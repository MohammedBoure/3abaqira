"""
backend/apis/kitchen.py
-----------------------
Daycare Cafeteria Procurement & Kitchen Logs REST Router.
Provides endpoints for:
  - Daily bread delivery logging, meal tracking, and bakery costs (سجل استهلاك الخبز اليومي)
  - Bulk food provisions orders across categories (vegetables, meat, dairy, dry goods)
  - Weekly distribution and expense voucher linkage
  - Executive cafeteria procurement KPI dashboards
"""

from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field

from backend.database import (
    Database,
    get_database,
    BranchManager,
    DailyBreadLogManager,
    ProvisionsOrderManager,
    KitchenProcurementManager,
    ExpenseManager,
)
from backend.apis.security import require_role

router = APIRouter(prefix="/kitchen", tags=["Daycare Kitchen & Cafeteria"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class DailyBreadLogCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", examples=["CENTER"])
    log_date: Optional[date] = Field(None, description="Delivery date (defaults to today)")
    scheduled_meal: str = Field(..., max_length=100, description="Meal allocation (e.g. الغداء / Lunch)", examples=["الغداء"])
    loaf_count: int = Field(..., ge=0, description="Quantity of loaves / baguettes delivered", examples=[45])
    unit_price: float = Field(15.00, ge=0, description="Price per loaf in DZD", examples=[15.0])
    day_of_week: Optional[str] = Field(None, max_length=20, description="Day of week (auto-derived if omitted)", examples=["الأربعاء"])
    supplier_name: Optional[str] = Field(None, max_length=100, description="Bakery / supplier name", examples=["مخبزة النور"])
    remarks: Optional[str] = Field(None, description="Additional notes or meal observations")


class DailyBreadLogUpdate(BaseModel):
    scheduled_meal: Optional[str] = None
    loaf_count: Optional[int] = Field(None, ge=0)
    unit_price: Optional[float] = Field(None, ge=0)
    supplier_name: Optional[str] = None
    remarks: Optional[str] = None


class ProvisionsOrderCreate(BaseModel):
    branch_id: str = Field(..., description="Target branch ID", examples=["CENTER"])
    order_date: Optional[date] = Field(None, description="Purchase date (defaults to today)")
    order_month: Optional[str] = Field(None, max_length=7, description="Month period code (YYYY-MM, auto-derived if omitted)", examples=["2025-09"])
    week_number: Optional[int] = Field(None, ge=1, le=5, description="Week number within month (1-5, auto-derived if omitted)", examples=[1])
    item_category: str = Field(..., max_length=100, description="Food provision category", examples=["خضر وفواكه"])
    quantity: float = Field(..., gt=0, description="Quantity purchased", examples=[25.5])
    unit_measure: str = Field("Kg", description="Kg, Piece, Tray, Bottle, Pack, Box, Liter", examples=["Kg"])
    unit_price: float = Field(..., ge=0, description="Unit price in DZD", examples=[120.0])
    supplier_name: Optional[str] = Field(None, max_length=100, description="Vendor / market supplier name", examples=["سوق الجملة للخضر"])
    expense_id: Optional[int] = Field(None, description="Linked operational expense voucher ID")
    auto_create_expense: bool = Field(False, description="If True, automatically log a matching operational expense")
    expense_payment_method: str = Field("CASH", description="Payment method for auto-created expense: CASH, CHECK, etc.", examples=["CASH"])
    notes: Optional[str] = Field(None, description="Procurement remarks or batch specifications")


class ProvisionsOrderUpdate(BaseModel):
    item_category: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    unit_measure: Optional[str] = None
    unit_price: Optional[float] = Field(None, ge=0)
    supplier_name: Optional[str] = None
    expense_id: Optional[int] = None
    notes: Optional[str] = None


class LinkExpenseRequest(BaseModel):
    expense_id: Optional[int] = Field(None, description="Operational expense ID to link, or null to unlink")


# =============================================================================
# DEPENDENCY PROVIDERS
# =============================================================================

def get_kitchen_mgr(db: Database = Depends(get_database)) -> KitchenProcurementManager:
    return KitchenProcurementManager(db)


def get_bread_mgr(db: Database = Depends(get_database)) -> DailyBreadLogManager:
    return DailyBreadLogManager(db)


def get_provisions_mgr(db: Database = Depends(get_database)) -> ProvisionsOrderManager:
    return ProvisionsOrderManager(db)


def get_branch_mgr(db: Database = Depends(get_database)) -> BranchManager:
    return BranchManager(db)


def get_expense_mgr(db: Database = Depends(get_database)) -> ExpenseManager:
    return ExpenseManager(db)


# =============================================================================
# DAILY BREAD LOGS ROUTE HANDLERS
# =============================================================================

@router.get(
    "/bread-logs",
    summary="List daily bread delivery logs",
    description="Retrieves bread logs filtered by branch, date range, and bakery supplier.",
)
def list_bread_logs(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    date_from: Optional[date] = Query(None, description="Filter logs starting from this date"),
    date_to: Optional[date] = Query(None, description="Filter logs up to this date"),
    supplier_name: Optional[str] = Query(None, description="Filter by bakery supplier name"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: DailyBreadLogManager = Depends(get_bread_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        date_from=date_from,
        date_to=date_to,
        supplier_name=supplier_name,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/bread-logs/summary/monthly",
    summary="Get monthly bread consumption summary",
    description="Aggregates monthly bread count, total bakery cost, daily averages, and meal breakdown.",
)
def get_bread_monthly_summary(
    branch_id: str = Query(..., description="Target branch ID", examples=["CENTER"]),
    month_code: Optional[str] = Query(None, description="Target month code (YYYY-MM)", examples=["2025-09"]),
    mgr: DailyBreadLogManager = Depends(get_bread_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
):
    if not branch_mgr.get_by_id(branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    return mgr.get_monthly_summary(branch_id=branch_id, month_code=month_code)


@router.get(
    "/bread-logs/{bread_log_id}",
    summary="Get bread log details",
    description="Retrieves single daily bread delivery record by ID.",
)
def get_bread_log(
    bread_log_id: int = Path(..., description="Bread log ID"),
    mgr: DailyBreadLogManager = Depends(get_bread_mgr),
):
    record = mgr.get_by_id(bread_log_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bread log ID {bread_log_id} not found.",
        )
    return record


@router.post(
    "/bread-logs",
    status_code=status.HTTP_201_CREATED,
    summary="Record daily bread delivery",
    description="Logs daily bread delivery with automatic day of the week calculation and unit price handling.",
)
def create_bread_log(
    payload: DailyBreadLogCreate,
    mgr: DailyBreadLogManager = Depends(get_bread_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    target_date = payload.log_date or date.today()
    existing = mgr.get_by_date(payload.branch_id, target_date)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A bread log already exists for branch '{payload.branch_id}' on {target_date}.",
        )

    created = mgr.create(
        branch_id=payload.branch_id,
        log_date=target_date,
        scheduled_meal=payload.scheduled_meal,
        loaf_count=payload.loaf_count,
        unit_price=payload.unit_price,
        day_of_week=payload.day_of_week,
        supplier_name=payload.supplier_name,
        remarks=payload.remarks,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to record daily bread log.",
        )
    return created


@router.put(
    "/bread-logs/{bread_log_id}",
    summary="Update bread log",
    description="Modifies loaf count, meal, unit price, or supplier for an existing delivery log.",
)
def update_bread_log(
    payload: DailyBreadLogUpdate,
    bread_log_id: int = Path(..., description="Bread log ID"),
    mgr: DailyBreadLogManager = Depends(get_bread_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF")),
):
    existing = mgr.get_by_id(bread_log_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bread log ID {bread_log_id} not found.",
        )

    updated = mgr.update(
        bread_log_id=bread_log_id,
        scheduled_meal=payload.scheduled_meal,
        loaf_count=payload.loaf_count,
        unit_price=payload.unit_price,
        supplier_name=payload.supplier_name,
        remarks=payload.remarks,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update bread log.",
        )
    return updated


@router.delete(
    "/bread-logs/{bread_log_id}",
    summary="Delete bread log",
    description="Deletes daily bread delivery entry.",
)
def delete_bread_log(
    bread_log_id: int = Path(..., description="Bread log ID"),
    mgr: DailyBreadLogManager = Depends(get_bread_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR")),
):
    existing = mgr.get_by_id(bread_log_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bread log ID {bread_log_id} not found.",
        )

    deleted = mgr.delete(bread_log_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete bread log.",
        )
    return {"message": f"Bread log ID {bread_log_id} deleted successfully."}


# =============================================================================
# FOOD PROVISIONS ORDERS ROUTE HANDLERS
# =============================================================================

@router.get(
    "/provisions",
    summary="List food provisions orders",
    description="Retrieves provisions orders filtered by branch, month, week number, category, or supplier.",
)
def list_provisions_orders(
    branch_id: Optional[str] = Query(None, description="Filter by branch ID"),
    order_month: Optional[str] = Query(None, description="Filter by order month (YYYY-MM)", examples=["2025-09"]),
    week_number: Optional[int] = Query(None, ge=1, le=5, description="Filter by week number (1-5)"),
    item_category: Optional[str] = Query(None, description="Filter by category (e.g. خضر وفواكه)"),
    supplier_name: Optional[str] = Query(None, description="Filter by supplier name"),
    has_expense: Optional[bool] = Query(None, description="Filter orders by whether linked to an expense voucher"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
):
    return mgr.get_all(
        branch_id=branch_id,
        order_month=order_month,
        week_number=week_number,
        item_category=item_category,
        supplier_name=supplier_name,
        has_expense=has_expense,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/provisions/summary/monthly",
    summary="Get monthly provisions procurement summary",
    description="Returns aggregate expenditure across food categories and weekly trends (Week 1 through 5).",
)
def get_provisions_monthly_summary(
    branch_id: str = Query(..., description="Target branch ID", examples=["CENTER"]),
    order_month: Optional[str] = Query(None, description="Target month code (YYYY-MM)", examples=["2025-09"]),
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
):
    if not branch_mgr.get_by_id(branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    return mgr.get_monthly_summary(branch_id=branch_id, order_month=order_month)


@router.get(
    "/provisions/{order_id}",
    summary="Get provisions order details",
    description="Retrieves single food provisions order record with joined expense voucher info.",
)
def get_provisions_order(
    order_id: int = Path(..., description="Order ID"),
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
):
    record = mgr.get_by_id(order_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provisions order ID {order_id} not found.",
        )
    return record


@router.post(
    "/provisions",
    status_code=status.HTTP_201_CREATED,
    summary="Create food provisions order",
    description="Creates food provisions order with auto week/month calculation and optional automatic operational expense logging.",
)
def create_provisions_order(
    payload: ProvisionsOrderCreate,
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
    exp_mgr: ExpenseManager = Depends(get_expense_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF")),
):
    if not branch_mgr.get_by_id(payload.branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{payload.branch_id}' not found.",
        )

    target_date = payload.order_date or date.today()
    linked_expense_id = payload.expense_id

    # If requested and no expense_id supplied, auto-log an operational expense
    if payload.auto_create_expense and not linked_expense_id:
        # Find or use first active cafeteria-related category for branch
        cafe_cats = exp_mgr.categories.get_all(
            branch_id=payload.branch_id,
            is_cafeteria_related=True,
            is_active=True,
        )
        cat_id = cafe_cats[0]["category_id"] if cafe_cats else None

        if not cat_id:
            # Fallback to any active category
            all_cats = exp_mgr.categories.get_all(branch_id=payload.branch_id, is_active=True)
            cat_id = all_cats[0]["category_id"] if all_cats else None

        if cat_id:
            total_cost = round(payload.quantity * payload.unit_price, 2)
            exp_record = exp_mgr.record_expense(
                branch_id=payload.branch_id,
                category_id=cat_id,
                description=f"طلبية تموين مطبخ: {payload.item_category} ({payload.quantity} {payload.unit_measure})",
                amount=total_cost,
                payment_method=payload.expense_payment_method,
                expense_date=target_date,
                paid_to=payload.supplier_name,
                notes=payload.notes,
            )
            if exp_record:
                linked_expense_id = exp_record.get("expense_id")

    created = mgr.create(
        branch_id=payload.branch_id,
        order_date=target_date,
        item_category=payload.item_category,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        unit_measure=payload.unit_measure,
        order_month=payload.order_month,
        week_number=payload.week_number,
        supplier_name=payload.supplier_name,
        expense_id=linked_expense_id,
        notes=payload.notes,
    )

    if not created:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create provisions order.",
        )
    return created


@router.put(
    "/provisions/{order_id}",
    summary="Update provisions order",
    description="Modifies quantity, unit price, category, supplier, or notes of an existing order.",
)
def update_provisions_order(
    payload: ProvisionsOrderUpdate,
    order_id: int = Path(..., description="Order ID"),
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR", "STAFF")),
):
    existing = mgr.get_by_id(order_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provisions order ID {order_id} not found.",
        )

    updated = mgr.update(
        order_id=order_id,
        item_category=payload.item_category,
        quantity=payload.quantity,
        unit_measure=payload.unit_measure,
        unit_price=payload.unit_price,
        supplier_name=payload.supplier_name,
        expense_id=payload.expense_id,
        notes=payload.notes,
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update provisions order.",
        )
    return updated


@router.delete(
    "/provisions/{order_id}",
    summary="Delete provisions order",
    description="Deletes a food provisions order record.",
)
def delete_provisions_order(
    order_id: int = Path(..., description="Order ID"),
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "DIRECTOR")),
):
    existing = mgr.get_by_id(order_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provisions order ID {order_id} not found.",
        )

    deleted = mgr.delete(order_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete provisions order.",
        )
    return {"message": f"Provisions order ID {order_id} deleted successfully."}


@router.post(
    "/provisions/{order_id}/link-expense",
    summary="Link provisions order to expense voucher",
    description="Associates or unlinks an order with an operational expense record.",
)
def link_order_expense(
    payload: LinkExpenseRequest,
    order_id: int = Path(..., description="Order ID"),
    mgr: ProvisionsOrderManager = Depends(get_provisions_mgr),
    current_user: dict = Depends(require_role("SUPER_ADMIN", "ADMIN", "ACCOUNTANT")),
):
    existing = mgr.get_by_id(order_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provisions order ID {order_id} not found.",
        )

    success = mgr.link_expense(order_id, payload.expense_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to link order ID {order_id} to expense ID {payload.expense_id}.",
        )
    return {
        "message": f"Successfully updated expense link for order ID {order_id}.",
        "order_id": order_id,
        "expense_id": payload.expense_id,
    }


# =============================================================================
# EXECUTIVE DASHBOARD ROUTE HANDLERS
# =============================================================================

@router.get(
    "/dashboard",
    summary="Get cafeteria procurement dashboard",
    description="Consolidated overview combining bread consumption, food orders, and overall kitchen expenditure for a given month.",
)
def get_cafeteria_dashboard(
    branch_id: str = Query(..., description="Target branch ID", examples=["CENTER"]),
    month_code: Optional[str] = Query(None, description="Month code (YYYY-MM)", examples=["2025-09"]),
    mgr: KitchenProcurementManager = Depends(get_kitchen_mgr),
    branch_mgr: BranchManager = Depends(get_branch_mgr),
):
    if not branch_mgr.get_by_id(branch_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Branch '{branch_id}' not found.",
        )
    return mgr.get_cafeteria_dashboard(branch_id=branch_id, month_code=month_code)
