"""
backend/apis/students.py
------------------------
Students & Student-Guardian Relationships REST Router.
Provides endpoints for:
  - Listing and searching students across Arabic/French names and codes
  - Viewing detailed student profiles including medical notes and guardians
  - Registering new students with auto-generated student codes
  - Updating student profiles and toggling active status
  - Linking / unlinking guardians, setting pickup rights & emergency flags
  - Deleting student records (Admin protected)
"""

from datetime import date
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, StudentManager, GuardianManager
from backend.apis.security import require_role

router = APIRouter(prefix="/students", tags=["Students"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class StudentBase(BaseModel):
    full_name_ar: str = Field(..., description="Arabic full name of student", example="يوسف بن مهيدي")
    first_name: Optional[str] = Field(None, description="First name (Latin / French)", example="Youcef")
    last_name: Optional[str] = Field(None, description="Last name (Latin / French)", example="Ben M'hidi")
    full_name_fr: Optional[str] = Field(None, description="Full French name", example="Youcef Ben M'hidi")
    birth_date: Optional[date] = Field(None, description="Date of birth", example="2018-05-15")
    gender: Optional[str] = Field(None, description="Gender: Male, Female", example="Male")
    blood_group: Optional[str] = Field(None, description="Blood group (e.g., A+, O+, B-)", example="O+")
    allergies: Optional[str] = Field(None, description="Food or medical allergies", example="Peanut allergy")
    medical_notes: Optional[str] = Field(None, description="Special physical or medical accommodations")
    emergency_phone: Optional[str] = Field(None, description="Primary emergency contact phone", example="0550123456")
    is_active: bool = Field(True, description="Enrolled active status")
    legacy_seq_number: Optional[int] = Field(None, description="Legacy Excel serial number if migrating")


class StudentCreate(StudentBase):
    student_code: Optional[str] = Field(None, description="Optional custom student code; auto-generated if omitted", example="STD-2025-0001")
    initial_guardian_id: Optional[int] = Field(None, description="ID of parent/guardian to link upon creation")
    initial_relationship: str = Field("Parent", description="Relationship type for initial guardian")


class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name_ar: Optional[str] = None
    full_name_fr: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    medical_notes: Optional[str] = None
    emergency_phone: Optional[str] = None
    is_active: Optional[bool] = None
    legacy_seq_number: Optional[int] = None
    student_code: Optional[str] = None


class StudentStatusToggleRequest(BaseModel):
    is_active: bool = Field(..., description="Target active status")


class AssignGuardianRequest(BaseModel):
    guardian_id: int = Field(..., description="ID of guardian to assign")
    is_primary_guardian: bool = Field(True, description="Whether this is the primary billing/contact parent")
    is_emergency_contact: bool = Field(True, description="Designated emergency contact")
    can_pickup: bool = Field(True, description="Authorized to pick up the child from daycare/center")
    relationship_type: str = Field("Parent", description="Relationship label: Father, Mother, Guardian, Driver, Other")


class UpdateGuardianLinkRequest(BaseModel):
    is_primary_guardian: Optional[bool] = None
    is_emergency_contact: Optional[bool] = None
    can_pickup: Optional[bool] = None
    relationship_type: Optional[str] = None


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_student_mgr(db: Database = Depends(get_database)) -> StudentManager:
    return StudentManager(db)


def get_guardian_mgr(db: Database = Depends(get_database)) -> GuardianManager:
    return GuardianManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List and search students",
    description="Lists registered students with multi-attribute bilingual search, gender filtering, active status toggle, and pagination.",
)
def list_students(
    search: Optional[str] = Query(None, description="Search across Arabic/French names, code, or phone"),
    gender: Optional[str] = Query(None, description="Filter by gender (Male/Female)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: StudentManager = Depends(get_student_mgr),
):
    students = mgr.get_all(search=search, gender=gender, is_active=is_active, limit=limit, offset=offset)
    total_count = mgr.count(search=search, is_active=is_active)
    return {
        "items": students,
        "total": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.get(
    "/{student_id}",
    summary="Get student profile",
    description="Retrieves comprehensive student profile including medical notes and all linked guardians with pickup rights.",
)
def get_student(
    student_id: int = Path(..., description="Student ID"),
    mgr: StudentManager = Depends(get_student_mgr),
):
    student = mgr.get_by_id(student_id, include_guardians=True)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )
    return student


@router.get(
    "/code/{student_code}",
    summary="Get student by unique code",
    description="Finds a student profile by their unique student code (e.g., STD-2025-0012).",
)
def get_student_by_code(
    student_code: str = Path(..., description="Unique student code"),
    mgr: StudentManager = Depends(get_student_mgr),
):
    student = mgr.get_by_code(student_code)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with code '{student_code}' not found.",
        )
    student["guardians"] = mgr.get_guardians_for_student(student["student_id"])
    return student


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Register new student",
    description="Registers a new student, automatically issuing a student code if not provided. Optionally links an initial guardian. Requires STAFF, TEACHER, or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def create_student(
    payload: StudentCreate,
    mgr: StudentManager = Depends(get_student_mgr),
    g_mgr: GuardianManager = Depends(get_guardian_mgr),
):
    # If initial guardian provided, ensure guardian exists
    if payload.initial_guardian_id:
        guardian = g_mgr.get_by_id(payload.initial_guardian_id)
        if not guardian:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Initial guardian ID {payload.initial_guardian_id} not found.",
            )

    created = mgr.create(
        full_name_ar=payload.full_name_ar,
        student_code=payload.student_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        full_name_fr=payload.full_name_fr,
        birth_date=payload.birth_date,
        gender=payload.gender,
        blood_group=payload.blood_group,
        allergies=payload.allergies,
        medical_notes=payload.medical_notes,
        emergency_phone=payload.emergency_phone,
        is_active=payload.is_active,
        legacy_seq_number=payload.legacy_seq_number,
        initial_guardian_id=payload.initial_guardian_id,
        initial_relationship=payload.initial_relationship,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register student record.",
        )
    return created


