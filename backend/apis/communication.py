"""
backend/apis/communication.py
------------------------------
Parent Inquiry Notes & Outbound Multi-Channel Notification Queue REST API Gateway.
Provides endpoints for:
  - Branch communication policy toggle (schedule windows and active days)
  - Two-way parent notes (parent inquiry -> staff reply -> closure)
  - Multi-channel notification queue (SMS, WhatsApp, Telegram, Email)
  - Background queue delivery dispatcher worker interface
"""

from typing import List, Optional, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, CommunicationManager

router = APIRouter(prefix="/communication", tags=["Parent & Multi-Channel Communication"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class NotePolicyUpdate(BaseModel):
    is_enabled: bool = Field(True, example=True, description="Master enable/disable toggle for branch")
    window_start_time: str = Field("08:00", example="08:00")
    window_end_time: str = Field("18:00", example="18:00")
    allowed_days: str = Field("1,2,3,4,5,6,7", example="1,2,3,4,5,6,7", description="Comma-separated ISO weekdays (1=Mon ... 7=Sun)")
    updated_by_user_id: Optional[int] = None


class ParentNoteSubmit(BaseModel):
    student_id: int = Field(..., example=1)
    branch_id: str = Field(..., example="RAWDA")
    subject: str = Field(..., max_length=150, example="استفسار بخصوص تغيير مواعيد القيلولة")
    message: str = Field(..., example="السلام عليكم، نرجو إعلامنا إن كان بإمكان الطفل النوم لمدة 45 دقيقة فقط بدلاً من ساعة ونصف اليوم.")
    recipient_role: str = Field("TEACHER", example="TEACHER", description="TEACHER, ADMIN, DIRECTOR, SPECIALIST")
    parent_user_id: Optional[int] = None
    bypass_policy: bool = Field(False, description="Internal flag to bypass operating hours check")


class StaffNoteResponse(BaseModel):
    staff_response: str = Field(..., example="وعليكم السلام ورحمة الله، تم التكفل بالطلب وسنقوم بإيقاظه بعد 45 دقيقة بالتنسيق مع المربية.")
    answered_by_employee_id: int = Field(..., example=2)


class NotificationQueueItem(BaseModel):
    channel: str = Field(..., example="SMS", description="SMS, WHATSAPP, TELEGRAM, EMAIL")
    notification_type: str = Field(..., example="ABSENCE_ALERT", description="ABSENCE_ALERT, PAYMENT_RECEIPT, REPORT_APPROVAL, INTERVIEW_INVITATION, ANNOUNCEMENT, GENERAL")
    recipient_name: str = Field(..., example="عمر بن علي")
    recipient_target: str = Field(..., example="+213555123456", description="Phone number, email address, or telegram chat ID")
    title: str = Field(..., max_length=200, example="إشعار غياب التلميذ")
    body_text: str = Field(..., example="نحيطكم علماً بأن ابنكم لم يحضر اليوم لحصة الحساب الذهني. يرجى الاتصال بالإدارة للتبرير.")
    student_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None


class ProcessQueueRequest(BaseModel):
    batch_size: int = Field(50, ge=1, le=500, example=50)


# =============================================================================
# ENDPOINTS
# =============================================================================

# 1. Policy & Time Window
@router.get("/policy/{branch_id}", summary="Get Parent Note Schedule Policy")
def get_note_policy(branch_id: str = Path(...), db: Database = Depends(get_database)):
    mgr = CommunicationManager(db)
    return mgr.get_policy(branch_id)


@router.put("/policy/{branch_id}", summary="Update Branch Parent Note Policy")
def update_note_policy(
    branch_id: str, payload: NotePolicyUpdate, db: Database = Depends(get_database)
):
    mgr = CommunicationManager(db)
    res = mgr.update_policy(
        branch_id=branch_id,
        is_enabled=payload.is_enabled,
        window_start_time=payload.window_start_time,
        window_end_time=payload.window_end_time,
        allowed_days=payload.allowed_days,
        updated_by_user_id=payload.updated_by_user_id,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not update note policy")
    return res


# 2. Parent Notes
@router.post("/notes", status_code=status.HTTP_201_CREATED, summary="Submit Parent Note")
def submit_parent_note(payload: ParentNoteSubmit, db: Database = Depends(get_database)):
    mgr = CommunicationManager(db)
    try:
        res = mgr.submit_parent_note(
            student_id=payload.student_id,
            branch_id=payload.branch_id,
            subject=payload.subject,
            message=payload.message,
            recipient_role=payload.recipient_role,
            parent_user_id=payload.parent_user_id,
            bypass_policy=payload.bypass_policy,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not submit note")
        return res
    except PermissionError as p_err:
        raise HTTPException(status_code=403, detail=str(p_err))
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.get("/notes", summary="Query Parent Notes")
def get_parent_notes(
    student_id: Optional[int] = Query(None),
    branch_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    parent_user_id: Optional[int] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = CommunicationManager(db)
    return mgr.get_notes(
        student_id=student_id,
        branch_id=branch_id,
        status=status,
        parent_user_id=parent_user_id,
    )


@router.get("/notes/{note_id}", summary="Get Note by ID")
def get_parent_note(note_id: int, db: Database = Depends(get_database)):
    mgr = CommunicationManager(db)
    res = mgr.get_note(note_id)
    if not res:
        raise HTTPException(status_code=404, detail="Note not found")
    return res


@router.put("/notes/{note_id}/respond", summary="Staff Response to Parent Note")
def respond_to_parent_note(
    note_id: int, payload: StaffNoteResponse, db: Database = Depends(get_database)
):
    mgr = CommunicationManager(db)
    res = mgr.respond_to_note(
        note_id=note_id,
        staff_response=payload.staff_response,
        answered_by_employee_id=payload.answered_by_employee_id,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Note not found")
    return res


@router.put("/notes/{note_id}/close", summary="Close Parent Note")
def close_parent_note(note_id: int, db: Database = Depends(get_database)):
    mgr = CommunicationManager(db)
    ok = mgr.close_note(note_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"note_id": note_id, "status": "CLOSED"}


# 3. Notification Queue
@router.post("/notifications/queue", status_code=status.HTTP_201_CREATED, summary="Enqueue Outbound Notification")
def queue_notification(payload: NotificationQueueItem, db: Database = Depends(get_database)):
    mgr = CommunicationManager(db)
    try:
        res = mgr.queue_notification(
            channel=payload.channel,
            notification_type=payload.notification_type,
            recipient_name=payload.recipient_name,
            recipient_target=payload.recipient_target,
            title=payload.title,
            body_text=payload.body_text,
            student_id=payload.student_id,
            scheduled_at=payload.scheduled_at,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not enqueue notification")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.get("/notifications/queued", summary="List Queued Notifications")
def get_queued_notifications(
    channel: Optional[str] = Query(None),
    status: str = Query("QUEUED"),
    limit: int = Query(50, ge=1, le=200),
    db: Database = Depends(get_database),
):
    mgr = CommunicationManager(db)
    return mgr.get_queued_notifications(channel=channel, status=status, limit=limit)


@router.post("/notifications/process-queue", summary="Trigger Outbound Delivery Queue Worker")
def process_notification_queue(
    payload: ProcessQueueRequest, db: Database = Depends(get_database)
):
    mgr = CommunicationManager(db)
    return mgr.process_delivery_queue(batch_size=payload.batch_size)


@router.get("/notifications/stats", summary="Notification Delivery Statistics")
def get_notification_statistics(db: Database = Depends(get_database)):
    mgr = CommunicationManager(db)
    return mgr.get_notification_stats()
