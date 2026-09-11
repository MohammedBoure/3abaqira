"""
backend/apis/sessions.py
------------------------
Conducted Sessions & Student Attendance REST Router.
Provides endpoints for:
  - Logging conducted classroom sessions and teacher hours
  - Recording batch student attendance (PRESENT, ABSENT, EXCUSED, LATE)
  - Student gamification points scoring and evaluation notes
  - Inspecting single session attendance rosters
  - Student chronological attendance history lookup
  - Deleting session logs (Admin protected)
"""

from datetime import date, time
from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AttendanceManager, GroupManager
from backend.apis.security import require_role

router = APIRouter(prefix="/sessions", tags=["Sessions & Attendance"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class SessionCreate(BaseModel):
    branch_id: str = Field(..., description="Operating branch ID", example="CENTER")
    group_id: int = Field(..., description="Target group ID", example=1)
    instructor_id: int = Field(..., description="Teacher / Coach employee ID", example=1)
    classroom_id: Optional[int] = Field(None, description="Conducted classroom location ID", example=1)
    session_date: date = Field(..., description="Date session took place", example="2025-10-15")
    start_time: Optional[time] = Field(None, description="Actual start time", example="09:00:00")
    end_time: Optional[time] = Field(None, description="Actual end time", example="11:00:00")
    duration_hours: float = Field(2.0, ge=0.5, le=10.0, description="Duration in hours", example=2.0)
    shift_slot: Optional[str] = Field(None, description="Shift / timing label", example="الفترة الصباحية")
    calculated_wage: float = Field(0.0, ge=0.0, description="Accrued teacher session wage (DZD)", example=1500.0)
    notes: Optional[str] = Field(None, description="Curriculum lesson notes or remarks")


class SessionUpdate(BaseModel):
    instructor_id: Optional[int] = None
    classroom_id: Optional[int] = None
    session_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_hours: Optional[float] = Field(None, ge=0.5, le=10.0)
    shift_slot: Optional[str] = None
    calculated_wage: Optional[float] = Field(None, ge=0.0)
    notes: Optional[str] = None


class StudentAttendanceItem(BaseModel):
    student_id: int = Field(..., description="Enrolled student ID", example=1)
    status: str = Field("PRESENT", description="Status: PRESENT, ABSENT, EXCUSED, LATE", example="PRESENT")
    points_scored: int = Field(0, description="Gamification / performance points", example=10)
    evaluation_notes: Optional[str] = Field(None, description="Behavior or academic evaluation remarks")


class BatchAttendanceSubmission(BaseModel):
    records: List[StudentAttendanceItem] = Field(..., min_length=1, description="List of student attendance items")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_attendance_mgr(db: Database = Depends(get_database)) -> AttendanceManager:
    return AttendanceManager(db)


def get_group_mgr(db: Database = Depends(get_database)) -> GroupManager:
    return GroupManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List completed sessions",
    description="Lists conducted instructional sessions with filters for branch, group, instructor, and date bounds.",
)
def list_sessions(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    group_id: Optional[int] = Query(None, description="Filter by group ID"),
    instructor_id: Optional[int] = Query(None, description="Filter by instructor ID"),
    start_date: Optional[date] = Query(None, description="From session date"),
    end_date: Optional[date] = Query(None, description="To session date"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    return mgr.get_sessions(
        branch_id=branch_id,
        group_id=group_id,
        instructor_id=instructor_id,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{session_id}",
    summary="Get session details",
    description="Retrieves a single session log along with student attendance roster and marks.",
)
def get_session(
    session_id: int = Path(..., description="Session ID"),
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    session = mgr.get_session_by_id(session_id, include_attendance=True)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session ID {session_id} not found.",
        )
    return session


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Log completed session",
    description="Logs an instructional session conducted by a teacher. Requires TEACHER, STAFF, or ADMIN role.",
    dependencies=[Depends(require_role("TEACHER", "STAFF", "ADMIN", "DIRECTOR"))],
)
def create_session(
    payload: SessionCreate,
    mgr: AttendanceManager = Depends(get_attendance_mgr),
    g_mgr: GroupManager = Depends(get_group_mgr),
):
    group = g_mgr.get_by_id(payload.group_id, include_schedules=False)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Group ID {payload.group_id} not found.")

    created = mgr.create_session(
        branch_id=payload.branch_id,
        group_id=payload.group_id,
        instructor_id=payload.instructor_id,
        classroom_id=payload.classroom_id,
        session_date=payload.session_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_hours=payload.duration_hours,
        shift_slot=payload.shift_slot,
        calculated_wage=payload.calculated_wage,
        notes=payload.notes,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register session log.",
        )
    return created


@router.put(
    "/{session_id}",
    summary="Update session log",
    description="Modifies duration, notes, or wage calculation. Requires STAFF or ADMIN role.",
    dependencies=[Depends(require_role("STAFF", "ADMIN", "DIRECTOR"))],
)
def update_session(
    session_id: int,
    payload: SessionUpdate,
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    existing = mgr.get_session_by_id(session_id, include_attendance=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session ID {session_id} not found.")

    success = mgr.update_session(session_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_session_by_id(session_id, include_attendance=True)


@router.delete(
    "/{session_id}",
    summary="Delete session log",
    description="Deletes a completed session and associated student attendance records. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_session(
    session_id: int,
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    existing = mgr.get_session_by_id(session_id, include_attendance=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session ID {session_id} not found.")

    mgr.delete_session(session_id)
    return {"message": f"Session ID {session_id} deleted successfully."}


# ── Student Attendance Endpoints ─────────────────────────────────────────────

@router.get(
    "/{session_id}/attendance",
    summary="Get session attendance roster",
    description="Lists student attendance records, status, and points scored for this session.",
)
def get_session_attendance(
    session_id: int = Path(..., description="Session ID"),
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    existing = mgr.get_session_by_id(session_id, include_attendance=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session ID {session_id} not found.")
    return mgr.get_session_attendance(session_id)


@router.post(
    "/{session_id}/attendance",
    summary="Submit batch attendance",
    description="Batch submits or updates student attendance for a completed session. Automatically synchronizes attended headcount.",
    dependencies=[Depends(require_role("TEACHER", "STAFF", "ADMIN", "DIRECTOR"))],
)
def submit_batch_attendance(
    session_id: int,
    payload: BatchAttendanceSubmission,
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    existing = mgr.get_session_by_id(session_id, include_attendance=False)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session ID {session_id} not found.")

    records_data = [item.model_dump() for item in payload.records]
    count_saved = mgr.record_attendance_batch(session_id, records_data)
    return {
        "session_id": session_id,
        "processed_records": count_saved,
        "message": f"Successfully registered attendance for {count_saved} students.",
        "attendance": mgr.get_session_attendance(session_id),
    }


@router.get(
    "/student/{student_id}/history",
    summary="Get student attendance history",
    description="Retrieves chronological attendance track record for a student across all sessions.",
)
def get_student_attendance_history(
    student_id: int = Path(..., description="Student ID"),
    group_id: Optional[int] = Query(None, description="Filter by group ID"),
    limit: int = Query(50, ge=1, le=200),
    mgr: AttendanceManager = Depends(get_attendance_mgr),
):
    return mgr.get_student_attendance_history(student_id, group_id=group_id, limit=limit)
