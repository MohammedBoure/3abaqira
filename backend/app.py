"""
backend/app.py
---------------
Main FastAPI Application for 3abaqira Enterprise Management Platform.
Exposes RESTful APIs for Core Organizational Infrastructure:
  - Branches (Multi-Tenant Locations: CENTER, RAWDA, etc.)
  - Academic Fiscal Years
  - Classrooms & Lecture Halls
  - System Health & Infrastructure Overview
"""

import os
import sys
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure backend root is on Python sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.database import (
    Database,
    get_database,
    get_db,
    BranchManager,
    AcademicYearManager,
    ClassroomManager,
    InfrastructureManager,
    logger,
)


# =============================================================================
# PYDANTIC DATA TRANSFER OBJECTS (SCHEMAS)
# =============================================================================

# --- Branch Schemas ---
class BranchBase(BaseModel):
    name_ar: str = Field(..., description="Arabic name of the branch", example="أكاديمية الأطفال العباقرة - المركز")
    name_en: Optional[str] = Field(None, description="English name of the branch", example="3abaqira Academy - Center")
    branch_type: str = Field(..., description="Branch classification: ACADEMY, DAYCARE, HYBRID, OTHER", example="ACADEMY")
    phone: Optional[str] = Field(None, description="Primary contact phone number", example="+213-21-000001")
    email: Optional[str] = Field(None, description="Contact email", example="center@3abaqira.dz")
    address: Optional[str] = Field(None, description="Physical address location", example="Algiers, Algeria")
    is_active: bool = Field(True, description="Operating status flag")


class BranchCreate(BranchBase):
    branch_id: str = Field(..., max_length=20, description="Unique tenant code (e.g., 'CENTER', 'RAWDA')", example="CENTER")


class BranchUpdate(BaseModel):
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    branch_type: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None


class StatusToggleRequest(BaseModel):
    is_active: bool = Field(..., description="New active status")


# --- Academic Year Schemas ---
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


# --- Classroom Schemas ---
class ClassroomBase(BaseModel):
    branch_id: str = Field(..., description="Associated branch ID", example="CENTER")
    name: str = Field(..., description="Classroom name or identifier", example="قاعة 1")
    capacity: int = Field(20, ge=1, description="Maximum seated student capacity", example=18)
    floor_number: Optional[int] = Field(0, description="Floor / level number", example=1)
    description: Optional[str] = Field(None, description="Facilities or specialized notes", example="Equipped with Soroban abacuses")
    is_active: bool = Field(True, description="Active status")


class ClassroomCreate(ClassroomBase):
    pass


class ClassroomUpdate(BaseModel):
    branch_id: Optional[str] = None
    name: Optional[str] = None
    capacity: Optional[int] = Field(None, ge=1)
    floor_number: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


# =============================================================================
# DEPENDENCY INJECTION HELPERS
# =============================================================================

def get_branches_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_academic_years_mgr(db: Database = Depends(get_database)) -> AcademicYearManager:
    return AcademicYearManager(db)


def get_classrooms_mgr(db: Database = Depends(get_database)) -> ClassroomManager:
    return ClassroomManager(db)


def get_infra_mgr(db: Database = Depends(get_database)) -> InfrastructureManager:
    return InfrastructureManager(db)


