"""
backend/apis/acad_evaluations.py
---------------------------------
REST API Router for Dynamic Evaluations and Double-Blind Review Workflows:
  - Dynamic templates with typed fields (timed operations, oral questions, robotics projects, milestones)
  - Evaluation events tied to course levels
  - DOUBLE-BLIND review workflow: Reviewer cannot be the corrector
  - Auto-generation of make-up session credits on failed test attempts
  - Mandatory audit-logging for sensitive grade changes
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AcadEvaluationManager
from backend.apis.security import get_optional_current_user

router = APIRouter(prefix="/acad/evaluations", tags=["Academy Evaluations (Double-Blind)"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class TemplateCreate(BaseModel):
    workshop_id: int
    name: str
    eval_type: str = Field(..., description="SOROBAN_TIMED, ORAL_RIGHT_WRONG, ROBOTICS_PROJECT, CHALLENGE_MILESTONES, STANDARD_TEST")
    description: Optional[str] = None


class FieldCreate(BaseModel):
    field_name: str
    field_type: str = Field(..., description="INTEGER, DECIMAL, BOOLEAN, TEXT, SCORE")
    field_order: int = 1
    max_value: Optional[float] = None
    weight: float = 1.0
    is_required: bool = True


class EventCreate(BaseModel):
    course_id: int
    template_id: int
    event_name: str
    event_date: str = Field(..., description="YYYY-MM-DD")
    pass_score: float = Field(80.0, description="Pass mark e.g. 80.0")
    max_score: float = Field(100.0)
    group_id: Optional[int] = None


class FieldValueItem(BaseModel):
    field_id: int
    value_text: Optional[str] = None
    value_numeric: Optional[float] = None
    value_boolean: Optional[bool] = None


class CorrectionSubmit(BaseModel):
    student_id: int
    corrector_person_id: int = Field(..., description="Teacher/corrector person ID")
    total_score: float = Field(..., description="Calculated or raw test score")
    field_values: Optional[List[FieldValueItem]] = None
    feedback_notes: Optional[str] = None


class ReviewSubmit(BaseModel):
    reviewer_person_id: int = Field(..., description="Independent reviewer person ID (must != corrector)")
    approved: bool = Field(True, description="True to publish; False to reject")
    feedback_notes: Optional[str] = None


class GradeChangeRequest(BaseModel):
    new_score: float = Field(..., description="New score value")
    reason: str = Field(..., description="Mandatory justification reason for grade alteration")
    branch_id: Optional[str] = None


# =============================================================================
# ENDPOINTS: TEMPLATES & TYPED FIELDS
# =============================================================================
@router.post("/templates", status_code=status.HTTP_201_CREATED, summary="Create evaluation template")
def create_template(payload: TemplateCreate, db: Database = Depends(get_database)):
    mgr = AcadEvaluationManager(db)
    try:
        return mgr.create_template(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/templates/{template_id}/fields", status_code=status.HTTP_201_CREATED, summary="Add typed field to template")
def add_template_field(
    template_id: int,
    payload: FieldCreate,
    db: Database = Depends(get_database),
):
    mgr = AcadEvaluationManager(db)
    try:
        return mgr.add_field(template_id=template_id, **payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/templates/{template_id}", summary="Get template with all fields")
def get_template(template_id: int, db: Database = Depends(get_database)):
    mgr = AcadEvaluationManager(db)
    tmpl = mgr.get_template(template_id)
    if not tmpl:
        raise HTTPException(status_code=404, detail="Template not found")
    return tmpl


# =============================================================================
# ENDPOINTS: EVENTS
# =============================================================================
@router.post("/events", status_code=status.HTTP_201_CREATED, summary="Create evaluation event")
def create_event(payload: EventCreate, db: Database = Depends(get_database)):
    mgr = AcadEvaluationManager(db)
    try:
        return mgr.create_event(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: CORRECTION & DOUBLE-BLIND REVIEW WORKFLOW
# =============================================================================
@router.post("/events/{event_id}/correct", summary="Stage 1: Submit test correction (Corrector)")
def submit_correction(
    event_id: int,
    payload: CorrectionSubmit,
    db: Database = Depends(get_database),
):
    mgr = AcadEvaluationManager(db)
    try:
        fields = [f.dict() for f in payload.field_values] if payload.field_values else None
        return mgr.submit_correction(
            event_id=event_id,
            student_id=payload.student_id,
            corrector_person_id=payload.corrector_person_id,
            total_score=payload.total_score,
            field_values=fields,
            feedback_notes=payload.feedback_notes,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/results/{result_id}/review", summary="Stage 2: Double-Blind Review (Corrector != Reviewer)")
def review_result(
    result_id: int,
    payload: ReviewSubmit,
    db: Database = Depends(get_database),
):
    mgr = AcadEvaluationManager(db)
    try:
        reviewed = mgr.review_evaluation(
            result_id=result_id,
            reviewer_person_id=payload.reviewer_person_id,
            approved=payload.approved,
            feedback_notes=payload.feedback_notes,
        )
        return {
            "message": "Double-blind review completed successfully. " + (
                "Make-up session credit auto-generated for failed test." if payload.approved and not reviewed.get("passed") else ""
            ),
            "result": reviewed,
        }
    except ValueError as ve:
        raise HTTPException(status_code=403, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: SENSITIVE ACTION: GRADE CHANGE (AUDIT-LOGGED)
# =============================================================================
@router.put("/results/{result_id}/score", summary="Override test score (Sensitive Action: Audit-Logged)")
def update_score(
    result_id: int,
    payload: GradeChangeRequest,
    request: Request,
    db: Database = Depends(get_database),
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
):
    mgr = AcadEvaluationManager(db)
    client_ip = request.client.host if request.client else None
    actor_id = current_user.get("user_id") if current_user else None
    actor_name = current_user.get("username") if current_user else None

    try:
        return mgr.update_evaluation_score(
            result_id=result_id,
            new_score=payload.new_score,
            actor_person_id=actor_id,
            reason=payload.reason,
            actor_username=actor_name,
            branch_id=payload.branch_id,
            ip_address=client_ip,
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/results/{result_id}", summary="Get evaluation result with fields and review history")
def get_result(result_id: int, db: Database = Depends(get_database)):
    mgr = AcadEvaluationManager(db)
    res = mgr.get_result(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return res
