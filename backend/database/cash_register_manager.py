"""
backend/database/cash_register_manager.py
------------------------------------------
Data Access Manager for the 'daily_cash_registers' table.
Encapsulates:
  - Daily cash drawer lifecycle (open, active intake, closing reconciliation)
  - Real-time aggregation of revenues, operational expenses, and safe remittances
  - Automatic theoretical closing balance and physical cash discrepancy calculation
  - Previous cycle closing balance carry-forward
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


class CashRegisterManager:
    """
    Manages operations for daily cash registers, drawer balances, and reconciliation.
    """

    SAFE_COLUMNS = (
        "register_id, branch_id, register_date, opening_balance, total_revenues, "
        "total_expenses, total_remitted, "
        "(opening_balance + total_revenues - total_expenses - total_remitted) AS closing_balance, "
        "actual_cash_counted, "
        "(COALESCE(actual_cash_counted, opening_balance + total_revenues - total_expenses - total_remitted) - "
        "(opening_balance + total_revenues - total_expenses - total_remitted)) AS discrepancy, "
        "reconciled_by, is_closed, notes, created_at, updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None,
        is_closed: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves daily cash registers with branch names, employee names, and live computed balances.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        r.register_id,
                        r.branch_id,
                        r.register_date,
                        r.opening_balance,
                        r.total_revenues,
                        r.total_expenses,
                        r.total_remitted,
                        (r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted) AS closing_balance,
                        r.actual_cash_counted,
                        (COALESCE(r.actual_cash_counted, r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted) - 
                         (r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted)) AS discrepancy,
                        r.reconciled_by,
                        r.is_closed,
                        r.notes,
                        r.created_at,
                        r.updated_at,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        e.full_name AS reconciled_by_name
                    FROM daily_cash_registers r
                    JOIN branches b ON r.branch_id = b.branch_id
                    LEFT JOIN employees e ON r.reconciled_by = e.employee_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND r.branch_id = %s"
                    params.append(branch_id.strip())
                if date_from:
                    query += " AND r.register_date >= %s"
                    params.append(date_from)
                if date_to:
                    query += " AND r.register_date <= %s"
                    params.append(date_to)
                if is_closed is not None:
                    query += " AND r.is_closed = %s"
                    params.append(is_closed)

                query += " ORDER BY r.register_date DESC, r.register_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching daily cash registers: {e}")
            return []

    def get_by_id(
        self, register_id: int, include_transactions: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Retrieves single register record with optional breakdowns of payments and handovers."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        r.register_id,
                        r.branch_id,
                        r.register_date,
                        r.opening_balance,
                        r.total_revenues,
                        r.total_expenses,
                        r.total_remitted,
                        (r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted) AS closing_balance,
                        r.actual_cash_counted,
                        (COALESCE(r.actual_cash_counted, r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted) - 
                         (r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted)) AS discrepancy,
                        r.reconciled_by,
                        r.is_closed,
                        r.notes,
                        r.created_at,
                        r.updated_at,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        e.full_name AS reconciled_by_name
                    FROM daily_cash_registers r
                    JOIN branches b ON r.branch_id = b.branch_id
                    LEFT JOIN employees e ON r.reconciled_by = e.employee_id
                    WHERE r.register_id = %s;
                """
                cursor.execute(query, (register_id,))
                reg = _dict_fetchone(cursor)
                if not reg:
                    return None

                if include_transactions:
                    # Fetch payments for this register
                    p_cursor = conn.cursor()
                    p_cursor.execute(
                        """
                        SELECT 
                            payment_id, receipt_number, payment_date, amount,
                            payment_method, remarks, created_at
                        FROM payments
                        WHERE register_id = %s
                        ORDER BY payment_id ASC;
                        """,
                        (register_id,),
                    )
                    reg["payments"] = _dict_fetchall(p_cursor)

                    # Fetch cash handovers for this register
                    h_cursor = conn.cursor()
                    h_cursor.execute(
                        """
                        SELECT 
                            handover_id, receipt_voucher_no, handover_date,
                            amount, received_by_name, status, remarks, created_at
                        FROM cash_handovers
                        WHERE register_id = %s
                        ORDER BY handover_id ASC;
                        """,
                        (register_id,),
                    )
                    reg["handovers"] = _dict_fetchall(h_cursor)

                return reg
        except Exception as e:
            logger.error(f"Error fetching register ID {register_id}: {e}")
            return None

    def get_by_date(self, branch_id: str, register_date: Any) -> Optional[Dict[str, Any]]:
        """Retrieves register record for a specific branch and calendar date."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        r.register_id,
                        r.branch_id,
                        r.register_date,
                        r.opening_balance,
                        r.total_revenues,
                        r.total_expenses,
                        r.total_remitted,
                        (r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted) AS closing_balance,
                        r.actual_cash_counted,
                        (COALESCE(r.actual_cash_counted, r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted) - 
                         (r.opening_balance + r.total_revenues - r.total_expenses - r.total_remitted)) AS discrepancy,
                        r.reconciled_by,
                        r.is_closed,
                        r.notes,
                        r.created_at,
                        r.updated_at,
                        b.name_ar AS branch_name_ar
                    FROM daily_cash_registers r
                    JOIN branches b ON r.branch_id = b.branch_id
                    WHERE r.branch_id = %s AND r.register_date = %s;
                """
                cursor.execute(query, (branch_id.strip(), register_date))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching register for branch {branch_id} on {register_date}: {e}")
            return None

    def get_or_create(
        self,
        branch_id: str,
        register_date: Optional[Any] = None,
        opening_balance: Optional[float] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves existing daily register or creates one, optionally carrying forward
        the previous register's closing balance as opening balance.
        """
        target_date = register_date or date.today()
        existing = self.get_by_date(branch_id, target_date)
        if existing:
            return existing

        # Determine opening balance from previous register if not supplied
        if opening_balance is None:
            try:
                with self.db.get_db_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        SELECT (opening_balance + total_revenues - total_expenses - total_remitted) AS previous_closing
                        FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date < %s
                        ORDER BY register_date DESC LIMIT 1;
                        """,
                        (branch_id.strip(), target_date),
                    )
                    row = cursor.fetchone()
                    opening_balance = float(row[0]) if row and row[0] is not None else 0.0
            except Exception as e:
                logger.warning(f"Could not carry over previous closing balance: {e}")
                opening_balance = 0.0

        return self.create(
            branch_id=branch_id,
            register_date=target_date,
            opening_balance=max(0.0, float(opening_balance or 0.0)),
        )

    def create(
        self,
        branch_id: str,
        register_date: Any,
        opening_balance: float = 0.0,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new daily register for a branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO daily_cash_registers (
                    branch_id, register_date, opening_balance,
                    total_revenues, total_expenses, total_remitted,
                    is_closed, notes
                )
                VALUES (%s, %s, %s, 0.00, 0.00, 0.00, FALSE, %s)
                RETURNING 
                    register_id, branch_id, register_date, opening_balance,
                    total_revenues, total_expenses, total_remitted,
                    (opening_balance + total_revenues - total_expenses - total_remitted) AS closing_balance,
                    actual_cash_counted,
                    (COALESCE(actual_cash_counted, opening_balance + total_revenues - total_expenses - total_remitted) - 
                     (opening_balance + total_revenues - total_expenses - total_remitted)) AS discrepancy,
                    reconciled_by, is_closed, notes, created_at, updated_at;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        register_date,
                        max(0.0, float(opening_balance)),
                        notes.strip() if notes else None,
                    ),
                )
                res = _dict_fetchone(cursor)
                conn.commit()
                return res
        except Exception as e:
            logger.error(f"Error creating register for {branch_id} on {register_date}: {e}")
            return None

    def update(self, register_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable register fields."""
        allowed = {"opening_balance", "actual_cash_counted", "notes"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values = list(updates.values()) + [register_id]
                query = f"UPDATE daily_cash_registers SET {', '.join(set_clauses)} WHERE register_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating register ID {register_id}: {e}")
            return False

    def close_and_reconcile(
        self,
        register_id: int,
        actual_cash_counted: float,
        reconciled_by: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Reconciles child transactions, records physical cash counted, sets discrepancy,
        and marks register as closed.
        """
        # First synchronize live transaction totals
        self.recalculate_totals(register_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE daily_cash_registers
                SET actual_cash_counted = %s,
                    reconciled_by = %s,
                    is_closed = TRUE,
                    notes = CASE WHEN %s IS NOT NULL THEN COALESCE(notes || ' | ', '') || %s ELSE notes END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE register_id = %s
                RETURNING 
                    register_id, branch_id, register_date, opening_balance,
                    total_revenues, total_expenses, total_remitted,
                    (opening_balance + total_revenues - total_expenses - total_remitted) AS closing_balance,
                    actual_cash_counted,
                    (COALESCE(actual_cash_counted, opening_balance + total_revenues - total_expenses - total_remitted) - 
                     (opening_balance + total_revenues - total_expenses - total_remitted)) AS discrepancy,
                    reconciled_by, is_closed, notes, created_at, updated_at;
                """
                cursor.execute(
                    query,
                    (
                        max(0.0, float(actual_cash_counted)),
                        reconciled_by,
                        notes,
                        notes,
                        register_id,
                    ),
                )
                res = _dict_fetchone(cursor)
                conn.commit()
                return res
        except Exception as e:
            logger.error(f"Error reconciling register ID {register_id}: {e}")
            return None

    def recalculate_totals(self, register_id: int) -> bool:
        """
        Synchronizes total_revenues, total_expenses, and total_remitted from child tables:
        payments, expenses, and cash_handovers.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Sum payments (revenues)
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0.00) FROM payments WHERE register_id = %s;",
                    (register_id,),
                )
                row_p = cursor.fetchone()
                revs = float(row_p[0]) if row_p else 0.0

                # Sum handovers (remittances with status = 'CONFIRMED')
                cursor.execute(
                    "SELECT COALESCE(SUM(amount), 0.00) FROM cash_handovers WHERE register_id = %s AND status = 'CONFIRMED';",
                    (register_id,),
                )
                row_h = cursor.fetchone()
                rems = float(row_h[0]) if row_h else 0.0

                # Sum expenses if table exists
                exps = 0.0
                try:
                    cursor.execute(
                        "SELECT COALESCE(SUM(amount), 0.00) FROM expenses WHERE register_id = %s;",
                        (register_id,),
                    )
                    row_e = cursor.fetchone()
                    exps = float(row_e[0]) if row_e else 0.0
                except Exception:
                    pass  # Expenses table not yet queried or migrated

                cursor.execute(
                    """
                    UPDATE daily_cash_registers
                    SET total_revenues = %s,
                        total_expenses = %s,
                        total_remitted = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE register_id = %s;
                    """,
                    (revs, exps, rems, register_id),
                )
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error recalculating totals for register ID {register_id}: {e}")
            return False

    def delete(self, register_id: int) -> bool:
        """Deletes register. Only allowed if is_closed is FALSE and no payments or handovers exist."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    DELETE FROM daily_cash_registers
                    WHERE register_id = %s 
                      AND is_closed = FALSE
                      AND NOT EXISTS (SELECT 1 FROM payments WHERE register_id = %s)
                      AND NOT EXISTS (SELECT 1 FROM cash_handovers WHERE register_id = %s);
                    """,
                    (register_id, register_id, register_id),
                )
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting register ID {register_id}: {e}")
            return False
