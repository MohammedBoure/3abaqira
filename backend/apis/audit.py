"""
backend/apis/audit.py
---------------------
System Audit Trail & Entity Modification Logs REST Router.
Provides endpoints for:
  - Querying comprehensive audit logs across all system tables and operations (INSERT, UPDATE, DELETE)
  - Inspecting before-and-after change diffs (old_values vs new_values)
  - Historical entity timeline inspection (/api/audit/history/{table_name}/{record_id})
  - Recent operational activity feed for administrative dashboards
  - Aggregate audit telemetry and modification frequency analytics
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    AuditLogManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/audit", tags=["System Audit Logs"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class AuditLogManualCreate(BaseModel):
    table_name: str = Field(..., max_length=50, description="Target database table name", examples=["invoices"])
    record_id: int = Field(..., description="ID of the modified record", examples=[101])
    action: str = Field(..., description="Action type: INSERT, UPDATE, or DELETE", examples=["UPDATE"])
    old_values: Optional[Dict[str, Any]] = Field(None, description="Previous state snapshot before modification")
    new_values: Optional[Dict[str, Any]] = Field(None, description="New state snapshot after modification")
    performed_by: Optional[str] = Field(None, description="Username or system actor performing the change")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_audit_mgr(db: Database = Depends(get_database)) -> AuditLogManager:
    return AuditLogManager(db)


# =============================================================================
# AUDIT TRAIL ROUTE HANDLERS
# =============================================================================

@router.get(
    "/logs",
    summary="List audit logs",
    description="Retrieves system audit trail logs with filtering by table, action, actor, and date bounds.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def list_audit_logs(
    table_name: Optional[str] = Query(None, description="Filter by table name (e.g. students, payments, payroll_runs)"),
    action: Optional[str] = Query(None, description="Filter by action: INSERT, UPDATE, DELETE"),
    performed_by: Optional[str] = Query(None, description="Filter by username of the actor"),
    from_date: Optional[datetime] = Query(None, description="Filter logs on or after this timestamp"),
    to_date: Optional[datetime] = Query(None, description="Filter logs on or before this timestamp"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: AuditLogManager = Depends(get_audit_mgr),
):
    return mgr.get_all(
        table_name=table_name,
        action=action,
        performed_by=performed_by,
        from_date=from_date,
        to_date=to_date,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/recent",
    summary="Recent system activity feed",
    description="Returns the most recent system modification events for administrative dashboard streams.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR"))],
)
def get_recent_activity(
    limit: int = Query(25, ge=1, le=100),
    mgr: AuditLogManager = Depends(get_audit_mgr),
):
    return mgr.get_recent(limit=limit)


@router.get(
    "/stats",
    summary="Audit telemetry & modification statistics",
    description="Aggregates system modification metrics, action distribution (INSERT/UPDATE/DELETE), top active tables, and top actors.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def get_audit_statistics(
    mgr: AuditLogManager = Depends(get_audit_mgr),
):
    return mgr.get_stats()


@router.get(
    "/logs/{audit_id}",
    summary="Get audit log details",
    description="Retrieves a single audit log entry with full before-and-after JSON snapshots.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def get_audit_log(
    audit_id: int = Path(..., description="Target audit log ID"),
    mgr: AuditLogManager = Depends(get_audit_mgr),
):
    entry = mgr.get_by_id(audit_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log #{audit_id} not found.",
        )
    return entry


@router.get(
    "/history/{table_name}/{record_id}",
    summary="Get entity change history",
    description="Retrieves the chronological audit history and all historical modifications for a specific database record.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def get_record_audit_history(
    table_name: str = Path(..., description="Database table name (e.g. students, invoices)"),
    record_id: int = Path(..., description="Primary key record ID"),
    limit: int = Query(50, ge=1, le=200),
    mgr: AuditLogManager = Depends(get_audit_mgr),
):
    return mgr.get_by_record(table_name=table_name, record_id=record_id, limit=limit)


@router.post(
    "/logs",
    status_code=status.HTTP_201_CREATED,
    summary="Record manual audit event",
    description="Explicitly records an audit log event from an administrative client or microservice.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def record_manual_audit_log(
    payload: AuditLogManualCreate,
    mgr: AuditLogManager = Depends(get_audit_mgr),
):
    created = mgr.log_event(
        table_name=payload.table_name,
        record_id=payload.record_id,
        action=payload.action,
        old_values=payload.old_values,
        new_values=payload.new_values,
        performed_by=payload.performed_by,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record audit event.",
        )
    return created
