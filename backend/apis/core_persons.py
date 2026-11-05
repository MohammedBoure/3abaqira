"""
backend/apis/core_persons.py
-----------------------------
REST API Router for Core Unified Person, Students, Confidential Medical Records,
Guardian Links, Pickup Authorizations, and Sensitive Action Audit Logging.
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    CorePersonManager,
    CoreAuditManager,
)
from backend.apis.security import get_optional_current_user

router = APIRouter(prefix="/core", tags=["Core Person & Registry"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class PersonCreate(BaseModel):
    full_name_ar: str = Field(..., description="Full Arabic name (e.g. محمد بوزيد)")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name_fr: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = Field(None, description="MALE or FEMALE")
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    person_type: str = Field("STUDENT", description="STUDENT, GUARDIAN, STAFF, INSTRUCTOR, ADMIN, MIXED")


class PersonUpdate(BaseModel):
    full_name_ar: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name_fr: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    national_id: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    person_type: Optional[str] = None
    is_active: Optional[bool] = None


class StudentCreate(BaseModel):
    person_id: int = Field(..., description="Foreign key to core_person")
    student_code: Optional[str] = None
    school_grade: Optional[str] = Field(None, description="Algerian school grade e.g. 3AP, 1AM")
    previous_schools: Optional[str] = None
    notes: Optional[str] = None


class MedicalUpsert(BaseModel):
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    special_needs: Optional[str] = None
    food_restrictions: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_notes: Optional[str] = None


class GuardianLinkCreate(BaseModel):
    guardian_person_id: int
    relationship: str = "Parent"
    is_primary: bool = False
    is_emergency_contact: bool = False
    custody_flag: bool = True
    notes: Optional[str] = None


class PickupCreate(BaseModel):
    full_name: str
    relationship: str
    national_id: Optional[str] = None
    phone: Optional[str] = None
    authorized_person_id: Optional[int] = None
    authorized_by_person_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None


class SensitiveActionLogRequest(BaseModel):
    action_type: str = Field(..., description="GRADE_CHANGE, PRICE_OVERRIDE, PAYMENT_VOID, MEDICAL_VIEW")
    entity_type: str
    entity_id: str
    branch_id: Optional[str] = None
    old_values: Optional[Any] = None
    new_values: Optional[Any] = None
    reason: str = Field(..., description="Mandatory justification reason")


# =============================================================================
# ENDPOINTS: PERSON REGISTRY
# =============================================================================
@router.post("/persons", status_code=status.HTTP_201_CREATED, summary="Register unified person")
def create_person(
    payload: PersonCreate,
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    try:
        person = mgr.create_person(**payload.dict())
        return person
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/persons", summary="Query unified persons")
def list_persons(
    person_type: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    return mgr.get_all_persons(
        person_type=person_type, search=search, is_active=is_active, limit=limit, offset=offset
    )


@router.get("/persons/{person_id}", summary="Get person details")
def get_person(person_id: int, db: Database = Depends(get_database)):
    mgr = CorePersonManager(db)
    person = mgr.get_person_by_id(person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    return person


@router.put("/persons/{person_id}", summary="Update person")
def update_person(
    person_id: int,
    payload: PersonUpdate,
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    updated = mgr.update_person(person_id, **payload.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Person not found")
    return updated


# =============================================================================
# ENDPOINTS: STUDENT SPECIALIZATION
# =============================================================================
@router.post("/students", status_code=status.HTTP_201_CREATED, summary="Create student profile")
def create_student(
    payload: StudentCreate,
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    try:
        student = mgr.create_student(**payload.dict())
        return student
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/students/{student_id}", summary="Get student details")
def get_student(student_id: int, db: Database = Depends(get_database)):
    mgr = CorePersonManager(db)
    student = mgr.get_student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


# =============================================================================
# ENDPOINTS: SENSITIVE MEDICAL INFO (AUDIT LOGGED)
# =============================================================================
@router.get("/students/{student_id}/medical", summary="View confidential medical data (Audit Logged)")
def get_student_medical(
    student_id: int,
    request: Request,
    db: Database = Depends(get_database),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    mgr = CorePersonManager(db)
    client_ip = request.client.host if request.client else None
    actor_id = current_user.get("user_id") if current_user else None
    actor_name = current_user.get("username") if current_user else "anonymous"

    # Reading medical data logs an audit event automatically
    medical = mgr.get_student_medical(
        student_id=student_id,
        actor_person_id=actor_id,
        actor_username=actor_name,
        ip_address=client_ip,
    )
    return medical or {}


@router.put("/students/{student_id}/medical", summary="Upsert student medical records")
def upsert_student_medical(
    student_id: int,
    payload: MedicalUpsert,
    db: Database = Depends(get_database),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    mgr = CorePersonManager(db)
    actor_id = current_user.get("user_id") if current_user else None
    actor_name = current_user.get("username") if current_user else None
    try:
        return mgr.upsert_student_medical(
            student_id=student_id,
            actor_person_id=actor_id,
            actor_username=actor_name,
            **payload.dict(),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: GUARDIAN LINKS & PICKUP AUTHORIZATIONS
# =============================================================================
@router.post("/students/{student_id}/guardians", summary="Link guardian to student")
def link_guardian(
    student_id: int,
    payload: GuardianLinkCreate,
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    try:
        return mgr.link_guardian(student_id=student_id, **payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/students/{student_id}/guardians", summary="Get linked guardians")
def get_student_guardians(student_id: int, db: Database = Depends(get_database)):
    mgr = CorePersonManager(db)
    return mgr.get_guardians_for_student(student_id)


@router.post("/students/{student_id}/pickups", summary="Add pickup authorization")
def add_pickup(
    student_id: int,
    payload: PickupCreate,
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    try:
        return mgr.add_pickup_authorization(student_id=student_id, **payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/students/{student_id}/pickups", summary="Get authorized pickups")
def get_pickups(
    student_id: int,
    active_only: bool = True,
    db: Database = Depends(get_database),
):
    mgr = CorePersonManager(db)
    return mgr.get_pickup_authorizations(student_id, active_only=active_only)


# =============================================================================
# ENDPOINTS: SENSITIVE ACTION AUDIT LOGS
# =============================================================================
@router.get("/audit-logs", summary="Query sensitive action audit trail")
def list_audit_logs(
    action_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_database),
):
    audit = CoreAuditManager(db)
    return audit.get_logs(
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        branch_id=branch_id,
        limit=limit,
        offset=offset,
    )


@router.post("/audit/sensitive-action", status_code=status.HTTP_201_CREATED, summary="Log sensitive ERP action")
def log_sensitive_action(
    payload: SensitiveActionLogRequest,
    request: Request,
    db: Database = Depends(get_database),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    audit = CoreAuditManager(db)
    client_ip = request.client.host if request.client else None
    actor_id = current_user.get("user_id") if current_user else None
    actor_name = current_user.get("username") if current_user else None

    entry = audit.log_action(
        action_type=payload.action_type,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        actor_person_id=actor_id,
        actor_username=actor_name,
        branch_id=payload.branch_id,
        old_values=payload.old_values,
        new_values=payload.new_values,
        reason=payload.reason,
        ip_address=client_ip,
    )
    if not entry:
        raise HTTPException(status_code=400, detail="Failed to write audit entry.")
    return entry
