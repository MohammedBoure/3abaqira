"""
backend/database/payment_manager.py
-----------------------------------
Data Access Manager for the 'payments' table.
Encapsulates:
  - Tuition and fee collection receipts (الوصل)
  - Automatic unique receipt number generation (REC-BRANCH-YYYY-XXXXX)
  - Seamless two-way synchronization:
      1. Credits target invoice amount_paid & updates status (UNPAID -> PARTIALLY_PAID -> PAID)
      2. Links to open daily cash register & increments total_revenues
  - Payment reversal / voiding with ledger recalculations
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


class PaymentManager:
    """
    Manages operations for student fee payments, receipt voucher generation, and cashier intakes.
    """

    SAFE_COLUMNS = (
        "payment_id, branch_id, invoice_id, register_id, receipt_number, "
        "payment_date, amount, payment_method, collected_by_employee_id, remarks, created_at"
    )

    VALID_PAYMENT_METHODS = {"CASH", "CHECK", "BANK_TRANSFER", "CARD", "OTHER"}

    def __init__(self, db_instance):
        self.db = db_instance

    def _generate_receipt_number(self, cursor, branch_id: str, payment_date: Any) -> str:
        """Generates an automated, sequential receipt voucher number (e.g., REC-CENTER-2025-00042)."""
        year = payment_date.year if hasattr(payment_date, "year") else datetime.now().year
        clean_branch = branch_id.strip().upper()

        cursor.execute(
            """
            SELECT COUNT(*) FROM payments 
            WHERE branch_id = %s AND EXTRACT(YEAR FROM payment_date) = %s;
            """,
            (clean_branch, year),
        )
        row = cursor.fetchone()
        next_seq = (row[0] if row else 0) + 1
        return f"REC-{clean_branch}-{year}-{next_seq:05d}"

    def get_all(
        self,
        branch_id: Optional[str] = None,
        invoice_id: Optional[int] = None,
        register_id: Optional[int] = None,
        student_id: Optional[int] = None,
        payment_method: Optional[str] = None,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves payment receipts with student names, invoice period, cashier names, and register dates.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        p.payment_id,
                        p.branch_id,
                        p.invoice_id,
                        p.register_id,
                        p.receipt_number,
                        p.payment_date,
                        p.amount,
                        p.payment_method,
                        p.collected_by_employee_id,
                        p.remarks,
                        p.created_at,
                        s.student_id,
                        s.student_code,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        inv.installment_number,
                        inv.period_label AS invoice_period_label,
                        inv.amount_due AS invoice_amount_due,
                        inv.amount_paid AS invoice_amount_paid,
                        inv.status AS invoice_status,
                        b.name_ar AS branch_name_ar,
                        e.full_name AS collected_by_name,
                        r.register_date
                    FROM payments p
                    JOIN invoices inv ON p.invoice_id = inv.invoice_id
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    JOIN students s ON se.student_id = s.student_id
                    JOIN branches b ON p.branch_id = b.branch_id
                    LEFT JOIN employees e ON p.collected_by_employee_id = e.employee_id
                    LEFT JOIN daily_cash_registers r ON p.register_id = r.register_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND p.branch_id = %s"
                    params.append(branch_id.strip())
                if invoice_id is not None:
                    query += " AND p.invoice_id = %s"
                    params.append(invoice_id)
                if register_id is not None:
                    query += " AND p.register_id = %s"
                    params.append(register_id)
                if student_id is not None:
                    query += " AND se.student_id = %s"
                    params.append(student_id)
                if payment_method and payment_method.strip():
                    query += " AND p.payment_method = %s"
                    params.append(payment_method.strip().upper())
                if date_from:
                    query += " AND p.payment_date >= %s"
                    params.append(date_from)
                if date_to:
                    query += " AND p.payment_date <= %s"
                    params.append(date_to)
                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        p.receipt_number ILIKE %s OR
                        s.full_name_ar ILIKE %s OR
                        COALESCE(s.full_name_fr, '') ILIKE %s OR
                        COALESCE(s.student_code, '') ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern, pattern])

                query += " ORDER BY p.payment_date DESC, p.payment_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching payments: {e}")
            return []

    def get_by_id(self, payment_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single payment receipt with full student and enrollment context."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        p.payment_id,
                        p.branch_id,
                        p.invoice_id,
                        p.register_id,
                        p.receipt_number,
                        p.payment_date,
                        p.amount,
                        p.payment_method,
                        p.collected_by_employee_id,
                        p.remarks,
                        p.created_at,
                        s.student_id,
                        s.student_code,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        g.group_name,
                        l.name_ar AS level_name_ar,
                        prog.name_ar AS program_name_ar,
                        inv.installment_number,
                        inv.period_label AS invoice_period_label,
                        inv.amount_due AS invoice_amount_due,
                        inv.amount_paid AS invoice_amount_paid,
                        inv.status AS invoice_status,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        e.full_name AS collected_by_name,
                        r.register_date
                    FROM payments p
                    JOIN invoices inv ON p.invoice_id = inv.invoice_id
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs prog ON l.program_id = prog.program_id
                    JOIN branches b ON p.branch_id = b.branch_id
                    LEFT JOIN employees e ON p.collected_by_employee_id = e.employee_id
                    LEFT JOIN daily_cash_registers r ON p.register_id = r.register_id
                    WHERE p.payment_id = %s;
                """
                cursor.execute(query, (payment_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching payment ID {payment_id}: {e}")
            return None

    def get_by_receipt_number(self, branch_id: str, receipt_number: str) -> Optional[Dict[str, Any]]:
        """Finds payment record by receipt voucher number."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT payment_id FROM payments WHERE branch_id = %s AND receipt_number = %s;"
                cursor.execute(query, (branch_id.strip(), receipt_number.strip()))
                row = cursor.fetchone()
                if not row:
                    return None
                return self.get_by_id(row[0])
        except Exception as e:
            logger.error(f"Error fetching receipt {receipt_number}: {e}")
            return None

    def record_payment(
        self,
        branch_id: str,
        invoice_id: int,
        amount: float,
        payment_method: str = "CASH",
        payment_date: Optional[Any] = None,
        receipt_number: Optional[str] = None,
        register_id: Optional[int] = None,
        collected_by_employee_id: Optional[int] = None,
        remarks: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records a student fee payment:
          1. Validates invoice and payment amount.
          2. Auto-resolves or creates active daily cash register for the branch/date.
          3. Generates sequential receipt voucher number if absent.
          4. Credits target invoice amount_paid and recalculates status.
          5. Updates daily cash register total_revenues.
        """
        if amount <= 0:
            logger.error(f"Invalid payment amount: {amount}")
            return None

        norm_method = payment_method.upper().strip() if payment_method else "CASH"
        if norm_method not in self.VALID_PAYMENT_METHODS:
            norm_method = "CASH"

        p_date = payment_date or date.today()
        clean_branch = branch_id.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # 1. Verify invoice exists
                cursor.execute(
                    "SELECT invoice_id, amount_due, amount_paid FROM invoices WHERE invoice_id = %s;",
                    (invoice_id,),
                )
                inv_row = cursor.fetchone()
                if not inv_row:
                    logger.error(f"Invoice ID {invoice_id} not found.")
                    return None

                inv_due = float(inv_row[1])
                inv_paid = float(inv_row[2])

                # 2. Auto-link to open daily cash register if not provided
                active_reg_id = register_id
                if not active_reg_id:
                    cursor.execute(
                        """
                        SELECT register_id FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date = %s AND is_closed = FALSE
                        ORDER BY register_id DESC LIMIT 1;
                        """,
                        (clean_branch, p_date),
                    )
                    reg_row = cursor.fetchone()
                    if reg_row:
                        active_reg_id = reg_row[0]
                    else:
                        # Auto-create open daily register for today
                        cursor.execute(
                            """
                            INSERT INTO daily_cash_registers (
                                branch_id, register_date, opening_balance,
                                total_revenues, total_expenses, total_remitted, is_closed
                            )
                            VALUES (%s, %s, 0.00, 0.00, 0.00, 0.00, FALSE)
                            RETURNING register_id;
                            """,
                            (clean_branch, p_date),
                        )
                        new_reg_row = cursor.fetchone()
                        active_reg_id = new_reg_row[0] if new_reg_row else None

                # 3. Generate receipt number if not provided
                final_receipt_no = receipt_number.strip() if receipt_number else None
                if not final_receipt_no:
                    final_receipt_no = self._generate_receipt_number(cursor, clean_branch, p_date)

                # 4. Insert payment
                insert_query = """
                INSERT INTO payments (
                    branch_id, invoice_id, register_id, receipt_number,
                    payment_date, amount, payment_method,
                    collected_by_employee_id, remarks
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING 
                    payment_id, branch_id, invoice_id, register_id, receipt_number,
                    payment_date, amount, payment_method, collected_by_employee_id,
                    remarks, created_at;
                """
                cursor.execute(
                    insert_query,
                    (
                        clean_branch,
                        invoice_id,
                        active_reg_id,
                        final_receipt_no,
                        p_date,
                        amount,
                        norm_method,
                        collected_by_employee_id,
                        remarks.strip() if remarks else None,
                    ),
                )
                payment_record = _dict_fetchone(cursor)
                if not payment_record:
                    return None

                # 5. Credit Invoice amount_paid and update status
                new_inv_paid = inv_paid + amount
                if new_inv_paid >= inv_due:
                    new_status = "PAID"
                elif new_inv_paid > 0:
                    new_status = "PARTIALLY_PAID"
                else:
                    new_status = "UNPAID"

                cursor.execute(
                    """
                    UPDATE invoices
                    SET amount_paid = %s, status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE invoice_id = %s;
                    """,
                    (new_inv_paid, new_status, invoice_id),
                )

                # 6. Increment Register total_revenues
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
                payment_record["updated_invoice"] = {
                    "invoice_id": invoice_id,
                    "amount_due": inv_due,
                    "amount_paid": new_inv_paid,
                    "remaining_balance": max(0.0, inv_due - new_inv_paid),
                    "status": new_status,
                }
                return payment_record

        except Exception as e:
            logger.error(f"Error recording payment for invoice {invoice_id}: {e}")
            return None

    def void_payment(self, payment_id: int, reason: Optional[str] = None) -> bool:
        """
        Voids/deletes a payment record, adjusts invoice amount_paid backwards,
        and decrements daily cash register total_revenues.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT invoice_id, register_id, amount FROM payments WHERE payment_id = %s;",
                    (payment_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return False

                invoice_id = row[0]
                register_id = row[1]
                amount = float(row[2])

                # Delete payment
                cursor.execute("DELETE FROM payments WHERE payment_id = %s;", (payment_id,))

                # Reverse invoice credit
                cursor.execute(
                    "SELECT amount_due, amount_paid FROM invoices WHERE invoice_id = %s;",
                    (invoice_id,),
                )
                inv_row = cursor.fetchone()
                if inv_row:
                    due = float(inv_row[0])
                    paid = max(0.0, float(inv_row[1]) - amount)
                    if paid >= due and due > 0:
                        st = "PAID"
                    elif paid > 0:
                        st = "PARTIALLY_PAID"
                    else:
                        st = "UNPAID"

                    cursor.execute(
                        """
                        UPDATE invoices
                        SET amount_paid = %s, status = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE invoice_id = %s;
                        """,
                        (paid, st, invoice_id),
                    )

                # Reverse register revenues
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
                return True
        except Exception as e:
            logger.error(f"Error voiding payment ID {payment_id}: {e}")
            return False

    def get_payment_methods_summary(
        self, branch_id: Optional[str] = None, date_from: Optional[Any] = None, date_to: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """Returns aggregate breakdown of collections by payment method."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        payment_method,
                        COUNT(payment_id) AS transaction_count,
                        COALESCE(SUM(amount), 0.00) AS total_collected
                    FROM payments
                    WHERE 1=1
                """
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip())
                if date_from:
                    query += " AND payment_date >= %s"
                    params.append(date_from)
                if date_to:
                    query += " AND payment_date <= %s"
                    params.append(date_to)

                query += " GROUP BY payment_method ORDER BY total_collected DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error getting payment methods summary: {e}")
            return []
