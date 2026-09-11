"""
backend/apis/payments.py
-------------------------
Student Tuition Payments & Receipt Vouchers REST Router.
Provides endpoints for:
  - Recording student fee payments with automatic invoice crediting and drawer intake
  - Generating official sequential receipt numbers (الوصل)
  - Inspecting payments by student, invoice, register, and payment method
  - Collection breakdown analytics by payment method (CASH, CHECK, BANK_TRANSFER, etc.)
  - Voiding and reversing payment transactions safely
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    PaymentManager,
    InvoiceManager,
    CashRegisterManager,
    BranchManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/payments", tags=["Payments"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PaymentCreate(BaseModel):
    branch_id: str = Field(..., description="Branch identifier", example="CENTER")
    invoice_id: int = Field(..., description="Target invoice tranche ID to credit", example=1)
    amount: float = Field(..., gt=0, description="Payment amount in DZD", example=3000.0)
    payment_method: str = Field("CASH", description="CASH, CHECK, BANK_TRANSFER, CARD, OTHER", example="CASH")
    payment_date: Optional[date] = Field(None, description="Date of payment (defaults to today)")
    receipt_number: Optional[str] = Field(None, description="Optional physical receipt voucher number (auto-generated if omitted)")
    register_id: Optional[int] = Field(None, description="Target daily register ID (auto-linked to active drawer if omitted)")
    collected_by_employee_id: Optional[int] = Field(None, description="Cashier / staff employee ID who collected the funds")
    remarks: Optional[str] = Field(None, description="Payment remarks or bank check reference")


class PaymentVoidRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for voiding the payment receipt")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_payment_mgr(db: Database = Depends(get_database)) -> PaymentManager:
    return PaymentManager(db)


def get_invoice_mgr(db: Database = Depends(get_database)) -> InvoiceManager:
    return InvoiceManager(db)


def get_register_mgr(db: Database = Depends(get_database)) -> CashRegisterManager:
    return CashRegisterManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List payments",
    description="Retrieves student payments with joined invoice, student, and cashier details.",
)
def list_payments(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    invoice_id: Optional[int] = Query(None, description="Filter by invoice ID"),
    register_id: Optional[int] = Query(None, description="Filter by daily register ID"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    payment_method: Optional[str] = Query(None, description="Filter by payment method (CASH, CHECK, etc.)"),
    date_from: Optional[date] = Query(None, description="Earliest payment date"),
    date_to: Optional[date] = Query(None, description="Latest payment date"),
    search: Optional[str] = Query(None, description="Search by receipt number, student name, or code"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: PaymentManager = Depends(get_payment_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        invoice_id=invoice_id,
        register_id=register_id,
        student_id=student_id,
        payment_method=payment_method,
        date_from=date_from,
        date_to=date_to,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/methods-summary",
    summary="Get collection breakdown by method",
    description="Calculates total funds collected categorized by payment method (CASH, CHECK, BANK_TRANSFER, etc.).",
)
def get_payment_methods_summary(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    date_from: Optional[date] = Query(None, description="Earliest payment date"),
    date_to: Optional[date] = Query(None, description="Latest payment date"),
    mgr: PaymentManager = Depends(get_payment_mgr),
):
    return mgr.get_payment_methods_summary(
        branch_id=branch_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get(
    "/receipt/{branch_id}/{receipt_number}",
    summary="Look up payment by receipt number",
    description="Retrieves full payment receipt details by unique receipt voucher number.",
)
def get_by_receipt(
    branch_id: str = Path(..., description="Branch ID"),
    receipt_number: str = Path(..., description="Receipt voucher number"),
    mgr: PaymentManager = Depends(get_payment_mgr),
):
    record = mgr.get_by_receipt_number(branch_id=branch_id, receipt_number=receipt_number)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receipt '{receipt_number}' not found in branch '{branch_id}'.",
        )
    return record


@router.get(
    "/{payment_id}",
    summary="Get payment details",
    description="Retrieves single payment receipt with full student, enrollment, invoice, and cashier context.",
)
def get_payment(
    payment_id: int = Path(..., description="Payment ID"),
    mgr: PaymentManager = Depends(get_payment_mgr),
):
    record = mgr.get_by_id(payment_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment ID {payment_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Record fee payment",
    description="Records student fee payment, auto-credits the invoice tranche, updates the daily cash drawer, and generates receipt number.",
)
def record_payment(
    payload: PaymentCreate,
    mgr: PaymentManager = Depends(get_payment_mgr),
    inv_mgr: InvoiceManager = Depends(get_invoice_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT", "STAFF")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    invoice = inv_mgr.get_by_id(payload.invoice_id)
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {payload.invoice_id} not found.",
        )

    if invoice.get("status") == "PAID":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invoice ID {payload.invoice_id} is already fully paid.",
        )

    created = mgr.record_payment(
        branch_id=payload.branch_id,
        invoice_id=payload.invoice_id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        payment_date=payload.payment_date,
        receipt_number=payload.receipt_number,
        register_id=payload.register_id,
        collected_by_employee_id=payload.collected_by_employee_id or current_user.get("user_id"),
        remarks=payload.remarks,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record payment. Check invoice validity and receipt number uniqueness.",
        )
    return created


@router.delete(
    "/{payment_id}",
    summary="Void payment receipt",
    description="Voids and deletes payment receipt, automatically reversing invoice payment credit and daily register revenues.",
)
def void_payment(
    payment_id: int = Path(..., description="Payment ID"),
    mgr: PaymentManager = Depends(get_payment_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(payment_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment ID {payment_id} not found.",
        )

    voided = mgr.void_payment(payment_id)
    if not voided:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to void payment ID {payment_id}.",
        )
    return {"message": f"Payment ID {payment_id} ({existing.get('receipt_number')}) voided and ledger reversed successfully."}
