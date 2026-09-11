"""
backend/apis/levels.py
----------------------
Curriculum Levels & Educational Progression Stages REST Router.
Provides endpoints for:
  - Listing levels across programs (p1, p2, s1, s2, prep cohorts)
  - Viewing level attributes, visual color tags, and age cohorts
  - Creating new curriculum progression levels (Admin protected)
  - Updating level configurations and sequence order (Admin protected)
  - Reordering curriculum levels under a program (Admin protected)
  - Deleting unused level definitions (Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, LevelManager, ProgramManager
from backend.apis.security import require_role

router = APIRouter(prefix="/levels", tags=["Levels"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class LevelBase(BaseModel):
    program_id: int = Field(..., description="Parent educational program ID", example=1)
    level_code: str = Field(..., max_length=50, description="Short level code", example="p1")
    name_ar: str = Field(..., description="Arabic level title", example="المستوى التمهيدي 1")
    name_en: Optional[str] = Field(None, description="English level title", example="Primary Level 1")
    age_group_cohort: Optional[str] = Field(None, description="Age group recommendation", example="5-7 years")
    color_tag: Optional[str] = Field(None, description="UI badge color hex or identifier", example="#4CAF50")
    sequence_order: int = Field(1, ge=1, description="Sequential stage order", example=1)


class LevelCreate(LevelBase):
    pass


class LevelUpdate(BaseModel):
    level_code: Optional[str] = None
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    age_group_cohort: Optional[str] = None
    color_tag: Optional[str] = None
    sequence_order: Optional[int] = Field(None, ge=1)


class ReorderLevelsRequest(BaseModel):
    program_id: int = Field(..., description="Target program ID")
    ordered_level_ids: List[int] = Field(..., min_length=1, description="Ordered list of level IDs")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_level_mgr(db: Database = Depends(get_database)) -> LevelManager:
    return LevelManager(db)


def get_program_mgr(db: Database = Depends(get_database)) -> ProgramManager:
    return ProgramManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List curriculum levels",
    description="Lists curriculum progression levels, optionally filtered by parent program.",
)
def list_levels(
    program_id: Optional[int] = Query(None, description="Filter by program ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: LevelManager = Depends(get_level_mgr),
):
    return mgr.get_all(program_id=program_id, limit=limit, offset=offset)


@router.get(
    "/{level_id}",
    summary="Get level details",
    description="Retrieves a single curriculum level by ID.",
)
def get_level(
    level_id: int = Path(..., description="Level ID"),
    mgr: LevelManager = Depends(get_level_mgr),
):
    level = mgr.get_by_id(level_id)
    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Level ID {level_id} not found.",
        )
    return level


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create curriculum level",
    description="Registers a new level under an educational program. Requires ADMIN or DIRECTOR role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_level(
    payload: LevelCreate,
    mgr: LevelManager = Depends(get_level_mgr),
    prog_mgr: ProgramManager = Depends(get_program_mgr),
):
    program = prog_mgr.get_by_id(payload.program_id, include_levels=False)
    if not program:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parent program ID {payload.program_id} not found.",
        )

    existing = mgr.get_by_code(payload.program_id, payload.level_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Level code '{payload.level_code}' already exists in program ID {payload.program_id}.",
        )

    created = mgr.create(
        program_id=payload.program_id,
        level_code=payload.level_code,
        name_ar=payload.name_ar,
        name_en=payload.name_en,
        age_group_cohort=payload.age_group_cohort,
        color_tag=payload.color_tag,
        sequence_order=payload.sequence_order,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create curriculum level.",
        )
    return created


@router.put(
    "/{level_id}",
    summary="Update curriculum level",
    description="Modifies a level's name, sequence order, or color tag. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_level(
    level_id: int,
    payload: LevelUpdate,
    mgr: LevelManager = Depends(get_level_mgr),
):
    existing = mgr.get_by_id(level_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Level ID {level_id} not found.",
        )

    success = mgr.update(level_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(level_id)


@router.post(
    "/reorder",
    summary="Reorder curriculum levels",
    description="Updates the sequence orders for a set of level IDs under a program. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def reorder_levels(
    payload: ReorderLevelsRequest,
    mgr: LevelManager = Depends(get_level_mgr),
):
    success = mgr.reorder_levels(payload.program_id, payload.ordered_level_ids)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update level sequence orders.",
        )
    return {
        "program_id": payload.program_id,
        "message": "Curriculum levels successfully reordered.",
        "levels": mgr.get_all(program_id=payload.program_id),
    }


@router.delete(
    "/{level_id}",
    summary="Delete curriculum level",
    description="Deletes a level definition. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_level(
    level_id: int,
    mgr: LevelManager = Depends(get_level_mgr),
):
    existing = mgr.get_by_id(level_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Level ID {level_id} not found.",
        )

    success = mgr.delete(level_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete level: referenced by groups or pricing plans.",
        )
    return {"message": f"Level ID {level_id} deleted successfully."}
