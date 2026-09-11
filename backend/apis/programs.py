"""
backend/apis/programs.py
------------------------
Educational Programs & Billing Structure REST Router.
Provides endpoints for:
  - Listing educational programs (Soroban, Quran, Robotics, Prep, Daycare)
  - Inspecting program details and assigned curriculum levels
  - Creating new branch programs (Admin protected)
  - Updating program descriptions and billing models (Admin protected)
  - Toggling active status and deleting empty programs (Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, ProgramManager, BranchManager
from backend.apis.security import require_role

router = APIRouter(prefix="/programs", tags=["Programs"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class ProgramBase(BaseModel):
    branch_id: str = Field(..., description="Target branch ID (e.g. 'CENTER', 'RAWDA')", example="CENTER")
    code: str = Field(..., max_length=50, description="Unique program code", example="SOROBAN")
    name_ar: str = Field(..., description="Arabic program name", example="الحساب الذهني (السوروبان)")
    name_en: Optional[str] = Field(None, description="English program name", example="Soroban Mental Arithmetic")
    billing_type: str = Field(
        "INSTALLMENT_PLAN",
        description="Billing model: INSTALLMENT_PLAN, MONTHLY_RECURRING, PER_SESSION, ONE_TIME_EVENT, ANNUAL_PACKAGE",
        example="INSTALLMENT_PLAN"
    )
    description: Optional[str] = Field(None, description="Detailed curriculum and schedule description")
    is_active: bool = Field(True, description="Operating status flag")


class ProgramCreate(ProgramBase):
    pass


class ProgramUpdate(BaseModel):
    code: Optional[str] = None
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    billing_type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ProgramStatusToggleRequest(BaseModel):
    is_active: bool = Field(..., description="Active flag")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_program_mgr(db: Database = Depends(get_database)) -> ProgramManager:
    return ProgramManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List educational programs",
    description="Lists all educational programs with optional filtering by branch, billing type, and active status.",
)
def list_programs(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID (e.g. 'CENTER', 'RAWDA')"),
    billing_type: Optional[str] = Query(None, description="Filter by billing model"),
    active_only: bool = Query(False, description="Filter active programs only"),
    mgr: ProgramManager = Depends(get_program_mgr),
):
    return mgr.get_all(branch_id=branch_id, billing_type=billing_type, active_only=active_only)


@router.get(
    "/{program_id}",
    summary="Get program details",
    description="Retrieves a single program record by ID along with its sequential curriculum levels.",
)
def get_program(
    program_id: int = Path(..., description="Program ID"),
    mgr: ProgramManager = Depends(get_program_mgr),
):
    prog = mgr.get_by_id(program_id, include_levels=True)
    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program ID {program_id} not found.",
        )
    return prog


@router.get(
    "/{program_id}/levels",
    summary="Get program levels",
    description="Lists all sequential curriculum levels assigned to this educational program.",
)
def get_program_levels(
    program_id: int = Path(..., description="Program ID"),
    mgr: ProgramManager = Depends(get_program_mgr),
):
    prog = mgr.get_by_id(program_id, include_levels=False)
    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program ID {program_id} not found.",
        )
    return mgr.get_levels(program_id)


@router.get(
    "/{program_id}/pricing-plans",
    summary="Get program pricing plans",
    description="Lists pricing matrices configured for this program.",
)
def get_program_pricing_plans(
    program_id: int = Path(..., description="Program ID"),
    academic_year_id: Optional[int] = Query(None, description="Filter by academic fiscal cycle"),
    mgr: ProgramManager = Depends(get_program_mgr),
):
    prog = mgr.get_by_id(program_id, include_levels=False)
    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program ID {program_id} not found.",
        )
    return mgr.get_pricing_plans(program_id, academic_year_id=academic_year_id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create educational program",
    description="Registers a new educational program under a branch. Requires ADMIN or DIRECTOR role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_program(
    payload: ProgramCreate,
    mgr: ProgramManager = Depends(get_program_mgr),
    b_mgr: BranchManager = Depends(get_branch_mgr),
):
    branch = b_mgr.get_by_id(payload.branch_id)
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    existing = mgr.get_by_code(payload.branch_id, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Program code '{payload.code}' already exists in branch '{payload.branch_id}'.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        code=payload.code,
        name_ar=payload.name_ar,
        name_en=payload.name_en,
        billing_type=payload.billing_type,
        description=payload.description,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create program.",
        )
    return created


@router.put(
    "/{program_id}",
    summary="Update educational program",
    description="Modifies program details, billing type, or description. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_program(
    program_id: int,
    payload: ProgramUpdate,
    mgr: ProgramManager = Depends(get_program_mgr),
):
    existing = mgr.get_by_id(program_id, include_levels=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program ID {program_id} not found.",
        )

    success = mgr.update(program_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(program_id, include_levels=True)


@router.patch(
    "/{program_id}/status",
    summary="Toggle program active status",
    description="Enables or disables an educational program. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def toggle_program_status(
    program_id: int,
    payload: ProgramStatusToggleRequest,
    mgr: ProgramManager = Depends(get_program_mgr),
):
    existing = mgr.get_by_id(program_id, include_levels=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program ID {program_id} not found.",
        )

    mgr.toggle_status(program_id, payload.is_active)
    return {
        "program_id": program_id,
        "is_active": payload.is_active,
        "message": "Program status successfully updated.",
    }


@router.delete(
    "/{program_id}",
    summary="Delete educational program",
    description="Deletes a program. Fails if child levels or active enrollments exist. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_program(
    program_id: int,
    mgr: ProgramManager = Depends(get_program_mgr),
):
    existing = mgr.get_by_id(program_id, include_levels=False)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Program ID {program_id} not found.",
        )

    success = mgr.delete(program_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete program: dependent levels, groups, or pricing plans exist.",
        )
    return {"message": f"Program ID {program_id} deleted successfully."}
