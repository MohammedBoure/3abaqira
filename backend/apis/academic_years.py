"""
backend/apis/academic_years.py
-------------------------------
Academic Cycles & Fiscal Years REST Router.
Provides endpoints for:
  - Listing all registered academic years
  - Retrieving the currently active academic cycle
  - Creating new fiscal cycles (Admin protected)
  - Updating cycle date bounds (Admin protected)
  - Atomically setting the active academic year (Admin protected)
  - Deleting empty cycle records (Admin protected)
"""

from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    AcademicYearManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/academic-years", tags=["Academic Years"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class AcademicYearBase(BaseModel):
    name: str = Field(..., description="Academic cycle label", example="2025-2026")
    start_date: date = Field(..., description="Cycle start date", example="2025-09-01")
    end_date: date = Field(..., description="Cycle completion date", example="2026-07-31")
    is_current: bool = Field(False, description="Flag marking this cycle as the active fiscal year")


class AcademicYearCreate(AcademicYearBase):
    pass


class AcademicYearUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_academic_years_mgr(db: Database = Depends(get_database)) -> AcademicYearManager:
    return AcademicYearManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List all academic years",
    description="Returns all registered academic cycles sorted by start date ascending.",
)
def list_academic_years(mgr: AcademicYearManager = Depends(get_academic_years_mgr)):
    return mgr.get_all()


@router.get(
    "/current",
    summary="Get active academic year",
    description="Returns the currently active academic fiscal cycle (is_current=TRUE).",
)
def get_current_academic_year(mgr: AcademicYearManager = Depends(get_academic_years_mgr)):
    current = mgr.get_current()
    if not current:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active academic year configured in system catalog.",
        )
    return current


@router.get(
    "/{year_id}",
    summary="Get academic year by ID",
    description="Retrieves a single academic year record.",
)
def get_academic_year(
    year_id: int = Path(..., description="Academic year ID"),
    mgr: AcademicYearManager = Depends(get_academic_years_mgr),
):
    year = mgr.get_by_id(year_id)
    if not year:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year ID {year_id} not found.",
        )
    return year


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create academic year",
    description="Creates a new academic cycle. Requires ADMIN or DIRECTOR role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_academic_year(
    payload: AcademicYearCreate,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr),
):
    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Academic year end_date must be strictly after start_date.",
        )
    created = mgr.create(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_current=payload.is_current,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create academic year.",
        )
    return created


@router.put(
    "/{year_id}",
    summary="Update academic year",
    description="Updates academic year dates or name. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_academic_year(
    year_id: int,
    payload: AcademicYearUpdate,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr),
):
    existing = mgr.get_by_id(year_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year ID {year_id} not found.",
        )
    success = mgr.update(year_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no fields modified.",
        )
    return mgr.get_by_id(year_id)


@router.post(
    "/{year_id}/set-current",
    summary="Activate academic year",
    description="Atomically switches the system-wide active academic fiscal year. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def set_current_academic_year(
    year_id: int,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr),
):
    existing = mgr.get_by_id(year_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year ID {year_id} not found.",
        )
    mgr.set_current(year_id)
    return {
        "academic_year_id": year_id,
        "is_current": True,
        "message": "Academic year activated successfully.",
    }


@router.delete(
    "/{year_id}",
    summary="Delete academic year",
    description="Deletes an unused academic year record. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_academic_year(
    year_id: int,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr),
):
    existing = mgr.get_by_id(year_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Academic year ID {year_id} not found.",
        )
    success = mgr.delete(year_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete academic year: dependent enrollments or groups exist.",
        )
    return {"message": f"Academic year ID {year_id} deleted successfully."}
