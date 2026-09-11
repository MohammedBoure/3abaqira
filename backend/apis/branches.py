"""
backend/apis/branches.py
-------------------------
Multi-Tenant Branch Management REST Router.
Provides endpoints for:
  - Listing all operating branches (CENTER, RAWDA, etc.)
  - Branch details inspection
  - Creating new operational branches (Admin protected)
  - Updating branch parameters (Admin protected)
  - Toggling active operational status (Admin protected)
  - Deleting empty branches (Admin protected)
  - Listing classrooms assigned to a branch
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    BranchManager,
    ClassroomManager,
)
from backend.apis.security import require_role, get_current_active_user

router = APIRouter(prefix="/branches", tags=["Branches"])


# =============================================================================
# PYDANTIC DATA TRANSFER OBJECTS (SCHEMAS)
# =============================================================================

class BranchBase(BaseModel):
    name_ar: str = Field(..., description="Arabic name of the branch", example="أكاديمية الأطفال العباقرة - المركز")
    name_en: Optional[str] = Field(None, description="English name of the branch", example="3abaqira Academy - Center")
    branch_type: str = Field(..., description="Branch classification: ACADEMY, DAYCARE, HYBRID, OTHER", example="ACADEMY")
    phone: Optional[str] = Field(None, description="Primary contact phone number", example="+213-21-000001")
    email: Optional[str] = Field(None, description="Contact email", example="center@3abaqira.dz")
    address: Optional[str] = Field(None, description="Physical address location", example="Algiers, Algeria")
    is_active: bool = Field(True, description="Operating status flag")


class BranchCreate(BranchBase):
    branch_id: str = Field(..., max_length=20, description="Unique tenant code (e.g., 'CENTER', 'RAWDA')", example="CENTER")


class BranchUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    branch_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class StatusToggleRequest(BaseModel):
    is_active: bool = Field(..., description="New active status")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_branches_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_classrooms_mgr(db: Database = Depends(get_database)) -> ClassroomManager:
    return ClassroomManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List all branches",
    description="Returns all registered branches (Academy Center, Daycare, etc.). Optional active-only filter.",
)
def list_branches(
    active_only: bool = Query(False, description="Filter for active branches only"),
    mgr: BranchManager = Depends(get_branches_mgr),
):
    return mgr.get_all(active_only=active_only)


@router.get(
    "/{branch_id}",
    summary="Get branch details",
    description="Retrieves a single branch record by its unique identifier (e.g. 'CENTER', 'RAWDA').",
)
def get_branch(
    branch_id: str = Path(..., description="Branch unique code"),
    mgr: BranchManager = Depends(get_branches_mgr),
):
    branch = mgr.get_by_id(branch_id)
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with ID '{branch_id}' not found.",
        )
    return branch


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create new branch",
    description="Registers a new branch location. Requires ADMIN or SUPER_ADMIN role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_branch(
    payload: BranchCreate,
    mgr: BranchManager = Depends(get_branches_mgr),
):
    existing = mgr.get_by_id(payload.branch_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Branch with ID '{payload.branch_id}' already exists.",
        )
    created = mgr.create(
        branch_id=payload.branch_id,
        name_ar=payload.name_ar,
        name_en=payload.name_en,
        branch_type=payload.branch_type,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register branch.",
        )
    return created


@router.put(
    "/{branch_id}",
    summary="Update branch details",
    description="Updates mutable attributes of an existing branch. Requires ADMIN or SUPER_ADMIN role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def update_branch(
    branch_id: str,
    payload: BranchUpdate,
    mgr: BranchManager = Depends(get_branches_mgr),
):
    existing = mgr.get_by_id(branch_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    success = mgr.update(branch_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No attributes updated or update failed.",
        )
    return mgr.get_by_id(branch_id)


@router.patch(
    "/{branch_id}/status",
    summary="Toggle branch active status",
    description="Enables or disables an operational branch. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def toggle_branch_status(
    branch_id: str,
    payload: StatusToggleRequest,
    mgr: BranchManager = Depends(get_branches_mgr),
):
    existing = mgr.get_by_id(branch_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    mgr.toggle_status(branch_id, payload.is_active)
    return {
        "branch_id": branch_id,
        "is_active": payload.is_active,
        "message": "Branch operational status updated.",
    }


@router.delete(
    "/{branch_id}",
    summary="Delete branch",
    description="Deletes an unused branch. Fails if dependent records (classrooms, enrollments) exist.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_branch(
    branch_id: str,
    mgr: BranchManager = Depends(get_branches_mgr),
):
    existing = mgr.get_by_id(branch_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    success = mgr.delete(branch_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete branch '{branch_id}': dependent records (classrooms, groups) exist.",
        )
    return {"message": f"Branch '{branch_id}' deleted successfully."}


@router.get(
    "/{branch_id}/classrooms",
    summary="List classrooms in branch",
    description="Lists all classrooms allocated to this specific branch.",
)
def get_branch_classrooms(
    branch_id: str,
    active_only: bool = Query(False),
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
):
    return mgr.get_by_branch(branch_id, active_only=active_only)
