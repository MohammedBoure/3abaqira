"""
backend/database/finance_manager.py
------------------------------------
Data Access Manager for the Complete Enterprise Finance & Treasury Architecture.
Encapsulates:
  - Multi-tier fee plans (Academy upfront/installments, Kindergarten monthly/annual discount, registration fees)
  - Dynamic price overrides with mandatory justification and staff author tracking
  - Invoices with structured installment schedules
  - Strictly sequential gapless cash receipts per branch and fiscal year
  - Payment voiding with reason audit (strict prevention of database deletes)
  - Cash box operational expense categorization and handovers to head office / owner
  - Real-time daily treasury summary (income, expenses, handovers, net daily balance)
  - Arabic RTL print document generators for invoices and receipt vouchers
"""

import logging
from datetime import datetime, date
from typing import List, Dict, Optional, Any

logger = logging.getLogger("ABAQIRA_SYS")


def _dict_fetchone(cursor) -> Optional[Dict[str, Any]]:
    row = cursor.fetchone()
    if not row:
        return None
    if isinstance(row, dict):
        return row
    cols = [col[0] for col in cursor.description]
    return dict(zip(cols, row))


def _dict_fetchall(cursor) -> List[Dict[str, Any]]:
    rows = cursor.fetchall()
    if not rows:
        return []
    if rows and isinstance(rows[0], dict):
        return rows
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


VALID_PLAN_TYPES = {
    "ACADEMY_LEVEL_UPFRONT",
    "ACADEMY_LEVEL_INSTALLMENTS",
    "KINDERGARTEN_MONTHLY",
    "KINDERGARTEN_ANNUAL",
    "ANNUAL_REGISTRATION",
}