# =============================================================================
# APPLICATION LIFESPAN & INITIALIZATION
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup verification and graceful shutdown."""
    logger.info("Initializing 3abaqira Enterprise Backend Service...")
    try:
        db = Database()
        logger.info("Database singleton initialized & schema verified.")
    except Exception as e:
        logger.error(f"Startup warning: Database initialization deferred or error: {e}")
    yield
    logger.info("3abaqira Enterprise Backend Service stopped.")


# Create FastAPI App Instance
app = FastAPI(
    title="3abaqira Enterprise Management API",
    description=(
        "Backend REST API for 3abaqira Academy & Daycare (أكاديمية وروضة الأطفال العباقرة). "
        "Provides multi-branch tenant isolation, academic cycles, and infrastructure management."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend clients (Vite / Next.js / Desktop clients)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# ROUTER DEFINITIONS
# =============================================================================

api_router = APIRouter(prefix="/api")


# ── System Health & Overview ─────────────────────────────────────────────────
@api_router.get("/health", tags=["System Health"])
def health_check(db: Database = Depends(get_database)):
    """System health check and database connectivity verification."""
    status_info = {
        "service": "3abaqira-backend",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": {
            "archive_view_mode": db.is_archive_view_mode(),
            "tables_in_scope": len(db._backup.TABLE_IMPORT_ORDER if hasattr(db._backup, 'TABLE_IMPORT_ORDER') else [])
        }
    }
    return status_info


@api_router.get("/system/overview", tags=["System Health"])
def get_system_overview(infra: InfrastructureManager = Depends(get_infra_mgr)):
    """Consolidated infrastructure status across all branches, active academic year, and classrooms."""
    return infra.get_system_overview()


@api_router.get("/system/archive-status", tags=["System Health"])
def get_archive_status(db: Database = Depends(get_database)):
    """Returns status of non-destructive historical archive inspection mode."""
    return db.get_archive_view_status()


# ── Branches API ─────────────────────────────────────────────────────────────
@api_router.get("/branches", tags=["Branches"])
def list_branches(
    active_only: bool = Query(False, description="Filter for active branches only"),
    mgr: BranchManager = Depends(get_branches_mgr)
):
    """Lists all registered branches (Academy Center, Daycare, etc.)."""
    return mgr.get_all(active_only=active_only)


@api_router.get("/branches/{branch_id}", tags=["Branches"])
def get_branch(
    branch_id: str = Path(..., description="Unique branch ID (e.g., 'CENTER', 'RAWDA')"),
    mgr: BranchManager = Depends(get_branches_mgr)
):
    """Retrieves single branch details by ID."""
    branch = mgr.get_by_id(branch_id)
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch with ID '{branch_id}' not found."
        )
    return branch


@api_router.post("/branches", tags=["Branches"], status_code=status.HTTP_201_CREATED)
def create_branch(
    payload: BranchCreate,
    mgr: BranchManager = Depends(get_branches_mgr)
):
    """Registers a new branch."""
    existing = mgr.get_by_id(payload.branch_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Branch with ID '{payload.branch_id}' already exists."
        )
    created = mgr.create(
        branch_id=payload.branch_id,
        name_ar=payload.name_ar,
        name_en=payload.name_en,
        branch_type=payload.branch_type,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register branch."
        )
    return created


@api_router.put("/branches/{branch_id}", tags=["Branches"])
def update_branch(
    branch_id: str,
    payload: BranchUpdate,
    mgr: BranchManager = Depends(get_branches_mgr)
):
    """Updates an existing branch's details."""
    existing = mgr.get_by_id(branch_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found."
        )
    success = mgr.update(branch_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No attributes updated or update failed."
        )
    return mgr.get_by_id(branch_id)


@api_router.patch("/branches/{branch_id}/status", tags=["Branches"])
def toggle_branch_status(
    branch_id: str,
    payload: StatusToggleRequest,
    mgr: BranchManager = Depends(get_branches_mgr)
):
    """Enables or disables an operational branch."""
    existing = mgr.get_by_id(branch_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found."
        )
    mgr.toggle_status(branch_id, payload.is_active)
    return {"branch_id": branch_id, "is_active": payload.is_active, "message": "Branch status updated."}


@api_router.delete("/branches/{branch_id}", tags=["Branches"])
def delete_branch(
    branch_id: str,
    mgr: BranchManager = Depends(get_branches_mgr)
):
    """Deletes a branch. Fails if dependent records exist."""
    existing = mgr.get_by_id(branch_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Branch '{branch_id}' not found.")
    success = mgr.delete(branch_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete branch '{branch_id}': dependent records (classrooms, enrollments) exist."
        )
    return {"message": f"Branch '{branch_id}' deleted successfully."}


@api_router.get("/branches/{branch_id}/classrooms", tags=["Branches"])
def get_branch_classrooms(
    branch_id: str,
    active_only: bool = Query(False),
    mgr: ClassroomManager = Depends(get_classrooms_mgr)
):
    """Lists all classrooms associated with a branch."""
    return mgr.get_by_branch(branch_id, active_only=active_only)


# ── Academic Years API ───────────────────────────────────────────────────────
@api_router.get("/academic-years", tags=["Academic Years"])
def list_academic_years(mgr: AcademicYearManager = Depends(get_academic_years_mgr)):
    """Lists all academic fiscal years sorted by start date."""
    return mgr.get_all()


@api_router.get("/academic-years/current", tags=["Academic Years"])
def get_current_academic_year(mgr: AcademicYearManager = Depends(get_academic_years_mgr)):
    """Retrieves the currently active academic fiscal year."""
    current = mgr.get_current()
    if not current:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active academic year configured.")
    return current


@api_router.get("/academic-years/{year_id}", tags=["Academic Years"])
def get_academic_year(
    year_id: int = Path(..., description="Academic year ID"),
    mgr: AcademicYearManager = Depends(get_academic_years_mgr)
):
    """Retrieves a single academic year by ID."""
    year = mgr.get_by_id(year_id)
    if not year:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Academic year ID {year_id} not found.")
    return year


@api_router.post("/academic-years", tags=["Academic Years"], status_code=status.HTTP_201_CREATED)
def create_academic_year(
    payload: AcademicYearCreate,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr)
):
    """Registers a new academic fiscal year."""
    if payload.end_date <= payload.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Academic year end_date must be strictly after start_date."
        )
    created = mgr.create(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_current=payload.is_current
    )
    if not created:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create academic year.")
    return created


