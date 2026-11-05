"""
backend/apis/finance.py
------------------------
Finance, Multi-Tier Fee Plans, Dynamic Price Overrides, Gapless Receipts,
Non-destructive Payment Voids, Cash Handovers & Arabic RTL Document Gateway.
"""

from typing import List, Optional, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Response
from pydantic import BaseModel, Field

from backend.database import Database, get_database, FinanceManager

router = APIRouter(prefix="/finance", tags=["Finance, Treasury & Receipts"])


# =============================================================================
# PYDANTIC SCHEMAS
# =============================================================================

class FeePlanCreate(BaseModel):
    branch_id: str = Field(..., example="RAWDA")
    plan_type: str = Field(..., example="KINDERGARTEN_MONTHLY", description="ACADEMY_LEVEL_UPFRONT, ACADEMY_LEVEL_INSTALLMENTS, KINDERGARTEN_MONTHLY, KINDERGARTEN_ANNUAL, ANNUAL_REGISTRATION")
    name_ar: str = Field(..., max_length=150, example="اشتراك الروضة الشهري")
    name_en: str = Field(..., max_length=150, example="Kindergarten Monthly Plan")
    base_amount: float = Field(..., ge=0, example=12000.0)
    discount_percentage: float = Field(0.0, ge=0.0, le=100.0, example=0.0)
    final_amount: Optional[float] = None
    installment_count: int = Field(1, ge=1, le=12, example=1)
    program_id: Optional[int] = None
    level_id: Optional[int] = None
    academic_year_id: Optional[int] = None
    notes: Optional[str] = None


class PriceOverrideCreate(BaseModel):
    invoice_id: int = Field(..., example=1)
    original_price: float = Field(..., ge=0, example=15000.0)
    overridden_price: float = Field(..., ge=0, example=12000.0)
    reason: str = Field(..., min_length=3, example="تخفيض اجتماعي معتمد من الإدارة العامة للأخ الثاني")
    authorized_by_employee_id: int = Field(..., example=1, description="Staff author authorizing the override")
    created_by_user_id: Optional[int] = None


class InstallmentSpec(BaseModel):
    due_date: date = Field(..., example="2026-11-01")
    amount: float = Field(..., gt=0, example=5000.0)
    notes: Optional[str] = None


class InvoiceWithInstallmentsCreate(BaseModel):
    branch_id: str = Field(..., example="RAWDA")
    enrollment_id: int = Field(..., example=1)
    total_amount: float = Field(..., gt=0, example=15000.0)
    installments: List[InstallmentSpec]
    period_label: Optional[str] = Field(None, example="2026-2027")
    notes: Optional[str] = None


class CashPaymentCreate(BaseModel):
    branch_id: str = Field(..., example="RAWDA")
    invoice_id: int = Field(..., example=1)
    amount: float = Field(..., gt=0, example=5000.0)
    collected_by_employee_id: Optional[int] = None
    register_id: Optional[int] = None
    payment_date: Optional[date] = None
    remarks: Optional[str] = Field(None, example="تسديد القسط الأول نقداً")


class PaymentVoidRequest(BaseModel):
    void_reason: str = Field(..., min_length=3, example="خطأ في إدخال المبلغ وسيتم إصدار وصل مصحح")
    voided_by_user_id: Optional[int] = None


class CashHandoverCreate(BaseModel):
    branch_id: str = Field(..., example="RAWDA")
    amount: float = Field(..., gt=0, example=50000.0)
    received_by_name: str = Field(..., example="سيد علي (المدير المالي)")
    recipient_type: str = Field("HEAD_OFFICE", example="HEAD_OFFICE", description="HEAD_OFFICE, OWNER, DIRECTOR")
    transferred_by_employee_id: Optional[int] = None
    register_id: Optional[int] = None
    receipt_voucher_no: Optional[str] = Field(None, example="REMIT-2026-001")
    notes: Optional[str] = None


# =============================================================================
# ENDPOINTS
# =============================================================================

