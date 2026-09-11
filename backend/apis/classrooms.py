"""
backend/apis/classrooms.py
--------------------------
Physical Classrooms, Lecture Halls & Capacities REST Router.
Provides endpoints for:
  - Listing classrooms across branches with capacity filters
  - Viewing classroom details
  - Registering new classrooms (Admin protected)
  - Updating classroom capacity and floor allocation (Admin protected)
  - Deleting unused classrooms (Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    ClassroomManager,
    BranchManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ClassroomBase(BaseModel):
    branch_id: str = Field(..., description="Associated branch ID", example="CENTER")
    name: str = Field(..., description="Classroom name or identifier", example="قاعة 1")
    capacity: int = Field(20, ge=1, description="Maximum seated student capacity", example=18)
    floor_number: Optional[int] = Field(0, description="Floor / level number", example=1)
    description: Optional[str] = Field(None, description="Facilities or specialized notes", example="Equipped with Soroban abacuses")
    is_active: bool = Field(True, description="Active status")


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    branch_id: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1)
    floor_number: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_classrooms_mgr(db: Database = Depends(get_database)) -> ClassroomManager:
    return ClassroomManager(db)


def get_branches_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List classrooms",
    description="Lists all classrooms across branches with capacity and location information.",
)
def list_classrooms(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    active_only: bool = Query(False, description="Filter active rooms only"),
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
):
    return mgr.get_all(branch_id=branch_id, active_only=active_only)


@router.get(
    "/{classroom_id}",
    summary="Get classroom by ID",
    description="Retrieves a single classroom record by primary key.",
)
def get_classroom(
    classroom_id: int = Path(..., description="Classroom ID"),
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
):
    room = mgr.get_by_id(classroom_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom ID {classroom_id} not found.",
        )
    return room


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create classroom",
    description="Creates a new classroom in the specified branch. Requires ADMIN or DIRECTOR role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_classroom(
    payload: ClassroomCreate,
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
    branches_mgr: BranchManager = Depends(get_branches_mgr),
):
    branch = branches_mgr.get_by_id(payload.branch_id)
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        name=payload.name,
        capacity=payload.capacity,
        floor_number=payload.floor_number or 0,
        description=payload.description,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create classroom.",
        )
    return created


@router.put(
    "/{classroom_id}",
    summary="Update classroom",
    description="Updates classroom parameters. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_classroom(
    classroom_id: int,
    payload: ClassroomUpdate,
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
):
    existing = mgr.get_by_id(classroom_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom ID {classroom_id} not found.",
        )
    success = mgr.update(classroom_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no fields modified.",
        )
    return mgr.get_by_id(classroom_id)


@router.delete(
    "/{classroom_id}",
    summary="Delete classroom",
    description="Deletes a classroom record. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_classroom(
    classroom_id: int,
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
):
    existing = mgr.get_by_id(classroom_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom ID {classroom_id} not found.",
        )
    success = mgr.delete(classroom_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete classroom: referenced by schedules or completed sessions.",
        )
    return {"message": f"Classroom ID {classroom_id} deleted successfully."}
