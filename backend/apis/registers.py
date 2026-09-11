"""
backend/apis/registers.py
--------------------------
Daily Cash Registers & Treasury Reconciliation REST Router.
Provides endpoints for:
  - Managing daily cash drawers across branches
  - Opening registers with carried-over closing balances
  - Real-time aggregation of intake revenues, expenses, and remittances
  - End-of-day drawer close and physical cash count discrepancy reconciliation
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, CashRegisterManager, BranchManager
from backend.apis.security import require_role

router = APIRouter(prefix="/cash-registers", tags=["Daily Cash Registers"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class CashRegisterCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", example="CENTER")
    register_date: Optional[date] = Field(None, description="Register operational date (defaults to today)")
    opening_balance: float = Field(0.0, ge=0, description="Opening drawer balance (carried over if omitted)", example=5000.0)
    notes: Optional[str] = Field(None, description="Opening remarks or drawer notes")


class CashRegisterUpdate(BaseModel):
    opening_balance: Optional[float] = Field(None, ge=0)
    actual_cash_counted: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class CashRegisterReconcile(BaseModel):
    actual_cash_counted: float = Field(..., ge=0, description="Physical cash counted in drawer at closing", example=18500.0)
    reconciled_by: Optional[int] = Field(None, description="Employee ID performing reconciliation")
    notes: Optional[str] = Field(None, description="Reconciliation findings or notes")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_register_mgr(db: Database = Depends(get_database)) -> CashRegisterManager:
    return CashRegisterManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List daily cash registers",
    description="Retrieves daily cash registers filtered by branch, date range, or open/closed status.",
)
def list_registers(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    date_from: Optional[date] = Query(None, description="Earliest register date"),
    date_to: Optional[date] = Query(None, description="Latest register date"),
    is_closed: Optional[bool] = Query(None, description="Filter by closed status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: CashRegisterManager = Depends(get_register_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        date_from=date_from,
        date_to=date_to,
        is_closed=is_closed,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/today",
    summary="Get or auto-open today's register",
    description="Retrieves active register for today in the specified branch, or auto-creates it carrying over previous closing balance.",
)
def get_today_register(
    branch_id: str = Query(..., description="Branch identifier"),
    mgr: CashRegisterManager = Depends(get_register_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
):
    if not branch_mgr.get_by_id(branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    return mgr.get_or_create(branch_id=branch_id, register_date=date.today())


@router.get(
    "/{register_id}",
    summary="Get cash register details",
    description="Retrieves single daily register profile with itemized breakdown of payments, expenses, and remittances.",
)
def get_register(
    register_id: int = Path(..., description="Register ID"),
    mgr: CashRegisterManager = Depends(get_register_mgr),
):
    record = mgr.get_by_id(register_id, include_transactions=True)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register ID {register_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Open daily cash register",
    description="Manually opens a daily cash register for a branch with an initial opening balance.",
)
def open_register(
    payload: CashRegisterCreate,
    mgr: CashRegisterManager = Depends(get_register_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT", "STAFF")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    target_date = payload.register_date or date.today()
    existing = mgr.get_by_date(payload.branch_id, target_date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A cash register already exists for branch '{payload.branch_id}' on {target_date}.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        register_date=target_date,
        opening_balance=payload.opening_balance,
        notes=payload.notes,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to open cash register.",
        )
    return created


@router.put(
    "/{register_id}",
    summary="Update register details",
    description="Updates opening balance, notes, or manual audit remarks on an open register.",
)
def update_register(
    payload: CashRegisterUpdate,
    register_id: int = Path(..., description="Register ID"),
    mgr: CashRegisterManager = Depends(get_register_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(register_id, include_transactions=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register ID {register_id} not found.",
        )

    updated = mgr.update(register_id, **payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid changes submitted or update failed.",
        )
    return mgr.get_by_id(register_id)


@router.post(
    "/{register_id}/close",
    summary="Reconcile and close cash drawer",
    description="Reconciles transaction totals, logs actual physical cash counted, computes discrepancy, and closes the register.",
)
def close_register(
    payload: CashRegisterReconcile,
    register_id: int = Path(..., description="Register ID"),
    mgr: CashRegisterManager = Depends(get_register_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(register_id, include_transactions=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register ID {register_id} not found.",
        )

    reconciled = mgr.close_and_reconcile(
        register_id=register_id,
        actual_cash_counted=payload.actual_cash_counted,
        reconciled_by=payload.reconciled_by or current_user.get("user_id"),
        notes=payload.notes,
    )
    if not reconciled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to close and reconcile cash register.",
        )
    return {
        "message": f"Cash register ID {register_id} reconciled and closed successfully.",
        "register": reconciled,
    }


@router.post(
    "/{register_id}/recalculate",
    summary="Recalculate register totals",
    description="Synchronizes live total_revenues, total_expenses, and total_remitted from child transactions.",
)
def recalculate_register(
    register_id: int = Path(..., description="Register ID"),
    mgr: CashRegisterManager = Depends(get_register_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(register_id, include_transactions=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register ID {register_id} not found.",
        )

    mgr.recalculate_totals(register_id)
    return mgr.get_by_id(register_id)


@router.delete(
    "/{register_id}",
    summary="Delete cash register",
    description="Deletes cash register record. Permitted only if the register is open and contains no child transactions.",
)
def delete_register(
    register_id: int = Path(..., description="Register ID"),
    mgr: CashRegisterManager = Depends(get_register_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN")),
):
    existing = mgr.get_by_id(register_id, include_transactions=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash register ID {register_id} not found.",
        )

    if existing.get("is_closed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete an audited, closed cash register.",
        )

    deleted = mgr.delete(register_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete register with linked payments, expenses, or remittances.",
        )
    return {"message": f"Cash register ID {register_id} deleted successfully."}