@router.put(
    "/{student_id}",
    summary="Update student profile",
    description="Modifies demographic, medical, or contact details for a student. Requires STAFF or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def update_student(
    student_id: int,
    payload: StudentUpdate,
    mgr: StudentManager = Depends(get_student_mgr),
):
    existing = mgr.get_by_id(student_id, include_guardians=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )

    success = mgr.update(student_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(student_id, include_guardians=True)


@router.patch(
    "/{student_id}/status",
    summary="Toggle student active status",
    description="Enables or suspends a student enrollment status. Requires STAFF or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def toggle_student_status(
    student_id: int,
    payload: StudentStatusToggleRequest,
    mgr: StudentManager = Depends(get_student_mgr),
):
    existing = mgr.get_by_id(student_id, include_guardians=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )

    mgr.toggle_status(student_id, payload.is_active)
    return {
        "student_id": student_id,
        "is_active": payload.is_active,
        "message": "Student active status updated successfully.",
    }


@router.delete(
    "/{student_id}",
    summary="Delete student",
    description="Deletes a student record. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_student(
    student_id: int,
    mgr: StudentManager = Depends(get_student_mgr),
):
    existing = mgr.get_by_id(student_id, include_guardians=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )

    success = mgr.delete(student_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete student: references exist in enrollments or invoices.",
        )
    return {"message": f"Student ID {student_id} deleted successfully."}


# ── Student-Guardian Junction Endpoints ─────────────────────────────────────

@router.get(
    "/{student_id}/guardians",
    summary="List student guardians",
    description="Lists all guardians linked to this student with pickup authorization and emergency contact flags.",
)
def get_student_guardians(
    student_id: int = Path(..., description="Student ID"),
    mgr: StudentManager = Depends(get_student_mgr),
):
    existing = mgr.get_by_id(student_id, include_guardians=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student ID {student_id} not found.",
        )
    return mgr.get_guardians_for_student(student_id)


@router.post(
    "/{student_id}/guardians",
    summary="Assign guardian to student",
    description="Links an existing guardian to a student, setting pickup permission and primary contact status. Requires STAFF or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def assign_guardian_to_student(
    student_id: int,
    payload: AssignGuardianRequest,
    mgr: StudentManager = Depends(get_student_mgr),
    g_mgr: GuardianManager = Depends(get_guardian_mgr),
):
    student = mgr.get_by_id(student_id, include_guardians=False)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Student ID {student_id} not found.")

    guardian = g_mgr.get_by_id(payload.guardian_id)
    if not guardian:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Guardian ID {payload.guardian_id} not found.")

    success = mgr.assign_guardian(
        student_id=student_id,
        guardian_id=payload.guardian_id,
        is_primary_guardian=payload.is_primary_guardian,
        is_emergency_contact=payload.is_emergency_contact,
        can_pickup=payload.can_pickup,
        relationship_type=payload.relationship_type,
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to link guardian to student.")

    return {
        "student_id": student_id,
        "guardian_id": payload.guardian_id,
        "message": "Guardian successfully assigned to student.",
        "guardians": mgr.get_guardians_for_student(student_id),
    }


@router.put(
    "/{student_id}/guardians/{guardian_id}",
    summary="Update student-guardian relationship",
    description="Updates relationship flags (primary contact, pickup rights, emergency contact) between a student and guardian.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def update_student_guardian_relationship(
    student_id: int,
    guardian_id: int,
    payload: UpdateGuardianLinkRequest,
    mgr: StudentManager = Depends(get_student_mgr),
):
    success = mgr.update_guardian_link(
        student_id=student_id,
        guardian_id=guardian_id,
        is_primary_guardian=payload.is_primary_guardian,
        is_emergency_contact=payload.is_emergency_contact,
        can_pickup=payload.can_pickup,
        relationship_type=payload.relationship_type,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update student-guardian linkage: relationship not found or no changes made.",
        )
    return {
        "student_id": student_id,
        "guardian_id": guardian_id,
        "message": "Relationship flags updated successfully.",
        "guardians": mgr.get_guardians_for_student(student_id),
    }


@router.delete(
    "/{student_id}/guardians/{guardian_id}",
    summary="Unlink guardian from student",
    description="Removes the association between a student and a guardian. Requires STAFF or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def unlink_guardian_from_student(
    student_id: int,
    guardian_id: int,
    mgr: StudentManager = Depends(get_student_mgr),
):
    success = mgr.remove_guardian(student_id, guardian_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No association found between student {student_id} and guardian {guardian_id}.",
        )
    return {"message": f"Guardian {guardian_id} successfully unlinked from student {student_id}."}
