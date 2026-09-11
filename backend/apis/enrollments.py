"""
backend/apis/enrollments.py
----------------------------
Student Enrollments & Multi-Tier Invoicing REST Router.
Provides endpoints for:
  - Enrolling students into group cohorts with tuition pricing matrices and discounts
  - Live cohort headcount synchronization
  - Viewing student enrollment trajectories and group rosters
  - Managing enrollment statuses (ACTIVE, COMPLETED, SUSPENDED, DROPPED)
  - Auto-generating or custom tailoring multi-tier invoice installment tranches
"""

from typing import List, Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    EnrollmentManager,
    InvoiceManager,
    GroupManager,
    StudentManager,
    BranchManager,
    AcademicYearManager,
    PricingManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class EnrollmentCreate(BaseModel):
    branch_id: str = Field(..., description="Branch identifier", example="CENTER")
    student_id: int = Field(..., description="Student ID to enroll", example=1)
    group_id: int = Field(..., description="Target cohort group ID", example=1)
    academic_year_id: int = Field(..., description="Target academic cycle ID", example=1)
    pricing_plan_id: Optional[int] = Field(None, description="Associated pricing plan ID for automatic fee matrix")
    enrollment_date: Optional[date] = Field(None, description="Date of enrollment (defaults to today)")
    payment_mode: str = Field(
        "INSTALLMENT",
        description="Payment mode: CASH_UPFRONT, INSTALLMENT, ANNUAL_PACKAGE, MONTHLY",
        example="INSTALLMENT"
    )
    base_tuition_fee: Optional[float] = Field(None, ge=0, description="Base tuition before discounts (auto-filled if plan provided)")
    has_sibling_discount: bool = Field(False, description="Apply sibling discount if configured in plan")
    has_cash_discount: bool = Field(False, description="Apply cash upfront discount if configured in plan")
    has_annual_package: bool = Field(False, description="Apply annual package discount / offer")
    total_discount_amount: Optional[float] = Field(None, ge=0, description="Total discount amount deducted")
    registration_fee_amount: Optional[float] = Field(None, ge=0, description="Registration / enrollment fee")
    agreed_total_amount: Optional[float] = Field(None, ge=0, description="Final agreed payable tuition amount")
    enrollment_status: str = Field("ACTIVE", description="ACTIVE, COMPLETED, SUSPENDED, DROPPED")
    notes: Optional[str] = Field(None, description="Operational or administrative notes")
    auto_generate_invoices: bool = Field(True, description="Automatically generate invoice tranches based on plan & mode")


class EnrollmentUpdate(BaseModel):
    group_id: Optional[int] = Field(None, description="Transfer student to another cohort")
    pricing_plan_id: Optional[int] = None
    payment_mode: Optional[str] = None
    base_tuition_fee: Optional[float] = Field(None, ge=0)
    has_sibling_discount: Optional[bool] = None
    has_cash_discount: Optional[bool] = None
    has_annual_package: Optional[bool] = None
    total_discount_amount: Optional[float] = Field(None, ge=0)
    registration_fee_amount: Optional[float] = Field(None, ge=0)
    agreed_total_amount: Optional[float] = Field(None, ge=0)
    enrollment_status: Optional[str] = None
    notes: Optional[str] = None


class EnrollmentStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: ACTIVE, COMPLETED, SUSPENDED, DROPPED", example="ACTIVE")


class GenerateInvoicesRequest(BaseModel):
    payment_mode: Optional[str] = Field("INSTALLMENT", description="CASH_UPFRONT, INSTALLMENT, ANNUAL_PACKAGE, MONTHLY")
    installments_count: Optional[int] = Field(4, ge=1, le=12)
    custom_invoices: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Optional explicit custom invoice tranches (installment_number, period_label, due_date, amount_due)"
    )


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_enrollment_mgr(db: Database = Depends(get_database)) -> EnrollmentManager:
    return EnrollmentManager(db)


def get_invoice_mgr(db: Database = Depends(get_database)) -> InvoiceManager:
    return InvoiceManager(db)


