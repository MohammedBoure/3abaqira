"""
backend/database/competition_manager.py
---------------------------------------
Data Access Managers for:
  - 'competitions' (المسابقات والفعاليات الخاصة - الأولمبياد، الحساب الذهني، الروبوتيك)
  - 'competition_registrations' (تسجيلات المشاركين، الرسوم والوصولات، وإيرادات الصندوق)
"""

import logging
from datetime import datetime, date
from typing import List, Dict, Optional, Any
from decimal import Decimal

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


VALID_SCOPES = {"NATIONAL", "REGIONAL", "WILAYA", "INTERNAL", "INTERNATIONAL"}
VALID_PAYMENT_STATUSES = {"PAID", "PENDING", "EXEMPT"}


# =============================================================================
# 1. COMPETITION REGISTRATION MANAGER
# =============================================================================

class CompetitionRegistrationManager:
    """
    Manages student & external candidate competition registrations,
    receipt generation (CMP-BRANCH-YYYY-XXXXX), and daily cash drawer intake.
    """

    SAFE_COLUMNS = (
        "r.registration_id, r.competition_id, r.student_id, r.competitor_name, "
        "r.division_level, r.receipt_number, r.fee_amount, r.amount_paid, "
        "r.payment_status, r.register_id, r.notes, r.registered_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def _generate_receipt_number(self, cursor, branch_id: str, reg_date: Any) -> str:
        """Generates sequential competition receipt voucher (CMP-BRANCH-YYYY-00042)."""
        if hasattr(reg_date, "year"):
            year = reg_date.year
        elif isinstance(reg_date, str) and len(reg_date) >= 4:
            try:
                year = int(reg_date[:4])
            except (ValueError, TypeError):
                year = datetime.now().year
        else:
            year = datetime.now().year

        clean_branch = branch_id.strip().upper()

        cursor.execute(
            """
            SELECT COUNT(*) FROM competition_registrations cr
            JOIN competitions c ON cr.competition_id = c.competition_id
            WHERE c.branch_id = %s AND EXTRACT(YEAR FROM cr.registered_at) = %s;
            """,
            (clean_branch, year),
        )
        row = cursor.fetchone()
        next_seq = (row[0] if row else 0) + 1
        return f"CMP-{clean_branch}-{year}-{next_seq:05d}"

    def get_all(
        self,
        competition_id: Optional[int] = None,
        branch_id: Optional[str] = None,
        student_id: Optional[int] = None,
        payment_status: Optional[str] = None,
        division_level: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves registrations with joined competition, student, and branch details.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        c.name AS competition_name,
                        c.scope AS competition_scope,
                        c.event_date AS competition_date,
                        c.branch_id,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        s.student_code,
                        s.full_name_ar AS student_full_name_ar,
                        s.full_name_fr AS student_full_name_fr
                    FROM competition_registrations r
                    JOIN competitions c ON r.competition_id = c.competition_id
                    JOIN branches b ON c.branch_id = b.branch_id
                    LEFT JOIN students s ON r.student_id = s.student_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if competition_id:
                    query += " AND r.competition_id = %s"
                    params.append(competition_id)
                if branch_id:
                    query += " AND c.branch_id = %s"
                    params.append(branch_id.strip())
                if student_id:
                    query += " AND r.student_id = %s"
                    params.append(student_id)
                if payment_status:
                    query += " AND r.payment_status = %s"
                    params.append(payment_status.strip().upper())
                if division_level:
                    query += " AND r.division_level = %s"
                    params.append(division_level.strip())
                if search:
                    query += " AND (r.competitor_name ILIKE %s OR r.receipt_number ILIKE %s)"
                    search_term = f"%{search.strip()}%"
                    params.extend([search_term, search_term])

                query += " ORDER BY r.registered_at DESC, r.registration_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching competition registrations: {e}")
            return []

    def get_by_id(self, registration_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single registration details by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        c.name AS competition_name,
                        c.scope AS competition_scope,
                        c.event_date AS competition_date,
                        c.branch_id,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        s.student_code,
                        s.full_name_ar AS student_full_name_ar,
                        s.full_name_fr AS student_full_name_fr,
                        dcr.register_date
                    FROM competition_registrations r
                    JOIN competitions c ON r.competition_id = c.competition_id
                    JOIN branches b ON c.branch_id = b.branch_id
                    LEFT JOIN students s ON r.student_id = s.student_id
                    LEFT JOIN daily_cash_registers dcr ON r.register_id = dcr.register_id
                    WHERE r.registration_id = %s;
                """
                cursor.execute(query, (registration_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching registration ID {registration_id}: {e}")
            return None

    def get_by_competition_and_student(self, competition_id: int, student_id: int) -> Optional[Dict[str, Any]]:
        """Checks for existing registration of a student in a competition."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT {self.SAFE_COLUMNS}
                    FROM competition_registrations r
                    WHERE r.competition_id = %s AND r.student_id = %s;
                """
                cursor.execute(query, (competition_id, student_id))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error checking student {student_id} in competition {competition_id}: {e}")
            return None

    def register(
        self,
        competition_id: int,
        competitor_name: Optional[str] = None,
        student_id: Optional[int] = None,
        division_level: Optional[str] = None,
        fee_amount: Optional[float] = None,
        amount_paid: Optional[float] = None,
        payment_status: Optional[str] = None,
        receipt_number: Optional[str] = None,
        register_id: Optional[int] = None,
        payment_method: str = "CASH",
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Enrolls a student or external competitor in a competition:
          1. Validates competition existence and retrieves default fee & branch.
          2. Derives competitor_name from student record if not explicitly provided.
          3. Checks uniqueness constraint (competition_id, student_id).
          4. Computes payment status (PAID, PENDING, EXEMPT).
          5. Generates receipt voucher (CMP-BRANCH-YYYY-XXXXX).
          6. Synchronizes cash register total_revenues if paid in cash.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # 1. Fetch competition metadata
                cursor.execute(
                    """
                    SELECT competition_id, branch_id, registration_fee, is_active
                    FROM competitions WHERE competition_id = %s;
                    """,
                    (competition_id,),
                )
                comp = _dict_fetchone(cursor)
                if not comp:
                    logger.error(f"Competition ID {competition_id} not found.")
                    return None

                branch_id = comp["branch_id"]
                default_fee = float(comp["registration_fee"])

                # 2. Check student existence and derive name if student_id provided
                final_name = competitor_name.strip() if competitor_name else None
                if student_id:
                    cursor.execute(
                        "SELECT student_id, full_name_ar FROM students WHERE student_id = %s;",
                        (student_id,),
                    )
                    stu = _dict_fetchone(cursor)
                    if not stu:
                        logger.error(f"Student ID {student_id} not found.")
                        return None
                    if not final_name:
                        final_name = stu["full_name_ar"]

                    # Check uniqueness
                    cursor.execute(
                        "SELECT registration_id FROM competition_registrations WHERE competition_id = %s AND student_id = %s;",
                        (competition_id, student_id),
                    )
                    if cursor.fetchone():
                        logger.warning(f"Student {student_id} is already registered in competition {competition_id}.")
                        return None

                if not final_name:
                    logger.error("Competitor name is required.")
                    return None

                # 3. Calculate fee and payment status
                final_fee = float(fee_amount if fee_amount is not None else default_fee)
                if final_fee < 0:
                    final_fee = 0.0

                final_paid = float(amount_paid if amount_paid is not None else final_fee)
                if final_paid < 0:
                    final_paid = 0.0

                if payment_status and payment_status.strip().upper() in VALID_PAYMENT_STATUSES:
                    final_status = payment_status.strip().upper()
                else:
                    if final_paid >= final_fee and final_fee > 0:
                        final_status = "PAID"
                    elif final_fee == 0:
                        final_status = "EXEMPT"
                    else:
                        final_status = "PENDING"

                # 4. Generate voucher number if not supplied
                v_no = receipt_number.strip() if receipt_number else None
                if not v_no:
                    v_no = self._generate_receipt_number(cursor, branch_id, date.today())

                # 5. Link to open daily cash register if cash intake
                active_reg_id = register_id
                norm_payment_method = payment_method.upper().strip() if payment_method else "CASH"
                if not active_reg_id and norm_payment_method == "CASH" and final_paid > 0:
                    cursor.execute(
                        """
                        SELECT register_id FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date = %s AND is_closed = FALSE
                        ORDER BY register_id DESC LIMIT 1;
                        """,
                        (branch_id, date.today()),
                    )
                    reg_row = cursor.fetchone()
                    if reg_row:
                        active_reg_id = reg_row[0]

                # 6. Insert registration record
                query = """
                    INSERT INTO competition_registrations (
                        competition_id, student_id, competitor_name, division_level,
                        receipt_number, fee_amount, amount_paid, payment_status,
                        register_id, notes
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        registration_id, competition_id, student_id, competitor_name,
                        division_level, receipt_number, fee_amount, amount_paid,
                        payment_status, register_id, notes, registered_at;
                """
                cursor.execute(
                    query,
                    (
                        competition_id,
                        student_id,
                        final_name,
                        division_level.strip() if division_level else None,
                        v_no,
                        final_fee,
                        final_paid,
                        final_status,
                        active_reg_id,
                        notes.strip() if notes else None,
                    ),
                )
                registration = _dict_fetchone(cursor)
                if not registration:
                    return None

                # 7. Increment cash drawer revenues if paid and drawer active
                if active_reg_id and final_paid > 0 and norm_payment_method == "CASH":
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_revenues = total_revenues + %s, updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (final_paid, active_reg_id),
                    )

                conn.commit()
                return registration
        except Exception as e:
            logger.error(f"Error registering competitor for competition {competition_id}: {e}")
            return None

    def update(
        self,
        registration_id: int,
        competitor_name: Optional[str] = None,
        division_level: Optional[str] = None,
        fee_amount: Optional[float] = None,
        amount_paid: Optional[float] = None,
        payment_status: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates registration details with differential drawer adjustment."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                current = self.get_by_id(registration_id)
                if not current:
                    return None

                fields: List[str] = []
                params: List[Any] = []

                if competitor_name is not None:
                    fields.append("competitor_name = %s")
                    params.append(competitor_name.strip())
                if division_level is not None:
                    fields.append("division_level = %s")
                    params.append(division_level.strip())
                if fee_amount is not None:
                    if fee_amount < 0:
                        return None
                    fields.append("fee_amount = %s")
                    params.append(float(fee_amount))

                # Handle payment amount difference
                new_paid = float(amount_paid) if amount_paid is not None else float(current["amount_paid"])
                if amount_paid is not None:
                    if amount_paid < 0:
                        return None
                    fields.append("amount_paid = %s")
                    params.append(new_paid)

                    # Adjust drawer balance if registered to an active register
                    old_paid = float(current["amount_paid"] or 0.0)
                    paid_diff = new_paid - old_paid
                    if paid_diff != 0 and current.get("register_id"):
                        cursor.execute(
                            """
                            UPDATE daily_cash_registers
                            SET total_revenues = total_revenues + %s, updated_at = CURRENT_TIMESTAMP
                            WHERE register_id = %s;
                            """,
                            (paid_diff, current["register_id"]),
                        )

                if payment_status is not None:
                    norm_status = payment_status.strip().upper()
                    if norm_status in VALID_PAYMENT_STATUSES:
                        fields.append("payment_status = %s")
                        params.append(norm_status)
                elif amount_paid is not None:
                    # Auto update status based on amount_paid vs fee_amount
                    eff_fee = float(fee_amount if fee_amount is not None else current["fee_amount"])
                    if new_paid >= eff_fee and eff_fee > 0:
                        auto_status = "PAID"
                    elif eff_fee == 0:
                        auto_status = "EXEMPT"
                    else:
                        auto_status = "PENDING"
                    fields.append("payment_status = %s")
                    params.append(auto_status)

                if notes is not None:
                    fields.append("notes = %s")
                    params.append(notes.strip() if notes else None)

                if not fields:
                    return current

                query = f"""
                    UPDATE competition_registrations
                    SET {', '.join(fields)}
                    WHERE registration_id = %s
                    RETURNING 
                        registration_id, competition_id, student_id, competitor_name,
                        division_level, receipt_number, fee_amount, amount_paid,
                        payment_status, register_id, notes, registered_at;
                """
                params.append(registration_id)
                cursor.execute(query, params)
                updated = _dict_fetchone(cursor)
                conn.commit()
                return updated
        except Exception as e:
            logger.error(f"Error updating registration ID {registration_id}: {e}")
            return None

    def record_additional_payment(
        self,
        registration_id: int,
        additional_amount: float,
        payment_method: str = "CASH",
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records subsequent payment for an existing pending registration.
        """
        if additional_amount <= 0:
            logger.error("Additional payment amount must be positive.")
            return None

        reg = self.get_by_id(registration_id)
        if not reg:
            return None

        old_paid = float(reg.get("amount_paid") or 0.0)
        fee_amt = float(reg.get("fee_amount") or 0.0)
        new_paid = old_paid + float(additional_amount)

        new_status = "PAID" if new_paid >= fee_amt else "PENDING"
        append_notes = f"{reg.get('notes') or ''} [Paid +{additional_amount} DZD on {date.today()}]".strip()

        return self.update(
            registration_id=registration_id,
            amount_paid=new_paid,
            payment_status=new_status,
            notes=append_notes,
        )

    def delete(self, registration_id: int) -> bool:
        """
        Cancels a registration and reverts cash drawer revenue credit.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                reg = self.get_by_id(registration_id)
                if not reg:
                    return False

                # Revert cash drawer if applicable
                if reg.get("register_id") and float(reg.get("amount_paid") or 0.0) > 0:
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_revenues = GREATEST(0.00, total_revenues - %s), updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (float(reg["amount_paid"]), reg["register_id"]),
                    )

                cursor.execute("DELETE FROM competition_registrations WHERE registration_id = %s;", (registration_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting registration ID {registration_id}: {e}")
            return False


# =============================================================================
# 2. COMPETITION MASTER MANAGER
# =============================================================================

class CompetitionManager:
    """
    Manages competition event configurations, schedules, participation rosters,
    and financial collection performance.
    """

    SAFE_COLUMNS = (
        "c.competition_id, c.branch_id, c.academic_year_id, c.name, "
        "c.scope, c.event_date, c.location, c.registration_fee, "
        "c.is_active, c.created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance
        self.registrations = CompetitionRegistrationManager(db_instance)

    def get_all(
        self,
        branch_id: Optional[str] = None,
        academic_year_id: Optional[int] = None,
        scope: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves competitions with joined branch, academic year, and candidate counts."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        ay.name AS academic_year_name,
                        COUNT(cr.registration_id) AS total_participants,
                        COALESCE(SUM(cr.amount_paid), 0.00) AS total_collected_revenue
                    FROM competitions c
                    JOIN branches b ON c.branch_id = b.branch_id
                    JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
                    LEFT JOIN competition_registrations cr ON c.competition_id = cr.competition_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND c.branch_id = %s"
                    params.append(branch_id.strip())
                if academic_year_id:
                    query += " AND c.academic_year_id = %s"
                    params.append(academic_year_id)
                if scope:
                    query += " AND c.scope = %s"
                    params.append(scope.strip().upper())
                if is_active is not None:
                    query += " AND c.is_active = %s"
                    params.append(is_active)

                query += """
                    GROUP BY 
                        c.competition_id, c.branch_id, c.academic_year_id, c.name,
                        c.scope, c.event_date, c.location, c.registration_fee,
                        c.is_active, c.created_at, b.name_ar, b.name_en, ay.name
                    ORDER BY c.event_date DESC NULLS LAST, c.competition_id DESC
                    LIMIT %s OFFSET %s;
                """
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching competitions: {e}")
            return []

    def get_by_id(self, competition_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves competition details with aggregate financial metrics."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        ay.name AS academic_year_name,
                        COUNT(cr.registration_id) AS total_participants,
                        COALESCE(SUM(cr.fee_amount), 0.00) AS total_expected_revenue,
                        COALESCE(SUM(cr.amount_paid), 0.00) AS total_collected_revenue,
                        (COALESCE(SUM(cr.fee_amount), 0.00) - COALESCE(SUM(cr.amount_paid), 0.00)) AS total_outstanding_revenue
                    FROM competitions c
                    JOIN branches b ON c.branch_id = b.branch_id
                    JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
                    LEFT JOIN competition_registrations cr ON c.competition_id = cr.competition_id
                    WHERE c.competition_id = %s
                    GROUP BY 
                        c.competition_id, c.branch_id, c.academic_year_id, c.name,
                        c.scope, c.event_date, c.location, c.registration_fee,
                        c.is_active, c.created_at, b.name_ar, b.name_en, ay.name;
                """
                cursor.execute(query, (competition_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching competition ID {competition_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        academic_year_id: int,
        name: str,
        scope: str = "NATIONAL",
        event_date: Optional[Any] = None,
        location: Optional[str] = None,
        registration_fee: float = 0.0,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new competition record."""
        if registration_fee < 0:
            logger.error("Registration fee must be non-negative.")
            return None

        clean_branch = branch_id.strip()
        clean_name = name.strip()
        clean_scope = scope.strip().upper() if scope and scope.strip().upper() in VALID_SCOPES else "NATIONAL"

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO competitions (
                        branch_id, academic_year_id, name, scope,
                        event_date, location, registration_fee, is_active
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        competition_id, branch_id, academic_year_id, name,
                        scope, event_date, location, registration_fee,
                        is_active, created_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        academic_year_id,
                        clean_name,
                        clean_scope,
                        event_date,
                        location.strip() if location else None,
                        float(registration_fee),
                        is_active,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating competition '{name}': {e}")
            return None

    def update(
        self,
        competition_id: int,
        name: Optional[str] = None,
        scope: Optional[str] = None,
        event_date: Optional[Any] = None,
        location: Optional[str] = None,
        registration_fee: Optional[float] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates competition configuration fields."""
        fields: List[str] = []
        params: List[Any] = []

        if name is not None:
            fields.append("name = %s")
            params.append(name.strip())
        if scope is not None:
            clean_scope = scope.strip().upper() if scope.strip().upper() in VALID_SCOPES else "NATIONAL"
            fields.append("scope = %s")
            params.append(clean_scope)
        if event_date is not None:
            fields.append("event_date = %s")
            params.append(event_date)
        if location is not None:
            fields.append("location = %s")
            params.append(location.strip() if location else None)
        if registration_fee is not None:
            if registration_fee < 0:
                return None
            fields.append("registration_fee = %s")
            params.append(float(registration_fee))
        if is_active is not None:
            fields.append("is_active = %s")
            params.append(is_active)

        if not fields:
            return self.get_by_id(competition_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    UPDATE competitions
                    SET {', '.join(fields)}
                    WHERE competition_id = %s
                    RETURNING 
                        competition_id, branch_id, academic_year_id, name,
                        scope, event_date, location, registration_fee,
                        is_active, created_at;
                """
                params.append(competition_id)
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating competition ID {competition_id}: {e}")
            return None

    def delete(self, competition_id: int) -> bool:
        """Deletes a competition if no active candidate registrations exist."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM competition_registrations WHERE competition_id = %s;", (competition_id,))
                row = cursor.fetchone()
                if row and row[0] > 0:
                    logger.warning(f"Cannot delete competition ID {competition_id}: has {row[0]} registered candidates.")
                    return False

                cursor.execute("DELETE FROM competitions WHERE competition_id = %s;", (competition_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting competition ID {competition_id}: {e}")
            return False

    def get_summary(self, competition_id: int) -> Dict[str, Any]:
        """
        Calculates participation and financial summary:
          - Total enrolled candidates
          - Division level breakdown
          - Payment statuses count (PAID, PENDING, EXEMPT)
          - Revenue collection rate (%)
        """
        comp = self.get_by_id(competition_id)
        if not comp:
            return {}

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Status distribution
                cursor.execute(
                    """
                    SELECT 
                        payment_status,
                        COUNT(*) AS candidate_count,
                        COALESCE(SUM(amount_paid), 0.00) AS total_paid
                    FROM competition_registrations
                    WHERE competition_id = %s
                    GROUP BY payment_status;
                    """,
                    (competition_id,),
                )
                status_breakdown = _dict_fetchall(cursor)

                # Division levels distribution
                cursor.execute(
                    """
                    SELECT 
                        COALESCE(division_level, 'Standard') AS division_level,
                        COUNT(*) AS participant_count
                    FROM competition_registrations
                    WHERE competition_id = %s
                    GROUP BY division_level
                    ORDER BY participant_count DESC;
                    """,
                    (competition_id,),
                )
                division_breakdown = _dict_fetchall(cursor)

                expected = float(comp.get("total_expected_revenue") or 0.0)
                collected = float(comp.get("total_collected_revenue") or 0.0)
                collection_rate = round((collected / expected * 100.0), 2) if expected > 0 else 100.0

                return {
                    "competition_id": competition_id,
                    "name": comp.get("name"),
                    "branch_id": comp.get("branch_id"),
                    "scope": comp.get("scope"),
                    "event_date": comp.get("event_date"),
                    "location": comp.get("location"),
                    "registration_fee": float(comp.get("registration_fee") or 0.0),
                    "total_participants": comp.get("total_participants", 0),
                    "total_expected_revenue": expected,
                    "total_collected_revenue": collected,
                    "total_outstanding_revenue": float(comp.get("total_outstanding_revenue") or 0.0),
                    "collection_rate_percentage": collection_rate,
                    "payment_status_breakdown": status_breakdown,
                    "division_breakdown": division_breakdown,
                }
        except Exception as e:
            logger.error(f"Error compiling competition summary {competition_id}: {e}")
            return {}
