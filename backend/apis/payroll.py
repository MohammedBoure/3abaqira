"""
backend/apis/payroll.py
-----------------------
HR Monthly Payroll Runs & Disbursement Ledger REST Router.
Provides endpoints for:
  - Monthly payroll run cycles (DRAFT -> CALCULATED -> APPROVED -> DISBURSED -> CANCELLED)
  - Automated faculty and staff compensation calculation (Fixed, Headcount, Per-Session, Hourly, Hybrid)
  - Departmental subtotals rollup (admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed)
  - Line-item adjustments, allowances, deductions, and payslip generation
  - Payment voucher issuance (PAY-{BRANCH}-{YYYY-MM}-{EMP_CODE}) and disbursement ledger
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    BranchManager,
    EmployeeManager,
    PayrollManager,
    PayrollItemManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/payroll", tags=["HR Monthly Payroll & Disbursements"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PayrollRunCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", examples=["CENTER"])
    month_period: str = Field(..., pattern=r"^\d{4}-\d{2}$", description="Payroll cycle month (YYYY-MM)", examples=["2026-09"])
    run_date: Optional[date] = Field(None, description="Payroll run execution date (defaults to today)", examples=["2026-09-30"])
    notes: Optional[str] = Field(None, description="Administrative notes regarding this payroll cycle")


class PayrollRunUpdate(BaseModel):
    run_date: Optional[date] = None
    notes: Optional[str] = None


class PayrollItemCreate(BaseModel):
    employee_id: int = Field(..., description="Employee faculty or staff member ID", examples=[1])
    base_amount: float = Field(0.0, ge=0, description="Base fixed compensation amount in DZD", examples=[35000.0])
    headcount_count: int = Field(0, ge=0, description="Number of active student headcounts coached", examples=[15])
    headcount_bonus: float = Field(0.0, ge=0, description="Headcount-based variable compensation in DZD", examples=[7500.0])
    session_count: int = Field(0, ge=0, description="Number of completed sessions conducted in the month", examples=[12])
    variable_session_amount: float = Field(0.0, ge=0, description="Session-based variable compensation in DZD", examples=[18000.0])
    overtime_or_allowance: float = Field(0.0, ge=0, description="Extra overtime, bonuses, or food allowances in DZD", examples=[2000.0])
    deductions: float = Field(0.0, ge=0, description="Salary deductions, advances, or penalties in DZD", examples=[0.0])
    payment_voucher_no: Optional[str] = Field(None, description="Disbursement voucher number (auto-generated if omitted)")
    disbursement_date: Optional[date] = Field(None, description="Actual payout date")
    notes: Optional[str] = Field(None, description="Adjustment notes")


class PayrollItemUpdate(BaseModel):
    base_amount: Optional[float] = Field(None, ge=0)
    headcount_count: Optional[int] = Field(None, ge=0)
    headcount_bonus: Optional[float] = Field(None, ge=0)
    session_count: Optional[int] = Field(None, ge=0)
    variable_session_amount: Optional[float] = Field(None, ge=0)
    overtime_or_allowance: Optional[float] = Field(None, ge=0)
    deductions: Optional[float] = Field(None, ge=0)
    payment_voucher_no: Optional[str] = None
    disbursement_date: Optional[date] = None
    notes: Optional[str] = None


class PayrollApproveRequest(BaseModel):
    approved_by_employee_id: int = Field(..., description="Employee ID of the approving director / administrator", examples=[1])
    notes: Optional[str] = Field(None, description="Approval sign-off notes")


class PayrollDisburseRequest(BaseModel):
    disbursement_date: Optional[date] = Field(None, description="Payout execution date (defaults to today)", examples=["2026-09-30"])
    notes: Optional[str] = Field(None, description="Disbursement ledger notes")


class PayrollCancelRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Cancellation / voiding justification")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_payroll_mgr(db: Database = Depends(get_database)) -> PayrollManager:
    return PayrollManager(db)


def get_item_mgr(db: Database = Depends(get_database)) -> PayrollItemManager:
    return PayrollItemManager(db)


def get_employee_mgr(db: Database = Depends(get_database)) -> EmployeeManager:
    return EmployeeManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


# =============================================================================
# PAYROLL RUNS MASTER ROUTE HANDLERS
# =============================================================================

@router.get(
    "/runs",
    summary="List monthly payroll runs",
    description="Retrieves payroll run cycles filtered by branch, month period (YYYY-MM), or lifecycle status.",
)
def list_payroll_runs(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    month_period: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Filter by month (YYYY-MM)"),
    status: Optional[str] = Query(None, description="Filter by status: DRAFT, CALCULATED, APPROVED, DISBURSED, CANCELLED"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        month_period=month_period,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/runs",
    status_code=status.HTTP_201_CREATED,
    summary="Create a draft payroll run",
    description="Initializes a new monthly payroll run in DRAFT status for a branch and month period.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_payroll_run(
    payload: PayrollRunCreate,
    mgr: PayrollManager = Depends(get_payroll_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
):
    branch = branch_mgr.get_by_id(payload.branch_id)
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' does not exist.",
        )

    existing = mgr.get_by_branch_and_period(payload.branch_id, payload.month_period)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A payroll run already exists for branch '{payload.branch_id}' and month '{payload.month_period}'.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        month_period=payload.month_period,
        run_date=payload.run_date,
        notes=payload.notes,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize payroll run record.",
        )
    return created


@router.get(
    "/summary",
    summary="Monthly payroll cost summary",
    description="Returns aggregated payroll expenditures per month partitioned into administrative, teachers, and coaches subtotals.",
)
def get_payroll_summary(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    year: Optional[str] = Query(None, description="Filter by calendar year (e.g. 2026)"),
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    return mgr.get_monthly_cost_summary(branch_id=branch_id, year=year)


@router.get(
    "/employees",
    summary="List active employees for payroll",
    description="Helper directory of faculty coaches and staff members available for payroll scheduling.",
)
def list_payroll_employees(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    role: Optional[str] = Query(None, description="Filter by employee role"),
    emp_mgr: EmployeeManager = Depends(get_employee_mgr),
):
    return emp_mgr.get_all(
        branch_id=branch_id,
        role=role,
        is_active=True,
        limit=200,
    )


@router.get(
    "/runs/{payroll_run_id}",
    summary="Get payroll run details",
    description="Retrieves a payroll run record with departmental subtotal rollups and item counts.",
)
def get_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    return run


@router.put(
    "/runs/{payroll_run_id}",
    summary="Update payroll run metadata",
    description="Updates execution date or administrative notes for a payroll run.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def update_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    payload: PayrollRunUpdate = ...,
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    updated = mgr.update(
        payroll_run_id=payroll_run_id,
        run_date=payload.run_date,
        notes=payload.notes,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update payroll run #{payroll_run_id}.",
        )
    return updated


@router.delete(
    "/runs/{payroll_run_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a payroll run",
    description="Deletes a payroll run. Only permitted if status is DRAFT or CANCELLED.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def delete_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    if run.get("status") not in ("DRAFT", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete payroll run #{payroll_run_id} with status '{run.get('status')}'. Must be DRAFT or CANCELLED.",
        )
    success = mgr.delete(payroll_run_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete payroll run #{payroll_run_id}.",
        )
    return None


@router.post(
    "/runs/{payroll_run_id}/calculate",
    summary="Execute automated batch payroll calculation",
    description="Calculates compensation items for all active employees in this branch based on compensation models, groups, and completed sessions.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def calculate_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    if run.get("status") in ("DISBURSED", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot recalculate payroll run #{payroll_run_id} with status '{run.get('status')}'.",
        )
    calculated = mgr.calculate_payroll(payroll_run_id)
    if not calculated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch calculation failed for payroll run #{payroll_run_id}.",
        )
    return calculated


@router.post(
    "/runs/{payroll_run_id}/approve",
    summary="Approve payroll run",
    description="Sign off and approve a calculated payroll run by an authorized director.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "DIRECTOR"))],
)
def approve_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    payload: PayrollApproveRequest = ...,
    mgr: PayrollManager = Depends(get_payroll_mgr),
    emp_mgr: EmployeeManager = Depends(get_employee_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    if run.get("status") not in ("DRAFT", "CALCULATED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payroll run #{payroll_run_id} cannot be approved from status '{run.get('status')}'.",
        )
    approver = emp_mgr.get_by_id(payload.approved_by_employee_id)
    if not approver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approver employee #{payload.approved_by_employee_id} not found.",
        )
    approved = mgr.approve_payroll(
        payroll_run_id=payroll_run_id,
        approved_by_employee_id=payload.approved_by_employee_id,
        notes=payload.notes,
    )
    if not approved:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve payroll run #{payroll_run_id}.",
        )
    return approved


@router.post(
    "/runs/{payroll_run_id}/disburse",
    summary="Disburse payroll run",
    description="Executes payroll payout: stamps disbursement dates and issues individual voucher numbers (PAY-{BRANCH}-{YYYY-MM}-{EMP_CODE}).",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR"))],
)
def disburse_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    payload: PayrollDisburseRequest = ...,
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    if run.get("status") not in ("APPROVED", "CALCULATED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot disburse payroll run #{payroll_run_id} from status '{run.get('status')}'. Must be APPROVED or CALCULATED.",
        )
    disbursed = mgr.disburse_payroll(
        payroll_run_id=payroll_run_id,
        disbursement_date=payload.disbursement_date,
        notes=payload.notes,
    )
    if not disbursed:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Disbursement failed for payroll run #{payroll_run_id}.",
        )
    return disbursed


@router.post(
    "/runs/{payroll_run_id}/cancel",
    summary="Cancel payroll run",
    description="Voids or cancels a payroll run. Disbursed runs cannot be cancelled.",
    dependencies=[Depends(require_role("SUPER_ADMIN", "ADMIN"))],
)
def cancel_payroll_run(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    payload: PayrollCancelRequest = ...,
    mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    if run.get("status") == "DISBURSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel payroll run #{payroll_run_id} because it has already been DISBURSED.",
        )
    cancelled = mgr.cancel_payroll(payroll_run_id=payroll_run_id, notes=payload.notes)
    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel payroll run #{payroll_run_id}.",
        )
    return cancelled


# =============================================================================
# PAYROLL ITEMS & ADJUSTMENTS ROUTE HANDLERS
# =============================================================================

@router.get(
    "/runs/{payroll_run_id}/items",
    summary="List line items for a payroll run",
    description="Retrieves all employee line items, compensation components, and vouchers for a payroll run.",
)
def list_payroll_run_items(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    item_mgr: PayrollItemManager = Depends(get_item_mgr),
    run_mgr: PayrollManager = Depends(get_payroll_mgr),
):
    run = run_mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    return item_mgr.get_items_for_run(payroll_run_id)


@router.post(
    "/runs/{payroll_run_id}/items",
    status_code=status.HTTP_201_CREATED,
    summary="Add an employee payroll line item",
    description="Manually registers or adds a line item adjustment to a payroll run and synchronizes parent subtotals.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def add_payroll_item(
    payroll_run_id: int = Path(..., description="Target payroll run ID"),
    payload: PayrollItemCreate = ...,
    item_mgr: PayrollItemManager = Depends(get_item_mgr),
    run_mgr: PayrollManager = Depends(get_payroll_mgr),
    emp_mgr: EmployeeManager = Depends(get_employee_mgr),
):
    run = run_mgr.get_by_id(payroll_run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll run #{payroll_run_id} not found.",
        )
    if run.get("status") in ("DISBURSED", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot add items to payroll run #{payroll_run_id} with status '{run.get('status')}'.",
        )

    emp = emp_mgr.get_by_id(payload.employee_id)
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee #{payload.employee_id} not found.",
        )

    existing = item_mgr.get_by_run_and_employee(payroll_run_id, payload.employee_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Employee #{payload.employee_id} already has a payroll item in run #{payroll_run_id}.",
        )

    created = item_mgr.create(
        payroll_run_id=payroll_run_id,
        employee_id=payload.employee_id,
        base_amount=payload.base_amount,
        headcount_count=payload.headcount_count,
        headcount_bonus=payload.headcount_bonus,
        session_count=payload.session_count,
        variable_session_amount=payload.variable_session_amount,
        overtime_or_allowance=payload.overtime_or_allowance,
        deductions=payload.deductions,
        payment_voucher_no=payload.payment_voucher_no,
        disbursement_date=payload.disbursement_date,
        notes=payload.notes,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payroll line item.",
        )
    return created


@router.get(
    "/items/{payroll_item_id}",
    summary="Get payroll line item",
    description="Retrieves a single payroll line item by ID.",
)
def get_payroll_item(
    payroll_item_id: int = Path(..., description="Target payroll item ID"),
    item_mgr: PayrollItemManager = Depends(get_item_mgr),
):
    item = item_mgr.get_by_id(payroll_item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll item #{payroll_item_id} not found.",
        )
    return item


@router.put(
    "/items/{payroll_item_id}",
    summary="Update payroll line item",
    description="Updates adjustments, bonuses, deductions, or voucher on an item and recalculates parent run subtotals.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def update_payroll_item(
    payroll_item_id: int = Path(..., description="Target payroll item ID"),
    payload: PayrollItemUpdate = ...,
    item_mgr: PayrollItemManager = Depends(get_item_mgr),
):
    item = item_mgr.get_by_id(payroll_item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll item #{payroll_item_id} not found.",
        )
    if item.get("run_status") == "DISBURSED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot modify payroll item #{payroll_item_id} on an already DISBURSED payroll run.",
        )

    updated = item_mgr.update(
        payroll_item_id=payroll_item_id,
        base_amount=payload.base_amount,
        headcount_count=payload.headcount_count,
        headcount_bonus=payload.headcount_bonus,
        session_count=payload.session_count,
        variable_session_amount=payload.variable_session_amount,
        overtime_or_allowance=payload.overtime_or_allowance,
        deductions=payload.deductions,
        payment_voucher_no=payload.payment_voucher_no,
        disbursement_date=payload.disbursement_date,
        notes=payload.notes,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update payroll item #{payroll_item_id}.",
        )
    return updated


@router.delete(
    "/items/{payroll_item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a payroll line item",
    description="Deletes an employee line item from a payroll run and recalibrates parent run subtotals.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def delete_payroll_item(
    payroll_item_id: int = Path(..., description="Target payroll item ID"),
    item_mgr: PayrollItemManager = Depends(get_item_mgr),
):
    item = item_mgr.get_by_id(payroll_item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payroll item #{payroll_item_id} not found.",
        )
    if item.get("run_status") in ("DISBURSED", "CANCELLED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete items from a payroll run with status '{item.get('run_status')}'.",
        )
    success = item_mgr.delete(payroll_item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete payroll item #{payroll_item_id}.",
        )
    return None


@router.get(
    "/items/{payroll_item_id}/payslip",
    summary="Generate employee payslip (كشف الراتب)",
    description="Returns structured payslip data with complete breakdown of base earnings, headcount/session variable pay, bonuses, deductions, and voucher verification.",
)
def get_employee_payslip(
    payroll_item_id: int = Path(..., description="Target payroll item ID"),
    item_mgr: PayrollItemManager = Depends(get_item_mgr),
):
    payslip = item_mgr.get_payslip(payroll_item_id)
    if not payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payslip for payroll item #{payroll_item_id} not found.",
        )
    return {
        "document_title_ar": "كشف الراتب الشهري",
        "document_title_fr": "Bulletin de Paie Mensuel",
        "payslip": payslip,
    }
