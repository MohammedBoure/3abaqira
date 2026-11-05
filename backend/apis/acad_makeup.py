"""
backend/apis/acad_makeup.py
----------------------------
REST API Router for Make-up Session Credits (acad_makeup):
  - Track owed make-up sessions generated from absences or failed tests
  - Assign make-ups to conducted sessions
  - Fulfill and complete make-ups
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AcadMakeupManager

router = APIRouter(prefix="/acad/makeup", tags=["Academy Make-Up Sessions"])


class MakeupAssign(BaseModel):
    assigned_session_id: int = Field(..., description="Target session to fulfill make-up")


@router.get("", summary="List make-up session credits queue")
def list_makeups(
    student_id: Optional[int] = None,
    status: Optional[str] = None,
    reason: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Database = Depends(get_database),
):
    mgr = AcadMakeupManager(db)
    return mgr.get_makeups(
        student_id=student_id, status=status, reason=reason, limit=limit, offset=offset
    )


@router.post("/{makeup_id}/assign", summary="Assign owed make-up to a session")
def assign_makeup(
    makeup_id: int,
    payload: MakeupAssign,
    db: Database = Depends(get_database),
):
    mgr = AcadMakeupManager(db)
    try:
        updated = mgr.assign_makeup_to_session(
            makeup_id=makeup_id, assigned_session_id=payload.assigned_session_id
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Make-up record not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{makeup_id}/complete", summary="Mark make-up credit as completed")
def complete_makeup(makeup_id: int, db: Database = Depends(get_database)):
    mgr = AcadMakeupManager(db)
    try:
        updated = mgr.complete_makeup(makeup_id=makeup_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Make-up record not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