@api_router.put("/academic-years/{year_id}", tags=["Academic Years"])
def update_academic_year(
    year_id: int,
    payload: AcademicYearUpdate,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr)
):
    """Updates an academic fiscal year."""
    existing = mgr.get_by_id(year_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Academic year ID {year_id} not found.")
    success = mgr.update(year_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update failed.")
    return mgr.get_by_id(year_id)


@api_router.post("/academic-years/{year_id}/set-current", tags=["Academic Years"])
def set_current_academic_year(
    year_id: int,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr)
):
    """Atomically sets this academic year as active (is_current=TRUE), setting all others to FALSE."""
    existing = mgr.get_by_id(year_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Academic year ID {year_id} not found.")
    mgr.set_current(year_id)
    return {"academic_year_id": year_id, "is_current": True, "message": "Academic year activated."}


@api_router.delete("/academic-years/{year_id}", tags=["Academic Years"])
def delete_academic_year(
    year_id: int,
    mgr: AcademicYearManager = Depends(get_academic_years_mgr)
):
    """Deletes an academic year."""
    existing = mgr.get_by_id(year_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Academic year ID {year_id} not found.")
    success = mgr.delete(year_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete academic year: references exist.")
    return {"message": f"Academic year ID {year_id} deleted successfully."}


# ── Classrooms API ───────────────────────────────────────────────────────────
@api_router.get("/classrooms", tags=["Classrooms"])
def list_classrooms(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    active_only: bool = Query(False, description="Filter active rooms only"),
    mgr: ClassroomManager = Depends(get_classrooms_mgr)
):
    """Lists all classrooms across branches with capacity and location information."""
    return mgr.get_all(branch_id=branch_id, active_only=active_only)


@api_router.get("/classrooms/{classroom_id}", tags=["Classrooms"])
def get_classroom(
    classroom_id: int = Path(..., description="Classroom ID"),
    mgr: ClassroomManager = Depends(get_classrooms_mgr)
):
    """Retrieves single classroom details by ID."""
    room = mgr.get_by_id(classroom_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Classroom ID {classroom_id} not found.")
    return room


@api_router.post("/classrooms", tags=["Classrooms"], status_code=status.HTTP_201_CREATED)
def create_classroom(
    payload: ClassroomCreate,
    mgr: ClassroomManager = Depends(get_classrooms_mgr),
    branches_mgr: BranchManager = Depends(get_branches_mgr)
):
    """Creates a new classroom in the specified branch."""
    branch = branches_mgr.get_by_id(payload.branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Branch '{payload.branch_id}' not found.")

    created = mgr.create(
        branch_id=payload.branch_id,
        name=payload.name,
        capacity=payload.capacity,
        floor_number=payload.floor_number or 0,
        description=payload.description,
        is_active=payload.is_active
    )
    if not created:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create classroom.")
    return created


@api_router.put("/classrooms/{classroom_id}", tags=["Classrooms"])
def update_classroom(
    classroom_id: int,
    payload: ClassroomUpdate,
    mgr: ClassroomManager = Depends(get_classrooms_mgr)
):
    """Updates classroom parameters."""
    existing = mgr.get_by_id(classroom_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Classroom ID {classroom_id} not found.")
    success = mgr.update(classroom_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Update failed.")
    return mgr.get_by_id(classroom_id)


@api_router.delete("/classrooms/{classroom_id}", tags=["Classrooms"])
def delete_classroom(
    classroom_id: int,
    mgr: ClassroomManager = Depends(get_classrooms_mgr)
):
    """Deletes a classroom record."""
    existing = mgr.get_by_id(classroom_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Classroom ID {classroom_id} not found.")
    success = mgr.delete(classroom_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete classroom: referenced by schedules.")
    return {"message": f"Classroom ID {classroom_id} deleted successfully."}


# Mount API router to main FastAPI app
app.include_router(api_router)


# Root Endpoint
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to 3abaqira Enterprise Management API",
        "documentation": "/docs",
        "health": "/api/health",
        "overview": "/api/system/overview"
    }


# Standalone runner
if __name__ == "__main__":
    try:
        import uvicorn
        uvicorn.run("backend.app:app", host="0.0.0.0", port=8000, reload=True)
    except ImportError:
        print("Uvicorn is not installed. Run: pip install uvicorn")
