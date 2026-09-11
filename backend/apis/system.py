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
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    InfrastructureManager,
    AppMetadataManager,
)
from backend.apis.security import get_optional_current_user, require_role

router = APIRouter(prefix="/system", tags=["System Health & Metadata"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class MetadataSetRequest(BaseModel):
    meta_value: str = Field(..., description="Configuration or branding value string", examples=["أكاديمية العباقرة للتعليم"])


class MetadataBulkRequest(BaseModel):
    items: Dict[str, str] = Field(..., description="Key-value mapping of configuration pairs", examples=[{"academy_name_ar": "أكاديمية العباقرة", "currency": "DZD"}])


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_infra_mgr(db: Database = Depends(get_database)) -> InfrastructureManager:
    return InfrastructureManager(db)


def get_meta_mgr(db: Database = Depends(get_database)) -> AppMetadataManager:
    return AppMetadataManager(db)


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


# =============================================================================
# APPLICATION METADATA & CONFIGURATION ENDPOINTS
# =============================================================================

@router.get(
    "/metadata",
    summary="List all application metadata",
    description="Retrieves all system configuration parameters as a key-value dictionary.",
)
def get_all_metadata(meta_mgr: AppMetadataManager = Depends(get_meta_mgr)):
    return meta_mgr.get_all()


@router.get(
    "/metadata/records",
    summary="List metadata with timestamps",
    description="Retrieves all metadata records including update timestamps.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def list_metadata_records(meta_mgr: AppMetadataManager = Depends(get_meta_mgr)):
    return meta_mgr.get_all_records()


@router.get(
    "/metadata/{meta_key}",
    summary="Get configuration value by key",
    description="Retrieves a specific configuration parameter by its meta_key.",
)
def get_metadata_value(
    meta_key: str = Path(..., description="Target metadata configuration key"),
    meta_mgr: AppMetadataManager = Depends(get_meta_mgr),
):
    record = meta_mgr.get_by_key(meta_key)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metadata key '{meta_key}' is not configured.",
        )
    return record


@router.put(
    "/metadata/{meta_key}",
    summary="Set or update configuration parameter",
    description="Upserts a configuration parameter value.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def set_metadata_value(
    meta_key: str = Path(..., description="Target metadata configuration key"),
    payload: MetadataSetRequest = ...,
    meta_mgr: AppMetadataManager = Depends(get_meta_mgr),
):
    updated = meta_mgr.set(meta_key, payload.meta_value)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set metadata key '{meta_key}'.",
        )
    return updated


@router.post(
    "/metadata/bulk",
    summary="Bulk update configuration parameters",
    description="Updates multiple system metadata parameters in a single atomic transaction.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def bulk_set_metadata(
    payload: MetadataBulkRequest = ...,
    meta_mgr: AppMetadataManager = Depends(get_meta_mgr),
):
    return meta_mgr.bulk_set(payload.items)


@router.delete(
    "/metadata/{meta_key}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete configuration parameter",
    description="Deletes a configuration parameter by key.",
    dependencies=[Depends(require_role("SUPER_ADMIN"))],
)
def delete_metadata_value(
    meta_key: str = Path(..., description="Target metadata configuration key"),
    meta_mgr: AppMetadataManager = Depends(get_meta_mgr),
):
    success = meta_mgr.delete(meta_key)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metadata key '{meta_key}' not found or could not be deleted.",
        )
    return None


@router.post(
    "/metadata/init-defaults",
    summary="Seed default application metadata",
    description="Initializes baseline default metadata keys (academy name, currency, default cycle) if missing.",
    dependencies=[Depends(require_role("SUPER_ADMIN"))],
)
def initialize_default_metadata(meta_mgr: AppMetadataManager = Depends(get_meta_mgr)):
    meta_mgr.initialize_defaults()
    return {"message": "Default metadata verified and initialized.", "metadata": meta_mgr.get_all()}

