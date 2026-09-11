"""
backend/apis/pricing_plans.py
-----------------------------
Multi-Tier Pricing Plans & Fee Computation REST Router.
Provides endpoints for:
  - Listing pricing matrices across branches, programs, and academic years
  - Viewing installment breakdowns and discount rules
  - Creating new pricing plans (Admin protected)
  - Updating fee amounts, discounts, and installment tranches (Admin protected)
  - Simulating net agreed tuition fees given enrollment parameters
  - Toggling active status and deleting pricing plans (Admin protected)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import Database, get_database, PricingManager, BranchManager, AcademicYearManager
from backend.apis.security import require_role

router = APIRouter(prefix="/pricing-plans", tags=["Pricing Plans"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class PricingPlanBase(BaseModel):
    branch_id: str = Field(..., description="Branch code (e.g. 'CENTER')", example="CENTER")
    academic_year_id: int = Field(..., description="Target academic cycle ID", example=2)
    plan_name: str = Field(..., description="Commercial plan title", example="خطة السوروبان القياسية - 4 دفعات")
    program_id: Optional[int] = Field(None, description="Linked educational program ID")
    level_id: Optional[int] = Field(None, description="Optional level specificity")
    standard_installment_price: float = Field(0.0, ge=0, description="Price per installment tranche (DZD)", example=3500.0)
    cash_discount: float = Field(500.0, ge=0, description="Deduction if paid in full upfront", example=500.0)
    sibling_discount: float = Field(500.0, ge=0, description="Discount for additional enrolled siblings", example=500.0)
    annual_prepaid_discount: float = Field(0.0, ge=0, description="Annual prepaid package incentive", example=1000.0)
    monthly_standard_rate: float = Field(0.0, ge=0, description="Recurring monthly rate (for daycare/quran)", example=0.0)
    registration_fee: float = Field(0.0, ge=0, description="One-time non-refundable registration fee", example=2000.0)
    installments_count: int = Field(4, ge=1, le=12, description="Total number of tranches across the cycle", example=4)
    notes: Optional[str] = Field(None, description="Administrative remarks")
    is_active: bool = Field(True, description="Operating status flag")


class PricingPlanCreate(PricingPlanBase):
    pass


class PricingPlanUpdate(BaseModel):
    branch_id: Optional[str] = None
    academic_year_id: Optional[int] = None
    plan_name: Optional[str] = None
    program_id: Optional[int] = None
    level_id: Optional[int] = None
    standard_installment_price: Optional[float] = Field(None, ge=0)
    cash_discount: Optional[float] = Field(None, ge=0)
    sibling_discount: Optional[float] = Field(None, ge=0)
    annual_prepaid_discount: Optional[float] = Field(None, ge=0)
    monthly_standard_rate: Optional[float] = Field(None, ge=0)
    registration_fee: Optional[float] = Field(None, ge=0)
    installments_count: Optional[int] = Field(None, ge=1, le=12)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class StatusToggleRequest(BaseModel):
    is_active: bool = Field(..., description="Active flag")


class PriceCalculationRequest(BaseModel):
    is_cash_upfront: bool = Field(False, description="Whether full amount is paid upfront in cash")
    is_sibling: bool = Field(False, description="Whether the student qualifies for sibling discount")
    is_annual_package: bool = Field(False, description="Whether enrolled in full annual package")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_pricing_mgr(db: Database = Depends(get_database)) -> PricingManager:
    return PricingManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_year_mgr(db: Database = Depends(get_database)) -> AcademicYearManager:
    return AcademicYearManager(db)


# =============================================================================
# ROUTE HANDLERS
# =============================================================================

@router.get(
    "",
    summary="List pricing plans",
    description="Lists pricing matrices across branches, programs, levels, and academic years.",
)
def list_pricing_plans(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    program_id: Optional[int] = Query(None, description="Filter by program ID"),
    level_id: Optional[int] = Query(None, description="Filter by level ID"),
    academic_year_id: Optional[int] = Query(None, description="Filter by academic year ID"),
    active_only: bool = Query(False, description="Filter active plans only"),
    mgr: PricingManager = Depends(get_pricing_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        program_id=program_id,
        level_id=level_id,
        academic_year_id=academic_year_id,
        active_only=active_only,
    )


@router.get(
    "/{pricing_plan_id}",
    summary="Get pricing plan details",
    description="Retrieves a single pricing plan record with relational program and cycle labels.",
)
def get_pricing_plan(
    pricing_plan_id: int = Path(..., description="Pricing Plan ID"),
    mgr: PricingManager = Depends(get_pricing_mgr),
):
    plan = mgr.get_by_id(pricing_plan_id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing plan ID {pricing_plan_id} not found.",
        )
    return plan


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Create pricing plan",
    description="Configures a new pricing model. Requires ADMIN or DIRECTOR role.",
    dependencies=[Depends(require_role("ADMIN", "DIRECTOR"))],
)
def create_pricing_plan(
    payload: PricingPlanCreate,
    mgr: PricingManager = Depends(get_pricing_mgr),
    b_mgr: BranchManager = Depends(get_branch_mgr),
    ay_mgr: AcademicYearManager = Depends(get_year_mgr),
):
    branch = b_mgr.get_by_id(payload.branch_id)
    if not branch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Branch '{payload.branch_id}' not found.")

    year = ay_mgr.get_by_id(payload.academic_year_id)
    if not year:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Academic year ID {payload.academic_year_id} not found.")

    created = mgr.create(
        branch_id=payload.branch_id,
        academic_year_id=payload.academic_year_id,
        plan_name=payload.plan_name,
        program_id=payload.program_id,
        level_id=payload.level_id,
        standard_installment_price=payload.standard_installment_price,
        cash_discount=payload.cash_discount,
        sibling_discount=payload.sibling_discount,
        annual_prepaid_discount=payload.annual_prepaid_discount,
        monthly_standard_rate=payload.monthly_standard_rate,
        registration_fee=payload.registration_fee,
        installments_count=payload.installments_count,
        notes=payload.notes,
        is_active=payload.is_active,
    )
    if not created:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create pricing plan.",
        )
    return created


@router.put(
    "/{pricing_plan_id}",
    summary="Update pricing plan",
    description="Updates tuition rates, discounts, or installment counts. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def update_pricing_plan(
    pricing_plan_id: int,
    payload: PricingPlanUpdate,
    mgr: PricingManager = Depends(get_pricing_mgr),
):
    existing = mgr.get_by_id(pricing_plan_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pricing plan ID {pricing_plan_id} not found.")

    success = mgr.update(pricing_plan_id, **payload.model_dump(exclude_unset=True))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed or no parameters modified.",
        )
    return mgr.get_by_id(pricing_plan_id)


@router.patch(
    "/{pricing_plan_id}/status",
    summary="Toggle pricing plan status",
    description="Enables or disables a pricing plan. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def toggle_pricing_plan_status(
    pricing_plan_id: int,
    payload: StatusToggleRequest,
    mgr: PricingManager = Depends(get_pricing_mgr),
):
    existing = mgr.get_by_id(pricing_plan_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pricing plan ID {pricing_plan_id} not found.")

    mgr.toggle_status(pricing_plan_id, payload.is_active)
    return {
        "pricing_plan_id": pricing_plan_id,
        "is_active": payload.is_active,
        "message": "Pricing plan status updated.",
    }


@router.post(
    "/{pricing_plan_id}/calculate",
    summary="Calculate effective tuition fee",
    description="Simulates the final agreed amount, discounts, and per-installment quotes given student eligibility.",
)
def calculate_tuition(
    pricing_plan_id: int,
    payload: PriceCalculationRequest,
    mgr: PricingManager = Depends(get_pricing_mgr),
):
    existing = mgr.get_by_id(pricing_plan_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pricing plan ID {pricing_plan_id} not found.")

    result = mgr.calculate_effective_price(
        pricing_plan_id=pricing_plan_id,
        is_cash_upfront=payload.is_cash_upfront,
        is_sibling=payload.is_sibling,
        is_annual_package=payload.is_annual_package,
    )
    return result


@router.delete(
    "/{pricing_plan_id}",
    summary="Delete pricing plan",
    description="Deletes a pricing plan. Requires ADMIN role.",
    dependencies=[Depends(require_role("ADMIN"))],
)
def delete_pricing_plan(
    pricing_plan_id: int,
    mgr: PricingManager = Depends(get_pricing_mgr),
):
    existing = mgr.get_by_id(pricing_plan_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Pricing plan ID {pricing_plan_id} not found.")

    success = mgr.delete(pricing_plan_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete pricing plan: referenced by student enrollments.",
        )
    return {"message": f"Pricing plan ID {pricing_plan_id} deleted successfully."}
