"""
backend/apis/schedules.py
-------------------------
Weekly Timetables & Classroom Occupancy REST Router.
Provides endpoints for:
  - Listing group schedules and weekly recurrence slots
  - Classroom occupancy conflict / clash detection
  - Creating new weekly schedule slots (Admin protected)
  - Updating classroom allocations and time bounds (Admin protected)
  - Inspecting weekly timetable by classroom
  - Deleting schedule slots (Admin protected)
"""

from datetime import time
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, ScheduleManager, GroupManager, ClassroomManager
from backend.apis.security import require_role

router = APIRouter(prefix="/schedules", tags=["Schedules"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ScheduleBase(BaseModel):
    group_id: int = Field(..., description="Target group ID", example=1)
    classroom_id: int = Field(..., description="Assigned physical classroom ID", example=1)
    day_of_week: str = Field(..., description="Day of week (e.g. 'Saturday', 'السبت')", example="Saturday")
    start_time: time = Field(..., description="Session start time", example="09:00:00")
    end_time: time = Field(..., description="Session end time", example="11:00:00")
    time_slot_label: Optional[str] = Field(None, description="Human readable label", example="الفترة الصباحية 09:00 - 11:00")


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    classroom_id: Optional[int] = None
    day_of_week: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    time_slot_label: Optional[str] = None


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_schedule_mgr(db: Database = Depends(get_database)) -> ScheduleManager:
    return ScheduleManager(db)


def get_group_mgr(db: Database = Depends(get_database)) -> GroupManager:
    return GroupManager(db)


def get_classroom_mgr(db: Database = Depends(get_database)) -> ClassroomManager:
    return ClassroomManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List schedule slots",
    description="Lists weekly recurring timetable schedule slots with classroom and group context.",
)
def list_schedules(
    group_id: Optional[int] = Query(None, description="Filter by group ID"),
    classroom_id: Optional[int] = Query(None, description="Filter by classroom ID"),
    day_of_week: Optional[str] = Query(None, description="Filter by day of week"),
    mgr: ScheduleManager = Depends(get_schedule_mgr),
):
    return mgr.get_all(group_id=group_id, classroom_id=classroom_id, day_of_week=day_of_week)


@router.get(
    "/{schedule_id}",
    summary="Get schedule details",
    description="Retrieves a single recurring schedule record by ID.",
)
def get_schedule(
    schedule_id: int = Path(..., description="Schedule ID"),
    mgr: ScheduleManager = Depends(get_schedule_mgr),
):
    slot = mgr.get_by_id(schedule_id)
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule ID {schedule_id} not found.",
        )
    return slot


@router.get(
    "/classroom/{classroom_id}/timetable",
    summary="Get classroom weekly timetable",
    description="Returns full weekly recurring schedule allocations for a physical classroom.",
)
def get_classroom_timetable(
    classroom_id: int = Path(..., description="Classroom ID"),
    mgr: ScheduleManager = Depends(get_schedule_mgr),
    cr_mgr: ClassroomManager = Depends(get_classroom_mgr),
):
    room = cr_mgr.get_by_id(classroom_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Classroom ID {classroom_id} not found.",
        )
    return mgr.get_timetable_by_classroom(classroom_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create schedule slot",
    description="Adds a weekly timetable slot. Performs automatic classroom clash and overlap detection.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_schedule(
    payload: ScheduleCreate,
    mgr: ScheduleManager = Depends(get_schedule_mgr),
    g_mgr: GroupManager = Depends(get_group_mgr),
    cr_mgr: ClassroomManager = Depends(get_classroom_mgr),
):
    if payload.end_time <= payload.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be strictly later than start time.",
        )

    group = g_mgr.get_by_id(payload.group_id, include_schedules=False)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Group ID {payload.group_id} not found.")

    room = cr_mgr.get_by_id(payload.classroom_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Classroom ID {payload.classroom_id} not found.")

    # Clash Detection
    clash = mgr.check_clash(
        classroom_id=payload.classroom_id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
    )
    if clash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Classroom '{room['name']}' is already booked on {payload.day_of_week} "
                f"between {clash['start_time']} and {clash['end_time']} by group '{clash['group_name']}'."
            ),
        )

    created = mgr.create(
        group_id=payload.group_id,
        classroom_id=payload.classroom_id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        time_slot_label=payload.time_slot_label,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register schedule slot.",
        )
    return created


@router.put(
    "/{schedule_id}",
    summary="Update schedule slot",
    description="Modifies classroom or time slot with collision prevention.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_schedule(
    schedule_id: int,
    payload: ScheduleUpdate,
    mgr: ScheduleManager = Depends(get_schedule_mgr),
):
    existing = mgr.get_by_id(schedule_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule ID {schedule_id} not found.")

    target_room = payload.classroom_id or existing["classroom_id"]
    target_day = payload.day_of_week or existing["day_of_week"]
    target_start = payload.start_time or existing["start_time"]
    target_end = payload.end_time or existing["end_time"]

    if target_end <= target_start:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time.")

    # Clash Detection excluding this record
    clash = mgr.check_clash(
        classroom_id=target_room,
        day_of_week=target_day,
        start_time=target_start,
        end_time=target_end,
        exclude_schedule_id=schedule_id,
    )
    if clash:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Classroom conflict detected on {target_day} with group '{clash['group_name']}'.",
        )

    success = mgr.update(schedule_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(schedule_id)


@router.delete(
    "/{schedule_id}",
    summary="Delete schedule slot",
    description="Deletes a schedule slot. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_schedule(
    schedule_id: int,
    mgr: ScheduleManager = Depends(get_schedule_mgr),
):
    existing = mgr.get_by_id(schedule_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule ID {schedule_id} not found.")

    mgr.delete(schedule_id)
    return {"message": f"Schedule ID {schedule_id} deleted successfully."}
