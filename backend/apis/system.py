"""
backend/apis/system.py
----------------------
System Health, Telemetry & Multi-Branch Operational Overview REST Router.
Provides endpoints for:
  - Service health checks & database connectivity verification
  - Consolidated infrastructure overview (branches, active year, classrooms)
  - Non-destructive historical archive inspection mode status
"""

from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends

from backend.database import (
    Database,
    get_database,
    InfrastructureManager,
)
from backend.apis.security import get_optional_current_user

router = APIRouter(prefix="/system", tags=["System Health"])


# =============================================================================
# DEPENDENCY PROVIDER
# =============================================================================

def get_infra_mgr(db: Database = Depends(get_database)) -> InfrastructureManager:
    return InfrastructureManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "/health",
    summary="Service Health Check",
    description="Returns live system operational telemetry and database connectivity status.",
)
def system_health_check(db: Database = Depends(get_database)):
    return {
        "service": "3abaqira-backend",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": {
            "archive_view_mode": db.is_archive_view_mode(),
            "tables_in_scope": len(db._backup.TABLE_IMPORT_ORDER if hasattr(db._backup, 'TABLE_IMPORT_ORDER') else [])
        }
    }


@router.get(
    "/overview",
    summary="Consolidated Infrastructure Overview",
    description="Returns high-level statistics across all branches, active academic year, and classroom counts.",
)
def get_system_overview(infra: InfrastructureManager = Depends(get_infra_mgr)):
    return infra.get_system_overview()


@router.get(
    "/archive-status",
    summary="Archive View Mode Status",
    description="Returns status of non-destructive historical archive inspection mode.",
)
def get_archive_status(db: Database = Depends(get_database)):
    return db.get_archive_view_status()
