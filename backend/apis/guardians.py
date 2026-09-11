"""
backend/apis/guardians.py
-------------------------
Guardians & Parents Master Registry REST Router.
Provides endpoints for:
  - Listing and searching guardians across phone numbers and names
  - Inspecting single guardian profiles
  - Viewing all student wards linked to a guardian
  - Registering new parents/guardians (Staff protected)
  - Updating contact info and addresses (Staff protected)
  - Deleting guardian records (Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, GuardianManager
from backend.apis.security import require_role, get_current_active_user

router = APIRouter(prefix="/guardians", tags=["Guardians"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class GuardianBase(BaseModel):
    full_name_ar: str = Field(..., description="Arabic full name of the guardian", example="محمد العربي بن مهيدي")
    full_name_fr: Optional[str] = Field(None, description="French / Latin full name", example="Mohamed Larbi Ben M'hidi")
    phone_primary: str = Field(..., description="Primary contact phone number", example="0550123456")
    phone_secondary: Optional[str] = Field(None, description="Secondary or WhatsApp contact", example="0661987654")
    relationship: str = Field("Parent", description="Relationship type: Father, Mother, Guardian, Grandparent, Other", example="Father")
    national_id: Optional[str] = Field(None, description="National Identity Number / NIN", example="1029384756")
    address: Optional[str] = Field(None, description="Residential address", example="Alger Centre, Alger")
    email: Optional[str] = Field(None, description="Contact email", example="parent@email.dz")
    notes: Optional[str] = Field(None, description="Administrative or pickup remarks")


class GuardianCreate(GuardianBase):
    pass


class GuardianUpdate(BaseModel):
    full_name_ar: Optional[str] = None
    full_name_fr: Optional[str] = None
    phone_primary: Optional[str] = None
    phone_secondary: Optional[str] = None
    relationship: Optional[str] = None
    national_id: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None


# =============================================================================
# DEPENDENCY PROVIDER
# =============================================================================

def get_guardian_mgr(db: Database = Depends(get_database)) -> GuardianManager:
    return GuardianManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List and search guardians",
    description="Lists registered guardians with optional multi-attribute search (Arabic/French name, phone, national ID) and relationship filtering.",
)
def list_guardians(
    search: Optional[str] = Query(None, description="Search term for names, phones, or national ID"),
    relationship: Optional[str] = Query(None, description="Filter by relationship (Father, Mother, Guardian, etc.)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: GuardianManager = Depends(get_guardian_mgr),
):
    guardians = mgr.get_all(search=search, relationship=relationship, limit=limit, offset=offset)
    total_count = mgr.count(search=search)
    return {
        "items": guardians,
        "total": total_count,
        "limit": limit,
        "offset": offset,
    }


@router.get(
    "/{guardian_id}",
    summary="Get guardian by ID",
    description="Retrieves a single guardian record by primary key.",
)
def get_guardian(
    guardian_id: int = Path(..., description="Guardian ID"),
    mgr: GuardianManager = Depends(get_guardian_mgr),
):
    guardian = mgr.get_by_id(guardian_id)
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian ID {guardian_id} not found.",
        )
    return guardian


@router.get(
    "/{guardian_id}/students",
    summary="Get students linked to guardian",
    description="Returns all enrolled children/wards linked to this guardian with pickup authorization details.",
)
def get_guardian_students(
    guardian_id: int = Path(..., description="Guardian ID"),
    mgr: GuardianManager = Depends(get_guardian_mgr),
):
    guardian = mgr.get_by_id(guardian_id)
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian ID {guardian_id} not found.",
        )
    return mgr.get_students_for_guardian(guardian_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Register new guardian",
    description="Registers a new parent/guardian profile. Requires STAFF, TEACHER, or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def create_guardian(
    payload: GuardianCreate,
    mgr: GuardianManager = Depends(get_guardian_mgr),
):
    created = mgr.create(
        full_name_ar=payload.full_name_ar,
        full_name_fr=payload.full_name_fr,
        phone_primary=payload.phone_primary,
        phone_secondary=payload.phone_secondary,
        relationship=payload.relationship,
        national_id=payload.national_id,
        address=payload.address,
        email=payload.email,
        notes=payload.notes,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register guardian record.",
        )
    return created


@router.put(
    "/{guardian_id}",
    summary="Update guardian details",
    description="Modifies guardian contact information or address. Requires STAFF or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "TEACHER", "ADMIN", "DIRECTOR"))],
)
def update_guardian(
    guardian_id: int,
    payload: GuardianUpdate,
    mgr: GuardianManager = Depends(get_guardian_mgr),
):
    existing = mgr.get_by_id(guardian_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian ID {guardian_id} not found.",
        )

    success = mgr.update(guardian_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(guardian_id)


@router.delete(
    "/{guardian_id}",
    summary="Delete guardian",
    description="Permanently deletes a guardian profile. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_guardian(
    guardian_id: int,
    mgr: GuardianManager = Depends(get_guardian_mgr),
):
    existing = mgr.get_by_id(guardian_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Guardian ID {guardian_id} not found.",
        )

    success = mgr.delete(guardian_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete guardian: active student linkages or references exist.",
        )
    return {"message": f"Guardian ID {guardian_id} deleted successfully."}
