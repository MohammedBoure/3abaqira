"""
backend/apis/budgets.py
------------------------
Monthly Operational Budgets & Variance Analysis REST Router.
Provides endpoints for:
  - Setting monthly planned budget targets per category (ملخص المصاريف)
  - Tracking variable factors (student headcounts, units, cafeteria loaves)
  - Synchronizing actual expenditures from expenses
  - Generating variance reports (budgeted vs actual, favorable/unfavorable status)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    BudgetVarianceManager,
    ExpenseManager,
    BranchManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/budget-variances", tags=["Budget Variances"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class BudgetVarianceSet(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", example="CENTER")
    category_id: int = Field(..., description="Target expense category ID", example=1)
    month_period: str = Field(..., max_length=7, description="Month period code (YYYY-MM)", example="2025-09")
    budgeted_amount: float = Field(..., ge=0, description="Allocated budget amount in DZD", example=50000.0)
    variable_factor: float = Field(0.0, description="Variable multiplier / units factor (المتغير)", example=18.0)
    notes: Optional[str] = Field(None, description="Budget planning remarks or notes")


class BudgetSyncRequest(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", example="CENTER")
    month_period: str = Field(..., max_length=7, description="Month period code (YYYY-MM)", example="2025-09")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_budget_mgr(db: Database = Depends(get_database)) -> BudgetVarianceManager:
    return BudgetVarianceManager(db)


def get_expense_mgr(db: Database = Depends(get_database)) -> ExpenseManager:
    return ExpenseManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List budget variances",
    description="Retrieves planned category budgets and actual spent amounts filtered by branch, month, or category.",
)
def list_budget_variances(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    month_period: Optional[str] = Query(None, description="Filter by month period (YYYY-MM)"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: BudgetVarianceManager = Depends(get_budget_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        month_period=month_period,
        category_id=category_id,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/report",
    summary="Get monthly variance report",
    description="Generates comprehensive monthly budget vs actual expenditure variance report with favorable/unfavorable analysis.",
)
def get_monthly_variance_report(
    branch_id: str = Query(..., description="Branch identifier", examples=["CENTER"]),
    month_period: str = Query(..., description="Month period code (YYYY-MM)", examples=["2025-09"]),
    mgr: BudgetVarianceManager = Depends(get_budget_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
):
    if not branch_mgr.get_by_id(branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    return mgr.get_monthly_report(branch_id=branch_id, month_period=month_period)


@router.get(
    "/{budget_variance_id}",
    summary="Get budget variance details",
    description="Retrieves single budget variance record by ID.",
)
def get_budget_variance(
    budget_variance_id: int = Path(..., description="Budget Variance ID"),
    mgr: BudgetVarianceManager = Depends(get_budget_mgr),
):
    record = mgr.get_by_id(budget_variance_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget variance ID {budget_variance_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Set category budget target",
    description="Sets or updates planned monthly budget for an expense category, automatically syncing current actual expenditures.",
)
def set_budget(
    payload: BudgetVarianceSet,
    mgr: BudgetVarianceManager = Depends(get_budget_mgr),
    exp_mgr: ExpenseManager = Depends(get_expense_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    cat = exp_mgr.categories.get_by_id(payload.category_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense category ID {payload.category_id} not found.",
        )

    created = mgr.set_budget(
        branch_id=payload.branch_id,
        category_id=payload.category_id,
        month_period=payload.month_period,
        budgeted_amount=payload.budgeted_amount,
        variable_factor=payload.variable_factor,
        notes=payload.notes,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to set budget target.",
        )
    return created


@router.post(
    "/sync-actuals",
    summary="Sync actual expenditures",
    description="Recalculates and updates actual spent amounts from recorded expenses for a branch and month.",
)
def sync_actuals(
    payload: BudgetSyncRequest,
    mgr: BudgetVarianceManager = Depends(get_budget_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    count = mgr.sync_actuals(branch_id=payload.branch_id, month_period=payload.month_period)
    return {
        "message": f"Successfully synchronized actual expenses for {payload.branch_id} ({payload.month_period}).",
        "synced_rows": count,
    }


@router.delete(
    "/{budget_variance_id}",
    summary="Delete budget target",
    description="Deletes monthly budget allocation record.",
)
def delete_budget_variance(
    budget_variance_id: int = Path(..., description="Budget Variance ID"),
    mgr: BudgetVarianceManager = Depends(get_budget_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN")),
):
    existing = mgr.get_by_id(budget_variance_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget variance ID {budget_variance_id} not found.",
        )

    deleted = mgr.delete(budget_variance_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete budget variance ID {budget_variance_id}.",
        )
    return {"message": f"Budget variance ID {budget_variance_id} deleted successfully."}
