"""
backend/database/invoice_manager.py
------------------------------------
Data Access Manager for the 'invoices' table.
Encapsulates:
  - Multi-tier invoice generation and installment tranches
  - Due date tracking, overdue detection, and status transitions (UNPAID, PARTIALLY_PAID, PAID, OVERDUE, WAIVED)
  - Payment credit registration and remaining balance tracking
  - Analytical financial aggregates (total invoiced, collected, and outstanding balances)
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


class InvoiceManager:
    """
    Manages operations for multi-tier student invoices and installment tranches.
    """

    SAFE_COLUMNS = (
        "invoice_id, branch_id, enrollment_id, installment_number, period_label, "
        "due_date, amount_due, amount_paid, (amount_due - amount_paid) AS remaining_balance, "
        "status, notes, created_at, updated_at"
    )

    VALID_STATUSES = {"UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "WAIVED"}

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        enrollment_id: Optional[int] = None,
        student_id: Optional[int] = None,
        status: Optional[str] = None,
        is_overdue: Optional[bool] = None,
        due_date_from: Optional[Any] = None,
        due_date_to: Optional[Any] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves invoices with relational student, group, branch, and cycle context.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        inv.invoice_id,
                        inv.branch_id,
                        inv.enrollment_id,
                        inv.installment_number,
                        inv.period_label,
                        inv.due_date,
                        inv.amount_due,
                        inv.amount_paid,
                        (inv.amount_due - inv.amount_paid) AS remaining_balance,
                        inv.status,
                        inv.notes,
                        inv.created_at,
                        inv.updated_at,
                        s.student_id,
                        s.student_code,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        g.group_id,
                        g.group_name,
                        p.program_id,
                        p.name_ar AS program_name_ar,
                        b.name_ar AS branch_name_ar,
                        ay.name AS academic_year_name
                    FROM invoices inv
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN branches b ON inv.branch_id = b.branch_id
                    JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND inv.branch_id = %s"
                    params.append(branch_id.strip())
                if enrollment_id is not None:
                    query += " AND inv.enrollment_id = %s"
                    params.append(enrollment_id)
                if student_id is not None:
                    query += " AND se.student_id = %s"
                    params.append(student_id)
                if status and status.strip():
                    query += " AND inv.status = %s"
                    params.append(status.strip().upper())
                if is_overdue is True:
                    query += " AND inv.status IN ('UNPAID', 'PARTIALLY_PAID') AND inv.due_date < CURRENT_DATE"
                elif is_overdue is False:
                    query += " AND (inv.status IN ('PAID', 'WAIVED') OR inv.due_date >= CURRENT_DATE OR inv.due_date IS NULL)"
                if due_date_from:
                    query += " AND inv.due_date >= %s"
                    params.append(due_date_from)
                if due_date_to:
                    query += " AND inv.due_date <= %s"
                    params.append(due_date_to)
                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        s.full_name_ar ILIKE %s OR
                        COALESCE(s.full_name_fr, '') ILIKE %s OR
                        COALESCE(s.student_code, '') ILIKE %s OR
                        inv.period_label ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern, pattern])

                query += " ORDER BY inv.due_date ASC NULLS LAST, inv.invoice_id ASC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching invoices: {e}")
            return []

    def get_by_id(self, invoice_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single invoice record with full relational student and enrollment context."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        inv.invoice_id,
                        inv.branch_id,
                        inv.enrollment_id,
                        inv.installment_number,
                        inv.period_label,
                        inv.due_date,
                        inv.amount_due,
                        inv.amount_paid,
                        (inv.amount_due - inv.amount_paid) AS remaining_balance,
                        inv.status,
                        inv.notes,
                        inv.created_at,
                        inv.updated_at,
                        s.student_id,
                        s.student_code,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        s.emergency_phone AS student_phone,
                        g.group_id,
                        g.group_name,
                        p.name_ar AS program_name_ar,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        se.payment_mode,
                        se.agreed_total_amount
                    FROM invoices inv
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN branches b ON inv.branch_id = b.branch_id
                    WHERE inv.invoice_id = %s;
                """
                cursor.execute(query, (invoice_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching invoice ID {invoice_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        enrollment_id: int,
        installment_number: int,
        period_label: str,
        amount_due: float,
        due_date: Optional[Any] = None,
        notes: Optional[str] = None,
        status: str = "UNPAID",
    ) -> Optional[Dict[str, Any]]:
        """Creates a single invoice installment tranche."""
        norm_status = status.upper().strip() if status else "UNPAID"
        if norm_status not in self.VALID_STATUSES:
            norm_status = "UNPAID"

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO invoices (
                    branch_id, enrollment_id, installment_number, period_label,
                    due_date, amount_due, amount_paid, status, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, 0.00, %s, %s)
                RETURNING 
                    invoice_id, branch_id, enrollment_id, installment_number,
                    period_label, due_date, amount_due, amount_paid,
                    (amount_due - amount_paid) AS remaining_balance,
                    status, notes, created_at, updated_at;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        enrollment_id,
                        installment_number,
                        period_label.strip(),
                        due_date,
                        max(0.0, float(amount_due)),
                        norm_status,
                        notes.strip() if notes else None,
                    ),
                )
                res = _dict_fetchone(cursor)
                conn.commit()
                return res
        except Exception as e:
            logger.error(f"Error creating invoice for enrollment ID {enrollment_id}: {e}")
            return None

    def create_batch(
        self,
        branch_id: str,
        enrollment_id: int,
        invoices: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """Batch creates multiple invoice tranches in a single atomic transaction."""
        created_list = []
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                for inv in invoices:
                    norm_status = inv.get("status", "UNPAID").upper().strip()
                    if norm_status not in self.VALID_STATUSES:
                        norm_status = "UNPAID"

                    query = """
                    INSERT INTO invoices (
                        branch_id, enrollment_id, installment_number, period_label,
                        due_date, amount_due, amount_paid, status, notes
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        invoice_id, branch_id, enrollment_id, installment_number,
                        period_label, due_date, amount_due, amount_paid,
                        (amount_due - amount_paid) AS remaining_balance,
                        status, notes, created_at, updated_at;
                    """
                    cursor.execute(
                        query,
                        (
                            branch_id.strip(),
                            enrollment_id,
                            int(inv.get("installment_number") or 1),
                            str(inv.get("period_label") or "").strip(),
                            inv.get("due_date"),
                            max(0.0, float(inv.get("amount_due") or 0.0)),
                            max(0.0, float(inv.get("amount_paid") or 0.0)),
                            norm_status,
                            inv.get("notes"),
                        ),
                    )
                    row = _dict_fetchone(cursor)
                    if row:
                        created_list.append(row)

                conn.commit()
                return created_list
        except Exception as e:
            logger.error(f"Error batch creating invoices for enrollment ID {enrollment_id}: {e}")
            return []

    def update(self, invoice_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable invoice fields."""
        allowed = {"installment_number", "period_label", "due_date", "amount_due", "notes", "status"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        if "status" in updates:
            updates["status"] = updates["status"].upper().strip()
            if updates["status"] not in self.VALID_STATUSES:
                del updates["status"]

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values = list(updates.values()) + [invoice_id]
                query = f"UPDATE invoices SET {', '.join(set_clauses)} WHERE invoice_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating invoice ID {invoice_id}: {e}")
            return False

    def record_payment_credit(
        self, invoice_id: int, payment_amount: float, notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Credits a payment amount to the invoice, advances amount_paid, and automatically
        synchronizes status (UNPAID -> PARTIALLY_PAID -> PAID).
        """
        if payment_amount <= 0:
            return None

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT amount_due, amount_paid FROM invoices WHERE invoice_id = %s;",
                    (invoice_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return None

                amount_due = float(row[0])
                current_paid = float(row[1])
                new_paid = current_paid + payment_amount

                if new_paid >= amount_due:
                    new_status = "PAID"
                elif new_paid > 0:
                    new_status = "PARTIALLY_PAID"
                else:
                    new_status = "UNPAID"

                query = """
                UPDATE invoices
                SET amount_paid = %s, status = %s, updated_at = CURRENT_TIMESTAMP
                WHERE invoice_id = %s
                RETURNING 
                    invoice_id, branch_id, enrollment_id, installment_number,
                    period_label, due_date, amount_due, amount_paid,
                    (amount_due - amount_paid) AS remaining_balance,
                    status, notes, created_at, updated_at;
                """
                cursor.execute(query, (new_paid, new_status, invoice_id))
                res = _dict_fetchone(cursor)
                conn.commit()
                return res
        except Exception as e:
            logger.error(f"Error recording payment credit to invoice ID {invoice_id}: {e}")
            return None

    def waive(self, invoice_id: int, reason: Optional[str] = None) -> bool:
        """Marks an invoice as WAIVED."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE invoices
                SET status = 'WAIVED', 
                    notes = CASE WHEN notes IS NULL THEN %s ELSE notes || ' | ' || %s END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE invoice_id = %s;
                """
                note_str = f"Waived: {reason}" if reason else "Waived"
                cursor.execute(query, (note_str, note_str, invoice_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error waiving invoice ID {invoice_id}: {e}")
            return False

    def check_and_update_overdue(self, branch_id: Optional[str] = None) -> int:
        """
        Scans for invoices with expired due dates and updates their status to OVERDUE.
        Returns count of transitioned invoices.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    UPDATE invoices
                    SET status = 'OVERDUE', updated_at = CURRENT_TIMESTAMP
                    WHERE status IN ('UNPAID', 'PARTIALLY_PAID')
                      AND due_date < CURRENT_DATE
                """
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip())

                cursor.execute(query, params)
                conn.commit()
                return cursor.rowcount
        except Exception as e:
            logger.error(f"Error updating overdue invoices: {e}")
            return 0

    def delete(self, invoice_id: int) -> bool:
        """Deletes an invoice. Permitted only if amount_paid is zero or status is WAIVED."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM invoices WHERE invoice_id = %s AND (amount_paid = 0 OR status = 'WAIVED');"
                cursor.execute(query, (invoice_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting invoice ID {invoice_id}: {e}")
            return False

    def get_financial_summary(
        self, branch_id: Optional[str] = None, academic_year_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Calculates global or branch-scoped financial invoicing KPIs."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        COUNT(inv.invoice_id) AS total_invoices,
                        COALESCE(SUM(inv.amount_due), 0.00) AS total_invoiced,
                        COALESCE(SUM(inv.amount_paid), 0.00) AS total_paid,
                        COALESCE(SUM(inv.amount_due - inv.amount_paid), 0.00) AS total_outstanding,
                        COUNT(CASE WHEN inv.status = 'PAID' THEN 1 END) AS count_paid,
                        COUNT(CASE WHEN inv.status = 'PARTIALLY_PAID' THEN 1 END) AS count_partially_paid,
                        COUNT(CASE WHEN inv.status = 'UNPAID' THEN 1 END) AS count_unpaid,
                        COUNT(CASE WHEN inv.status = 'OVERDUE' OR (inv.status IN ('UNPAID', 'PARTIALLY_PAID') AND inv.due_date < CURRENT_DATE) THEN 1 END) AS count_overdue,
                        COALESCE(SUM(CASE WHEN inv.status = 'OVERDUE' OR (inv.status IN ('UNPAID', 'PARTIALLY_PAID') AND inv.due_date < CURRENT_DATE) THEN (inv.amount_due - inv.amount_paid) ELSE 0 END), 0.00) AS total_overdue_amount
                    FROM invoices inv
                    JOIN student_enrollments se ON inv.enrollment_id = se.enrollment_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if branch_id:
                    query += " AND inv.branch_id = %s"
                    params.append(branch_id.strip())
                if academic_year_id is not None:
                    query += " AND se.academic_year_id = %s"
                    params.append(academic_year_id)

                cursor.execute(query, params)
                res = _dict_fetchone(cursor)
                return res or {
                    "total_invoices": 0,
                    "total_invoiced": 0.0,
                    "total_paid": 0.0,
                    "total_outstanding": 0.0,
                    "count_paid": 0,
                    "count_partially_paid": 0,
                    "count_unpaid": 0,
                    "count_overdue": 0,
                    "total_overdue_amount": 0.0,
                }
        except Exception as e:
            logger.error(f"Error generating financial summary: {e}")
            return {
                "total_invoices": 0,
                "total_invoiced": 0.0,
                "total_paid": 0.0,
                "total_outstanding": 0.0,
                "count_paid": 0,
                "count_partially_paid": 0,
                "count_unpaid": 0,
                "count_overdue": 0,
                "total_overdue_amount": 0.0,
            }
