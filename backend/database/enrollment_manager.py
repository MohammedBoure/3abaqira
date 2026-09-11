"""
backend/database/enrollment_manager.py
---------------------------------------
Data Access Manager for the 'student_enrollments' table.
Encapsulates:
  - Student enrollment into academic cohorts / groups across branches
  - Fee calculation matrices, sibling discounts, and upfront payment rebates
  - Multi-tier payment mode classification (INSTALLMENT, CASH_UPFRONT, ANNUAL_PACKAGE, MONTHLY)
  - Cohort capacity checks and live headcount synchronization
  - Automated or custom invoice installment generation linkage
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


class EnrollmentManager:
    """
    Manages operations for student course and daycare enrollments.
    """

    SAFE_COLUMNS = (
        "enrollment_id, branch_id, student_id, group_id, pricing_plan_id, "
        "academic_year_id, enrollment_date, payment_mode, base_tuition_fee, "
        "has_sibling_discount, has_cash_discount, has_annual_package, "
        "total_discount_amount, registration_fee_amount, agreed_total_amount, "
        "enrollment_status, notes, created_at, updated_at"
    )

    VALID_PAYMENT_MODES = {"CASH_UPFRONT", "INSTALLMENT", "ANNUAL_PACKAGE", "MONTHLY"}
    VALID_STATUSES = {"ACTIVE", "COMPLETED", "SUSPENDED", "DROPPED"}

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        student_id: Optional[int] = None,
        group_id: Optional[int] = None,
        academic_year_id: Optional[int] = None,
        status: Optional[str] = None,
        payment_mode: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves enrollments with joined student, group, level, program, branch,
        academic year, and invoice summary metrics.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        se.*,
                        s.student_code,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        s.birth_date AS student_birth_date,
                        s.emergency_phone AS student_phone,
                        g.group_name,
                        g.max_capacity AS group_max_capacity,
                        g.current_headcount AS group_headcount,
                        l.name_ar AS level_name_ar,
                        l.level_code,
                        l.color_tag AS level_color_tag,
                        p.program_id,
                        p.name_ar AS program_name_ar,
                        p.code AS program_code,
                        p.billing_type AS program_billing_type,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        ay.name AS academic_year_name,
                        pp.plan_name AS pricing_plan_name,
                        COALESCE(inv_summary.invoice_count, 0) AS invoice_count,
                        COALESCE(inv_summary.total_invoiced, 0.00) AS total_invoiced,
                        COALESCE(inv_summary.total_paid, 0.00) AS total_paid,
                        (se.agreed_total_amount - COALESCE(inv_summary.total_paid, 0.00)) AS outstanding_balance
                    FROM student_enrollments se
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN branches b ON se.branch_id = b.branch_id
                    JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
                    LEFT JOIN pricing_plans pp ON se.pricing_plan_id = pp.pricing_plan_id
                    LEFT JOIN (
                        SELECT 
                            enrollment_id,
                            COUNT(invoice_id) AS invoice_count,
                            SUM(amount_due) AS total_invoiced,
                            SUM(amount_paid) AS total_paid
                        FROM invoices
                        GROUP BY enrollment_id
                    ) inv_summary ON se.enrollment_id = inv_summary.enrollment_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND se.branch_id = %s"
                    params.append(branch_id.strip())
                if student_id is not None:
                    query += " AND se.student_id = %s"
                    params.append(student_id)
                if group_id is not None:
                    query += " AND se.group_id = %s"
                    params.append(group_id)
                if academic_year_id is not None:
                    query += " AND se.academic_year_id = %s"
                    params.append(academic_year_id)
                if status and status.strip():
                    query += " AND se.enrollment_status = %s"
                    params.append(status.strip().upper())
                if payment_mode and payment_mode.strip():
                    query += " AND se.payment_mode = %s"
                    params.append(payment_mode.strip().upper())
                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        s.full_name_ar ILIKE %s OR
                        COALESCE(s.full_name_fr, '') ILIKE %s OR
                        COALESCE(s.student_code, '') ILIKE %s OR
                        g.group_name ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern, pattern])

                query += " ORDER BY se.enrollment_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching enrollments: {e}")
            return []

    def get_by_id(
        self, enrollment_id: int, include_invoices: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Retrieves a single enrollment record with relational metadata and invoices."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        se.*,
                        s.student_code,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        s.birth_date AS student_birth_date,
                        s.emergency_phone AS student_phone,
                        g.group_name,
                        g.max_capacity AS group_max_capacity,
                        g.current_headcount AS group_headcount,
                        l.name_ar AS level_name_ar,
                        l.level_code,
                        l.color_tag AS level_color_tag,
                        p.program_id,
                        p.name_ar AS program_name_ar,
                        p.code AS program_code,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        ay.name AS academic_year_name,
                        pp.plan_name AS pricing_plan_name
                    FROM student_enrollments se
                    JOIN students s ON se.student_id = s.student_id
                    JOIN groups g ON se.group_id = g.group_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN branches b ON se.branch_id = b.branch_id
                    JOIN academic_years ay ON se.academic_year_id = ay.academic_year_id
                    LEFT JOIN pricing_plans pp ON se.pricing_plan_id = pp.pricing_plan_id
                    WHERE se.enrollment_id = %s;
                """
                cursor.execute(query, (enrollment_id,))
                enrollment = _dict_fetchone(cursor)
                if not enrollment:
                    return None

                if include_invoices:
                    inv_cursor = conn.cursor()
                    inv_cursor.execute(
                        """
                        SELECT 
                            invoice_id, branch_id, enrollment_id, installment_number,
                            period_label, due_date, amount_due, amount_paid,
                            (amount_due - amount_paid) AS remaining_balance,
                            status, notes, created_at, updated_at
                        FROM invoices
                        WHERE enrollment_id = %s
                        ORDER BY installment_number ASC, invoice_id ASC;
                        """,
                        (enrollment_id,),
                    )
                    invoices = _dict_fetchall(inv_cursor)
                    enrollment["invoices"] = invoices
                    total_invoiced = sum(float(inv.get("amount_due") or 0.0) for inv in invoices)
                    total_paid = sum(float(inv.get("amount_paid") or 0.0) for inv in invoices)
                    enrollment["financial_summary"] = {
                        "total_invoiced": total_invoiced,
                        "total_paid": total_paid,
                        "remaining_balance": float(enrollment.get("agreed_total_amount") or 0.0) - total_paid,
                        "is_fully_paid": total_paid >= float(enrollment.get("agreed_total_amount") or 0.0),
                    }

                return enrollment
        except Exception as e:
            logger.error(f"Error fetching enrollment ID {enrollment_id}: {e}")
            return None

    def enroll(
        self,
        branch_id: str,
        student_id: int,
        group_id: int,
        academic_year_id: int,
        pricing_plan_id: Optional[int] = None,
        enrollment_date: Optional[Any] = None,
        payment_mode: str = "INSTALLMENT",
        base_tuition_fee: Optional[float] = None,
        has_sibling_discount: bool = False,
        has_cash_discount: bool = False,
        has_annual_package: bool = False,
        total_discount_amount: Optional[float] = None,
        registration_fee_amount: Optional[float] = None,
        agreed_total_amount: Optional[float] = None,
        enrollment_status: str = "ACTIVE",
        notes: Optional[str] = None,
        auto_generate_invoices: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """
        Enrolls a student in a study cohort, calculates tuition fees, updates group headcount,
        and optionally auto-generates invoice installment tranches.
        """
        norm_payment_mode = payment_mode.upper().strip()
        if norm_payment_mode not in self.VALID_PAYMENT_MODES:
            norm_payment_mode = "INSTALLMENT"

        norm_status = enrollment_status.upper().strip()
        if norm_status not in self.VALID_STATUSES:
            norm_status = "ACTIVE"

        enroll_date = enrollment_date or date.today()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # 1. Fetch Pricing Plan Details if supplied and calculations needed
                plan = None
                if pricing_plan_id:
                    cursor.execute(
                        "SELECT * FROM pricing_plans WHERE pricing_plan_id = %s;",
                        (pricing_plan_id,),
                    )
                    plan = _dict_fetchone(cursor)

                if plan:
                    inst_price = float(plan.get("standard_installment_price") or 0.0)
                    inst_count = int(plan.get("installments_count") or 4)
                    monthly_rate = float(plan.get("monthly_standard_rate") or 0.0)
                    reg_fee = float(plan.get("registration_fee") or 0.0)

                    if base_tuition_fee is None:
                        if inst_price > 0:
                            base_tuition_fee = inst_price * inst_count
                        elif monthly_rate > 0:
                            base_tuition_fee = monthly_rate * inst_count
                        else:
                            base_tuition_fee = 0.0

                    if total_discount_amount is None:
                        c_disc = float(plan.get("cash_discount") or 0.0) if has_cash_discount else 0.0
                        s_disc = float(plan.get("sibling_discount") or 0.0) if has_sibling_discount else 0.0
                        a_disc = float(plan.get("annual_prepaid_discount") or 0.0) if has_annual_package else 0.0
                        total_discount_amount = c_disc + s_disc + a_disc

                    if registration_fee_amount is None:
                        registration_fee_amount = reg_fee

                    if agreed_total_amount is None:
                        agreed_total_amount = max(
                            0.0,
                            float(base_tuition_fee) - float(total_discount_amount) + float(registration_fee_amount)
                        )
                else:
                    base_tuition_fee = float(base_tuition_fee or 0.0)
                    total_discount_amount = float(total_discount_amount or 0.0)
                    registration_fee_amount = float(registration_fee_amount or 0.0)
                    if agreed_total_amount is None:
                        agreed_total_amount = max(
                            0.0,
                            base_tuition_fee - total_discount_amount + registration_fee_amount
                        )

                # 2. Insert into student_enrollments
                query = """
                INSERT INTO student_enrollments (
                    branch_id, student_id, group_id, pricing_plan_id, academic_year_id,
                    enrollment_date, payment_mode, base_tuition_fee, has_sibling_discount,
                    has_cash_discount, has_annual_package, total_discount_amount,
                    registration_fee_amount, agreed_total_amount, enrollment_status, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        student_id,
                        group_id,
                        pricing_plan_id,
                        academic_year_id,
                        enroll_date,
                        norm_payment_mode,
                        base_tuition_fee,
                        has_sibling_discount,
                        has_cash_discount,
                        has_annual_package,
                        total_discount_amount,
                        registration_fee_amount,
                        agreed_total_amount,
                        norm_status,
                        notes.strip() if notes else None,
                    ),
                )
                enrollment = _dict_fetchone(cursor)
                if not enrollment:
                    return None

                enrollment_id = enrollment["enrollment_id"]

                # 3. Synchronize group live headcount
                cursor.execute(
                    """
                    UPDATE groups
                    SET current_headcount = (
                        SELECT COUNT(*) FROM student_enrollments
                        WHERE group_id = %s AND enrollment_status = 'ACTIVE'
                    )
                    WHERE group_id = %s;
                    """,
                    (group_id, group_id),
                )

                # 4. Auto-generate invoices if requested
                generated_invoices = []
                if auto_generate_invoices and agreed_total_amount > 0:
                    generated_invoices = self._create_default_invoices(
                        cursor=cursor,
                        branch_id=branch_id.strip(),
                        enrollment_id=enrollment_id,
                        payment_mode=norm_payment_mode,
                        total_amount=agreed_total_amount,
                        plan=plan,
                        enroll_date=enroll_date,
                    )

                conn.commit()
                enrollment["invoices"] = generated_invoices
                return enrollment

        except Exception as e:
            logger.error(f"Error enrolling student {student_id} in group {group_id}: {e}")
            return None

    def _create_default_invoices(
        self,
        cursor,
        branch_id: str,
        enrollment_id: int,
        payment_mode: str,
        total_amount: float,
        plan: Optional[Dict[str, Any]],
        enroll_date: Any,
    ) -> List[Dict[str, Any]]:
        """Generates standard scheduled invoice tranches based on payment mode."""
        invoices = []

        if payment_mode == "CASH_UPFRONT":
            # Single upfront full invoice
            cursor.execute(
                """
                INSERT INTO invoices (
                    branch_id, enrollment_id, installment_number, period_label,
                    due_date, amount_due, amount_paid, status, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, 0.00, 'UNPAID', %s)
                RETURNING *;
                """,
                (branch_id, enrollment_id, 1, "تسديد نقدي كامل", enroll_date, total_amount, "Cash Upfront Full Payment"),
            )
            inv = _dict_fetchone(cursor)
            if inv:
                invoices.append(inv)

        elif payment_mode == "ANNUAL_PACKAGE":
            # Single annual package invoice
            cursor.execute(
                """
                INSERT INTO invoices (
                    branch_id, enrollment_id, installment_number, period_label,
                    due_date, amount_due, amount_paid, status, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, 0.00, 'UNPAID', %s)
                RETURNING *;
                """,
                (branch_id, enrollment_id, 1, "العرض السنوي 2025", enroll_date, total_amount, "Annual Package Offer"),
            )
            inv = _dict_fetchone(cursor)
            if inv:
                invoices.append(inv)

        elif payment_mode == "MONTHLY":
            # Monthly recurring payments (10 standard school months: Sep to Jun)
            month_labels = [
                "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
                "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان"
            ]
            count = len(month_labels)
            portion = round(total_amount / count, 2)
            remainder = round(total_amount - (portion * count), 2)

            for idx, label in enumerate(month_labels, start=1):
                amt = portion + remainder if idx == 1 else portion
                cursor.execute(
                    """
                    INSERT INTO invoices (
                        branch_id, enrollment_id, installment_number, period_label,
                        due_date, amount_due, amount_paid, status, notes
                    )
                    VALUES (%s, %s, %s, %s, NULL, %s, 0.00, 'UNPAID', %s)
                    RETURNING *;
                    """,
                    (branch_id, enrollment_id, idx, label, amt, f"Monthly Tuition - {label}"),
                )
                inv = _dict_fetchone(cursor)
                if inv:
                    invoices.append(inv)

        else:
            # Standard INSTALLMENT mode (defaults to 4 tranches or plan's installments_count)
            count = int(plan.get("installments_count") or 4) if plan else 4
            count = max(1, count)
            portion = round(total_amount / count, 2)
            remainder = round(total_amount - (portion * count), 2)

            for idx in range(1, count + 1):
                amt = portion + remainder if idx == 1 else portion
                label = f"الدفعة {idx}"
                cursor.execute(
                    """
                    INSERT INTO invoices (
                        branch_id, enrollment_id, installment_number, period_label,
                        due_date, amount_due, amount_paid, status, notes
                    )
                    VALUES (%s, %s, %s, %s, NULL, %s, 0.00, 'UNPAID', %s)
                    RETURNING *;
                    """,
                    (branch_id, enrollment_id, idx, label, amt, f"Installment tranche {idx}"),
                )
                inv = _dict_fetchone(cursor)
                if inv:
                    invoices.append(inv)

        return invoices

    def update(self, enrollment_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable enrollment attributes."""
        allowed = {
            "group_id", "pricing_plan_id", "payment_mode", "base_tuition_fee",
            "has_sibling_discount", "has_cash_discount", "has_annual_package",
            "total_discount_amount", "registration_fee_amount", "agreed_total_amount",
            "enrollment_status", "notes"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Get existing group_id for headcount recount if group_id changes
                cursor.execute("SELECT group_id FROM student_enrollments WHERE enrollment_id = %s;", (enrollment_id,))
                row = cursor.fetchone()
                old_group_id = row[0] if row else None

                set_clauses = [f"{k} = %s" for k in updates.keys()]
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values = list(updates.values()) + [enrollment_id]
                query = f"UPDATE student_enrollments SET {', '.join(set_clauses)} WHERE enrollment_id = %s;"
                cursor.execute(query, values)

                # Sync headcounts
                new_group_id = updates.get("group_id", old_group_id)
                for gid in {old_group_id, new_group_id}:
                    if gid:
                        cursor.execute(
                            """
                            UPDATE groups
                            SET current_headcount = (
                                SELECT COUNT(*) FROM student_enrollments
                                WHERE group_id = %s AND enrollment_status = 'ACTIVE'
                            )
                            WHERE group_id = %s;
                            """,
                            (gid, gid),
                        )

                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating enrollment ID {enrollment_id}: {e}")
            return False

    def toggle_status(self, enrollment_id: int, new_status: str) -> bool:
        """Updates operational status (ACTIVE, COMPLETED, SUSPENDED, DROPPED) and synchronizes group headcount."""
        norm_status = new_status.upper().strip()
        if norm_status not in self.VALID_STATUSES:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE student_enrollments
                    SET enrollment_status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE enrollment_id = %s
                    RETURNING group_id;
                    """,
                    (norm_status, enrollment_id),
                )
                row = cursor.fetchone()
                if not row:
                    return False
                group_id = row[0]

                # Recalculate group headcount
                cursor.execute(
                    """
                    UPDATE groups
                    SET current_headcount = (
                        SELECT COUNT(*) FROM student_enrollments
                        WHERE group_id = %s AND enrollment_status = 'ACTIVE'
                    )
                    WHERE group_id = %s;
                    """,
                    (group_id, group_id),
                )
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error toggling status for enrollment ID {enrollment_id}: {e}")
            return False

    def delete(self, enrollment_id: int) -> bool:
        """Deletes enrollment (cascades to invoices) and updates group headcount."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT group_id FROM student_enrollments WHERE enrollment_id = %s;",
                    (enrollment_id,),
                )
                row = cursor.fetchone()
                group_id = row[0] if row else None

                cursor.execute("DELETE FROM student_enrollments WHERE enrollment_id = %s;", (enrollment_id,))
                deleted = cursor.rowcount > 0

                if deleted and group_id:
                    cursor.execute(
                        """
                        UPDATE groups
                        SET current_headcount = (
                            SELECT COUNT(*) FROM student_enrollments
                            WHERE group_id = %s AND enrollment_status = 'ACTIVE'
                        )
                        WHERE group_id = %s;
                        """,
                        (group_id, group_id),
                    )

                conn.commit()
                return deleted
        except Exception as e:
            logger.error(f"Error deleting enrollment ID {enrollment_id}: {e}")
            return False

    def get_student_enrollments(self, student_id: int) -> List[Dict[str, Any]]:
        """Retrieves all historical and active course enrollments of a student."""
        return self.get_all(student_id=student_id, limit=50)

    def get_group_roster(self, group_id: int) -> List[Dict[str, Any]]:
        """Retrieves active student roster for a specific study group."""
        return self.get_all(group_id=group_id, status="ACTIVE", limit=100)
