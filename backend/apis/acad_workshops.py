"""
backend/apis/acad_workshops.py
-------------------------------
REST API Router for Academy Workshops & Disciplines (acad_workshop).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.database import Database, get_database, AcadWorkshopManager

router = APIRouter(prefix="/acad/workshops", tags=["Academy Workshops"])


class WorkshopCreate(BaseModel):
    code: str = Field(..., description="Unique workshop code e.g. SOROBAN, ROBOTICS")
    name_ar: str
    name_en: Optional[str] = None
    evaluation_type: str = Field("STANDARD_SCORE", description="TIMED_OPERATIONS, ORAL_RIGHT_WRONG, PROJECT, CHALLENGE_MILESTONES, STANDARD_SCORE")
    description: Optional[str] = None


@router.get("", summary="List all educational workshops")
def list_workshops(active_only: bool = False, db: Database = Depends(get_database)):
    mgr = AcadWorkshopManager(db)
    return mgr.get_all_workshops(active_only=active_only)


@router.get("/{workshop_id}", summary="Get workshop by ID")
def get_workshop(workshop_id: int, db: Database = Depends(get_database)):
    mgr = AcadWorkshopManager(db)
    ws = mgr.get_workshop_by_id(workshop_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workshop not found")
    return ws


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create workshop discipline")
def create_workshop(payload: WorkshopCreate, db: Database = Depends(get_database)):
    mgr = AcadWorkshopManager(db)
    try:
        return mgr.create_workshop(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
