"""
backend/apis/kindergarten.py
-----------------------------
Kindergarten, Nursery & Daycare Operations REST API Gateway.
Provides endpoints for:
  - Age bands (Bébé, Petite, Moyenne, Grande)
  - Numbered physical & digital books per child
  - Child daily attendance and justifications
  - Daily logs with strict A/B/C ratings across 8 categories + notes
  - Monthly reports with teacher authoring and double-blind admin review & approval
  - Incident logs across problem categories (behavior, eating, sleeping, learning)
  - Orthophonist and specialist clinical notes with role-sensitive visibility
  - Parent-filled child habit profiles (food, sleep, clothing, illness, temperament)
  - Weekly rotating cafeteria menus (weeks 1-4, days 1-7, breakfast/lunch/snack)
"""

from typing import List, Optional, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, KindergartenManager

router = APIRouter(prefix="/kindergarten", tags=["Kindergarten & Daycare"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class AgeBandCreate(BaseModel):
    code: str = Field(..., max_length=50, example="BEBE")
    name_ar: str = Field(..., max_length=100, example="الرضع")
    name_en: str = Field(..., max_length=100, example="Bébé")
    min_age_months: int = Field(..., ge=0, example=3)
    max_age_months: int = Field(..., ge=0, example=12)
    description: Optional[str] = Field(None, example="Infant nursery cohort")


class AgeBandUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    min_age_months: Optional[int] = None
    max_age_months: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ChildBookAssign(BaseModel):
    student_id: int = Field(..., example=1)
    book_number: str = Field(..., max_length=50, example="BK-BEBE-2026-0042")
    title: str = Field(..., max_length=150, example="كتاب الأنشطة الحسية والحركية")
    age_band_id: Optional[int] = Field(None, example=1)
    book_type: str = Field("PHYSICAL", example="PHYSICAL")
    level_label: Optional[str] = Field(None, example="Bébé Niveau 1")
    notes: Optional[str] = None


class ChildBookStatusUpdate(BaseModel):
    status: str = Field(..., example="RETURNED")
    return_date: Optional[date] = None
    notes: Optional[str] = None


class ChildAttendanceMark(BaseModel):
    student_id: int = Field(..., example=1)
    branch_id: str = Field(..., example="RAWDA")
    attendance_date: Optional[date] = None
    status: str = Field("PRESENT", example="PRESENT")
    arrival_time: Optional[str] = Field(None, example="08:15")
    departure_time: Optional[str] = Field(None, example="16:45")
    picked_up_by: Optional[str] = Field(None, example="فاطمة بن علي (الأم)")
    justification: Optional[str] = None
    marked_by_user_id: Optional[int] = None


class DailyLogCreate(BaseModel):
    student_id: int = Field(..., example=1)
    branch_id: str = Field("RAWDA", example="RAWDA")
    log_date: Optional[date] = None
    breakfast: str = Field(..., regex="^[ABCabc]$", example="A", description="A=Good, B=Average, C=Weak")
    lunch: str = Field(..., regex="^[ABCabc]$", example="A")
    snack: str = Field(..., regex="^[ABCabc]$", example="B")
    sleep: str = Field(..., regex="^[ABCabc]$", example="A")
    study: str = Field(..., regex="^[ABCabc]$", example="A")
    interaction: str = Field(..., regex="^[ABCabc]$", example="A")
    crying: str = Field(..., regex="^[ABCabc]$", example="C", description="C=Mild/No crying or A=Calm")
    clothes_change: str = Field(..., regex="^[ABCabc]$", example="A")
    notes: Optional[str] = Field(None, example="تناول كل وجبة الغداء وكان نشيطاً في ورشة الرسم")
    recorded_by_staff_id: Optional[int] = None


class MonthlyReportCreate(BaseModel):
    student_id: int = Field(..., example=1)
    branch_id: str = Field("RAWDA", example="RAWDA")
    month_period: str = Field(..., example="2026-11")
    author_staff_id: int = Field(..., example=2)
    breakfast: str = Field(..., regex="^[ABCabc]$", example="A")
    lunch: str = Field(..., regex="^[ABCabc]$", example="A")
    snack: str = Field(..., regex="^[ABCabc]$", example="A")
    sleep: str = Field(..., regex="^[ABCabc]$", example="B")
    study: str = Field(..., regex="^[ABCabc]$", example="A")
    interaction: str = Field(..., regex="^[ABCabc]$", example="A")
    crying: str = Field(..., regex="^[ABCabc]$", example="A")
    clothes_change: str = Field(..., regex="^[ABCabc]$", example="A")
    teacher_notes: Optional[str] = Field(None, example="تطور ممتاز في التفاعل الحركي والكلامي")
    status: str = Field("DRAFT", example="SUBMITTED")


class MonthlyReportReview(BaseModel):
    reviewer_admin_id: int = Field(..., example=1, description="Admin reviewer (MUST differ from author)")
    status: str = Field(..., example="APPROVED", description="APPROVED or REJECTED")
    admin_feedback: Optional[str] = Field(None, example="معتمد للنشر في نافذة الأولياء")


class IncidentCreate(BaseModel):
    student_id: int = Field(..., example=1)
    branch_id: str = Field("RAWDA", example="RAWDA")
    category: str = Field(..., example="BEHAVIOR", description="BEHAVIOR, EATING, SLEEPING, LEARNING, HEALTH, OTHER")
    description: str = Field(..., example="رفض النوم في وقت القيلولة وقام بالبكاء المتواصل")
    incident_date: Optional[date] = None
    action_taken: Optional[str] = Field(None, example="تم تهدئة الطفل وتقديم قصة مصورة")
    reported_by_staff_id: Optional[int] = None
    parent_notified: bool = False


class IncidentAcknowledge(BaseModel):
    parent_acknowledgment: str = Field(..., example="اطلعت على التقرير وسيتم تدريبه على النوم الباكر")


class SpecialistNoteCreate(BaseModel):
    student_id: int = Field(..., example=1)
    specialist_id: int = Field(..., example=7, description="Orthophonist / Specialist employee ID")
    observation_type: str = Field(..., example="ORTHOPHONIE", description="SPEECH, MOTOR_SKILLS, BEHAVIOR")
    clinical_observations: str = Field(..., example="ملاحظة تأخر طفيف في نطق الحروف اللثوية")
    recommendations: Optional[str] = Field(None, example="تمارين تحريك اللسان مع جلسات مرتين أسبوعياً")
    session_date: Optional[date] = None
    visibility: str = Field("STAFF_ONLY", example="STAFF_AND_PARENTS", description="STAFF_ONLY or STAFF_AND_PARENTS")


class ChildHabitProfileUpsert(BaseModel):
    food_preferences: Optional[str] = Field(None, example="يفضل الخضار المهروسة ويكره الجبن")
    eating_habits: Optional[str] = Field(None, example="يأكل ببطء ويحتاج إلى تشجيع")
    sleep_habits: Optional[str] = Field(None, example="ينام على جانبه الأيمن مع لعبته المفضلة")
    clothing_notes: Optional[str] = Field(None, example="ملابس قطنية فقط لتفادي الحساسية")
    allergies_medical: Optional[str] = Field(None, example="حساسية من الفراولة")
    illness_history: Optional[str] = None
    temperament: Optional[str] = Field(None, example="هادئ ومحب للاستكشاف")
    soothing_methods: Optional[str] = Field(None, example="الاستماع إلى الأناشيد الهادئة")
    updated_by_user_id: Optional[int] = None


class CafeteriaMenuCreate(BaseModel):
    branch_id: str = Field("RAWDA", example="RAWDA")
    week_number: int = Field(..., ge=1, le=4, example=1)
    day_of_week: int = Field(..., ge=1, le=7, example=1, description="1=Monday, 7=Sunday")
    meal_type: str = Field(..., example="LUNCH", description="BREAKFAST, LUNCH, SNACK")
    menu_items: str = Field(..., example="شوربة خضار + أرز بالدجاج + تفاح")
    allergen_info: Optional[str] = Field(None, example="يحتوي على الكرفس")
    is_active: bool = True


# =============================================================================
# ENDPOINTS
# =============================================================================

# 1. Age Bands
@router.get("/age-bands", summary="List Kindergarten Age Bands")
def get_age_bands(
    is_active: Optional[bool] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_age_bands(is_active=is_active)


@router.post("/age-bands", status_code=status.HTTP_201_CREATED, summary="Create Age Band")
def create_age_band(payload: AgeBandCreate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.create_age_band(
        code=payload.code,
        name_ar=payload.name_ar,
        name_en=payload.name_en,
        min_age_months=payload.min_age_months,
        max_age_months=payload.max_age_months,
        description=payload.description,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not create age band.")
    return res


@router.get("/age-bands/{band_id}", summary="Get Age Band by ID")
def get_age_band(band_id: int = Path(...), db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.get_age_band(band_id)
    if not res:
        raise HTTPException(status_code=404, detail="Age band not found")
    return res


@router.put("/age-bands/{band_id}", summary="Update Age Band")
def update_age_band(band_id: int, payload: AgeBandUpdate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.update_age_band(band_id, **payload.dict(exclude_unset=True))
    if not res:
        raise HTTPException(status_code=404, detail="Age band not found or update failed")
    return res


# 2. Numbered Books
@router.get("/books", summary="List Numbered Books per Child")
def get_child_books(
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    age_band_id: Optional[int] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_child_books(student_id=student_id, status=status, age_band_id=age_band_id)


@router.post("/books", status_code=status.HTTP_201_CREATED, summary="Assign Numbered Book to Child")
def assign_child_book(payload: ChildBookAssign, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.assign_child_book(
        student_id=payload.student_id,
        book_number=payload.book_number,
        title=payload.title,
        age_band_id=payload.age_band_id,
        book_type=payload.book_type,
        level_label=payload.level_label,
        notes=payload.notes,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not assign book to student")
    return res


@router.put("/books/{book_id}/status", summary="Update Book Status")
def update_book_status(book_id: int, payload: ChildBookStatusUpdate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.update_book_status(book_id, status=payload.status, return_date=payload.return_date, notes=payload.notes)
    if not res:
        raise HTTPException(status_code=404, detail="Book record not found or status invalid")
    return res


# 3. Attendance
@router.post("/attendance", summary="Mark Child Daily Attendance")
def mark_attendance(payload: ChildAttendanceMark, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.mark_attendance(
        student_id=payload.student_id,
        branch_id=payload.branch_id,
        attendance_date=payload.attendance_date or date.today(),
        status=payload.status,
        arrival_time=payload.arrival_time,
        departure_time=payload.departure_time,
        picked_up_by=payload.picked_up_by,
        justification=payload.justification,
        marked_by_user_id=payload.marked_by_user_id,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not mark attendance")
    return res


@router.post("/attendance/bulk", summary="Bulk Mark Child Attendance")
def bulk_mark_attendance(items: List[ChildAttendanceMark], db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    return mgr.bulk_mark_attendance([i.dict() for i in items])


@router.get("/attendance", summary="Query Daily Child Attendance")
def get_attendance(
    branch_id: Optional[str] = Query(None),
    attendance_date: Optional[date] = Query(None),
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_attendance(branch_id=branch_id, attendance_date=attendance_date, student_id=student_id, status=status)


# 4. Daily Logs
@router.post("/daily-logs", status_code=status.HTTP_201_CREATED, summary="Record Child Daily Log (A/B/C Ratings)")
def record_daily_log(payload: DailyLogCreate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    try:
        res = mgr.record_daily_log(
            student_id=payload.student_id,
            branch_id=payload.branch_id,
            log_date=payload.log_date or date.today(),
            breakfast=payload.breakfast,
            lunch=payload.lunch,
            snack=payload.snack,
            sleep=payload.sleep,
            study=payload.study,
            interaction=payload.interaction,
            crying=payload.crying,
            clothes_change=payload.clothes_change,
            notes=payload.notes,
            recorded_by_staff_id=payload.recorded_by_staff_id,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not record daily log")
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))


@router.get("/daily-logs", summary="Get Daily Logs for Branch & Date")
def get_daily_logs_by_date(
    branch_id: str = Query("RAWDA"),
    log_date: date = Query(default_factory=date.today),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_daily_logs_by_date(branch_id, log_date)


@router.get("/daily-logs/{student_id}", summary="Get Single Child Daily Log")
def get_daily_log(
    student_id: int,
    log_date: date = Query(default_factory=date.today),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    res = mgr.get_daily_log(student_id, log_date)
    if not res:
        raise HTTPException(status_code=404, detail="Daily log not found for this date")
    return res


# 5. Monthly Reports
@router.post("/monthly-reports", status_code=status.HTTP_201_CREATED, summary="Draft or Submit Monthly Progress Report")
def create_monthly_report(payload: MonthlyReportCreate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    try:
        res = mgr.create_monthly_report(
            student_id=payload.student_id,
            branch_id=payload.branch_id,
            month_period=payload.month_period,
            author_staff_id=payload.author_staff_id,
            breakfast=payload.breakfast,
            lunch=payload.lunch,
            snack=payload.snack,
            sleep=payload.sleep,
            study=payload.study,
            interaction=payload.interaction,
            crying=payload.crying,
            clothes_change=payload.clothes_change,
            teacher_notes=payload.teacher_notes,
            status=payload.status,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not create monthly report")
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))


@router.put("/monthly-reports/{report_id}/submit", summary="Submit Monthly Report for Review")
def submit_monthly_report(report_id: int, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.submit_monthly_report(report_id)
    if not res:
        raise HTTPException(status_code=404, detail="Monthly report not found")
    return res


@router.put("/monthly-reports/{report_id}/review", summary="Review & Approve/Reject Monthly Report (Reviewer != Author)")
def review_monthly_report(report_id: int, payload: MonthlyReportReview, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    try:
        res = mgr.review_monthly_report(
            report_id=report_id,
            reviewer_admin_id=payload.reviewer_admin_id,
            status=payload.status,
            admin_feedback=payload.admin_feedback,
        )
        if not res:
            raise HTTPException(status_code=404, detail="Report not found")
        return res
    except PermissionError as p_err:
        raise HTTPException(status_code=403, detail=str(p_err))
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.get("/monthly-reports", summary="Query Monthly Reports")
def get_monthly_reports(
    branch_id: Optional[str] = Query(None),
    month_period: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    visible_to_parents: Optional[bool] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_monthly_reports(
        branch_id=branch_id,
        month_period=month_period,
        student_id=student_id,
        status=status,
        visible_to_parents=visible_to_parents,
    )


# 6. Incidents
@router.post("/incidents", status_code=status.HTTP_201_CREATED, summary="Log Incident (Behavior, Eating, Sleeping, Learning)")
def log_incident(payload: IncidentCreate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    try:
        res = mgr.log_incident(
            student_id=payload.student_id,
            branch_id=payload.branch_id,
            category=payload.category,
            description=payload.description,
            incident_date=payload.incident_date,
            action_taken=payload.action_taken,
            reported_by_staff_id=payload.reported_by_staff_id,
            parent_notified=payload.parent_notified,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not log incident")
        return res
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))


@router.put("/incidents/{incident_id}/acknowledge", summary="Parent Acknowledgment of Incident")
def acknowledge_incident(incident_id: int, payload: IncidentAcknowledge, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.acknowledge_incident(incident_id, payload.parent_acknowledgment)
    if not res:
        raise HTTPException(status_code=404, detail="Incident not found")
    return res


@router.get("/incidents", summary="Query Incident Logs")
def get_incidents(
    branch_id: Optional[str] = Query(None),
    student_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_incidents(branch_id=branch_id, student_id=student_id, category=category)


# 7. Orthophonist & Specialist Clinical Notes
@router.post("/specialist-notes", status_code=status.HTTP_201_CREATED, summary="Record Specialist Clinical Note")
def record_specialist_note(payload: SpecialistNoteCreate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.record_specialist_note(
        student_id=payload.student_id,
        specialist_id=payload.specialist_id,
        observation_type=payload.observation_type,
        clinical_observations=payload.clinical_observations,
        recommendations=payload.recommendations,
        session_date=payload.session_date,
        visibility=payload.visibility,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not record specialist note")
    return res


@router.get("/specialist-notes", summary="Query Specialist Clinical Notes")
def get_specialist_notes(
    student_id: Optional[int] = Query(None),
    viewer_role: str = Query("STAFF", description="STAFF or PARENT"),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_specialist_notes(student_id=student_id, viewer_role=viewer_role)


# 8. Child Habit Profiles
@router.get("/habit-profiles/{student_id}", summary="Get Child Habit Profile")
def get_child_habit_profile(student_id: int, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.get_child_habit_profile(student_id)
    if not res:
        raise HTTPException(status_code=404, detail="Habit profile not yet filled for this child")
    return res


@router.put("/habit-profiles/{student_id}", summary="Create or Update Child Habit Profile")
def upsert_child_habit_profile(student_id: int, payload: ChildHabitProfileUpsert, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    res = mgr.upsert_child_habit_profile(student_id=student_id, **payload.dict(exclude_unset=True))
    if not res:
        raise HTTPException(status_code=400, detail="Could not upsert habit profile")
    return res


# 9. Cafeteria Menu
@router.post("/cafeteria-menu", status_code=status.HTTP_201_CREATED, summary="Set Cafeteria Menu Entry")
def set_cafeteria_menu(payload: CafeteriaMenuCreate, db: Database = Depends(get_database)):
    mgr = KindergartenManager(db)
    try:
        res = mgr.set_menu_entry(
            branch_id=payload.branch_id,
            week_number=payload.week_number,
            day_of_week=payload.day_of_week,
            meal_type=payload.meal_type,
            menu_items=payload.menu_items,
            allergen_info=payload.allergen_info,
            is_active=payload.is_active,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not save menu entry")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.get("/cafeteria-menu", summary="Get Weekly Cafeteria Menu")
def get_weekly_cafeteria_menu(
    branch_id: str = Query("RAWDA"),
    week_number: Optional[int] = Query(None, ge=1, le=4),
    db: Database = Depends(get_database),
):
    mgr = KindergartenManager(db)
    return mgr.get_weekly_menu(branch_id=branch_id, week_number=week_number)
