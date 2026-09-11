"""
backend/apis/handovers.py
--------------------------
Cash Handovers & Safe Remittance Operations REST Router.
Provides endpoints for:
  - Logging drawer remittances (التسليم) from branch cashiers to administration / safe
  - Auto-generating sequential handover vouchers (HND-BRANCH-YYYY-XXXX)
  - Synchronizing daily cash register total_remitted upon confirmation
  - Managing confirmation lifecycles (PENDING, CONFIRMED, REJECTED)
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, CashHandoverManager, BranchManager
from backend.apis.security import require_role

router = APIRouter(prefix="/cash-handovers", tags=["Cash Handovers"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class CashHandoverCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", example="CENTER")
    amount: float = Field(..., gt=0, description="Remittance amount in DZD", example=50000.0)
    received_by_name: str = Field(..., max_length=150, description="Name of recipient (Director / Safe Custodian)", example="المدير العام")
    handover_date: Optional[date] = Field(None, description="Remittance date (defaults to today)")
    transferred_by_employee_id: Optional[int] = Field(None, description="Employee ID handing over the cash")
    register_id: Optional[int] = Field(None, description="Associated daily cash register ID (auto-linked if omitted)")
    receipt_voucher_no: Optional[str] = Field(None, description="Physical drop voucher number (auto-generated if omitted)")
    status: str = Field("CONFIRMED", description="Status: PENDING, CONFIRMED, REJECTED", example="CONFIRMED")
    remarks: Optional[str] = Field(None, description="Remittance remarks or handover notes")


class CashHandoverStatusUpdate(BaseModel):
    status: str = Field(..., description="New confirmation status: PENDING, CONFIRMED, REJECTED", example="CONFIRMED")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_handover_mgr(db: Database = Depends(get_database)) -> CashHandoverManager:
    return CashHandoverManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List cash handovers",
    description="Retrieves cash safe remittances filtered by branch, register, status, or date bounds.",
)
def list_handovers(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    register_id: Optional[int] = Query(None, description="Filter by daily register ID"),
    status: Optional[str] = Query(None, description="Filter by status (CONFIRMED, PENDING, REJECTED)"),
    date_from: Optional[date] = Query(None, description="Earliest handover date"),
    date_to: Optional[date] = Query(None, description="Latest handover date"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: CashHandoverManager = Depends(get_handover_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        register_id=register_id,
        status=status,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{handover_id}",
    summary="Get cash handover details",
    description="Retrieves single cash remittance voucher record with branch, employee, and register details.",
)
def get_handover(
    handover_id: int = Path(..., description="Handover ID"),
    mgr: CashHandoverManager = Depends(get_handover_mgr),
):
    record = mgr.get_by_id(handover_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash handover ID {handover_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Record cash remittance",
    description="Logs a drawer remittance to safe/director, auto-links to open daily register, and updates register total_remitted.",
)
def create_handover(
    payload: CashHandoverCreate,
    mgr: CashHandoverManager = Depends(get_handover_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT", "STAFF")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        amount=payload.amount,
        received_by_name=payload.received_by_name,
        handover_date=payload.handover_date,
        transferred_by_employee_id=payload.transferred_by_employee_id or current_user.get("user_id"),
        register_id=payload.register_id,
        receipt_voucher_no=payload.receipt_voucher_no,
        status=payload.status,
        remarks=payload.remarks,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record cash handover.",
        )
    return created


@router.patch(
    "/{handover_id}/status",
    summary="Update handover status",
    description="Updates handover status (PENDING, CONFIRMED, REJECTED) and automatically synchronizes register total_remitted.",
)
def update_handover_status(
    payload: CashHandoverStatusUpdate,
    handover_id: int = Path(..., description="Handover ID"),
    mgr: CashHandoverManager = Depends(get_handover_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(handover_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash handover ID {handover_id} not found.",
        )

    ok = mgr.update_status(handover_id, payload.status)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update status to '{payload.status}'. Valid values: PENDING, CONFIRMED, REJECTED",
        )
    return {"message": f"Cash handover ID {handover_id} status updated to {payload.status.upper()}."}


@router.delete(
    "/{handover_id}",
    summary="Delete cash handover",
    description="Deletes cash handover record, automatically reversing the register remittance if previously confirmed.",
)
def delete_handover(
    handover_id: int = Path(..., description="Handover ID"),
    mgr: CashHandoverManager = Depends(get_handover_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN")),
):
    existing = mgr.get_by_id(handover_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cash handover ID {handover_id} not found.",
        )

    deleted = mgr.delete(handover_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete cash handover ID {handover_id}.",
        )
    return {"message": f"Cash handover ID {handover_id} deleted successfully."}
