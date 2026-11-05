"""
backend/apis/acad_timetable.py
-------------------------------
REST API Router for Groups, Weekly Timetable Slots, and Automated Clash Detection:
  - acad_group: Student cohorts per course and branch
  - acad_group_slot: Weekly recurring timetable slots
  - Automated collision detection for trainer, room, and group overlaps
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    AcadTimetableManager,
)
from backend.database.acad_timetable_manager import TimetableClashError

router = APIRouter(prefix="/acad/timetable", tags=["Academy Timetable & Clash Detection"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class GroupCreate(BaseModel):
    branch_id: str
    course_id: int
    academic_year_id: int
    group_name: str
    trainer_person_id: Optional[int] = None
    room_id: Optional[int] = None
    max_capacity: int = Field(15, gt=0)


class GroupSlotCreate(BaseModel):
    room_id: int
    trainer_person_id: int
    day_of_week: int = Field(..., ge=1, le=7, description="ISO day of week: 1=Monday, 7=Sunday")
    start_time: str = Field(..., description="e.g. '09:00'")
    end_time: str = Field(..., description="e.g. '11:00'")


class ClashCheckRequest(BaseModel):
    group_id: int
    room_id: int
    trainer_person_id: int
    day_of_week: int = Field(..., ge=1, le=7)
    start_time: str
    end_time: str
    exclude_slot_id: Optional[int] = None


# =============================================================================
# ENDPOINTS: GROUPS
# =============================================================================
@router.post("/groups", status_code=status.HTTP_201_CREATED, summary="Create academy group")
def create_group(payload: GroupCreate, db: Database = Depends(get_database)):
    mgr = AcadTimetableManager(db)
    try:
        return mgr.create_group(**payload.dict())
    except TimetableClashError as ce:
        raise HTTPException(status_code=409, detail=str(ce))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/groups", summary="List academy groups")
def list_groups(
    branch_id: Optional[str] = None,
    course_id: Optional[int] = None,
    academic_year_id: Optional[int] = None,
    status: Optional[str] = "ACTIVE",
    db: Database = Depends(get_database),
):
    mgr = AcadTimetableManager(db)
    return mgr.get_groups(
        branch_id=branch_id,
        course_id=course_id,
        academic_year_id=academic_year_id,
        status=status,
    )


@router.get("/groups/{group_id}", summary="Get group details and slots")
def get_group(group_id: int, db: Database = Depends(get_database)):
    mgr = AcadTimetableManager(db)
    g = mgr.get_group_by_id(group_id)
    if not g:
        raise HTTPException(status_code=404, detail="Group not found")
    return g


# =============================================================================
# ENDPOINTS: CLASH DETECTION & SLOTS
# =============================================================================
@router.post("/check-clash", summary="Preview timetable collisions (Trainer, Room, Group)")
def check_timetable_clash(payload: ClashCheckRequest, db: Database = Depends(get_database)):
    mgr = AcadTimetableManager(db)
    try:
        return mgr.check_clash(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/groups/{group_id}/slots", status_code=status.HTTP_201_CREATED, summary="Schedule weekly slot (blocks clashes)")
def schedule_group_slot(
    group_id: int,
    payload: GroupSlotCreate,
    db: Database = Depends(get_database),
):
    mgr = AcadTimetableManager(db)
    try:
        return mgr.add_group_slot(group_id=group_id, **payload.dict())
    except TimetableClashError as ce:
        raise HTTPException(status_code=409, detail=str(ce))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/groups/{group_id}/slots", summary="Get weekly timetable slots for group")
def get_group_slots(group_id: int, db: Database = Depends(get_database)):
    mgr = AcadTimetableManager(db)
    return mgr.get_group_slots(group_id)
