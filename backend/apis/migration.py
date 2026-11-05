"""
backend/apis/migration.py
--------------------------
Legacy Data Migration & Excel Ingestion REST API Gateway.
Provides endpoints for:
  - Staging batch management
  - Excel and row payload staging with automated Arabic name normalization & cohort matching
  - Ambiguous row human review queue with confidence scoring
  - Reconciled entity conversion (Student, Enrollment, Invoices) with legacy traceability
  - Batch financial reconciliation (Excel vs. System Ledger)
"""

from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, UploadFile, File
from pydantic import BaseModel, Field

from backend.database import Database, get_database, MigrationManager

router = APIRouter(prefix="/migration", tags=["Data Migration & Excel Ingestion"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class MigrationBatchCreate(BaseModel):
    filename: str = Field(..., example="rawda_2025_2026.xlsx")
    sheet_name: Optional[str] = Field(None, example="قسم الأصغر 2")
    source_branch_id: Optional[str] = Field("RAWDA", example="RAWDA")
    academic_year_id: Optional[int] = None
    notes: Optional[str] = Field(None, example="Initial staging import from kindergarten Excel file")


class StageRowsRequest(BaseModel):
    rows: List[Dict[str, Any]] = Field(..., description="Array of raw row dictionaries extracted from Excel sheet")
    source_branch_id: str = Field("RAWDA", example="RAWDA")


class ResolveAmbiguousRowRequest(BaseModel):
    resolved_payload: Dict[str, Any] = Field(..., description="Corrected/verified fields (first_name, last_name, cohort, etc.)")
    resolved_by_user_id: Optional[int] = None
    review_notes: Optional[str] = Field(None, example="Verified with branch director; compound surname confirmed.")


class ArabicNameSplitRequest(BaseModel):
    full_name: str = Field(..., example="عبد الرحمن بن علي")


# =============================================================================
# ENDPOINTS
# =============================================================================

# 1. Utility: Test Arabic Name Normalization & Splitting
@router.post("/tools/split-arabic-name", summary="Test Arabic Name Normalization & Compound Splitting")
def test_split_arabic_name(payload: ArabicNameSplitRequest):
    return MigrationManager.split_arabic_name(payload.full_name)


# 2. Batches
@router.get("/batches", summary="List Migration Staging Batches")
def get_migration_batches(
    status: Optional[str] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = MigrationManager(db)
    return mgr.get_batches(status=status)


@router.post("/batches", status_code=status.HTTP_201_CREATED, summary="Create Migration Staging Batch")
def create_migration_batch(payload: MigrationBatchCreate, db: Database = Depends(get_database)):
    mgr = MigrationManager(db)
    res = mgr.create_batch(
        filename=payload.filename,
        sheet_name=payload.sheet_name,
        source_branch_id=payload.source_branch_id,
        academic_year_id=payload.academic_year_id,
        notes=payload.notes,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not create migration batch")
    return res


@router.get("/batches/{batch_id}", summary="Get Migration Batch Details")
def get_migration_batch(batch_id: int, db: Database = Depends(get_database)):
    mgr = MigrationManager(db)
    res = mgr.get_batch(batch_id)
    if not res:
        raise HTTPException(status_code=404, detail="Migration batch not found")
    return res


# 3. Staging Rows
@router.post("/batches/{batch_id}/stage-rows", summary="Stage Parsed Rows with Name Normalization")
def stage_batch_rows(
    batch_id: int, payload: StageRowsRequest, db: Database = Depends(get_database)
):
    mgr = MigrationManager(db)
    batch = mgr.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Migration batch not found")

    return mgr.stage_parsed_rows(
        batch_id=batch_id,
        rows=payload.rows,
        source_branch_id=payload.source_branch_id,
    )


# 4. Ambiguous Rows Review Queue
@router.get("/ambiguous-rows", summary="Get Ambiguous Rows Requiring Human Review")
def get_ambiguous_rows(
    batch_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Database = Depends(get_database),
):
    mgr = MigrationManager(db)
    return mgr.get_ambiguous_rows(batch_id=batch_id, limit=limit)


@router.put("/rows/{row_id}/resolve", summary="Resolve Ambiguous Row (Promote to EXACT_MATCH)")
def resolve_ambiguous_row(
    row_id: int, payload: ResolveAmbiguousRowRequest, db: Database = Depends(get_database)
):
    mgr = MigrationManager(db)
    res = mgr.resolve_ambiguous_row(
        row_id=row_id,
        resolved_payload=payload.resolved_payload,
        resolved_by_user_id=payload.resolved_by_user_id,
        review_notes=payload.review_notes,
    )
    if not res:
        raise HTTPException(status_code=404, detail="Row not found or resolution failed")
    return res


# 5. Entity Conversion & Legacy Traceability
@router.post("/rows/{row_id}/convert", summary="Convert Single Approved Staged Row to Production Entities")
def convert_staged_row(
    row_id: int,
    default_branch_id: str = Query("RAWDA"),
    db: Database = Depends(get_database),
):
    mgr = MigrationManager(db)
    res = mgr.convert_staged_row_to_entities(row_id=row_id, default_branch_id=default_branch_id)
    if not res:
        raise HTTPException(status_code=400, detail="Could not convert row to production entities")
    return res


@router.post("/batches/{batch_id}/convert-approved", summary="Batch Convert All Approved (EXACT_MATCH) Rows")
def convert_batch_approved_rows(batch_id: int, db: Database = Depends(get_database)):
    mgr = MigrationManager(db)
    return mgr.convert_batch_approved_rows(batch_id=batch_id)


# 6. Batch Financial Reconciliation & Legacy Refs
@router.get("/batches/{batch_id}/reconciliation", summary="Reconcile Staged Excel Sums vs Production Ledger")
def reconcile_batch(batch_id: int, db: Database = Depends(get_database)):
    mgr = MigrationManager(db)
    return mgr.reconcile_batch_financials(batch_id=batch_id)


@router.get("/legacy-refs", summary="Query Legacy Traceability Audit Links")
def get_legacy_refs(
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = MigrationManager(db)
    return mgr.get_legacy_refs(entity_type=entity_type, entity_id=entity_id)
