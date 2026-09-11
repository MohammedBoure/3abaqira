"""
backend/database/cash_handover_manager.py
------------------------------------------
Data Access Manager for the 'cash_handovers' table.
Encapsulates:
  - Cash safe remittances and drawer drops (التسليم)
  - Sequential physical voucher generation (HND-BRANCH-YYYY-XXXX)
  - Daily cash drawer total_remitted synchronization
  - Status lifecycle transitions (PENDING, CONFIRMED, REJECTED)
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


class CashHandoverManager:
    """
    Manages operations for cash remittances, safe drops, and drawer payouts.
    """

    SAFE_COLUMNS = (
        "handover_id, branch_id, register_id, handover_date, receipt_voucher_no, "
        "amount, transferred_by_employee_id, received_by_name, handover_time, "
        "status, remarks, created_at"
    )

    VALID_STATUSES = {"PENDING", "CONFIRMED", "REJECTED"}

    def __init__(self, db_instance):
        self.db = db_instance

    def _generate_voucher_no(self, cursor, branch_id: str, handover_date: Any) -> str:
        """Generates an automated, sequential remittance voucher number (e.g., HND-CENTER-2025-0012)."""
        year = handover_date.year if hasattr(handover_date, "year") else datetime.now().year
        clean_branch = branch_id.strip().upper()

        cursor.execute(
            """
            SELECT COUNT(*) FROM cash_handovers 
            WHERE branch_id = %s AND EXTRACT(YEAR FROM handover_date) = %s;
            """,
            (clean_branch, year),
        )
        row = cursor.fetchone()
        next_seq = (row[0] if row else 0) + 1
        return f"HND-{clean_branch}-{year}-{next_seq:04d}"

    def get_all(
        self,
        branch_id: Optional[str] = None,
        register_id: Optional[int] = None,
        status: Optional[str] = None,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves cash handover remittance records with branch, cashier, and register metadata.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        h.handover_id,
                        h.branch_id,
                        h.register_id,
                        h.handover_date,
                        h.receipt_voucher_no,
                        h.amount,
                        h.transferred_by_employee_id,
                        h.received_by_name,
                        h.handover_time,
                        h.status,
                        h.remarks,
                        h.created_at,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        e.full_name AS transferred_by_name,
                        r.register_date
                    FROM cash_handovers h
                    JOIN branches b ON h.branch_id = b.branch_id
                    LEFT JOIN employees e ON h.transferred_by_employee_id = e.employee_id
                    LEFT JOIN daily_cash_registers r ON h.register_id = r.register_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND h.branch_id = %s"
                    params.append(branch_id.strip())
                if register_id is not None:
                    query += " AND h.register_id = %s"
                    params.append(register_id)
                if status and status.strip():
                    query += " AND h.status = %s"
                    params.append(status.strip().upper())
                if date_from:
                    query += " AND h.handover_date >= %s"
                    params.append(date_from)
                if date_to:
                    query += " AND h.handover_date <= %s"
                    params.append(date_to)

                query += " ORDER BY h.handover_date DESC, h.handover_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching cash handovers: {e}")
            return []

    def get_by_id(self, handover_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single handover record with relational metadata."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        h.handover_id,
                        h.branch_id,
                        h.register_id,
                        h.handover_date,
                        h.receipt_voucher_no,
                        h.amount,
                        h.transferred_by_employee_id,
                        h.received_by_name,
                        h.handover_time,
                        h.status,
                        h.remarks,
                        h.created_at,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        e.full_name AS transferred_by_name,
                        r.register_date
                    FROM cash_handovers h
                    JOIN branches b ON h.branch_id = b.branch_id
                    LEFT JOIN employees e ON h.transferred_by_employee_id = e.employee_id
                    LEFT JOIN daily_cash_registers r ON h.register_id = r.register_id
                    WHERE h.handover_id = %s;
                """
                cursor.execute(query, (handover_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching handover ID {handover_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        amount: float,
        received_by_name: str,
        handover_date: Optional[Any] = None,
        transferred_by_employee_id: Optional[int] = None,
        register_id: Optional[int] = None,
        receipt_voucher_no: Optional[str] = None,
        status: str = "CONFIRMED",
        remarks: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records a cash remittance/handover, links to active cash register,
        and updates register total_remitted if status is CONFIRMED.
        """
        if amount <= 0:
            logger.error(f"Invalid remittance amount: {amount}")
            return None

        norm_status = status.upper().strip() if status else "CONFIRMED"
        if norm_status not in self.VALID_STATUSES:
            norm_status = "CONFIRMED"

        h_date = handover_date or date.today()
        clean_branch = branch_id.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Auto-link to open daily register if absent
                active_reg_id = register_id
                if not active_reg_id:
                    cursor.execute(
                        """
                        SELECT register_id FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date = %s AND is_closed = FALSE
                        ORDER BY register_id DESC LIMIT 1;
                        """,
                        (clean_branch, h_date),
                    )
                    reg_row = cursor.fetchone()
                    if reg_row:
                        active_reg_id = reg_row[0]

                # Generate voucher number if not supplied
                voucher_no = receipt_voucher_no.strip() if receipt_voucher_no else None
                if not voucher_no:
                    voucher_no = self._generate_voucher_no(cursor, clean_branch, h_date)

                query = """
                INSERT INTO cash_handovers (
                    branch_id, register_id, handover_date, receipt_voucher_no,
                    amount, transferred_by_employee_id, received_by_name,
                    status, remarks
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING 
                    handover_id, branch_id, register_id, handover_date,
                    receipt_voucher_no, amount, transferred_by_employee_id,
                    received_by_name, handover_time, status, remarks, created_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        active_reg_id,
                        h_date,
                        voucher_no,
                        amount,
                        transferred_by_employee_id,
                        received_by_name.strip(),
                        norm_status,
                        remarks.strip() if remarks else None,
                    ),
                )
                handover = _dict_fetchone(cursor)
                if not handover:
                    return None

                # Increment register total_remitted if confirmed
                if norm_status == "CONFIRMED" and active_reg_id:
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_remitted = total_remitted + %s, updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (amount, active_reg_id),
                    )

                conn.commit()
                return handover

        except Exception as e:
            logger.error(f"Error creating cash handover for branch {branch_id}: {e}")
            return None

    def update_status(self, handover_id: int, new_status: str) -> bool:
        """
        Updates handover confirmation status and synchronizes daily cash register total_remitted.
        """
        norm_status = new_status.upper().strip()
        if norm_status not in self.VALID_STATUSES:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT register_id, amount, status FROM cash_handovers WHERE handover_id = %s;",
                    (handover_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return False

                register_id = row[0]
                amount = float(row[1])
                old_status = row[2]

                if old_status == norm_status:
                    return True

                cursor.execute(
                    "UPDATE cash_handovers SET status = %s WHERE handover_id = %s;",
                    (norm_status, handover_id),
                )

                # Adjust register total_remitted if register is attached
                if register_id:
                    if old_status != "CONFIRMED" and norm_status == "CONFIRMED":
                        cursor.execute(
                            "UPDATE daily_cash_registers SET total_remitted = total_remitted + %s, updated_at = CURRENT_TIMESTAMP WHERE register_id = %s;",
                            (amount, register_id),
                        )
                    elif old_status == "CONFIRMED" and norm_status != "CONFIRMED":
                        cursor.execute(
                            "UPDATE daily_cash_registers SET total_remitted = GREATEST(0.00, total_remitted - %s), updated_at = CURRENT_TIMESTAMP WHERE register_id = %s;",
                            (amount, register_id),
                        )

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error updating status for handover ID {handover_id}: {e}")
            return False

    def delete(self, handover_id: int) -> bool:
        """Deletes handover record, reversing register remittance if it was confirmed."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT register_id, amount, status FROM cash_handovers WHERE handover_id = %s;",
                    (handover_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return False

                register_id = row[0]
                amount = float(row[1])
                old_status = row[2]

                cursor.execute("DELETE FROM cash_handovers WHERE handover_id = %s;", (handover_id,))

                if old_status == "CONFIRMED" and register_id:
                    cursor.execute(
                        "UPDATE daily_cash_registers SET total_remitted = GREATEST(0.00, total_remitted - %s), updated_at = CURRENT_TIMESTAMP WHERE register_id = %s;",
                        (amount, register_id),
                    )

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error deleting handover ID {handover_id}: {e}")
            return False