class FinanceManager:
    """
    Central database manager for Fee Plans, Invoices, Installments, Sequential Receipts,
    Void Audits, Cash Box Registers, Handovers and Arabic RTL Reports.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # 1. Multi-Tier Fee Plans
    # =========================================================================
    def get_fee_plans(
        self,
        branch_id: Optional[str] = None,
        plan_type: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves active fee plans."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM fin_fee_plan WHERE 1=1"
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip().upper())
                if plan_type:
                    query += " AND plan_type = %s"
                    params.append(plan_type.upper())
                if is_active is not None:
                    query += " AND is_active = %s"
                    params.append(is_active)
                query += " ORDER BY branch_id ASC, plan_type ASC, fee_plan_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching fee plans: {e}")
            return []

    def create_fee_plan(
        self,
        branch_id: str,
        plan_type: str,
        name_ar: str,
        name_en: str,
        base_amount: float,
        discount_percentage: float = 0.0,
        final_amount: Optional[float] = None,
        installment_count: int = 1,
        program_id: Optional[int] = None,
        level_id: Optional[int] = None,
        academic_year_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a standardized fee plan."""
        clean_type = plan_type.upper()
        if clean_type not in VALID_PLAN_TYPES:
            raise ValueError(f"Invalid plan_type '{plan_type}'. Must be one of {VALID_PLAN_TYPES}")

        calc_final = final_amount if final_amount is not None else round(base_amount * (1.0 - (discount_percentage / 100.0)), 2)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO fin_fee_plan (
                        branch_id, program_id, level_id, academic_year_id, plan_type,
                        name_ar, name_en, base_amount, discount_percentage, final_amount,
                        installment_count, notes, is_active
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                    ON CONFLICT (branch_id, plan_type) DO UPDATE
                    SET base_amount = EXCLUDED.base_amount,
                        discount_percentage = EXCLUDED.discount_percentage,
                        final_amount = EXCLUDED.final_amount,
                        installment_count = EXCLUDED.installment_count,
                        name_ar = EXCLUDED.name_ar,
                        name_en = EXCLUDED.name_en,
                        notes = EXCLUDED.notes
                    RETURNING *;
                    """,
                    (
                        branch_id.strip().upper(),
                        program_id,
                        level_id,
                        academic_year_id,
                        clean_type,
                        name_ar.strip(),
                        name_en.strip(),
                        base_amount,
                        discount_percentage,
                        calc_final,
                        installment_count,
                        notes,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error creating fee plan: {e}")
            return None

    # =========================================================================
    # 2. Strictly Sequential Gapless Receipt Generator
    # =========================================================================
    def get_next_receipt_number(self, branch_id: str, fiscal_year: Optional[int] = None) -> str:
        """
        Generates the next gapless, branch-specific sequential cash receipt voucher number.
        Format: REC-{BRANCH}-{YEAR}-{SEQ:05d} (e.g. REC-CENTER-2026-00001).
        Thread-safe and atomic across transactions.
        """
        clean_branch = branch_id.strip().upper()
        year = fiscal_year if fiscal_year else datetime.now().year

        with self.db.get_db_connection() as conn:
            cursor = conn.cursor()
            # Ensure row exists in fin_receipt_sequence
            cursor.execute(
                """
                INSERT INTO fin_receipt_sequence (branch_id, fiscal_year, last_sequence_number, updated_at)
                VALUES (%s, %s, 0, CURRENT_TIMESTAMP)
                ON CONFLICT (branch_id, fiscal_year) DO NOTHING;
                """,
                (clean_branch, year),
            )
            # Atomically increment
            cursor.execute(
                """
                UPDATE fin_receipt_sequence
                SET last_sequence_number = last_sequence_number + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE branch_id = %s AND fiscal_year = %s
                RETURNING last_sequence_number;
                """,
                (clean_branch, year),
            )
            row = cursor.fetchone()
            seq_num = row[0] if row and not isinstance(row, dict) else (row["last_sequence_number"] if row else 1)
            conn.commit()
            return f"REC-{clean_branch}-{year}-{seq_num:05d}"

    # =========================================================================
    # 3. Dynamic Price Override Tracking
    # =========================================================================
    def record_price_override(
        self,
        invoice_id: int,
        original_price: float,
        overridden_price: float,
        reason: str,
        authorized_by_employee_id: int,
        created_by_user_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records a receptionist / administrative dynamic discount override.
        RULE ENFORCEMENT:
          - 'reason' is strictly mandatory and cannot be empty.
          - 'authorized_by_employee_id' is strictly mandatory and cannot be null.
        """
        clean_reason = reason.strip() if reason else ""
        if not clean_reason:
            raise ValueError("Dynamic price override requires a non-empty, mandatory explanation reason.")
        if not authorized_by_employee_id:
            raise ValueError("Dynamic price override requires a valid authorizing staff employee ID.")

        diff = round(float(original_price) - float(overridden_price), 2)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO fin_price_override (
                        invoice_id, original_price, overridden_price, difference_amount,
                        reason, authorized_by_employee_id, created_by_user_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        invoice_id,
                        original_price,
                        overridden_price,
                        diff,
                        clean_reason,
                        authorized_by_employee_id,
                        created_by_user_id,
                    ),
                )
                override_rec = _dict_fetchone(cursor)

                # Update invoice amount_due to reflect overridden price
                cursor.execute(
                    """
                    UPDATE invoices
                    SET amount_due = %s,
                        notes = COALESCE(notes, '') || ' [Price Override: ' || %s || ' DZD by Staff #' || %s || ']'
                    WHERE invoice_id = %s;
                    """,
                    (overridden_price, diff, authorized_by_employee_id, invoice_id),
                )

                conn.commit()
                return override_rec
        except Exception as e:
            logger.error(f"Error recording price override for invoice {invoice_id}: {e}")
            raise

    def get_price_overrides(self, invoice_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Retrieves price override audits."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        po.*,
                        e.full_name AS authorized_by_name,
                        e.role AS authorizing_staff_role
                    FROM fin_price_override po
                    JOIN employees e ON po.authorized_by_employee_id = e.employee_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if invoice_id is not None:
                    query += " AND po.invoice_id = %s"
                    params.append(invoice_id)
                query += " ORDER BY po.created_at DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching price overrides: {e}")
            return []

    # =========================================================================
    # 4. Invoices with Installment Schedules
    # =========================================================================
    def create_invoice_with_installments(
        self,
        branch_id: str,
        enrollment_id: int,
        total_amount: float,
        installments: List[Dict[str, Any]],
        period_label: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates an invoice linked to an enrollment and establishes its installment schedule.
        Upfront payment = 1 installment; split payment = multiple installments.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                # 1. Create main invoice record
                cursor.execute(
                    """
                    INSERT INTO invoices (
                        enrollment_id, installment_number, period_label,
                        due_date, amount_due, amount_paid, status, notes
                    ) VALUES (%s, %s, %s, %s, %s, 0.00, 'UNPAID', %s)
                    RETURNING *;
                    """,
                    (
                        enrollment_id,
                        1,
                        period_label if period_label else f"{datetime.now().year}-{datetime.now().month:02d}",
                        installments[0].get("due_date", date.today()) if installments else date.today(),
                        total_amount,
                        notes,
                    ),
                )
                inv = _dict_fetchone(cursor)
                invoice_id = inv["invoice_id"]

                # 2. Insert installments schedule into fin_installment
                created_installments = []
                for idx, inst in enumerate(installments, start=1):
                    cursor.execute(
                        """
                        INSERT INTO fin_installment (
                            invoice_id, installment_number, due_date,
                            amount_due, amount_paid, status, notes
                        ) VALUES (%s, %s, %s, %s, 0.00, 'PENDING', %s)
                        RETURNING *;
                        """,
                        (
                            invoice_id,
                            idx,
                            inst.get("due_date", date.today()),
                            inst.get("amount", round(total_amount / len(installments), 2)),
                            inst.get("notes"),
                        ),
                    )
                    created_installments.append(_dict_fetchone(cursor))

                conn.commit()
                inv["installments"] = created_installments
                return inv
        except Exception as e:
            logger.error(f"Error creating invoice with installments: {e}")
            return None

    def get_invoice_installments(self, invoice_id: int) -> List[Dict[str, Any]]:
        """Retrieves installment schedule for an invoice."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM fin_installment WHERE invoice_id = %s ORDER BY installment_number ASC;",
                    (invoice_id,),
                )
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching installments for invoice {invoice_id}: {e}")
            return []

    # =========================================================================
    # 5. Cash Payments & Payment Voiding (Zero Deletes)
    # =========================================================================
    def record_cash_payment(
        self,
        branch_id: str,
        invoice_id: int,
        amount: float,
        collected_by_employee_id: Optional[int] = None,
        register_id: Optional[int] = None,
        payment_date: Optional[Any] = None,
        remarks: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records a cash payment receipt with gapless sequential receipt number.
        Synchronizes target invoice amount_paid & active cash register total_revenues.
        """
        p_date = payment_date if payment_date else date.today()
        year = p_date.year if hasattr(p_date, "year") else datetime.now().year

        try:
            receipt_num = self.get_next_receipt_number(branch_id, fiscal_year=year)
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # If register_id not supplied, locate or create today's open register
                active_reg_id = register_id
                if not active_reg_id:
                    cursor.execute(
                        """
                        SELECT register_id FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date = %s AND is_closed = FALSE;
                        """,
                        (branch_id.strip().upper(), p_date),
                    )
                    r_row = cursor.fetchone()
                    if r_row:
                        active_reg_id = r_row[0] if not isinstance(r_row, dict) else r_row["register_id"]
                    else:
                        cursor.execute(
                            """
                            INSERT INTO daily_cash_registers (branch_id, register_date, opening_balance)
                            VALUES (%s, %s, 0.00)
                            ON CONFLICT (branch_id, register_date) DO UPDATE
                            SET updated_at = CURRENT_TIMESTAMP
                            RETURNING register_id;
                            """,
                            (branch_id.strip().upper(), p_date),
                        )
                        new_r = cursor.fetchone()
                        active_reg_id = new_r[0] if not isinstance(new_r, dict) else new_r["register_id"]

                # 1. Insert Payment Record
                cursor.execute(
                    """
                    INSERT INTO payments (
                        branch_id, invoice_id, register_id, receipt_number, payment_date,
                        amount, payment_method, collected_by_employee_id, remarks, is_voided
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'CASH', %s, %s, FALSE)
                    RETURNING *;
                    """,
                    (
                        branch_id.strip().upper(),
                        invoice_id,
                        active_reg_id,
                        receipt_num,
                        p_date,
                        amount,
                        collected_by_employee_id,
                        remarks,
                    ),
                )
                payment_rec = _dict_fetchone(cursor)

                # 2. Update Invoice amount_paid and status
                cursor.execute(
                    "SELECT amount_due, amount_paid FROM invoices WHERE invoice_id = %s;",
                    (invoice_id,),
                )
                inv_row = cursor.fetchone()
                if inv_row:
                    due = float(inv_row[0] if not isinstance(inv_row, dict) else inv_row["amount_due"])
                    curr_paid = float(inv_row[1] if not isinstance(inv_row, dict) else inv_row["amount_paid"])
                    new_paid = curr_paid + float(amount)
                    st = "PAID" if new_paid >= due else "PARTIALLY_PAID"
                    cursor.execute(
                        "UPDATE invoices SET amount_paid = %s, status = %s WHERE invoice_id = %s;",
                        (new_paid, st, invoice_id),
                    )

                # 3. Update Register Revenues
                if active_reg_id:
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_revenues = total_revenues + %s, updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (amount, active_reg_id),
                    )

                conn.commit()
                return payment_rec
        except Exception as e:
            logger.error(f"Error recording cash payment: {e}")
            return None

    def void_payment(
        self, payment_id: int, void_reason: str, voided_by_user_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Strict non-destructive payment voiding.
        RULE ENFORCEMENT:
          - Hard deletes are strictly forbidden.
          - Voiding requires an explicit, audited reason.
          - Marks is_voided = TRUE, reverses invoice amount_paid, and decrements register total_revenues.
        """
        clean_reason = void_reason.strip() if void_reason else ""
        if not clean_reason:
            raise ValueError("Voiding a payment requires a mandatory explanation reason.")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                # 1. Fetch current payment details
                cursor.execute(
                    "SELECT * FROM payments WHERE payment_id = %s;",
                    (payment_id,),
                )
                pay = _dict_fetchone(cursor)
                if not pay:
                    logger.warning(f"Payment {payment_id} not found.")
                    return None
                if pay.get("is_voided"):
                    logger.warning(f"Payment {payment_id} has already been voided.")
                    return pay

                invoice_id = pay["invoice_id"]
                register_id = pay.get("register_id")
                amount = float(pay["amount"])

                # 2. Mark payment voided (no delete!)
                cursor.execute(
                    """
                    UPDATE payments
                    SET is_voided = TRUE,
                        void_reason = %s,
                        voided_by_user_id = %s,
                        voided_at = CURRENT_TIMESTAMP
                    WHERE payment_id = %s
                    RETURNING *;
                    """,
                    (clean_reason, voided_by_user_id, payment_id),
                )
                voided_rec = _dict_fetchone(cursor)

                # 3. Adjust Invoice amount_paid backwards
                cursor.execute(
                    "SELECT amount_due, amount_paid FROM invoices WHERE invoice_id = %s;",
                    (invoice_id,),
                )
                inv_row = cursor.fetchone()
                if inv_row:
                    due = float(inv_row[0] if not isinstance(inv_row, dict) else inv_row["amount_due"])
                    current_paid = float(inv_row[1] if not isinstance(inv_row, dict) else inv_row["amount_paid"])
                    reverted_paid = max(0.0, current_paid - amount)
                    st = "UNPAID" if reverted_paid <= 0 else ("PAID" if reverted_paid >= due else "PARTIALLY_PAID")
                    cursor.execute(
                        "UPDATE invoices SET amount_paid = %s, status = %s WHERE invoice_id = %s;",
                        (reverted_paid, st, invoice_id),
                    )

                # 4. Decrement register revenues
                if register_id:
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_revenues = GREATEST(0.00, total_revenues - %s), updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (amount, register_id),
                    )

                conn.commit()
                return voided_rec
        except Exception as e:
            logger.error(f"Error voiding payment {payment_id}: {e}")
            raise

    # =========================================================================
    # 6. Cash Box Expenses & Handovers to Head Office / Owner
    # =========================================================================
    def record_cash_handover(
        self,
        branch_id: str,
        amount: float,
        received_by_name: str,
        recipient_type: str = "HEAD_OFFICE",
        transferred_by_employee_id: Optional[int] = None,
        register_id: Optional[int] = None,
        receipt_voucher_no: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Records a cash handover to owner or head office."""
        clean_branch = branch_id.strip().upper()
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                active_reg_id = register_id
                if not active_reg_id:
                    cursor.execute(
                        """
                        SELECT register_id FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date = CURRENT_DATE AND is_closed = FALSE;
                        """,
                        (clean_branch,),
                    )
                    r_row = cursor.fetchone()
                    if r_row:
                        active_reg_id = r_row[0] if not isinstance(r_row, dict) else r_row["register_id"]

                cursor.execute(
                    """
                    INSERT INTO cash_handovers (
                        branch_id, register_id, handover_date, receipt_voucher_no,
                        amount, transferred_by_employee_id, received_by_name, status, notes
                    ) VALUES (%s, %s, CURRENT_DATE, %s, %s, %s, %s, 'CONFIRMED', %s)
                    RETURNING *;
                    """,
                    (
                        clean_branch,
                        active_reg_id,
                        receipt_voucher_no,
                        amount,
                        transferred_by_employee_id,
                        received_by_name.strip(),
                        notes,
                    ),
                )
                handover_rec = _dict_fetchone(cursor)

                if active_reg_id:
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_remitted = total_remitted + %s, updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (amount, active_reg_id),
                    )

                conn.commit()
                return handover_rec
        except Exception as e:
            logger.error(f"Error recording cash handover: {e}")
            return None

    def get_cash_handovers(self, branch_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves cash handovers history."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM cash_handovers WHERE 1=1"
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip().upper())
                query += " ORDER BY handover_date DESC, handover_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching handovers: {e}")
            return []

    # =========================================================================
    # 7. Daily Summary View (Live Treasury Balance)
    # =========================================================================
    def get_daily_summary(self, branch_id: str, summary_date: Optional[Any] = None) -> Dict[str, Any]:
        """
        Consolidates daily treasury view:
        Opening Balance + Total Revenues - Total Expenses - Total Handovers = Net Running Balance.
        """
        clean_branch = branch_id.strip().upper()
        s_date = summary_date if summary_date else date.today()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT * FROM v_daily_cash_summary
                    WHERE branch_id = %s AND summary_date = %s;
                    """,
                    (clean_branch, s_date),
                )
                summary = _dict_fetchone(cursor)
                if not summary:
                    return {
                        "branch_id": clean_branch,
                        "summary_date": str(s_date),
                        "opening_balance": 0.0,
                        "total_income": 0.0,
                        "total_expenses": 0.0,
                        "total_handovers": 0.0,
                        "net_balance": 0.0,
                        "is_closed": False,
                    }
                return summary
        except Exception as e:
            logger.error(f"Error fetching daily summary: {e}")
            return {
                "branch_id": clean_branch,
                "summary_date": str(s_date),
                "opening_balance": 0.0,
                "total_income": 0.0,
                "total_expenses": 0.0,
                "total_handovers": 0.0,
                "net_balance": 0.0,
                "is_closed": False,
            }

    # =========================================================================
    # 8. Arabic RTL Document Generators (Invoice & Receipt)
    # =========================================================================
    def generate_arabic_rtl_invoice_html(self, invoice_id: int) -> str:
        """
        Generates production-ready Arabic Right-to-Left (RTL) HTML for printing invoices.
        Supports standard print stylesheets and DZD currency format.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT 
                        inv.*,
                        s.full_name_ar AS student_name_ar,
                        s.student_code,
                        b.name_ar AS branch_name_ar,
                        b.phone AS branch_phone,
                        b.address AS branch_address
                    FROM invoices inv
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN branches b ON p.branch_id = b.branch_id
                    WHERE inv.invoice_id = %s;
                    """,
                    (invoice_id,),
                )
                inv = _dict_fetchone(cursor)
                if not inv:
                    return "<html><body dir='rtl'><h1>الفاتورة غير موجودة</h1></body></html>"

                cursor.execute(
                    "SELECT * FROM fin_installment WHERE invoice_id = %s ORDER BY installment_number ASC;",
                    (invoice_id,),
                )
                installments = _dict_fetchall(cursor)

            inst_rows = "".join(
                f"<tr><td>القسط {i['installment_number']}</td><td>{i['due_date']}</td><td>{float(i['amount_due']):,.2f} د.ج</td><td>{float(i['amount_paid']):,.2f} د.ج</td><td>{i['status']}</td></tr>"
                for i in installments
            ) or f"<tr><td>دفعة كاملة</td><td>{inv['due_date']}</td><td>{float(inv['amount_due']):,.2f} د.ج</td><td>{float(inv['amount_paid']):,.2f} د.ج</td><td>{inv['status']}</td></tr>"

            return f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>فاتورة رسوم - {inv.get('student_name_ar')}</title>
<style>
  body {{ font-family: 'Amiri', 'Cairo', Tahoma, sans-serif; margin: 30px; direction: rtl; color: #1e293b; }}
  .header {{ border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; }}
  .title {{ font-size: 24px; font-weight: bold; color: #0369a1; }}
  .meta-box {{ margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; background: #f8fafc; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
  th, td {{ border: 1px solid #cbd5e1; padding: 10px; text-align: right; }}
  th {{ background: #f1f5f9; color: #334155; }}
  .total-row {{ font-weight: bold; background: #e0f2fe; }}
  @media print {{ body {{ margin: 0; }} }}
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">أكاديمية وروضة الأطفال العباقرة</div>
      <div>{inv.get('branch_name_ar', '')}</div>
      <div>الهاتف: {inv.get('branch_phone', '')}</div>
    </div>
    <div style="text-align: left;">
      <h2>فاتورة رسوم دراسية</h2>
      <div>رقم الفاتورة: #{inv['invoice_id']}</div>
      <div>تاريخ الاستحقاق: {inv['due_date']}</div>
    </div>
  </div>
  <div class="meta-box">
    <strong>بيانات التلميذ:</strong> {inv.get('student_name_ar')} | كود: {inv.get('student_code', '')} | الحالة: <strong>{inv['status']}</strong>
  </div>
  <table>
    <thead>
      <tr>
        <th>البيان</th>
        <th>تاريخ الاستحقاق</th>
        <th>المبلغ المستحق</th>
        <th>المبلغ المسدد</th>
        <th>حالة القسط</th>
      </tr>
    </thead>
    <tbody>
      {inst_rows}
      <tr class="total-row">
        <td colspan="2">الإجمالي العام</td>
        <td>{float(inv['amount_due']):,.2f} د.ج</td>
        <td>{float(inv['amount_paid']):,.2f} د.ج</td>
        <td>المتبقي: {max(0.0, float(inv['amount_due']) - float(inv['amount_paid'])):,.2f} د.ج</td>
      </tr>
    </tbody>
  </table>
</body>
</html>"""
        except Exception as e:
            logger.error(f"Error generating RTL invoice HTML: {e}")
            return f"<html><body dir='rtl'><h1>خطأ في إنشاء الفاتورة: {e}</h1></body></html>"

    def generate_arabic_rtl_receipt_html(self, payment_id: int) -> str:
        """
        Generates production-ready Arabic RTL HTML for printable cash payment receipts (وصل استلام).
        Includes gapless sequential receipt number and cashier seal.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT 
                        pay.*,
                        s.full_name_ar AS student_name_ar,
                        s.student_code,
                        b.name_ar AS branch_name_ar,
                        e.full_name AS collector_name
                    FROM payments pay
                    JOIN invoices inv ON pay.invoice_id = inv.invoice_id
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN branches b ON p.branch_id = b.branch_id
                    LEFT JOIN employees e ON pay.collected_by_employee_id = e.employee_id
                    WHERE pay.payment_id = %s;
                    """,
                    (payment_id,),
                )
                pay = _dict_fetchone(cursor)
                if not pay:
                    return "<html><body dir='rtl'><h1>وصل القبض غير موجود</h1></body></html>"

            void_banner = "<div style='color:red; font-size:22px; font-weight:bold; border:2px dashed red; padding:10px; margin-bottom:15px; text-align:center;'>*** هذا الوصل ملغى (VOIDED) ***<br>سبب الإلغاء: " + str(pay.get('void_reason', '')) + "</div>" if pay.get("is_voided") else ""

            return f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<title>وصل قبض نقدي - {pay['receipt_number']}</title>
