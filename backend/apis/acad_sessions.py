"""
backend/apis/acad_sessions.py
------------------------------
REST API Router for Sessions, Attendance, and Absence Telephone Call Logs:
  - acad_session: Classroom execution events
  - acad_attendance: Attendance marking with auto-generation of make-up session on absence
  - Absence telephone call logging: Capturing verbal parent justifications
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AcadSessionManager
from backend.apis.security import get_optional_current_user

router = APIRouter(prefix="/acad", tags=["Academy Sessions & Attendance"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class SessionCreate(BaseModel):
    group_id: int
    session_date: str = Field(..., description="YYYY-MM-DD")
    start_time: str = Field(..., description="e.g. '09:00'")
    end_time: str = Field(..., description="e.g. '11:00'")
    room_id: Optional[int] = None
    trainer_person_id: Optional[int] = None
    is_makeup: bool = False
    topic: Optional[str] = None
    notes: Optional[str] = None


class AttendanceMark(BaseModel):
    student_id: int
    status: str = Field(..., description="PRESENT, ABSENT, LATE, EXCUSED")
    notes: Optional[str] = None


class TelephoneCallLogCreate(BaseModel):
    call_answered: bool
    absence_justification: Optional[str] = Field(None, description="Verbal justification received over telephone")
    parent_contacted_phone: Optional[str] = None
    notes: Optional[str] = None


# =============================================================================
# ENDPOINTS: SESSIONS
# =============================================================================
@router.post("/sessions", status_code=status.HTTP_201_CREATED, summary="Create session")
def create_session(payload: SessionCreate, db: Database = Depends(get_database)):
    mgr = AcadSessionManager(db)
    try:
        return mgr.create_session(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}", summary="Get session details")
def get_session(session_id: int, db: Database = Depends(get_database)):
    mgr = AcadSessionManager(db)
    s = mgr.get_session_by_id(session_id)
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


# =============================================================================
# ENDPOINTS: ATTENDANCE & AUTOMATIC MAKE-UP GENERATION
# =============================================================================
@router.post("/sessions/{session_id}/attendance", summary="Mark attendance (auto-creates make-up credit on ABSENT)")
def mark_attendance(
    session_id: int,
    payload: AttendanceMark,
    db: Database = Depends(get_database),
):
    mgr = AcadSessionManager(db)
    try:
        attendance = mgr.mark_attendance(
            session_id=session_id,
            student_id=payload.student_id,
            status=payload.status,
            notes=payload.notes,
        )
        return {
            "message": f"Attendance marked as {payload.status}. " + (
                "Make-up session credit auto-generated in acad_makeup." if payload.status.upper() == "ABSENT" else ""
            ),
            "attendance": attendance,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}/attendance", summary="Get session attendance roster & call logs")
def get_session_attendance(session_id: int, db: Database = Depends(get_database)):
    mgr = AcadSessionManager(db)
    return mgr.get_session_attendance(session_id)


# =============================================================================
# ENDPOINTS: ABSENCE TELEPHONE CALL LOGS
# =============================================================================
@router.post("/attendance/{attendance_id}/call-log", summary="Log telephone call with parent & verbal justification")
def log_absence_call(
    attendance_id: int,
    payload: TelephoneCallLogCreate,
    db: Database = Depends(get_database),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    mgr = AcadSessionManager(db)
    caller_id = current_user.get("user_id") if current_user else None
    try:
        updated = mgr.log_absence_telephone_call(
            attendance_id=attendance_id,
            caller_person_id=caller_id,
            call_answered=payload.call_answered,
            absence_justification=payload.absence_justification,
            parent_contacted_phone=payload.parent_contacted_phone,
            notes=payload.notes,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
