"""
backend/apis/organizations.py
------------------------------
REST API Router for Multi-Branch Infrastructure & Academic Organization:
  - org_branch: 13 operational branches (Academy vs Kindergarten)
  - org_academic_year: Non-overlapping academic years with single active current year
  - org_room & org_room_equipment: Facilities, capacity, and equipment inventory
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field

from backend.database import Database, get_database, OrgManager

router = APIRouter(prefix="/org", tags=["Organizations & Infrastructure"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================
class OrgBranchCreate(BaseModel):
    branch_id: str = Field(..., description="Unique branch ID (e.g. BR-01, JIJEL_ACAD)")
    code: str = Field(..., description="Unique branch code")
    name_ar: str
    name_en: Optional[str] = None
    branch_type: str = Field("ACADEMY", description="ACADEMY, KINDERGARTEN, HYBRID")
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class OrgAcademicYearCreate(BaseModel):
    name: str = Field(..., description="e.g. '2026-2027'")
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date: str = Field(..., description="YYYY-MM-DD")
    is_current: bool = False


class OrgRoomCreate(BaseModel):
    name: str = Field(..., description="Room identifier / name")
    capacity: int = Field(20, gt=0)
    floor_number: int = 0
    description: Optional[str] = None


class OrgEquipmentCreate(BaseModel):
    name: str
    quantity: int = Field(1, ge=0)
    condition: str = Field("GOOD", description="EXCELLENT, GOOD, FAIR, NEEDS_REPAIR")
    notes: Optional[str] = None


# =============================================================================
# ENDPOINTS: 13 BRANCHES
# =============================================================================
@router.get("/branches", summary="List branches (Academy vs Kindergarten)")
def list_branches(
    branch_type: Optional[str] = None,
    active_only: bool = False,
    db: Database = Depends(get_database),
):
    mgr = OrgManager(db)
    return mgr.get_all_branches(branch_type=branch_type, active_only=active_only)


@router.get("/branches/{branch_id}", summary="Get branch details")
def get_branch(branch_id: str, db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    branch = mgr.get_branch_by_id(branch_id)
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch


@router.post("/branches", status_code=status.HTTP_201_CREATED, summary="Create branch")
def create_branch(payload: OrgBranchCreate, db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    try:
        return mgr.create_branch(**payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: ACADEMIC YEARS (NON-OVERLAPPING & SINGLE CURRENT)
# =============================================================================
@router.get("/academic-years", summary="List academic cycles")
def list_academic_years(db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    return mgr.get_all_academic_years()


@router.get("/academic-years/current", summary="Get single active current year")
def get_current_year(db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    curr = mgr.get_current_academic_year()
    if not curr:
        raise HTTPException(status_code=404, detail="No current academic year active")
    return curr


@router.post("/academic-years", status_code=status.HTTP_201_CREATED, summary="Create academic year (enforces non-overlapping)")
def create_academic_year(payload: OrgAcademicYearCreate, db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    try:
        return mgr.create_academic_year(**payload.dict())
    except ValueError as ve:
        raise HTTPException(status_code=409, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/academic-years/{academic_year_id}/activate", summary="Set as single current active year")
def activate_academic_year(academic_year_id: int, db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    try:
        updated = mgr.set_current_academic_year(academic_year_id)
        if not updated:
            raise HTTPException(status_code=404, detail="Academic year not found")
        return updated
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =============================================================================
# ENDPOINTS: ROOMS & EQUIPMENT
# =============================================================================
@router.post("/branches/{branch_id}/rooms", status_code=status.HTTP_201_CREATED, summary="Create classroom in branch")
def create_room(
    branch_id: str,
    payload: OrgRoomCreate,
    db: Database = Depends(get_database),
):
    mgr = OrgManager(db)
    try:
        return mgr.create_room(branch_id=branch_id, **payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/branches/{branch_id}/rooms", summary="List classrooms in branch")
def list_rooms(
    branch_id: str,
    active_only: bool = True,
    db: Database = Depends(get_database),
):
    mgr = OrgManager(db)
    return mgr.get_rooms_by_branch(branch_id=branch_id, active_only=active_only)


@router.post("/rooms/{room_id}/equipment", status_code=status.HTTP_201_CREATED, summary="Add equipment to room")
def add_equipment(
    room_id: int,
    payload: OrgEquipmentCreate,
    db: Database = Depends(get_database),
):
    mgr = OrgManager(db)
    try:
        return mgr.add_room_equipment(room_id=room_id, **payload.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/rooms/{room_id}/equipment", summary="List equipment in room")
def list_equipment(room_id: int, db: Database = Depends(get_database)):
    mgr = OrgManager(db)
    return mgr.get_room_equipment(room_id=room_id)
