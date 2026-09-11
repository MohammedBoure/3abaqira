"""
backend/apis/invoices.py
-------------------------
Multi-Tier Invoices, Installment Tranches & Billing Operations REST Router.
Provides endpoints for:
  - Listing and filtering invoice tranches across students, groups, branches, and statuses
  - Invoicing analytics (total billed, collected, outstanding, and overdue amounts)
  - Overdue debt monitoring and automated status transitions
  - Crediting payments against invoices with auto-transitioning (UNPAID -> PARTIALLY_PAID -> PAID)
  - Waiving invoices and managing installment adjustments
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    InvoiceManager,
    EnrollmentManager,
    BranchManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/invoices", tags=["Invoices"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class InvoiceCreate(BaseModel):
    branch_id: str = Field(..., description="Branch identifier", example="CENTER")
    enrollment_id: int = Field(..., description="Target enrollment ID", example=1)
    installment_number: int = Field(..., ge=1, description="Tranche index (1..4 for tranches, 1..10 for months)", example=1)
    period_label: str = Field(..., description="Period label (e.g., 'الدفعة 1', 'أكتوبر', 'رسوم التسجيل')", example="الدفعة 1")
    amount_due: float = Field(..., ge=0, description="Amount payable for this tranche", example=3000.0)
    due_date: Optional[date] = Field(None, description="Scheduled payment due date")
    notes: Optional[str] = Field(None, description="Invoice notes or description")
    status: str = Field("UNPAID", description="UNPAID, PARTIALLY_PAID, PAID, OVERDUE, WAIVED")


class InvoiceUpdate(BaseModel):
    installment_number: Optional[int] = Field(None, ge=1)
    period_label: Optional[str] = None
    amount_due: Optional[float] = Field(None, ge=0)
    due_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class InvoicePaymentCreditRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Payment credit increment amount to apply", example=1500.0)
    notes: Optional[str] = Field(None, description="Payment transaction reference or notes")


class InvoiceWaiveRequest(BaseModel):
    reason: Optional[str] = Field(None, description="Reason for waiving the invoice", example="Administrative scholarship exception")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_invoice_mgr(db: Database = Depends(get_database)) -> InvoiceManager:
    return InvoiceManager(db)


def get_enrollment_mgr(db: Database = Depends(get_database)) -> EnrollmentManager:
    return EnrollmentManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List invoices",
    description="Retrieves invoice tranches filtered by branch, enrollment, student, status, or date bounds.",
)
def list_invoices(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    enrollment_id: Optional[int] = Query(None, description="Filter by enrollment ID"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    status: Optional[str] = Query(None, description="Filter by status (UNPAID, PARTIALLY_PAID, PAID, OVERDUE, WAIVED)"),
    is_overdue: Optional[bool] = Query(None, description="Filter by overdue status flag"),
    due_date_from: Optional[date] = Query(None, description="Earliest due date"),
    due_date_to: Optional[date] = Query(None, description="Latest due date"),
    search: Optional[str] = Query(None, description="Search by student name or period label"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        enrollment_id=enrollment_id,
        student_id=student_id,
        status=status,
        is_overdue=is_overdue,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    summary="Get invoicing financial KPIs",
    description="Returns aggregate billing metrics: total billed, total collected, total outstanding, and overdue debt.",
)
def get_invoicing_summary(
    branch_id: Optional[str] = Query(None, description="Filter summary by branch"),
    academic_year_id: Optional[int] = Query(None, description="Filter summary by academic cycle"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
):
    return mgr.get_financial_summary(branch_id=branch_id, academic_year_id=academic_year_id)


@router.get(
    "/overdue",
    summary="List overdue invoices",
    description="Retrieves all active unpaid invoices whose due date has passed.",
)
def list_overdue_invoices(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        is_overdue=True,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/check-overdue",
    summary="Trigger overdue invoices scan",
    description="Scans all invoices with past due dates and transitions UNPAID/PARTIALLY_PAID records to OVERDUE.",
)
def trigger_overdue_scan(
    branch_id: Optional[str] = Query(None, description="Optional branch filter"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"])),
):
    updated_count = mgr.check_and_update_overdue(branch_id=branch_id)
    return {
        "message": f"Overdue scan complete. Transitioned {updated_count} invoices to OVERDUE status.",
        "updated_count": updated_count,
    }


@router.get(
    "/{invoice_id}",
    summary="Get invoice details",
    description="Retrieves single invoice record with full student, enrollment, and cohort context.",
)
def get_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
):
    record = mgr.get_by_id(invoice_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create invoice tranche",
    description="Creates an individual invoice installment tranche for an enrollment.",
)
def create_invoice(
    payload: InvoiceCreate,
    mgr: InvoiceManager = Depends(get_invoice_mgr),
    enroll_mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT"])),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )
    if not enroll_mgr.get_by_id(payload.enrollment_id, include_invoices=False):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment ID {payload.enrollment_id} not found.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        enrollment_id=payload.enrollment_id,
        installment_number=payload.installment_number,
        period_label=payload.period_label,
        amount_due=payload.amount_due,
        due_date=payload.due_date,
        notes=payload.notes,
        status=payload.status,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create invoice. Verify installment number and period label uniqueness for this enrollment.",
        )
    return created


@router.put(
    "/{invoice_id}",
    summary="Update invoice details",
    description="Updates invoice amount, due date, period label, or status.",
)
def update_invoice(
    payload: InvoiceUpdate,
    invoice_id: int = Path(..., description="Invoice ID"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT"])),
):
    existing = mgr.get_by_id(invoice_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found.",
        )

    updated = mgr.update(invoice_id, **payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid changes submitted or update failed.",
        )
    return mgr.get_by_id(invoice_id)


@router.post(
    "/{invoice_id}/credit-payment",
    summary="Credit payment against invoice",
    description="Records payment credit, increments amount_paid, and synchronizes status (UNPAID -> PARTIALLY_PAID -> PAID).",
)
def credit_payment(
    payload: InvoicePaymentCreditRequest,
    invoice_id: int = Path(..., description="Invoice ID"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT"])),
):
    existing = mgr.get_by_id(invoice_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found.",
        )

    updated = mgr.record_payment_credit(
        invoice_id=invoice_id,
        payment_amount=payload.amount,
        notes=payload.notes,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to apply payment credit to invoice.",
        )
    return {
        "message": f"Successfully credited {payload.amount:.2f} DZD to invoice ID {invoice_id}.",
        "invoice": updated,
    }


@router.post(
    "/{invoice_id}/waive",
    summary="Waive invoice",
    description="Marks invoice as WAIVED and logs exemption rationale.",
)
def waive_invoice(
    payload: InvoiceWaiveRequest,
    invoice_id: int = Path(..., description="Invoice ID"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT"])),
):
    existing = mgr.get_by_id(invoice_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found.",
        )

    ok = mgr.waive(invoice_id, reason=payload.reason)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to waive invoice.",
        )
    return {"message": f"Invoice ID {invoice_id} has been waived."}


@router.delete(
    "/{invoice_id}",
    summary="Delete invoice",
    description="Deletes invoice record. Allowed only if amount_paid is zero or status is WAIVED.",
)
def delete_invoice(
    invoice_id: int = Path(..., description="Invoice ID"),
    mgr: InvoiceManager = Depends(get_invoice_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN"])),
):
    existing = mgr.get_by_id(invoice_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice ID {invoice_id} not found.",
        )

    amount_paid = float(existing.get("amount_paid") or 0.0)
    curr_status = existing.get("status")
    if amount_paid > 0 and curr_status != "WAIVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete invoice with recorded payments ({amount_paid:.2f} DZD). Waive or adjust instead.",
        )

    deleted = mgr.delete(invoice_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete invoice ID {invoice_id}.",
        )
    return {"message": f"Invoice ID {invoice_id} deleted successfully."}