def get_group_mgr(db: Database = Depends(get_database)) -> GroupManager:
    return GroupManager(db)


def get_student_mgr(db: Database = Depends(get_database)) -> StudentManager:
    return StudentManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_year_mgr(db: Database = Depends(get_database)) -> AcademicYearManager:
    return AcademicYearManager(db)


def get_pricing_mgr(db: Database = Depends(get_database)) -> PricingManager:
    return PricingManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List student enrollments",
    description="Retrieves student enrollments with relational student, group, program, level, and billing summaries.",
)
def list_enrollments(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    group_id: Optional[int] = Query(None, description="Filter by cohort group ID"),
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year ID"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, COMPLETED, etc.)"),
    payment_mode: Optional[str] = Query(None, description="Filter by payment mode"),
    search: Optional[str] = Query(None, description="Search by student name or code"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        student_id=student_id,
        group_id=group_id,
        academic_year_id=academic_year_id,
        status=status,
        payment_mode=payment_mode,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/student/{student_id}",
    summary="Get student enrollment history",
    description="Retrieves all course and daycare enrollments for a specific student.",
)
def get_student_enrollments(
    student_id: int = Path(..., description="Student ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    student_mgr: StudentManager = Depends(get_student_mgr),
):
    student = student_mgr.get_by_id(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} does not exist.",
        )
    return mgr.get_student_enrollments(student_id)


@router.get(
    "/group/{group_id}/roster",
    summary="Get group active student roster",
    description="Retrieves all active students currently enrolled in a cohort with billing aggregates.",
)
def get_group_roster(
    group_id: int = Path(..., description="Group ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    group_mgr: GroupManager = Depends(get_group_mgr),
):
    group = group_mgr.get_by_id(group_id, include_schedules=False)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group ID {group_id} does not exist.",
        )
    return {
        "group": group,
        "roster": mgr.get_group_roster(group_id),
    }


@router.get(
    "/{enrollment_id}",
    summary="Get enrollment details",
    description="Retrieves full enrollment profile, joined program/cohort details, and associated invoice tranches.",
)
def get_enrollment(
    enrollment_id: int = Path(..., description="Enrollment ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
):
    record = mgr.get_by_id(enrollment_id, include_invoices=True)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment ID {enrollment_id} not found.",
        )
    return record


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Enroll student into group",
    description="Creates student enrollment, calculates tuition fees, updates group live headcount, and auto-generates invoice tranches.",
)
def enroll_student(
    payload: EnrollmentCreate,
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    student_mgr: StudentManager = Depends(get_student_mgr),
    group_mgr: GroupManager = Depends(get_group_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    year_mgr: AcademicYearManager = Depends(get_year_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF", "ACCOUNTANT"])),
):
    # Verify entity existence
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )
    if not student_mgr.get_by_id(payload.student_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {payload.student_id} not found.",
        )
    group = group_mgr.get_by_id(payload.group_id, include_schedules=False)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group ID {payload.group_id} not found.",
        )
    if not year_mgr.get_by_id(payload.academic_year_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic Year ID {payload.academic_year_id} not found.",
        )

    # Check capacity warning (soft guard)
    current_count = int(group.get("current_headcount") or 0)
    max_cap = int(group.get("max_capacity") or 18)
    if current_count >= max_cap:
        # Group is already full
        logger_msg = f"Warning: Group '{group.get('group_name')}' capacity ({max_cap}) reached."

    created = mgr.enroll(
        branch_id=payload.branch_id,
        student_id=payload.student_id,
        group_id=payload.group_id,
        academic_year_id=payload.academic_year_id,
        pricing_plan_id=payload.pricing_plan_id,
        enrollment_date=payload.enrollment_date,
        payment_mode=payload.payment_mode,
        base_tuition_fee=payload.base_tuition_fee,
        has_sibling_discount=payload.has_sibling_discount,
        has_cash_discount=payload.has_cash_discount,
        has_annual_package=payload.has_annual_package,
        total_discount_amount=payload.total_discount_amount,
        registration_fee_amount=payload.registration_fee_amount,
        agreed_total_amount=payload.agreed_total_amount,
        enrollment_status=payload.enrollment_status,
        notes=payload.notes,
        auto_generate_invoices=payload.auto_generate_invoices,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to enroll student. Check if student is already enrolled in this group for the academic year.",
        )
    return created


