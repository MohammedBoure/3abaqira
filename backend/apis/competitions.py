"""
backend/apis/competitions.py
----------------------------
Competitions & Special Events REST Router.
Provides endpoints for:
  - Event setups, academic cycle linkage, and scope categorization (National, Regional, Wilaya, etc.)
  - Participant registrations for academy students and external candidates
  - Receipt generation (CMP-BRANCH-YYYY-XXXXX) and automatic cash drawer revenue crediting
  - Division levels, financial intake summaries, and roster reporting
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    BranchManager,
    AcademicYearManager,
    StudentManager,
    CompetitionManager,
    CompetitionRegistrationManager,
    CashRegisterManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/competitions", tags=["Competitions & Special Events"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class CompetitionCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", examples=["CENTER"])
    academic_year_id: int = Field(..., description="Academic year cycle ID", examples=[1])
    name: str = Field(..., max_length=150, description="Competition title (e.g. المسابقة الوطنية للحساب الذهني)", examples=["المسابقة الوطنية للحساب الذهني 2026"])
    scope: str = Field("NATIONAL", description="NATIONAL, REGIONAL, WILAYA, INTERNAL, INTERNATIONAL", examples=["NATIONAL"])
    event_date: Optional[date] = Field(None, description="Event scheduled date", examples=["2026-05-15"])
    location: Optional[str] = Field(None, max_length=200, description="Event venue / hall", examples=["قاعة المؤتمرات الدولية - الجزائر"])
    registration_fee: float = Field(0.0, ge=0, description="Candidate registration fee in DZD", examples=[2500.0])
    is_active: bool = Field(True, description="Event active registration status")


class CompetitionUpdate(BaseModel):
    name: Optional[str] = None
    scope: Optional[str] = None
    event_date: Optional[date] = None
    location: Optional[str] = None
    registration_fee: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class RegistrationCreate(BaseModel):
    competition_id: int = Field(..., description="Target competition ID", examples=[1])
    student_id: Optional[int] = Field(None, description="Internal student ID if candidate is an enrolled pupil")
    competitor_name: Optional[str] = Field(None, max_length=150, description="Candidate full name (auto-filled if student_id provided)", examples=["محمد أمين بورموز"])
    division_level: Optional[str] = Field(None, max_length=50, description="Age group / difficulty level", examples=["Category A (6-8 yrs)"])
    fee_amount: Optional[float] = Field(None, ge=0, description="Registration fee (defaults to competition fee if omitted)", examples=[2500.0])
    amount_paid: Optional[float] = Field(None, ge=0, description="Intake amount paid today (defaults to fee_amount)", examples=[2500.0])
    payment_status: Optional[str] = Field(None, description="PAID, PENDING, EXEMPT (auto-derived if omitted)", examples=["PAID"])
    receipt_number: Optional[str] = Field(None, description="Voucher number (auto-generated if omitted)")
    register_id: Optional[int] = Field(None, description="Cash drawer ID (auto-linked if cash intake)")
    payment_method: str = Field("CASH", description="Payment method: CASH, CHECK, BANK_TRANSFER, CARD", examples=["CASH"])
    notes: Optional[str] = Field(None, description="Registration notes or special accommodations")


class RegistrationUpdate(BaseModel):
    competitor_name: Optional[str] = None
    division_level: Optional[str] = None
    fee_amount: Optional[float] = Field(None, ge=0)
    amount_paid: Optional[float] = Field(None, ge=0)
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class AdditionalPaymentRequest(BaseModel):
    additional_amount: float = Field(..., gt=0, description="Payment amount in DZD to credit", examples=[1000.0])
    payment_method: str = Field("CASH", description="Payment method: CASH, CHECK, BANK_TRANSFER", examples=["CASH"])
    notes: Optional[str] = Field(None, description="Payment receipt notes")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_comp_mgr(db: Database = Depends(get_database)) -> CompetitionManager:
    return CompetitionManager(db)


def get_reg_mgr(db: Database = Depends(get_database)) -> CompetitionRegistrationManager:
    return CompetitionRegistrationManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_academic_mgr(db: Database = Depends(get_database)) -> AcademicYearManager:
    return AcademicYearManager(db)


def get_student_mgr(db: Database = Depends(get_database)) -> StudentManager:
    return StudentManager(db)


# =============================================================================
# COMPETITIONS MASTER ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List competitions",
    description="Retrieves competition events filtered by branch, academic year cycle, scope, or active status.",
)
def list_competitions(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year ID"),
    scope: Optional[str] = Query(None, description="Filter by scope (NATIONAL, WILAYA, etc.)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: CompetitionManager = Depends(get_comp_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        academic_year_id=academic_year_id,
        scope=scope,
        is_active=is_active,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{competition_id}",
    summary="Get competition details",
    description="Retrieves competition details with aggregate financial metrics (expected vs collected revenue).",
)
def get_competition(
    competition_id: int = Path(..., description="Competition ID"),
    mgr: CompetitionManager = Depends(get_comp_mgr),
):
    record = mgr.get_by_id(competition_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competition ID {competition_id} not found.",
        )
    return record


@router.get(
    "/{competition_id}/summary",
    summary="Get competition analytics summary",
    description="Calculates participant totals, collection rate percentage, payment status counts, and division distribution.",
)
def get_competition_summary(
    competition_id: int = Path(..., description="Competition ID"),
    mgr: CompetitionManager = Depends(get_comp_mgr),
):
    summary = mgr.get_summary(competition_id)
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competition ID {competition_id} not found.",
        )
    return summary


@router.get(
    "/{competition_id}/roster",
    summary="Get competition participant roster",
    description="Retrieves the full list of candidate registrations enrolled in this competition.",
)
def get_competition_roster(
    competition_id: int = Path(..., description="Competition ID"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    division_level: Optional[str] = Query(None, description="Filter by division level"),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    mgr: CompetitionManager = Depends(get_comp_mgr),
):
    comp = mgr.get_by_id(competition_id)
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competition ID {competition_id} not found.",
        )
    return mgr.registrations.get_all(
        competition_id=competition_id,
        payment_status=payment_status,
        division_level=division_level,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create competition event",
    description="Configures a new competition event under a branch and fiscal academic year.",
)
def create_competition(
    payload: CompetitionCreate,
    mgr: CompetitionManager = Depends(get_comp_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    academic_mgr: AcademicYearManager = Depends(get_academic_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    if not academic_mgr.get_by_id(payload.academic_year_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year ID {payload.academic_year_id} not found.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        academic_year_id=payload.academic_year_id,
        name=payload.name,
        scope=payload.scope,
        event_date=payload.event_date,
        location=payload.location,
        registration_fee=payload.registration_fee,
        is_active=payload.is_active,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create competition.",
        )
    return created


@router.put(
    "/{competition_id}",
    summary="Update competition event",
    description="Modifies event details, date, location, fee, or active status.",
)
def update_competition(
    payload: CompetitionUpdate,
    competition_id: int = Path(..., description="Competition ID"),
    mgr: CompetitionManager = Depends(get_comp_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR")),
):
    existing = mgr.get_by_id(competition_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competition ID {competition_id} not found.",
        )

    updated = mgr.update(
        competition_id=competition_id,
        name=payload.name,
        scope=payload.scope,
        event_date=payload.event_date,
        location=payload.location,
        registration_fee=payload.registration_fee,
        is_active=payload.is_active,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update competition.",
        )
    return updated


@router.delete(
    "/{competition_id}",
    summary="Delete competition event",
    description="Deletes a competition only if no candidate registrations exist.",
)
def delete_competition(
    competition_id: int = Path(..., description="Competition ID"),
    mgr: CompetitionManager = Depends(get_comp_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN")),
):
    existing = mgr.get_by_id(competition_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competition ID {competition_id} not found.",
        )

    if existing.get("total_participants", 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete competition ID {competition_id}: has {existing['total_participants']} registered candidates.",
        )

    deleted = mgr.delete(competition_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete competition.",
        )
    return {"message": f"Competition ID {competition_id} deleted successfully."}


# =============================================================================
# CANDIDATE REGISTRATION ROUTE HANDLERS
# =============================================================================

@router.get(
    "/registrations/all",
    summary="List all competition registrations",
    description="Retrieves registrations across all competitions with filtering by branch, student, payment status, or candidate name.",
)
def list_registrations(
    competition_id: Optional[int] = Query(None, description="Filter by competition ID"),
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status (PAID, PENDING, EXEMPT)"),
    division_level: Optional[str] = Query(None, description="Filter by division level"),
    search: Optional[str] = Query(None, description="Search candidate name or receipt number"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: CompetitionRegistrationManager = Depends(get_reg_mgr),
):
    return mgr.get_all(
        competition_id=competition_id,
        branch_id=branch_id,
        student_id=student_id,
        payment_status=payment_status,
        division_level=division_level,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/registrations/{registration_id}",
    summary="Get registration details",
    description="Retrieves single candidate registration by ID with competition and student ward details.",
)
def get_registration(
    registration_id: int = Path(..., description="Registration ID"),
    mgr: CompetitionRegistrationManager = Depends(get_reg_mgr),
):
    record = mgr.get_by_id(registration_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration ID {registration_id} not found.",
        )
    return record


@router.post(
    "/registrations",
    status_code=status.HTTP_201_CREATED,
    summary="Register participant for competition",
    description="Registers an academy student or external candidate, generates voucher number (CMP-BRANCH-YYYY-XXXXX), and credits cash drawer.",
)
def register_participant(
    payload: RegistrationCreate,
    mgr: CompetitionRegistrationManager = Depends(get_reg_mgr),
    comp_mgr: CompetitionManager = Depends(get_comp_mgr),
    student_mgr: StudentManager = Depends(get_student_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF")),
):
    comp = comp_mgr.get_by_id(payload.competition_id)
    if not comp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Competition ID {payload.competition_id} not found.",
        )

    if not comp.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Competition '{comp.get('name')}' is currently closed for registrations.",
        )

    # If student provided, check existence and prevent duplicates
    if payload.student_id:
        student = student_mgr.get_by_id(payload.student_id)
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student ID {payload.student_id} not found.",
            )

        existing = mgr.get_by_competition_and_student(payload.competition_id, payload.student_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Student ID {payload.student_id} is already registered for this competition.",
            )

    created = mgr.register(
        competition_id=payload.competition_id,
        competitor_name=payload.competitor_name,
        student_id=payload.student_id,
        division_level=payload.division_level,
        fee_amount=payload.fee_amount,
        amount_paid=payload.amount_paid,
        payment_status=payload.payment_status,
        receipt_number=payload.receipt_number,
        register_id=payload.register_id,
        payment_method=payload.payment_method,
        notes=payload.notes,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to register participant.",
        )
    return created


@router.put(
    "/registrations/{registration_id}",
    summary="Update candidate registration",
    description="Modifies competitor name, division level, fee adjustments, or payment status with drawer reconciliation.",
)
def update_registration(
    payload: RegistrationUpdate,
    registration_id: int = Path(..., description="Registration ID"),
    mgr: CompetitionRegistrationManager = Depends(get_reg_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF")),
):
    existing = mgr.get_by_id(registration_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration ID {registration_id} not found.",
        )

    updated = mgr.update(
        registration_id=registration_id,
        competitor_name=payload.competitor_name,
        division_level=payload.division_level,
        fee_amount=payload.fee_amount,
        amount_paid=payload.amount_paid,
        payment_status=payload.payment_status,
        notes=payload.notes,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update registration.",
        )
    return updated


@router.post(
    "/registrations/{registration_id}/pay",
    summary="Record additional payment for registration",
    description="Records payment for a pending balance, updates payment status, and logs receipt history.",
)
def record_registration_payment(
    payload: AdditionalPaymentRequest,
    registration_id: int = Path(..., description="Registration ID"),
    mgr: CompetitionRegistrationManager = Depends(get_reg_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "STAFF", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(registration_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration ID {registration_id} not found.",
        )

    updated = mgr.record_additional_payment(
        registration_id=registration_id,
        additional_amount=payload.additional_amount,
        payment_method=payload.payment_method,
        notes=payload.notes,
    )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record additional payment.",
        )
    return updated


@router.delete(
    "/registrations/{registration_id}",
    summary="Cancel registration",
    description="Cancels candidate registration and reverts credited cash drawer revenue.",
)
def cancel_registration(
    registration_id: int = Path(..., description="Registration ID"),
    mgr: CompetitionRegistrationManager = Depends(get_reg_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR")),
):
    existing = mgr.get_by_id(registration_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Registration ID {registration_id} not found.",
        )

    deleted = mgr.delete(registration_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to cancel registration.",
        )
    return {"message": f"Registration ID {registration_id} cancelled successfully and drawer balance adjusted."}
