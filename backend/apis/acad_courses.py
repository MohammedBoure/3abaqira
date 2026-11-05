"""
backend/apis/acad_courses.py
-----------------------------
REST API Router for Courses, Sequential Books, Pass Rules, and Progression Triggers:
  - acad_course: Sequential levels per workshop, one-book-per-course mapping
  - acad_course_rule: Dynamic pass rules (Soroban 3 tests 80/100, oral, projects, milestones)
  - acad_enrollment: Sequential progression enforcement (cannot skip, one open book per workshop, placement notes, repeat on failure)
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AcadCourseManager

router = APIRouter(prefix="/acad", tags=["Academy Courses & Progression"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class CourseCreate(BaseModel):
    workshop_id: int
    sequence_order: int = Field(..., ge=1, description="Strict level order: 1, 2, 3...")
    course_code: str
    name_ar: str
    book_title: str = Field(..., description="One book per course rule: Title of the book")
    book_code: str = Field(..., description="Unique book identifier code")
    name_en: Optional[str] = None
    description: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None


class CourseRuleCreate(BaseModel):
    rule_type: str = Field(..., description="SOROBAN_TESTS, ORAL_QUESTIONS, PROJECT_SCORE, CHALLENGE_MILESTONES, STANDARD_SCORE")
    pass_mark: float = Field(80.0, description="Passing threshold (e.g. 80.0)")
    max_mark: float = Field(100.0)
    required_tests_count: int = Field(3, description="For Soroban: 3 tests required")
    min_score_per_test: float = Field(80.0, description="Minimum mark per test for Soroban")
    rule_config: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None


class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int
    group_id: Optional[int] = None
    placement_note: Optional[str] = Field(None, description="Administrative authorization note to skip levels or place into advanced level")


class EnrollmentComplete(BaseModel):
    passed: bool = Field(True, description="True to graduate to next level; False forces repeating the book")


# =============================================================================
# ENDPOINTS: COURSES & SEQUENTIAL BOOKS
# =============================================================================
@router.post("/courses", status_code=status.HTTP_201_CREATED, summary="Create course level (One Book per Course)")
def create_course(payload: CourseCreate, db: Database = Depends(get_database)):
    mgr = AcadCourseManager(db)
    try:
        return mgr.create_course(**payload.dict())
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/workshops/{workshop_id}/courses", summary="List sequential courses for a workshop")
def list_courses_by_workshop(
    workshop_id: int,
    active_only: bool = True,
    db: Database = Depends(get_database),
):
    mgr = AcadCourseManager(db)
    return mgr.get_courses_by_workshop(workshop_id=workshop_id, active_only=active_only)


@router.get("/courses/{course_id}", summary="Get course level with book and pass rule")
def get_course(course_id: int, db: Database = Depends(get_database)):
    mgr = AcadCourseManager(db)
    c = mgr.get_course_by_id(course_id)
    if not c:
        raise HTTPException(status_code=404, detail="Course not found")
    return c


# =============================================================================
# ENDPOINTS: DYNAMIC PASS RULES
# =============================================================================
@router.post("/courses/{course_id}/rules", summary="Configure pass rule (e.g. Soroban 3 tests 80/100)")
def configure_course_rule(
    course_id: int,
    payload: CourseRuleCreate,
    db: Database = Depends(get_database),
):
    mgr = AcadCourseManager(db)
    try:
        return mgr.set_course_rule(course_id=course_id, **payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/courses/{course_id}/rules", summary="Get pass rule for course")
def get_course_rule(course_id: int, db: Database = Depends(get_database)):
    mgr = AcadCourseManager(db)
    rule = mgr.get_course_rule(course_id)
    if not rule:
        raise HTTPException(status_code=404, detail="No specific pass rule configured for this course")
    return rule


# =============================================================================
# ENDPOINTS: ENROLLMENT & PROGRESSION ENFORCEMENT
# =============================================================================
@router.post("/enrollments", status_code=status.HTTP_201_CREATED, summary="Enroll student (enforces one open book & sequential advancement)")
def enroll_student(payload: EnrollmentCreate, db: Database = Depends(get_database)):
    mgr = AcadCourseManager(db)
    try:
        return mgr.enroll_student(
            student_id=payload.student_id,
            course_id=payload.course_id,
            group_id=payload.group_id,
            placement_note=payload.placement_note,
        )
    except ValueError as ve:
        raise HTTPException(status_code=409, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/students/{student_id}/enrollments", summary="Get student enrollments and book progress")
def get_student_enrollments(
    student_id: int,
    workshop_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Database = Depends(get_database),
):
    mgr = AcadCourseManager(db)
    return mgr.get_student_enrollments(student_id=student_id, workshop_id=workshop_id, status=status)


@router.put("/enrollments/{enrollment_id}/complete", summary="Conclude enrollment: advance or repeat book on failure")
def complete_enrollment(
    enrollment_id: int,
    payload: EnrollmentComplete,
    db: Database = Depends(get_database),
):
    mgr = AcadCourseManager(db)
    try:
        return mgr.complete_enrollment(enrollment_id=enrollment_id, passed=payload.passed)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
