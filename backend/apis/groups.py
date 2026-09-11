"""
backend/apis/groups.py
----------------------
Student Groups, Cohorts & Class Sections REST Router.
Provides endpoints for:
  - Listing groups across branches, programs, levels, and academic years
  - Viewing group details, current headcounts, and schedules
  - Creating new study groups and cohorts (Admin protected)
  - Modifying group teachers, max capacity, or names (Admin protected)
  - Toggling group operational status (ACTIVE, PLANNED, COMPLETED, MERGED, CANCELLED)
  - Deleting empty group definitions (Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, GroupManager, BranchManager, LevelManager, AcademicYearManager
from backend.apis.security import require_role

router = APIRouter(prefix="/groups", tags=["Groups"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class GroupBase(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", example="CENTER")
    level_id: int = Field(..., description="Associated curriculum level ID", example=1)
    academic_year_id: int = Field(..., description="Target academic cycle ID", example=2)
    group_name: str = Field(..., max_length=100, description="Cohort or class identifier", example="فوج السبت صباحا (أ)")
    lead_teacher_id: Optional[int] = Field(None, description="Primary teacher / instructor ID")
    secondary_teacher_id: Optional[int] = Field(None, description="Assistant or secondary coach ID")
    max_capacity: int = Field(18, ge=1, description="Maximum seated student capacity", example=18)
    status: str = Field("ACTIVE", description="Status: ACTIVE, PLANNED, COMPLETED, MERGED, CANCELLED", example="ACTIVE")


class GroupCreate(GroupBase):
    pass


class GroupUpdate(BaseModel):
    level_id: Optional[int] = None
    group_name: Optional[str] = None
    lead_teacher_id: Optional[int] = None
    secondary_teacher_id: Optional[int] = None
    max_capacity: Optional[int] = Field(None, ge=1)
    status: Optional[str] = None


class GroupStatusToggleRequest(BaseModel):
    status: str = Field(..., description="New operational status: ACTIVE, PLANNED, COMPLETED, MERGED, CANCELLED")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_group_mgr(db: Database = Depends(get_database)) -> GroupManager:
    return GroupManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_level_mgr(db: Database = Depends(get_database)) -> LevelManager:
    return LevelManager(db)


def get_year_mgr(db: Database = Depends(get_database)) -> AcademicYearManager:
    return AcademicYearManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List student groups",
    description="Lists study groups and cohorts with relational branch, program, level, and academic year context.",
)
def list_groups(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year ID"),
    level_id: Optional[int] = Query(None, description="Filter by curriculum level ID"),
    status: Optional[str] = Query(None, description="Filter by operational status"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: GroupManager = Depends(get_group_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        academic_year_id=academic_year_id,
        level_id=level_id,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{group_id}",
    summary="Get group details",
    description="Retrieves single group record including weekly recurring timetable schedules.",
)
def get_group(
    group_id: int = Path(..., description="Group ID"),
    mgr: GroupManager = Depends(get_group_mgr),
):
    group = mgr.get_by_id(group_id, include_schedules=True)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group ID {group_id} not found.",
        )
    return group


@router.get(
    "/{group_id}/schedules",
    summary="Get group schedules",
    description="Lists all recurring timetable slots and classrooms assigned to this group.",
)
def get_group_schedules(
    group_id: int = Path(..., description="Group ID"),
    mgr: GroupManager = Depends(get_group_mgr),
):
    group = mgr.get_by_id(group_id, include_schedules=False)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Group ID {group_id} not found.",
        )
    return mgr.get_schedules(group_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create student group",
    description="Registers a new group or cohort. Requires ADMIN or DIRECTOR role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_group(
    payload: GroupCreate,
    mgr: GroupManager = Depends(get_group_mgr),
    b_mgr: BranchManager = Depends(get_branch_mgr),
    l_mgr: LevelManager = Depends(get_level_mgr),
    ay_mgr: AcademicYearManager = Depends(get_year_mgr),
):
    branch = b_mgr.get_by_id(payload.branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Branch '{payload.branch_id}' not found.")

    level = l_mgr.get_by_id(payload.level_id)
    if not level:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Level ID {payload.level_id} not found.")

    year = ay_mgr.get_by_id(payload.academic_year_id)
    if not year:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Academic year ID {payload.academic_year_id} not found.")

    created = mgr.create(
        branch_id=payload.branch_id,
        level_id=payload.level_id,
        academic_year_id=payload.academic_year_id,
        group_name=payload.group_name,
        lead_teacher_id=payload.lead_teacher_id,
        secondary_teacher_id=payload.secondary_teacher_id,
        max_capacity=payload.max_capacity,
        status=payload.status,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create student group.",
        )
    return created


@router.put(
    "/{group_id}",
    summary="Update group details",
    description="Updates group title, teachers, capacity, or status. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_group(
    group_id: int,
    payload: GroupUpdate,
    mgr: GroupManager = Depends(get_group_mgr),
):
    existing = mgr.get_by_id(group_id, include_schedules=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Group ID {group_id} not found.")

    success = mgr.update(group_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(group_id, include_schedules=True)


@router.patch(
    "/{group_id}/status",
    summary="Toggle group status",
    description="Updates group lifecycle status (ACTIVE, PLANNED, COMPLETED, MERGED, CANCELLED). Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def toggle_group_status(
    group_id: int,
    payload: GroupStatusToggleRequest,
    mgr: GroupManager = Depends(get_group_mgr),
):
    existing = mgr.get_by_id(group_id, include_schedules=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Group ID {group_id} not found.")

    success = mgr.toggle_status(group_id, payload.status)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{payload.status}'. Allowed: ACTIVE, PLANNED, COMPLETED, MERGED, CANCELLED.",
        )
    return {
        "group_id": group_id,
        "status": payload.status.upper(),
        "message": "Group operational status updated.",
    }


@router.delete(
    "/{group_id}",
    summary="Delete group",
    description="Deletes a group. Fails if dependent student enrollments exist. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_group(
    group_id: int,
    mgr: GroupManager = Depends(get_group_mgr),
):
    existing = mgr.get_by_id(group_id, include_schedules=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Group ID {group_id} not found.")

    success = mgr.delete(group_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete group: active enrollments or conducted sessions exist.",
        )
    return {"message": f"Group ID {group_id} deleted successfully."}
