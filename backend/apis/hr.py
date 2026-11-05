"""
backend/apis/hr.py
-------------------
Staff, Multi-Branch Faculty, Daily Attendance & Recruitment Pipeline REST API Gateway.
Provides endpoints for:
  - Job title positions catalogue (teaching, admin, nannies, cooks, cleaning, maintenance, orthophonist)
  - Extended staff profiles
  - Multi-branch staff assignments & percentage allocations
  - Daily staff attendance with biometric/manual source tracking
  - Online job application pipeline and interview evaluations
"""

from typing import List, Optional, Any
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, HRManager

router = APIRouter(prefix="/hr", tags=["Staff & HR"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PositionCreate(BaseModel):
    code: str = Field(..., max_length=50, example="ORTHOPHONIST")
    title_ar: str = Field(..., max_length=100, example="أخصائي أرطوفوني")
    title_en: str = Field(..., max_length=100, example="Speech Therapist")
    category: str = Field(..., example="ORTHOPHONIST", description="TEACHING, ADMINISTRATIVE, NANNY, COOK, CLEANING, MAINTENANCE, ORTHOPHONIST, SPECIALIST, OTHER")
    description: Optional[str] = Field(None, example="Specialist in pediatric language assessment")


class StaffProfileCreate(BaseModel):
    employee_id: int = Field(..., example=1)
    position_id: Optional[int] = Field(None, example=7)
    national_id: Optional[str] = Field(None, example="123456789012345678")
    phone: Optional[str] = Field(None, example="+213-555-001122")
    email: Optional[str] = Field(None, example="ortho@geniuskids.dz")
    qualifications: Optional[str] = Field(None, example="Master degree in Clinical Speech Therapy")
    specialization: Optional[str] = Field(None, example="Speech & Language Pathology")
    emergency_contact: Optional[str] = Field(None, example="0555123456 (Spouse)")


class StaffAssignmentCreate(BaseModel):
    employee_id: int = Field(..., example=1)
    branch_id: str = Field(..., example="RAWDA")
    position_id: Optional[int] = Field(None, example=7)
    role_in_branch: Optional[str] = Field(None, example="Visiting Speech Therapist")
    allocation_percentage: float = Field(100.0, ge=1.0, le=100.0, example=50.0)
    is_primary: bool = True
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class StaffAttendanceMark(BaseModel):
    employee_id: int = Field(..., example=1)
    branch_id: str = Field(..., example="RAWDA")
    attendance_date: Optional[date] = None
    status: str = Field("PRESENT", example="PRESENT", description="PRESENT, ABSENT, LATE, EXCUSED, ON_LEAVE, HALF_DAY")
    check_in_time: Optional[str] = Field(None, example="07:55")
    check_out_time: Optional[str] = Field(None, example="16:30")
    source: str = Field("MANUAL", example="BIOMETRIC", description="MANUAL, BIOMETRIC, DEVICE_IMPORT, MOBILE")
    marked_by_user_id: Optional[int] = None
    notes: Optional[str] = None


class JobApplicationSubmit(BaseModel):
    applicant_name: str = Field(..., example="سارة بلمختار")
    email: str = Field(..., example="sara.bel@gmail.com")
    phone: str = Field(..., example="+213-661-998877")
    applied_position: str = Field(..., example="أستاذة لغة فرنسية")
    branch_id: Optional[str] = Field(None, example="CENTER")
    position_id: Optional[int] = None
    experience_years: int = Field(0, ge=0, example=3)
    resume_url: Optional[str] = Field(None, example="https://storage.geniuskids.dz/resumes/cv_sara.pdf")


class InterviewSchedule(BaseModel):
    interview_date: datetime = Field(..., example="2026-11-15T10:00:00Z")
    interviewer_employee_id: Optional[int] = Field(None, example=1)
    interview_notes: Optional[str] = Field(None, example="Technical teaching test & oral French interview")


class InterviewEvaluation(BaseModel):
    interview_rating: int = Field(..., ge=1, le=5, example=5, description="Score 1 (Poor) to 5 (Excellent)")
    interview_notes: str = Field(..., example="كفاءة لغوية وبيداغوجية ممتازة وتمكن من وسائل التدريس الحديثة")
    new_status: str = Field("INTERVIEWED", example="OFFERED")
    decision_notes: Optional[str] = Field(None, example="Recommended for hiring at Jijel Center")


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., example="HIRED", description="APPLIED, SCREENING, INTERVIEW_SCHEDULED, INTERVIEWED, OFFERED, HIRED, REJECTED")
    decision_notes: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

# 1. Positions
@router.get("/positions", summary="List Staff Positions")
def get_positions(
    category: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = HRManager(db)
    return mgr.get_positions(category=category, is_active=is_active)


@router.post("/positions", status_code=status.HTTP_201_CREATED, summary="Create Position")
def create_position(payload: PositionCreate, db: Database = Depends(get_database)):
    mgr = HRManager(db)
    try:
        res = mgr.create_position(
            code=payload.code,
            title_ar=payload.title_ar,
            title_en=payload.title_en,
            category=payload.category,
            description=payload.description,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not create position")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


# 2. Staff Profiles
@router.get("/staff", summary="List Staff Profiles")
def get_staff_profiles(
    position_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = HRManager(db)
    return mgr.get_staff_profiles(position_id=position_id, is_active=is_active)


@router.post("/staff", status_code=status.HTTP_201_CREATED, summary="Create or Update Extended Staff Profile")
def create_staff_profile(payload: StaffProfileCreate, db: Database = Depends(get_database)):
    mgr = HRManager(db)
    res = mgr.create_staff_profile(
        employee_id=payload.employee_id,
        position_id=payload.position_id,
        national_id=payload.national_id,
        phone=payload.phone,
        email=payload.email,
        qualifications=payload.qualifications,
        specialization=payload.specialization,
        emergency_contact=payload.emergency_contact,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not create staff profile")
    return res


# 3. Multi-Branch Assignments
@router.get("/assignments", summary="Query Multi-Branch Staff Assignments")
def get_staff_assignments(
    employee_id: Optional[int] = Query(None),
    branch_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = HRManager(db)
    return mgr.get_staff_assignments(employee_id=employee_id, branch_id=branch_id, is_active=is_active)


@router.post("/assignments", status_code=status.HTTP_201_CREATED, summary="Assign Staff to Branch")
def assign_staff_to_branch(payload: StaffAssignmentCreate, db: Database = Depends(get_database)):
    mgr = HRManager(db)
    res = mgr.assign_staff_to_branch(
        employee_id=payload.employee_id,
        branch_id=payload.branch_id,
        position_id=payload.position_id,
        role_in_branch=payload.role_in_branch,
        allocation_percentage=payload.allocation_percentage,
        is_primary=payload.is_primary,
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not assign staff to branch")
    return res


@router.put("/assignments/{assignment_id}/end", summary="End Staff Assignment")
def end_staff_assignment(
    assignment_id: int,
    end_date: Optional[date] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = HRManager(db)
    ok = mgr.end_staff_assignment(assignment_id, end_date=end_date)
    if not ok:
        raise HTTPException(status_code=404, detail="Assignment not found or already ended")
    return {"assignment_id": assignment_id, "status": "ENDED", "end_date": end_date or date.today()}


# 4. Daily Staff Attendance
@router.post("/attendance", summary="Mark Staff Daily Attendance (Manual or Biometric)")
def mark_staff_attendance(payload: StaffAttendanceMark, db: Database = Depends(get_database)):
    mgr = HRManager(db)
    try:
        res = mgr.mark_staff_attendance(
            employee_id=payload.employee_id,
            branch_id=payload.branch_id,
            attendance_date=payload.attendance_date or date.today(),
            status=payload.status,
            check_in_time=payload.check_in_time,
            check_out_time=payload.check_out_time,
            source=payload.source,
            marked_by_user_id=payload.marked_by_user_id,
            notes=payload.notes,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not record staff attendance")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.post("/attendance/bulk", summary="Bulk Mark Staff Attendance")
def bulk_mark_staff_attendance(items: List[StaffAttendanceMark], db: Database = Depends(get_database)):
    mgr = HRManager(db)
    return mgr.bulk_mark_staff_attendance([i.dict() for i in items])


@router.get("/attendance", summary="Query Daily Staff Attendance")
def get_staff_attendance(
    branch_id: Optional[str] = Query(None),
    attendance_date: Optional[date] = Query(None),
    employee_id: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = HRManager(db)
    return mgr.get_staff_attendance(
        branch_id=branch_id,
        attendance_date=attendance_date,
        employee_id=employee_id,
        source=source,
    )


# 5. Recruitment Pipeline
@router.post("/applications", status_code=status.HTTP_201_CREATED, summary="Submit Job Application")
def submit_job_application(payload: JobApplicationSubmit, db: Database = Depends(get_database)):
    mgr = HRManager(db)
    res = mgr.submit_application(
        applicant_name=payload.applicant_name,
        email=payload.email,
        phone=payload.phone,
        applied_position=payload.applied_position,
        branch_id=payload.branch_id,
        position_id=payload.position_id,
        experience_years=payload.experience_years,
        resume_url=payload.resume_url,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not submit job application")
    return res


@router.get("/applications", summary="List Job Applications")
def get_job_applications(
    branch_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    applied_position: Optional[str] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = HRManager(db)
    return mgr.get_applications(branch_id=branch_id, status=status, applied_position=applied_position)


@router.put("/applications/{application_id}/interview", summary="Schedule Candidate Interview")
def schedule_candidate_interview(
    application_id: int, payload: InterviewSchedule, db: Database = Depends(get_database)
):
    mgr = HRManager(db)
    res = mgr.schedule_interview(
        application_id=application_id,
        interview_date=payload.interview_date,
        interviewer_employee_id=payload.interviewer_employee_id,
        interview_notes=payload.interview_notes,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Application not found")
    return res


@router.put("/applications/{application_id}/evaluate", summary="Record Interview Result & Score")
def record_interview_evaluation(
    application_id: int, payload: InterviewEvaluation, db: Database = Depends(get_database)
):
    mgr = HRManager(db)
    try:
        res = mgr.record_interview_result(
            application_id=application_id,
            interview_rating=payload.interview_rating,
            interview_notes=payload.interview_notes,
            new_status=payload.new_status,
            decision_notes=payload.decision_notes,
        )
        if not res:
            raise HTTPException(status_code=404, detail="Application not found")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.put("/applications/{application_id}/status", summary="Update Application Pipeline Status")
def update_application_status(
    application_id: int, payload: ApplicationStatusUpdate, db: Database = Depends(get_database)
):
    mgr = HRManager(db)
    try:
        res = mgr.update_application_status(
            application_id=application_id,
            status=payload.status,
            decision_notes=payload.decision_notes,
        )
        if not res:
            raise HTTPException(status_code=404, detail="Application not found")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.get("/pipeline-stats", summary="Recruitment Pipeline Statistics")
def get_pipeline_statistics(db: Database = Depends(get_database)):
    mgr = HRManager(db)
    return mgr.get_pipeline_statistics()