# 1. Multi-Tier Fee Plans
@router.get("/fee-plans", summary="List Standard Fee Plans")
def get_fee_plans(
    branch_id: Optional[str] = Query(None),
    plan_type: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = FinanceManager(db)
    return mgr.get_fee_plans(branch_id=branch_id, plan_type=plan_type, is_active=is_active)


@router.post("/fee-plans", status_code=status.HTTP_201_CREATED, summary="Create or Update Fee Plan")
def create_fee_plan(payload: FeePlanCreate, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    try:
        res = mgr.create_fee_plan(
            branch_id=payload.branch_id,
            plan_type=payload.plan_type,
            name_ar=payload.name_ar,
            name_en=payload.name_en,
            base_amount=payload.base_amount,
            discount_percentage=payload.discount_percentage,
            final_amount=payload.final_amount,
            installment_count=payload.installment_count,
            program_id=payload.program_id,
            level_id=payload.level_id,
            academic_year_id=payload.academic_year_id,
            notes=payload.notes,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not create fee plan")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


# 2. Dynamic Price Overrides
@router.post("/price-overrides", status_code=status.HTTP_201_CREATED, summary="Record Dynamic Price Override (Reason Mandatory)")
def record_price_override(payload: PriceOverrideCreate, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    try:
        res = mgr.record_price_override(
            invoice_id=payload.invoice_id,
            original_price=payload.original_price,
            overridden_price=payload.overridden_price,
            reason=payload.reason,
            authorized_by_employee_id=payload.authorized_by_employee_id,
            created_by_user_id=payload.created_by_user_id,
        )
        if not res:
            raise HTTPException(status_code=400, detail="Could not record price override")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


@router.get("/price-overrides", summary="Query Price Overrides Audit Trail")
def get_price_overrides(
    invoice_id: Optional[int] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = FinanceManager(db)
    return mgr.get_price_overrides(invoice_id=invoice_id)


# 3. Invoices with Installments
@router.post("/invoices-with-installments", status_code=status.HTTP_201_CREATED, summary="Create Invoice with Installment Schedule")
def create_invoice_with_installments(
    payload: InvoiceWithInstallmentsCreate, db: Database = Depends(get_database)
):
    mgr = FinanceManager(db)
    res = mgr.create_invoice_with_installments(
        branch_id=payload.branch_id,
        enrollment_id=payload.enrollment_id,
        total_amount=payload.total_amount,
        installments=[i.dict() for i in payload.installments],
        period_label=payload.period_label,
        notes=payload.notes,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not create invoice with installments")
    return res


@router.get("/invoices/{invoice_id}/installments", summary="Get Installments for Invoice")
def get_invoice_installments(invoice_id: int, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    return mgr.get_invoice_installments(invoice_id)


# 4. Strictly Sequential Cash Receipts & Payments
@router.get("/receipts/next-number", summary="Get Next Sequential Gapless Receipt Number")
def get_next_receipt_number(
    branch_id: str = Query("RAWDA"),
    fiscal_year: Optional[int] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = FinanceManager(db)
    num = mgr.get_next_receipt_number(branch_id=branch_id, fiscal_year=fiscal_year)
    return {"branch_id": branch_id, "next_receipt_number": num}


@router.post("/payments/cash", status_code=status.HTTP_201_CREATED, summary="Record Cash Payment (Generates Gapless Receipt)")
def record_cash_payment(payload: CashPaymentCreate, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    res = mgr.record_cash_payment(
        branch_id=payload.branch_id,
        invoice_id=payload.invoice_id,
        amount=payload.amount,
        collected_by_employee_id=payload.collected_by_employee_id,
        register_id=payload.register_id,
        payment_date=payload.payment_date,
        remarks=payload.remarks,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not record cash payment")
    return res


# 5. Payment Voiding (Zero Deletes)
@router.post("/payments/{payment_id}/void", summary="Void Payment Receipt (Prohibits Hard Deletes)")
def void_payment(payment_id: int, payload: PaymentVoidRequest, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    try:
        res = mgr.void_payment(
            payment_id=payment_id,
            void_reason=payload.void_reason,
            voided_by_user_id=payload.voided_by_user_id,
        )
        if not res:
            raise HTTPException(status_code=404, detail="Payment not found")
        return res
    except ValueError as v_err:
        raise HTTPException(status_code=422, detail=str(v_err))


# 6. Cash Handovers
@router.post("/cash-handovers", status_code=status.HTTP_201_CREATED, summary="Record Cash Handover to Head Office / Owner")
def record_cash_handover(payload: CashHandoverCreate, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    res = mgr.record_cash_handover(
        branch_id=payload.branch_id,
        amount=payload.amount,
        received_by_name=payload.received_by_name,
        recipient_type=payload.recipient_type,
        transferred_by_employee_id=payload.transferred_by_employee_id,
        register_id=payload.register_id,
        receipt_voucher_no=payload.receipt_voucher_no,
        notes=payload.notes,
    )
    if not res:
        raise HTTPException(status_code=400, detail="Could not record cash handover")
    return res


@router.get("/cash-handovers", summary="List Cash Handovers")
def get_cash_handovers(branch_id: Optional[str] = Query(None), db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    return mgr.get_cash_handovers(branch_id=branch_id)


# 7. Daily Summary View
@router.get("/daily-summary", summary="Daily Treasury Summary (Income, Expenses, Handovers, Net Balance)")
def get_daily_summary(
    branch_id: str = Query("RAWDA"),
    summary_date: Optional[date] = Query(None),
    db: Database = Depends(get_database),
):
    mgr = FinanceManager(db)
    return mgr.get_daily_summary(branch_id=branch_id, summary_date=summary_date)


# 8. Arabic RTL Document Generators
@router.get("/invoices/{invoice_id}/rtl-html", summary="Generate Arabic RTL Invoice HTML")
def get_invoice_rtl_html(invoice_id: int, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    html_content = mgr.generate_arabic_rtl_invoice_html(invoice_id)
    return Response(content=html_content, media_type="text/html; charset=utf-8")


@router.get("/payments/{payment_id}/rtl-receipt-html", summary="Generate Arabic RTL Cash Receipt HTML")
def get_payment_rtl_receipt_html(payment_id: int, db: Database = Depends(get_database)):
    mgr = FinanceManager(db)
    html_content = mgr.generate_arabic_rtl_receipt_html(payment_id)
    return Response(content=html_content, media_type="text/html; charset=utf-8")