<style>
  body {{ font-family: 'Amiri', 'Cairo', Tahoma, sans-serif; margin: 30px; direction: rtl; color: #1e293b; }}
  .voucher {{ border: 2px solid #0f766e; border-radius: 8px; padding: 25px; background: #fff; max-width: 750px; margin: auto; }}
  .header {{ display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-bottom: 20px; }}
  .title {{ font-size: 22px; font-weight: bold; color: #0f766e; }}
  .receipt-no {{ font-size: 18px; font-weight: bold; color: #b91c1c; font-family: monospace; }}
  .content-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 15px; }}
  .amount-box {{ background: #f0fdfa; border: 1px solid #99f6e4; padding: 15px; border-radius: 6px; font-size: 18px; font-weight: bold; color: #0f766e; text-align: center; margin-bottom: 20px; }}
  .signatures {{ display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }}
  @media print {{ body {{ margin: 0; }} .voucher {{ border: 1px solid #000; }} }}
</style>
</head>
<body>
  <div class="voucher">
    {void_banner}
    <div class="header">
      <div>
        <div class="title">أكاديمية وروضة الأطفال العباقرة</div>
        <div>{pay.get('branch_name_ar', '')}</div>
      </div>
      <div style="text-align: left;">
        <div style="font-size: 16px; font-weight: bold;">وصل قبض نقدي رسمي</div>
        <div class="receipt-no">{pay['receipt_number']}</div>
        <div>التاريخ: {pay['payment_date']}</div>
      </div>
    </div>
    <div class="content-grid">
      <div><strong>استلمنا من التلميذ(ة):</strong> {pay.get('student_name_ar')}</div>
      <div><strong>الكود المدرسي:</strong> {pay.get('student_code', '')}</div>
      <div><strong>طريقة الدفع:</strong> نقداً (CASH)</div>
      <div><strong>رقم الفاتورة المرجعية:</strong> #{pay['invoice_id']}</div>
    </div>
    <div class="amount-box">
      المبلغ المقبوض: {float(pay['amount']):,.2f} د.ج (دينار جزائري)
    </div>
    <div><strong>الملاحظات والبيان:</strong> {pay.get('remarks') or 'تسديد رسوم دراسية معتمدة'}</div>
    <div class="signatures">
      <div><strong>توقيع أمين الصندوق:</strong><br><br>{pay.get('collector_name') or 'الاستقبال'}</div>
      <div style="text-align: left;"><strong>ختم المؤسسة:</strong><br><br>____________________</div>
    </div>
  </div>
</body>
</html>"""
        except Exception as e:
            logger.error(f"Error generating RTL receipt HTML: {e}")
            return f"<html><body dir='rtl'><h1>خطأ في إنشاء وصل القبض: {e}</h1></body></html>"
