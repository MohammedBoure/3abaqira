"""
backend/database/payroll_manager.py
------------------------------------
Data Access Managers for 'payroll_runs' and 'payroll_items'.
Encapsulates:
  - HR Monthly Payroll Runs lifecycle (DRAFT -> CALCULATED -> APPROVED -> DISBURSED -> CANCELLED)
  - Automated faculty and staff compensation calculation (Fixed, Headcount, Per-Session, Hourly, Hybrid)
  - Departmental subtotals rollup (admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed)
  - Individual item adjustments, allowances, deductions, and payslip generation
  - Payment voucher issuance (PAY-{BRANCH}-{YYYY-MM}-{EMP_CODE}) and disbursement ledger
"""

import logging
from datetime import datetime, date
from decimal import Decimal
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


# ─── Departmental Role Classification for Subtotal Rollups ──────────────────
ADMIN_ROLES = {
    "ADMIN", "DIRECTOR", "SECURITY", "DRIVER",
    "CLEANER", "COOK", "NANNY", "OTHER"
}

TEACHER_ROLES = {
    "LANG_TEACHER", "QURAN_TEACHER", "PREP_TEACHER", "SUPPORT_TEACHER"
}

COACH_ROLES = {
    "SOROBAN_COACH", "ROBOTICS_COACH"
}

VALID_PAYROLL_STATUSES = {
    "DRAFT", "CALCULATED", "APPROVED", "DISBURSED", "CANCELLED"
}