@router.put(
    "/{enrollment_id}",
    summary="Update enrollment details",
    description="Updates enrollment fees, payment mode, transferred group, or notes.",
)
def update_enrollment(
    payload: EnrollmentUpdate,
    enrollment_id: int = Path(..., description="Enrollment ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT"])),
):
    existing = mgr.get_by_id(enrollment_id, include_invoices=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment ID {enrollment_id} not found.",
        )

    updated = mgr.update(enrollment_id, **payload.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid changes submitted or update failed.",
        )
    return mgr.get_by_id(enrollment_id, include_invoices=True)


@router.patch(
    "/{enrollment_id}/status",
    summary="Update enrollment status",
    description="Updates enrollment status (ACTIVE, COMPLETED, SUSPENDED, DROPPED) and synchronizes group headcount.",
)
def update_enrollment_status(
    payload: EnrollmentStatusUpdate,
    enrollment_id: int = Path(..., description="Enrollment ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF"])),
):
    existing = mgr.get_by_id(enrollment_id, include_invoices=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment ID {enrollment_id} not found.",
        )

    ok = mgr.toggle_status(enrollment_id, payload.status)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update status to '{payload.status}'. Valid values: ACTIVE, COMPLETED, SUSPENDED, DROPPED",
        )
    return {"message": f"Enrollment ID {enrollment_id} status updated to {payload.status.upper()}"}


@router.post(
    "/{enrollment_id}/generate-invoices",
    summary="Generate invoice schedule",
    description="Generates or regenerates invoice installment tranches for an existing enrollment.",
)
def generate_invoices(
    payload: GenerateInvoicesRequest,
    enrollment_id: int = Path(..., description="Enrollment ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    inv_mgr: InvoiceManager = Depends(get_invoice_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN", "DIRECTOR", "ACCOUNTANT"])),
):
    enrollment = mgr.get_by_id(enrollment_id, include_invoices=False)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment ID {enrollment_id} not found.",
        )

    branch_id = enrollment["branch_id"]
    agreed_total = float(enrollment.get("agreed_total_amount") or 0.0)

    if payload.custom_invoices:
        created = inv_mgr.create_batch(branch_id, enrollment_id, payload.custom_invoices)
        return {
            "message": f"Generated {len(created)} custom invoice tranches.",
            "invoices": created,
        }

    # Standard generator
    mode = (payload.payment_mode or enrollment.get("payment_mode") or "INSTALLMENT").upper()
    count = payload.installments_count or 4
    portion = round(agreed_total / count, 2)
    remainder = round(agreed_total - (portion * count), 2)

    generated = []
    for idx in range(1, count + 1):
        amt = portion + remainder if idx == 1 else portion
        inv = inv_mgr.create(
            branch_id=branch_id,
            enrollment_id=enrollment_id,
            installment_number=idx,
            period_label=f"الدفعة {idx}",
            amount_due=amt,
            notes=f"Generated tranche {idx} ({mode})",
        )
        if inv:
            generated.append(inv)

    return {
        "message": f"Generated {len(generated)} invoice installment tranches.",
        "invoices": generated,
    }


@router.delete(
    "/{enrollment_id}",
    summary="Delete enrollment",
    description="Deletes enrollment (cascades to invoices) and updates cohort current headcount.",
)
def delete_enrollment(
    enrollment_id: int = Path(..., description="Enrollment ID"),
    mgr: EnrollmentManager = Depends(get_enrollment_mgr),
    current_user: dict = Depends(require_role(["SUPER_ADMIN", "ADMIN"])),
):
    existing = mgr.get_by_id(enrollment_id, include_invoices=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Enrollment ID {enrollment_id} not found.",
        )

    deleted = mgr.delete(enrollment_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete enrollment ID {enrollment_id}.",
        )
    return {"message": f"Enrollment ID {enrollment_id} deleted successfully."}
