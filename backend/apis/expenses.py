"""
backend/apis/expenses.py
-------------------------
Operational Daily Expenses & Expense Categories REST Router.
Provides endpoints for:
  - Managing expense categories (المصاريف / ملخص المصاريف) and cafeteria classification
  - Recording daily operational expenses with automatic voucher generation (EXP-BRANCH-YYYY-XXXXX)
  - Synchronizing cash payments with open daily cash drawers
  - Real-time aggregation and category breakdown reporting
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    ExpenseManager,
    BranchManager,
    CashRegisterManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/expenses", tags=["Expenses"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ExpenseCategoryCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", example="CENTER")
    code: str = Field(..., max_length=50, description="Unique category code", example="CLEANING")
    name_ar: str = Field(..., max_length=150, description="Arabic category name", example="حفاظات و مواد التنظيف")
    name_en: Optional[str] = Field(None, max_length=150, description="English category name")
    is_cafeteria_related: bool = Field(False, description="Flag if related to kitchen/cafeteria supply")
    is_active: bool = Field(True, description="Category active status")


class ExpenseCategoryUpdate(BaseModel):
    code: Optional[str] = None
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    is_cafeteria_related: Optional[bool] = None
    is_active: Optional[bool] = None


class ExpenseCreate(BaseModel):
    branch_id: str = Field(..., description="Branch identifier", example="CENTER")
    category_id: int = Field(..., description="Target expense category ID", example=1)
    description: str = Field(..., max_length=255, description="Expense description / purpose (التعيين)", example="شراء مواد تنظيف وأكياس قمامة")
    amount: float = Field(..., gt=0, description="Amount in DZD", example=4500.0)
    expense_date: Optional[date] = Field(None, description="Date of expense (defaults to today)")
    month_code: Optional[str] = Field(None, description="Month period code (YYYY-MM, auto-derived if omitted)", example="2025-09")
    payment_method: str = Field("CASH", description="CASH, CHECK, BANK_TRANSFER, CARD", example="CASH")
    voucher_number: Optional[str] = Field(None, description="Physical expense voucher number (auto-generated if omitted)")
    paid_to: Optional[str] = Field(None, max_length=150, description="Beneficiary vendor or supplier name", example="مؤسسة النظافة السريعة")
    authorized_by_employee_id: Optional[int] = Field(None, description="Employee ID authorizer")
    register_id: Optional[int] = Field(None, description="Associated daily cash register ID (auto-linked if cash)")
    receipt_attachment_url: Optional[str] = Field(None, description="URL or file path to scanned receipt bill")
    notes: Optional[str] = Field(None, description="Additional administrative remarks")


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    payment_method: Optional[str] = None
    paid_to: Optional[str] = None
    authorized_by_employee_id: Optional[int] = None
    receipt_attachment_url: Optional[str] = None
    notes: Optional[str] = None


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_expense_mgr(db: Database = Depends(get_database)) -> ExpenseManager:
    return ExpenseManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_register_mgr(db: Database = Depends(get_database)) -> CashRegisterManager:
    return CashRegisterManager(db)


# =============================================================================
# CATEGORY ROUTE HANDLERS
# =============================================================================

@router.get(
    "/categories",
    summary="List expense categories",
    description="Retrieves expense categories filtered by branch, cafeteria relation, and active status.",
)
def list_categories(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    is_cafeteria_related: Optional[bool] = Query(None, description="Filter cafeteria supply categories"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
):
    return mgr.categories.get_all(
        branch_id=branch_id,
        is_cafeteria_related=is_cafeteria_related,
        is_active=is_active,
    )


@router.get(
    "/categories/{category_id}",
    summary="Get category details",
    description="Retrieves single expense category details by ID.",
)
def get_category(
    category_id: int = Path(..., description="Category ID"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
):
    record = mgr.categories.get_by_id(category_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense category ID {category_id} not found.",
        )
    return record


@router.post(
    "/categories",
    status_code=status.HTTP_201_CREATED,
    summary="Create expense category",
    description="Creates a new expense category within a branch.",
)
def create_category(
    payload: ExpenseCategoryCreate,
    mgr: ExpenseManager = Depends(get_expense_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    created = mgr.categories.create(
        branch_id=payload.branch_id,
        code=payload.code,
        name_ar=payload.name_ar,
        name_en=payload.name_en,
        is_cafeteria_related=payload.is_cafeteria_related,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create category. Ensure code '{payload.code}' is unique in branch '{payload.branch_id}'.",
        )
    return created


@router.put(
    "/categories/{category_id}",
    summary="Update expense category",
    description="Updates category name, code, cafeteria flag, or active status.",
)
def update_category(
    payload: ExpenseCategoryUpdate,
    category_id: int = Path(..., description="Category ID"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.categories.get_by_id(category_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense category ID {category_id} not found.",
        )

    updated = mgr.categories.update(category_id, **payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid changes submitted or update failed.",
        )
    return mgr.categories.get_by_id(category_id)


@router.delete(
    "/categories/{category_id}",
    summary="Delete expense category",
    description="Deletes category if no expenses or budget targets reference it.",
)
def delete_category(
    category_id: int = Path(..., description="Category ID"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN")),
):
    existing = mgr.categories.get_by_id(category_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense category ID {category_id} not found.",
        )

    deleted = mgr.categories.delete(category_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with associated expenses or budget targets.",
        )
    return {"message": f"Expense category ID {category_id} deleted successfully."}


# =============================================================================
# EXPENSE ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List operational expenses",
    description="Retrieves operational daily expenses filtered by branch, category, register, month, or payment method.",
)
def list_expenses(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    register_id: Optional[int] = Query(None, description="Filter by daily register ID"),
    month_code: Optional[str] = Query(None, description="Filter by month period (YYYY-MM)"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method (CASH, CHECK, etc.)"),
    date_from: Optional[date] = Query(None, description="Earliest expense date"),
    date_to: Optional[date] = Query(None, description="Latest expense date"),
    search: Optional[str] = Query(None, description="Search by description, vendor, or voucher number"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: ExpenseManager = Depends(get_expense_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        category_id=category_id,
        register_id=register_id,
        month_code=month_code,
        payment_method=payment_method,
        date_from=date_from,
        date_to=date_to,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/monthly-summary",
    summary="Get monthly expense summary",
    description="Returns aggregate expenditure broken down by expense category for a given month.",
)
def get_monthly_summary(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    month_code: Optional[str] = Query(None, description="Month period code (YYYY-MM)", examples=["2025-09"]),
    mgr: ExpenseManager = Depends(get_expense_mgr),
):
    return mgr.get_monthly_summary(branch_id=branch_id, month_code=month_code)


@router.get(
    "/{expense_id}",
    summary="Get expense details",
    description="Retrieves single expense record with joined category, authorizer, and drawer info.",
)
def get_expense(
    expense_id: int = Path(..., description="Expense ID"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
):
    record = mgr.get_by_id(expense_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense ID {expense_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Record operational expense",
    description="Records operational expense, auto-links to open cash register if CASH, and syncs budget actuals.",
)
def record_expense(
    payload: ExpenseCreate,
    mgr: ExpenseManager = Depends(get_expense_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT", "STAFF")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    cat = mgr.categories.get_by_id(payload.category_id)
    if not cat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense category ID {payload.category_id} not found.",
        )

    created = mgr.record_expense(
        branch_id=payload.branch_id,
        category_id=payload.category_id,
        description=payload.description,
        amount=payload.amount,
        expense_date=payload.expense_date,
        month_code=payload.month_code,
        payment_method=payload.payment_method,
        voucher_number=payload.voucher_number,
        paid_to=payload.paid_to,
        authorized_by_employee_id=payload.authorized_by_employee_id or current_user.get("user_id"),
        register_id=payload.register_id,
        receipt_attachment_url=payload.receipt_attachment_url,
        notes=payload.notes,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record operational expense.",
        )
    return created


@router.put(
    "/{expense_id}",
    summary="Update expense details",
    description="Updates expense description, amount, vendor, or notes, resynchronizing register and budget actuals.",
)
def update_expense(
    payload: ExpenseUpdate,
    expense_id: int = Path(..., description="Expense ID"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(expense_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense ID {expense_id} not found.",
        )

    updated = mgr.update(expense_id, **payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid changes submitted or update failed.",
        )
    return mgr.get_by_id(expense_id)


@router.delete(
    "/{expense_id}",
    summary="Delete operational expense",
    description="Deletes operational expense, reversing daily cash register total_expenses and budget actuals.",
)
def delete_expense(
    expense_id: int = Path(..., description="Expense ID"),
    mgr: ExpenseManager = Depends(get_expense_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(expense_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Expense ID {expense_id} not found.",
        )

    deleted = mgr.delete(expense_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete expense ID {expense_id}.",
        )
    return {"message": f"Expense ID {expense_id} deleted and ledger balances reversed successfully."}