class PayrollItemManager:
    """
    Manages operations for individual employee payroll items and adjustments.
    """

    SAFE_COLUMNS = (
        "pi.payroll_item_id, pi.payroll_run_id, pi.employee_id, "
        "pi.base_amount, pi.headcount_count, pi.headcount_bonus, "
        "pi.session_count, pi.variable_session_amount, "
        "pi.overtime_or_allowance, pi.deductions, pi.net_payout, "
        "pi.payment_voucher_no, pi.disbursement_date, pi.notes, pi.created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def _generate_voucher_no(self, branch_id: str, month_period: str, employee_code: Optional[str], employee_id: int) -> str:
        """Generates standard disbursement voucher number (e.g. PAY-CENTER-2026-09-EMP001)."""
        clean_branch = branch_id.strip().upper()
        clean_code = (employee_code.strip() if employee_code else f"EMP{employee_id:04d}").upper()
        return f"PAY-{clean_branch}-{month_period.strip()}-{clean_code}"

    def sync_parent_run_subtotals(self, cursor, payroll_run_id: int) -> Dict[str, Decimal]:
        """
        Recalculates admin_subtotal, teachers_subtotal, coaches_subtotal, and total_disbursed
        from all line items belonging to the specified payroll run, updating the parent record.
        """
        query = """
            SELECT 
                e.role,
                COALESCE(pi.net_payout, (pi.base_amount + pi.headcount_bonus + pi.variable_session_amount + pi.overtime_or_allowance - pi.deductions)) AS net_val
            FROM payroll_items pi
            JOIN employees e ON pi.employee_id = e.employee_id
            WHERE pi.payroll_run_id = %s;
        """
        cursor.execute(query, (payroll_run_id,))
        rows = cursor.fetchall()

        admin_sub = Decimal("0.00")
        teachers_sub = Decimal("0.00")
        coaches_sub = Decimal("0.00")

        for r in rows:
            role = r[0] if isinstance(r, (list, tuple)) else r.get("role")
            val = r[1] if isinstance(r, (list, tuple)) else r.get("net_val")
            dec_val = Decimal(str(val or "0.00"))
            clean_role = (role or "").strip().upper()

            if clean_role in COACH_ROLES:
                coaches_sub += dec_val
            elif clean_role in TEACHER_ROLES:
                teachers_sub += dec_val
            else:
                admin_sub += dec_val

        total_disbursed = admin_sub + teachers_sub + coaches_sub

        update_query = """
            UPDATE payroll_runs
            SET admin_subtotal = %s,
                teachers_subtotal = %s,
                coaches_subtotal = %s,
                total_disbursed = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE payroll_run_id = %s;
        """
        cursor.execute(
            update_query,
            (admin_sub, teachers_sub, coaches_sub, total_disbursed, payroll_run_id)
        )
        return {
            "admin_subtotal": admin_sub,
            "teachers_subtotal": teachers_sub,
            "coaches_subtotal": coaches_sub,
            "total_disbursed": total_disbursed,
        }

    def get_by_id(self, payroll_item_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single payroll item with employee and run details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        e.employee_code,
                        e.full_name AS employee_name,
                        e.role,
                        e.compensation_model,
                        e.phone AS employee_phone,
                        e.bank_account_details,
                        pr.branch_id,
                        pr.month_period,
                        pr.status AS run_status
                    FROM payroll_items pi
                    JOIN payroll_runs pr ON pi.payroll_run_id = pr.payroll_run_id
                    JOIN employees e ON pi.employee_id = e.employee_id
                    WHERE pi.payroll_item_id = %s;
                """
                cursor.execute(query, (payroll_item_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching payroll item {payroll_item_id}: {e}")
            return None

    def get_by_run_and_employee(self, payroll_run_id: int, employee_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves payroll item for an employee within a specific run."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        e.employee_code,
                        e.full_name AS employee_name,
                        e.role,
                        e.compensation_model
                    FROM payroll_items pi
                    JOIN employees e ON pi.employee_id = e.employee_id
                    WHERE pi.payroll_run_id = %s AND pi.employee_id = %s;
                """
                cursor.execute(query, (payroll_run_id, employee_id))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching item for run {payroll_run_id}, emp {employee_id}: {e}")
            return None

    def get_items_for_run(self, payroll_run_id: int) -> List[Dict[str, Any]]:
        """Retrieves all line items for a payroll run, joined with employee directory data."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        e.employee_code,
                        e.full_name AS employee_name,
                        e.role,
                        e.compensation_model,
                        e.phone AS employee_phone,
                        e.bank_account_details
                    FROM payroll_items pi
                    JOIN employees e ON pi.employee_id = e.employee_id
                    WHERE pi.payroll_run_id = %s
                    ORDER BY e.role ASC, e.full_name ASC;
                """
                cursor.execute(query, (payroll_run_id,))
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching items for payroll run {payroll_run_id}: {e}")
            return []

    def create(
        self,
        payroll_run_id: int,
        employee_id: int,
        base_amount: float = 0.0,
        headcount_count: int = 0,
        headcount_bonus: float = 0.0,
        session_count: int = 0,
        variable_session_amount: float = 0.0,
        overtime_or_allowance: float = 0.0,
        deductions: float = 0.0,
        payment_voucher_no: Optional[str] = None,
        disbursement_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a single payroll item and synchronizes the parent run subtotals."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Note: net_payout is a GENERATED ALWAYS column in PostgreSQL, omit from INSERT
                insert_query = """
                    INSERT INTO payroll_items (
                        payroll_run_id, employee_id, base_amount,
                        headcount_count, headcount_bonus, session_count,
                        variable_session_amount, overtime_or_allowance,
                        deductions, payment_voucher_no, disbursement_date, notes
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        payroll_item_id, payroll_run_id, employee_id,
                        base_amount, headcount_count, headcount_bonus,
                        session_count, variable_session_amount,
                        overtime_or_allowance, deductions, net_payout,
                        payment_voucher_no, disbursement_date, notes, created_at;
                """
                cursor.execute(
                    insert_query,
                    (
                        payroll_run_id,
                        employee_id,
                        max(0.0, float(base_amount or 0.0)),
                        max(0, int(headcount_count or 0)),
                        max(0.0, float(headcount_bonus or 0.0)),
                        max(0, int(session_count or 0)),
                        max(0.0, float(variable_session_amount or 0.0)),
                        max(0.0, float(overtime_or_allowance or 0.0)),
                        max(0.0, float(deductions or 0.0)),
                        payment_voucher_no.strip() if payment_voucher_no else None,
                        disbursement_date,
                        notes.strip() if notes else None,
                    ),
                )
                created_item = _dict_fetchone(cursor)

                # Sync parent subtotals
                self.sync_parent_run_subtotals(cursor, payroll_run_id)
                conn.commit()

                return created_item
        except Exception as e:
            logger.error(f"Error creating payroll item for run {payroll_run_id}, emp {employee_id}: {e}")
            return None

    def update(
        self,
        payroll_item_id: int,
        base_amount: Optional[float] = None,
        headcount_count: Optional[int] = None,
        headcount_bonus: Optional[float] = None,
        session_count: Optional[int] = None,
        variable_session_amount: Optional[float] = None,
        overtime_or_allowance: Optional[float] = None,
        deductions: Optional[float] = None,
        payment_voucher_no: Optional[str] = None,
        disbursement_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates payroll item adjustment fields and synchronizes parent run subtotals."""
        fields: List[str] = []
        params: List[Any] = []

        if base_amount is not None:
            if base_amount < 0:
                return None
            fields.append("base_amount = %s")
            params.append(float(base_amount))
        if headcount_count is not None:
            if headcount_count < 0:
                return None
            fields.append("headcount_count = %s")
            params.append(int(headcount_count))
        if headcount_bonus is not None:
            if headcount_bonus < 0:
                return None
            fields.append("headcount_bonus = %s")
            params.append(float(headcount_bonus))
        if session_count is not None:
            if session_count < 0:
                return None
            fields.append("session_count = %s")
            params.append(int(session_count))
        if variable_session_amount is not None:
            if variable_session_amount < 0:
                return None
            fields.append("variable_session_amount = %s")
            params.append(float(variable_session_amount))
        if overtime_or_allowance is not None:
            if overtime_or_allowance < 0:
                return None
            fields.append("overtime_or_allowance = %s")
            params.append(float(overtime_or_allowance))
        if deductions is not None:
            if deductions < 0:
                return None
            fields.append("deductions = %s")
            params.append(float(deductions))
        if payment_voucher_no is not None:
            fields.append("payment_voucher_no = %s")
            params.append(payment_voucher_no.strip() if payment_voucher_no else None)
        if disbursement_date is not None:
            fields.append("disbursement_date = %s")
            params.append(disbursement_date)
        if notes is not None:
            fields.append("notes = %s")
            params.append(notes.strip() if notes else None)

        if not fields:
            return self.get_by_id(payroll_item_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # First determine payroll_run_id
                cursor.execute("SELECT payroll_run_id FROM payroll_items WHERE payroll_item_id = %s;", (payroll_item_id,))
                run_row = cursor.fetchone()
                if not run_row:
                    return None
                payroll_run_id = run_row[0] if isinstance(run_row, (list, tuple)) else run_row.get("payroll_run_id")

                query = f"""
                    UPDATE payroll_items
                    SET {', '.join(fields)}
                    WHERE payroll_item_id = %s
                    RETURNING 
                        payroll_item_id, payroll_run_id, employee_id,
                        base_amount, headcount_count, headcount_bonus,
                        session_count, variable_session_amount,
                        overtime_or_allowance, deductions, net_payout,
                        payment_voucher_no, disbursement_date, notes, created_at;
                """
                params.append(payroll_item_id)
                cursor.execute(query, params)
                updated_item = _dict_fetchone(cursor)

                # Sync parent subtotals
                self.sync_parent_run_subtotals(cursor, payroll_run_id)
                conn.commit()

                return updated_item
        except Exception as e:
            logger.error(f"Error updating payroll item {payroll_item_id}: {e}")
            return None

    def delete(self, payroll_item_id: int) -> bool:
        """Deletes a payroll item and synchronizes parent run subtotals."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT payroll_run_id FROM payroll_items WHERE payroll_item_id = %s;", (payroll_item_id,))
                run_row = cursor.fetchone()
                if not run_row:
                    return False
                payroll_run_id = run_row[0] if isinstance(run_row, (list, tuple)) else run_row.get("payroll_run_id")

                cursor.execute("DELETE FROM payroll_items WHERE payroll_item_id = %s;", (payroll_item_id,))
                deleted = cursor.rowcount > 0

                if deleted:
                    self.sync_parent_run_subtotals(cursor, payroll_run_id)
                conn.commit()
                return deleted
        except Exception as e:
            logger.error(f"Error deleting payroll item {payroll_item_id}: {e}")
            return False

    def get_payslip(self, payroll_item_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieves complete payslip data (كشف الراتب / Bulletin de Paie)
        including branch information, employee details, compensation breakdown,
        deductions, and voucher metadata.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        e.employee_code,
                        e.full_name AS employee_name,
                        e.role,
                        e.compensation_model,
                        e.national_id,
                        e.phone,
                        e.email,
                        e.bank_account_details,
                        pr.branch_id,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        pr.month_period,
                        pr.run_date,
                        pr.status AS run_status,
                        app_e.full_name AS approved_by_name
                    FROM payroll_items pi
                    JOIN payroll_runs pr ON pi.payroll_run_id = pr.payroll_run_id
                    JOIN branches b ON pr.branch_id = b.branch_id
                    JOIN employees e ON pi.employee_id = e.employee_id
                    LEFT JOIN employees app_e ON pr.approved_by_employee_id = app_e.employee_id
                    WHERE pi.payroll_item_id = %s;
                """
                cursor.execute(query, (payroll_item_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching payslip for item {payroll_item_id}: {e}")
            return None


class PayrollManager:
    """
    Manages HR monthly payroll runs, automated batch compensation calculation,
    review approvals, and disbursement ledger reconciliation.
    """

    SAFE_COLUMNS = (
        "pr.payroll_run_id, pr.branch_id, pr.month_period, pr.run_date, "
        "pr.admin_subtotal, pr.teachers_subtotal, pr.coaches_subtotal, "
        "pr.total_disbursed, pr.status, pr.approved_by_employee_id, "
        "pr.notes, pr.created_at, pr.updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance
        self.item_manager = PayrollItemManager(db_instance)

    def get_all(
        self,
        branch_id: Optional[str] = None,
        month_period: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves payroll runs with branch and approval metadata."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        app_e.full_name AS approved_by_name,
                        COUNT(pi.payroll_item_id) AS items_count
                    FROM payroll_runs pr
                    JOIN branches b ON pr.branch_id = b.branch_id
                    LEFT JOIN employees app_e ON pr.approved_by_employee_id = app_e.employee_id
                    LEFT JOIN payroll_items pi ON pr.payroll_run_id = pi.payroll_run_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND pr.branch_id = %s"
                    params.append(branch_id.strip().upper())
                if month_period:
                    query += " AND pr.month_period = %s"
                    params.append(month_period.strip())
                if status:
                    query += " AND pr.status = %s"
                    params.append(status.strip().upper())

                query += """
                    GROUP BY 
                        pr.payroll_run_id, pr.branch_id, pr.month_period, pr.run_date,
                        pr.admin_subtotal, pr.teachers_subtotal, pr.coaches_subtotal,
                        pr.total_disbursed, pr.status, pr.approved_by_employee_id,
                        pr.notes, pr.created_at, pr.updated_at,
                        b.name_ar, b.name_en, app_e.full_name
                    ORDER BY pr.month_period DESC, pr.branch_id ASC
                    LIMIT %s OFFSET %s;
                """
                params.extend([max(1, limit), max(0, offset)])
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching payroll runs: {e}")
            return []

    def get_by_id(self, payroll_run_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single payroll run by ID with detailed joined metadata."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        app_e.full_name AS approved_by_name,
                        COUNT(pi.payroll_item_id) AS items_count
                    FROM payroll_runs pr
                    JOIN branches b ON pr.branch_id = b.branch_id
                    LEFT JOIN employees app_e ON pr.approved_by_employee_id = app_e.employee_id
                    LEFT JOIN payroll_items pi ON pr.payroll_run_id = pi.payroll_run_id
                    WHERE pr.payroll_run_id = %s
                    GROUP BY 
                        pr.payroll_run_id, pr.branch_id, pr.month_period, pr.run_date,
                        pr.admin_subtotal, pr.teachers_subtotal, pr.coaches_subtotal,
                        pr.total_disbursed, pr.status, pr.approved_by_employee_id,
                        pr.notes, pr.created_at, pr.updated_at,
                        b.name_ar, b.name_en, app_e.full_name;
                """
                cursor.execute(query, (payroll_run_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching payroll run {payroll_run_id}: {e}")
            return None

    def get_by_branch_and_period(self, branch_id: str, month_period: str) -> Optional[Dict[str, Any]]:
        """Retrieves payroll run for a branch and month (YYYY-MM)."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT {self.SAFE_COLUMNS}
                    FROM payroll_runs pr
                    WHERE pr.branch_id = %s AND pr.month_period = %s;
                """
                cursor.execute(query, (branch_id.strip().upper(), month_period.strip()))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching payroll run for {branch_id} - {month_period}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        month_period: str,
        run_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a new draft payroll run for a branch and month period.
        Unique constraint on (branch_id, month_period) prevents duplicate runs.
        """
        clean_branch = branch_id.strip().upper()
        clean_month = month_period.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Verify branch exists
                cursor.execute("SELECT branch_id FROM branches WHERE branch_id = %s;", (clean_branch,))
                if not cursor.fetchone():
                    logger.warning(f"Branch '{clean_branch}' not found for payroll run creation.")
                    return None

                # Check existing run
                cursor.execute(
                    "SELECT payroll_run_id FROM payroll_runs WHERE branch_id = %s AND month_period = %s;",
                    (clean_branch, clean_month),
                )
                if cursor.fetchone():
                    logger.warning(f"Payroll run already exists for {clean_branch} {clean_month}.")
                    return None

                query = """
                    INSERT INTO payroll_runs (
                        branch_id, month_period, run_date,
                        admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed,
                        status, notes
                    )
                    VALUES (%s, %s, %s, 0.00, 0.00, 0.00, 0.00, 'DRAFT', %s)
                    RETURNING 
                        payroll_run_id, branch_id, month_period, run_date,
                        admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed,
                        status, approved_by_employee_id, notes, created_at, updated_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        clean_month,
                        run_date or date.today(),
                        notes.strip() if notes else None,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating payroll run for {clean_branch} {clean_month}: {e}")
            return None

    def update(
        self,
        payroll_run_id: int,
        run_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates metadata notes or run date on a payroll run."""
        fields: List[str] = []
        params: List[Any] = []

        if run_date is not None:
            fields.append("run_date = %s")
            params.append(run_date)
        if notes is not None:
            fields.append("notes = %s")
            params.append(notes.strip() if notes else None)

        if not fields:
            return self.get_by_id(payroll_run_id)

        fields.append("updated_at = CURRENT_TIMESTAMP")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    UPDATE payroll_runs
                    SET {', '.join(fields)}
                    WHERE payroll_run_id = %s
                    RETURNING 
                        payroll_run_id, branch_id, month_period, run_date,
                        admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed,
                        status, approved_by_employee_id, notes, created_at, updated_at;
                """
                params.append(payroll_run_id)
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating payroll run {payroll_run_id}: {e}")
            return None

    def delete(self, payroll_run_id: int) -> bool:
        """
        Deletes a payroll run. Only allowed if status is 'DRAFT' or 'CANCELLED'
        to safeguard historical disbursement records.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT status FROM payroll_runs WHERE payroll_run_id = %s;", (payroll_run_id,))
                row = cursor.fetchone()
                if not row:
                    return False
                status = row[0] if isinstance(row, (list, tuple)) else row.get("status")

                if status not in ("DRAFT", "CANCELLED"):
                    logger.warning(f"Cannot delete payroll run {payroll_run_id} in '{status}' status.")
                    return False

                cursor.execute("DELETE FROM payroll_runs WHERE payroll_run_id = %s;", (payroll_run_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting payroll run {payroll_run_id}: {e}")
            return False

    def calculate_payroll(self, payroll_run_id: int) -> Optional[Dict[str, Any]]:
        """
        Automated Batch Calculation:
        1. Reads active employees for the run's branch.
        2. Evaluates compensation rules based on each employee's compensation model:
           - FIXED_MONTHLY: Base salary.
           - PER_HEADCOUNT: Active group headcounts led by instructor * headcount rate.
           - PER_SESSION: Completed sessions in the month period * session rate.
           - HOURLY: Completed session hours in the month period * hourly rate.
           - HYBRID: Base salary + headcount bonus + session earnings.
        3. Inserts or updates payroll_items for each employee.
        4. Recalculates department subtotals and updates run status to 'CALCULATED'.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # 1. Fetch Run
                cursor.execute(
                    "SELECT payroll_run_id, branch_id, month_period, status FROM payroll_runs WHERE payroll_run_id = %s;",
                    (payroll_run_id,)
                )
                run_row = cursor.fetchone()
                if not run_row:
                    return None
                r_id = run_row[0] if isinstance(run_row, (list, tuple)) else run_row.get("payroll_run_id")
                branch_id = run_row[1] if isinstance(run_row, (list, tuple)) else run_row.get("branch_id")
                month_period = run_row[2] if isinstance(run_row, (list, tuple)) else run_row.get("month_period")
                status = run_row[3] if isinstance(run_row, (list, tuple)) else run_row.get("status")

                if status in ("DISBURSED", "CANCELLED"):
                    logger.warning(f"Cannot recalculate payroll run {payroll_run_id} with status '{status}'.")
                    return None

                # 2. Query all active employees for this branch
                cursor.execute(
                    """
                    SELECT 
                        employee_id, employee_code, full_name, role,
                        compensation_model, base_salary
                    FROM employees
                    WHERE branch_id = %s AND is_active = TRUE
                    ORDER BY employee_id ASC;
                    """,
                    (branch_id,)
                )
                employees = _dict_fetchall(cursor)

                # 3. Process each employee
                for emp in employees:
                    emp_id = emp["employee_id"]
                    comp_model = (emp["compensation_model"] or "FIXED_MONTHLY").strip().upper()
                    base_salary = float(emp["base_salary"] or 0.0)

                    base_amount = 0.0
                    headcount_count = 0
                    headcount_bonus = 0.0
                    session_count = 0
                    variable_session_amount = 0.0

                    if comp_model == "FIXED_MONTHLY":
                        base_amount = base_salary

                    elif comp_model == "PER_HEADCOUNT":
                        # Tally enrolled student headcounts in active groups led by this teacher
                        cursor.execute(
                            """
                            SELECT COALESCE(SUM(current_headcount), 0)
                            FROM groups
                            WHERE branch_id = %s 
                              AND (lead_teacher_id = %s OR secondary_teacher_id = %s)
                              AND status = 'ACTIVE';
                            """,
                            (branch_id, emp_id, emp_id)
                        )
                        hc_row = cursor.fetchone()
                        headcount_count = int(hc_row[0] if hc_row else 0)

                        # Lookup coach wage matrix rate per student if available, else use base_salary as per-head rate
                        cursor.execute(
                            """
                            SELECT rate_per_student 
                            FROM coach_wage_matrices 
                            WHERE branch_id = %s AND is_active = TRUE 
                            ORDER BY wage_matrix_id DESC LIMIT 1;
                            """,
                            (branch_id,)
                        )
                        wm_row = cursor.fetchone()
                        per_head_rate = float(wm_row[0]) if wm_row and wm_row[0] is not None else base_salary
                        headcount_bonus = round(headcount_count * per_head_rate, 2)

                    elif comp_model == "PER_SESSION":
                        # Tally completed sessions conducted by instructor in this month
                        cursor.execute(
                            """
                            SELECT COUNT(*)
                            FROM completed_sessions
                            WHERE branch_id = %s 
                              AND instructor_id = %s 
                              AND TO_CHAR(session_date, 'YYYY-MM') = %s;
                            """,
                            (branch_id, emp_id, month_period)
                        )
                        sess_row = cursor.fetchone()
                        session_count = int(sess_row[0] if sess_row else 0)

                        # Lookup session rate
                        cursor.execute(
                            """
                            SELECT rate_per_session 
                            FROM coach_wage_matrices 
                            WHERE branch_id = %s AND is_active = TRUE 
                            ORDER BY wage_matrix_id DESC LIMIT 1;
                            """,
                            (branch_id,)
                        )
                        wm_row = cursor.fetchone()
                        sess_rate = float(wm_row[0]) if wm_row and wm_row[0] is not None else base_salary
                        variable_session_amount = round(session_count * sess_rate, 2)

                    elif comp_model == "HOURLY":
                        cursor.execute(
                            """
                            SELECT COUNT(*), COALESCE(SUM(duration_hours), 0)
                            FROM completed_sessions
                            WHERE branch_id = %s 
                              AND instructor_id = %s 
                              AND TO_CHAR(session_date, 'YYYY-MM') = %s;
                            """,
                            (branch_id, emp_id, month_period)
                        )
                        sess_row = cursor.fetchone()
                        session_count = int(sess_row[0] if sess_row else 0)
                        hours = float(sess_row[1] if sess_row else 0.0)
                        variable_session_amount = round(hours * base_salary, 2)

                    elif comp_model == "HYBRID":
                        base_amount = base_salary
                        # Count headcounts
                        cursor.execute(
                            """
                            SELECT COALESCE(SUM(current_headcount), 0)
                            FROM groups
                            WHERE branch_id = %s 
                              AND (lead_teacher_id = %s OR secondary_teacher_id = %s)
                              AND status = 'ACTIVE';
                            """,
                            (branch_id, emp_id, emp_id)
                        )
                        hc_row = cursor.fetchone()
                        headcount_count = int(hc_row[0] if hc_row else 0)

                        # Count sessions
                        cursor.execute(
                            """
                            SELECT COUNT(*)
                            FROM completed_sessions
                            WHERE branch_id = %s 
                              AND instructor_id = %s 
                              AND TO_CHAR(session_date, 'YYYY-MM') = %s;
                            """,
                            (branch_id, emp_id, month_period)
                        )
                        sess_row = cursor.fetchone()
                        session_count = int(sess_row[0] if sess_row else 0)

                    else:
                        base_amount = base_salary

                    # Upsert into payroll_items
                    cursor.execute(
                        "SELECT payroll_item_id FROM payroll_items WHERE payroll_run_id = %s AND employee_id = %s;",
                        (payroll_run_id, emp_id)
                    )
                    existing_item = cursor.fetchone()

                    if existing_item:
                        item_id = existing_item[0] if isinstance(existing_item, (list, tuple)) else existing_item.get("payroll_item_id")
                        cursor.execute(
                            """
                            UPDATE payroll_items
                            SET base_amount = %s,
                                headcount_count = %s,
                                headcount_bonus = %s,
                                session_count = %s,
                                variable_session_amount = %s
                            WHERE payroll_item_id = %s;
                            """,
                            (
                                base_amount,
                                headcount_count,
                                headcount_bonus,
                                session_count,
                                variable_session_amount,
                                item_id,
                            )
                        )
                    else:
                        cursor.execute(
                            """
                            INSERT INTO payroll_items (
                                payroll_run_id, employee_id, base_amount,
                                headcount_count, headcount_bonus, session_count,
                                variable_session_amount, overtime_or_allowance, deductions
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s, 0.00, 0.00);
                            """,
                            (
                                payroll_run_id,
                                emp_id,
                                base_amount,
                                headcount_count,
                                headcount_bonus,
                                session_count,
                                variable_session_amount,
                            )
                        )

                # 4. Sync parent run subtotals
                self.item_manager.sync_parent_run_subtotals(cursor, payroll_run_id)

                # 5. Transition status to CALCULATED
                cursor.execute(
                    """
                    UPDATE payroll_runs
                    SET status = 'CALCULATED',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE payroll_run_id = %s;
                    """,
                    (payroll_run_id,)
                )
                conn.commit()

            return self.get_by_id(payroll_run_id)
        except Exception as e:
            logger.error(f"Error calculating payroll run {payroll_run_id}: {e}")
            return None

    def approve_payroll(
        self,
        payroll_run_id: int,
        approved_by_employee_id: int,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Approves a calculated or draft payroll run by an authorized director/administrator.
        Transitions status to 'APPROVED'.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Verify run status
                cursor.execute(
                    "SELECT status FROM payroll_runs WHERE payroll_run_id = %s;",
                    (payroll_run_id,)
                )
                row = cursor.fetchone()
                if not row:
                    return None
                current_status = row[0] if isinstance(row, (list, tuple)) else row.get("status")

                if current_status not in ("DRAFT", "CALCULATED"):
                    logger.warning(f"Cannot approve payroll run {payroll_run_id} in '{current_status}' status.")
                    return None

                # Verify approver employee exists
                cursor.execute(
                    "SELECT employee_id FROM employees WHERE employee_id = %s;",
                    (approved_by_employee_id,)
                )
                if not cursor.fetchone():
                    logger.warning(f"Approver employee ID {approved_by_employee_id} not found.")
                    return None

                query = """
                    UPDATE payroll_runs
                    SET status = 'APPROVED',
                        approved_by_employee_id = %s,
                        notes = COALESCE(%s, notes),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE payroll_run_id = %s
                    RETURNING 
                        payroll_run_id, branch_id, month_period, run_date,
                        admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed,
                        status, approved_by_employee_id, notes, created_at, updated_at;
                """
                cursor.execute(query, (approved_by_employee_id, notes.strip() if notes else None, payroll_run_id))
                updated = _dict_fetchone(cursor)
                conn.commit()
                return updated
        except Exception as e:
            logger.error(f"Error approving payroll run {payroll_run_id}: {e}")
            return None

    def disburse_payroll(
        self,
        payroll_run_id: int,
        disbursement_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Disburses the approved payroll run:
        - Issues individual payment vouchers (PAY-{BRANCH}-{YYYY-MM}-{EMP_CODE}) for items without vouchers.
        - Stamps disbursement date (defaults to current date).
        - Transitions run status to 'DISBURSED'.
        """
        d_date = disbursement_date or date.today()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # 1. Fetch run details
                cursor.execute(
                    "SELECT branch_id, month_period, status FROM payroll_runs WHERE payroll_run_id = %s;",
                    (payroll_run_id,)
                )
                row = cursor.fetchone()
                if not row:
                    return None
                branch_id = row[0] if isinstance(row, (list, tuple)) else row.get("branch_id")
                month_period = row[1] if isinstance(row, (list, tuple)) else row.get("month_period")
                current_status = row[2] if isinstance(row, (list, tuple)) else row.get("status")

                if current_status not in ("APPROVED", "CALCULATED"):
                    logger.warning(f"Cannot disburse payroll run {payroll_run_id} in '{current_status}' status.")
                    return None

                # 2. Fetch all items to stamp vouchers and disbursement dates
                cursor.execute(
                    """
                    SELECT pi.payroll_item_id, pi.employee_id, pi.payment_voucher_no, e.employee_code
                    FROM payroll_items pi
                    JOIN employees e ON pi.employee_id = e.employee_id
                    WHERE pi.payroll_run_id = %s;
                    """,
                    (payroll_run_id,)
                )
                items = _dict_fetchall(cursor)

                for itm in items:
                    v_no = itm.get("payment_voucher_no")
                    if not v_no:
                        v_no = self.item_manager._generate_voucher_no(
                            branch_id, month_period, itm.get("employee_code"), itm["employee_id"]
                        )
                    cursor.execute(
                        """
                        UPDATE payroll_items
                        SET payment_voucher_no = %s,
                            disbursement_date = %s
                        WHERE payroll_item_id = %s;
                        """,
                        (v_no, d_date, itm["payroll_item_id"])
                    )

                # 3. Update parent run
                query = """
                    UPDATE payroll_runs
                    SET status = 'DISBURSED',
                        notes = COALESCE(%s, notes),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE payroll_run_id = %s
                    RETURNING 
                        payroll_run_id, branch_id, month_period, run_date,
                        admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed,
                        status, approved_by_employee_id, notes, created_at, updated_at;
                """
                cursor.execute(query, (notes.strip() if notes else None, payroll_run_id))
                updated = _dict_fetchone(cursor)
                conn.commit()
                return updated
        except Exception as e:
            logger.error(f"Error disbursing payroll run {payroll_run_id}: {e}")
            return None

    def cancel_payroll(self, payroll_run_id: int, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Cancels a payroll run. Transitions status to 'CANCELLED'.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT status FROM payroll_runs WHERE payroll_run_id = %s;", (payroll_run_id,))
                row = cursor.fetchone()
                if not row:
                    return None
                current_status = row[0] if isinstance(row, (list, tuple)) else row.get("status")

                if current_status == "DISBURSED":
                    logger.warning(f"Cannot cancel already disbursed payroll run {payroll_run_id}.")
                    return None

                query = """
                    UPDATE payroll_runs
                    SET status = 'CANCELLED',
                        notes = COALESCE(%s, notes),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE payroll_run_id = %s
                    RETURNING 
                        payroll_run_id, branch_id, month_period, run_date,
                        admin_subtotal, teachers_subtotal, coaches_subtotal, total_disbursed,
                        status, approved_by_employee_id, notes, created_at, updated_at;
                """
                cursor.execute(query, (notes.strip() if notes else None, payroll_run_id))
                updated = _dict_fetchone(cursor)
                conn.commit()
                return updated
        except Exception as e:
            logger.error(f"Error cancelling payroll run {payroll_run_id}: {e}")
            return None

    def get_monthly_cost_summary(self, branch_id: Optional[str] = None, year: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Aggregated monthly payroll expenditures summary:
        Returns admin, teacher, coach subtotals and total disbursements per month.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        pr.month_period,
                        COUNT(pr.payroll_run_id) AS total_runs,
                        SUM(pr.admin_subtotal) AS total_admin_subtotal,
                        SUM(pr.teachers_subtotal) AS total_teachers_subtotal,
                        SUM(pr.coaches_subtotal) AS total_coaches_subtotal,
                        SUM(pr.total_disbursed) AS total_payroll_expenditure
                    FROM payroll_runs pr
                    WHERE pr.status IN ('CALCULATED', 'APPROVED', 'DISBURSED')
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND pr.branch_id = %s"
                    params.append(branch_id.strip().upper())
                if year:
                    query += " AND pr.month_period LIKE %s"
                    params.append(f"{year.strip()}%")

                query += " GROUP BY pr.month_period ORDER BY pr.month_period DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching monthly payroll cost summary: {e}")
            return []
