"""
backend/database/kindergarten_manager.py
-----------------------------------------
Data Access Manager for the Kindergarten / Daycare Module (الروضة والحضانة).
Encapsulates:
  - Age bands & cohorts (Bébé, Petite, Moyenne, Grande Section)
  - Numbered physical/digital books per child by age/level
  - Daily attendance tracking per child
  - Daily logs with strict A/B/C ratings across 8 criteria + notes
  - Monthly reports with teacher drafting and double-blind admin review & approval workflow
  - Incident logs across problem categories (behavior, eating, sleeping, learning)
  - Orthophonist and clinical specialist notes with role-sensitive visibility flags
  - Child habit profiles (food, sleep, clothing, illness, temperament)
  - Weekly rotating cafeteria menus (weeks 1-4, days 1-7, meals)
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


VALID_RATINGS = {"A", "B", "C"}
VALID_INCIDENT_CATEGORIES = {"BEHAVIOR", "EATING", "SLEEPING", "LEARNING", "HEALTH", "OTHER"}
VALID_ATTENDANCE_STATUSES = {"PRESENT", "ABSENT", "LATE", "EXCUSED"}
VALID_REPORT_STATUSES = {"DRAFT", "SUBMITTED", "APPROVED", "REJECTED"}
VALID_VISIBILITIES = {"STAFF_ONLY", "STAFF_AND_PARENTS"}
VALID_MEAL_TYPES = {"BREAKFAST", "LUNCH", "SNACK"}


class KindergartenManager:
    """
    Central database manager for Kindergarten & Nursery operations.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # 1. Age Bands & Cohorts
    # =========================================================================
    def get_age_bands(self, is_active: Optional[bool] = None) -> List[Dict[str, Any]]:
        """Retrieves kindergarten age bands sorted by minimum age."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM kg_age_band WHERE 1=1"
                params: List[Any] = []
                if is_active is not None:
                    query += " AND is_active = %s"
                    params.append(is_active)
                query += " ORDER BY min_age_months ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching age bands: {e}")
            return []

    def get_age_band(self, age_band_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single age band by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM kg_age_band WHERE age_band_id = %s;", (age_band_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching age band {age_band_id}: {e}")
            return None

    def create_age_band(
        self,
        code: str,
        name_ar: str,
        name_en: str,
        min_age_months: int,
        max_age_months: int,
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Registers a new kindergarten age cohort band."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_age_band (code, name_ar, name_en, min_age_months, max_age_months, description)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (code) DO UPDATE
                    SET name_ar = EXCLUDED.name_ar,
                        name_en = EXCLUDED.name_en,
                        min_age_months = EXCLUDED.min_age_months,
                        max_age_months = EXCLUDED.max_age_months,
                        description = EXCLUDED.description
                    RETURNING *;
                    """,
                    (code.strip().upper(), name_ar.strip(), name_en.strip(), min_age_months, max_age_months, description),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error creating age band {code}: {e}")
            return None

    def update_age_band(self, age_band_id: int, **fields) -> Optional[Dict[str, Any]]:
        """Updates age band parameters."""
        allowed = {"name_ar", "name_en", "min_age_months", "max_age_months", "description", "is_active"}
        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return self.get_age_band(age_band_id)
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                params = list(updates.values()) + [age_band_id]
                cursor.execute(
                    f"UPDATE kg_age_band SET {', '.join(set_clauses)} WHERE age_band_id = %s RETURNING *;",
                    params,
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error updating age band {age_band_id}: {e}")
            return None

    # =========================================================================
    # 2. Numbered Physical/Digital Books
    # =========================================================================
    def assign_child_book(
        self,
        student_id: int,
        book_number: str,
        title: str,
        age_band_id: Optional[int] = None,
        book_type: str = "PHYSICAL",
        level_label: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Assigns an inventory-numbered book to a child."""
        clean_type = book_type.upper() if book_type in {"PHYSICAL", "DIGITAL"} else "PHYSICAL"
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_child_book (
                        student_id, age_band_id, book_number, title, book_type, level_label, status, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'ASSIGNED', %s)
                    ON CONFLICT (student_id, book_number) DO UPDATE
                    SET title = EXCLUDED.title,
                        status = 'ASSIGNED',
                        return_date = NULL,
                        notes = EXCLUDED.notes
                    RETURNING *;
                    """,
                    (student_id, age_band_id, book_number.strip(), title.strip(), clean_type, level_label, notes),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error assigning book {book_number} to student {student_id}: {e}")
            return None

    def get_child_books(
        self,
        student_id: Optional[int] = None,
        status: Optional[str] = None,
        age_band_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves assigned or cataloged books with student details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT b.*, ab.name_ar AS age_band_name_ar, ab.name_en AS age_band_name_en
                    FROM kg_child_book b
                    LEFT JOIN kg_age_band ab ON b.age_band_id = ab.age_band_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if student_id is not None:
                    query += " AND b.student_id = %s"
                    params.append(student_id)
                if status:
                    query += " AND b.status = %s"
                    params.append(status.upper())
                if age_band_id is not None:
                    query += " AND b.age_band_id = %s"
                    params.append(age_band_id)
                query += " ORDER BY b.assigned_date DESC, b.child_book_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching child books: {e}")
            return []

    def update_book_status(
        self, child_book_id: int, status: str, return_date: Optional[Any] = None, notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Updates book status (ASSIGNED, RETURNED, DAMAGED, LOST)."""
        valid_statuses = {"ASSIGNED", "RETURNED", "DAMAGED", "LOST"}
        clean_status = status.upper()
        if clean_status not in valid_statuses:
            return None
        ret_d = return_date if return_date else (date.today() if clean_status == "RETURNED" else None)
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE kg_child_book
                    SET status = %s, return_date = COALESCE(%s, return_date), notes = COALESCE(%s, notes)
                    WHERE child_book_id = %s
                    RETURNING *;
                    """,
                    (clean_status, ret_d, notes, child_book_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error updating book {child_book_id} status: {e}")
            return None

    # =========================================================================
    # 3. Daily Attendance per Child
    # =========================================================================
    def mark_attendance(
        self,
        student_id: int,
        branch_id: str,
        attendance_date: Any,
        status: str = "PRESENT",
        arrival_time: Optional[str] = None,
        departure_time: Optional[str] = None,
        picked_up_by: Optional[str] = None,
        justification: Optional[str] = None,
        marked_by_user_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Marks or updates daily attendance for a kindergarten child."""
        clean_status = status.upper()
        if clean_status not in VALID_ATTENDANCE_STATUSES:
            raise ValueError(f"Invalid status '{status}'. Must be one of {VALID_ATTENDANCE_STATUSES}")
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_attendance (
                        student_id, branch_id, attendance_date, status, arrival_time,
                        departure_time, picked_up_by, justification, marked_by_user_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (student_id, attendance_date) DO UPDATE
                    SET status = EXCLUDED.status,
                        arrival_time = COALESCE(EXCLUDED.arrival_time, kg_attendance.arrival_time),
                        departure_time = COALESCE(EXCLUDED.departure_time, kg_attendance.departure_time),
                        picked_up_by = COALESCE(EXCLUDED.picked_up_by, kg_attendance.picked_up_by),
                        justification = COALESCE(EXCLUDED.justification, kg_attendance.justification),
                        marked_by_user_id = COALESCE(EXCLUDED.marked_by_user_id, kg_attendance.marked_by_user_id)
                    RETURNING *;
                    """,
                    (
                        student_id,
                        branch_id.strip().upper(),
                        attendance_date,
                        clean_status,
                        arrival_time,
                        departure_time,
                        picked_up_by,
                        justification,
                        marked_by_user_id,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error marking attendance for student {student_id}: {e}")
            return None

    def bulk_mark_attendance(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Atomically marks attendance for an entire classroom or cohort."""
        success_count = 0
        errors = []
        for item in items:
            res = self.mark_attendance(
                student_id=item["student_id"],
                branch_id=item.get("branch_id", "RAWDA"),
                attendance_date=item.get("attendance_date", date.today()),
                status=item.get("status", "PRESENT"),
                arrival_time=item.get("arrival_time"),
                departure_time=item.get("departure_time"),
                picked_up_by=item.get("picked_up_by"),
                justification=item.get("justification"),
                marked_by_user_id=item.get("marked_by_user_id"),
            )
            if res:
                success_count += 1
            else:
                errors.append(item.get("student_id"))
        return {"processed": len(items), "successful": success_count, "failed_student_ids": errors}

    def get_attendance(
        self,
        branch_id: Optional[str] = None,
        attendance_date: Optional[Any] = None,
        student_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Queries daily attendance records."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM kg_attendance WHERE 1=1"
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip().upper())
                if attendance_date:
                    query += " AND attendance_date = %s"
                    params.append(attendance_date)
                if student_id:
                    query += " AND student_id = %s"
                    params.append(student_id)
                if status:
                    query += " AND status = %s"
                    params.append(status.upper())
                query += " ORDER BY attendance_date DESC, student_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching attendance: {e}")
            return []

    # =========================================================================
    # 4. Daily Logs (A/B/C ratings across 8 categories + notes)
    # =========================================================================
    def record_daily_log(
        self,
        student_id: int,
        branch_id: str,
        log_date: Any,
        breakfast: str,
        lunch: str,
        snack: str,
        sleep: str,
        study: str,
        interaction: str,
        crying: str,
        clothes_change: str,
        notes: Optional[str] = None,
        recorded_by_staff_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records or updates a child's daily evaluation.
        Ratings across all 8 categories MUST be strictly 'A' (Good), 'B' (Average), or 'C' (Weak).
        """
        ratings = {
            "breakfast": breakfast.upper(),
            "lunch": lunch.upper(),
            "snack": snack.upper(),
            "sleep": sleep.upper(),
            "study": study.upper(),
            "interaction": interaction.upper(),
            "crying": crying.upper(),
            "clothes_change": clothes_change.upper(),
        }
        for category, rating in ratings.items():
            if rating not in VALID_RATINGS:
                raise ValueError(
                    f"Category '{category}' has invalid rating '{rating}'. Must be 'A', 'B', or 'C'."
                )

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_daily_log (
                        student_id, branch_id, log_date, breakfast, lunch, snack,
                        sleep, study, interaction, crying, clothes_change, notes, recorded_by_staff_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (student_id, log_date) DO UPDATE
                    SET breakfast = EXCLUDED.breakfast,
                        lunch = EXCLUDED.lunch,
                        snack = EXCLUDED.snack,
                        sleep = EXCLUDED.sleep,
                        study = EXCLUDED.study,
                        interaction = EXCLUDED.interaction,
                        crying = EXCLUDED.crying,
                        clothes_change = EXCLUDED.clothes_change,
                        notes = EXCLUDED.notes,
                        recorded_by_staff_id = EXCLUDED.recorded_by_staff_id
                    RETURNING *;
                    """,
                    (
                        student_id,
                        branch_id.strip().upper(),
                        log_date,
                        ratings["breakfast"],
                        ratings["lunch"],
                        ratings["snack"],
                        ratings["sleep"],
                        ratings["study"],
                        ratings["interaction"],
                        ratings["crying"],
                        ratings["clothes_change"],
                        notes,
                        recorded_by_staff_id,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error recording daily log for student {student_id}: {e}")
            return None

    def get_daily_log(self, student_id: int, log_date: Any) -> Optional[Dict[str, Any]]:
        """Retrieves a single child daily log."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM kg_daily_log WHERE student_id = %s AND log_date = %s;",
                    (student_id, log_date),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching daily log: {e}")
            return None

    def get_daily_logs_by_date(self, branch_id: str, log_date: Any) -> List[Dict[str, Any]]:
        """Retrieves all daily logs for a given branch and date."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT dl.*, s.full_name_ar, s.full_name_fr
                    FROM kg_daily_log dl
                    JOIN students s ON dl.student_id = s.student_id
                    WHERE dl.branch_id = %s AND dl.log_date = %s
                    ORDER BY s.full_name_ar ASC;
                    """,
                    (branch_id.strip().upper(), log_date),
                )
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching branch daily logs: {e}")
            return []

    # =========================================================================
    # 5. Monthly Reports (Review & Approval Workflow)
    # =========================================================================
    def create_monthly_report(
        self,
        student_id: int,
        branch_id: str,
        month_period: str,
        author_staff_id: int,
        breakfast: str,
        lunch: str,
        snack: str,
        sleep: str,
        study: str,
        interaction: str,
        crying: str,
        clothes_change: str,
        teacher_notes: Optional[str] = None,
        status: str = "DRAFT",
    ) -> Optional[Dict[str, Any]]:
        """Creates a monthly progress report authored by a teacher/nanny."""
        ratings = {
            "breakfast": breakfast.upper(),
            "lunch": lunch.upper(),
            "snack": snack.upper(),
            "sleep": sleep.upper(),
            "study": study.upper(),
            "interaction": interaction.upper(),
            "crying": crying.upper(),
            "clothes_change": clothes_change.upper(),
        }
        for cat, r in ratings.items():
            if r not in VALID_RATINGS:
                raise ValueError(f"Category '{cat}' rating '{r}' must be A, B, or C.")

        clean_status = status.upper() if status.upper() in VALID_REPORT_STATUSES else "DRAFT"
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_monthly_report (
                        student_id, branch_id, month_period, author_staff_id, breakfast, lunch,
                        snack, sleep, study, interaction, crying, clothes_change, teacher_notes,
                        status, visible_to_parents
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, FALSE)
                    ON CONFLICT (student_id, month_period) DO UPDATE
                    SET author_staff_id = EXCLUDED.author_staff_id,
                        breakfast = EXCLUDED.breakfast,
                        lunch = EXCLUDED.lunch,
                        snack = EXCLUDED.snack,
                        sleep = EXCLUDED.sleep,
                        study = EXCLUDED.study,
                        interaction = EXCLUDED.interaction,
                        crying = EXCLUDED.crying,
                        clothes_change = EXCLUDED.clothes_change,
                        teacher_notes = EXCLUDED.teacher_notes,
                        status = EXCLUDED.status,
                        visible_to_parents = FALSE,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *;
                    """,
                    (
                        student_id,
                        branch_id.strip().upper(),
                        month_period.strip(),
                        author_staff_id,
                        ratings["breakfast"],
                        ratings["lunch"],
                        ratings["snack"],
                        ratings["sleep"],
                        ratings["study"],
                        ratings["interaction"],
                        ratings["crying"],
                        ratings["clothes_change"],
                        teacher_notes,
                        clean_status,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error creating monthly report: {e}")
            return None

    def submit_monthly_report(self, report_id: int) -> Optional[Dict[str, Any]]:
        """Submits a monthly report for administrative review."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE kg_monthly_report
                    SET status = 'SUBMITTED', updated_at = CURRENT_TIMESTAMP
                    WHERE report_id = %s
                    RETURNING *;
                    """,
                    (report_id,),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error submitting monthly report {report_id}: {e}")
            return None

    def review_monthly_report(
        self,
        report_id: int,
        reviewer_admin_id: int,
        status: str,
        admin_feedback: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Administrative review and approval workflow.
        RULE ENFORCEMENT: The reviewing administrator MUST strictly differ from the author teacher!
        Only APPROVED reports become visible to parents (visible_to_parents = TRUE).
        """
        clean_status = status.upper()
        if clean_status not in {"APPROVED", "REJECTED"}:
            raise ValueError(f"Review status must be 'APPROVED' or 'REJECTED', got '{status}'")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                # 1. Fetch current report to verify author
                cursor.execute(
                    "SELECT author_staff_id FROM kg_monthly_report WHERE report_id = %s;",
                    (report_id,),
                )
                current = cursor.fetchone()
                if not current:
                    logger.warning(f"Monthly report {report_id} not found.")
                    return None

                author_id = current[0] if not isinstance(current, dict) else current["author_staff_id"]
                if author_id == reviewer_admin_id:
                    raise PermissionError(
                        f"Segregation of Duties violation: Reviewer admin (ID: {reviewer_admin_id}) "
                        f"cannot be the same person as Author teacher (ID: {author_id})."
                    )

                is_visible = (clean_status == "APPROVED")
                cursor.execute(
                    """
                    UPDATE kg_monthly_report
                    SET reviewer_admin_id = %s,
                        status = %s,
                        admin_feedback = %s,
                        approved_at = CASE WHEN %s = 'APPROVED' THEN CURRENT_TIMESTAMP ELSE NULL END,
                        visible_to_parents = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE report_id = %s
                    RETURNING *;
                    """,
                    (reviewer_admin_id, clean_status, admin_feedback, clean_status, is_visible, report_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error reviewing monthly report {report_id}: {e}")
            raise

    def get_monthly_reports(
        self,
        branch_id: Optional[str] = None,
        month_period: Optional[str] = None,
        student_id: Optional[int] = None,
        status: Optional[str] = None,
        visible_to_parents: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """Fetches monthly reports based on review and authorization filters."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM kg_monthly_report WHERE 1=1"
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip().upper())
                if month_period:
                    query += " AND month_period = %s"
                    params.append(month_period.strip())
                if student_id is not None:
                    query += " AND student_id = %s"
                    params.append(student_id)
                if status:
                    query += " AND status = %s"
                    params.append(status.upper())
                if visible_to_parents is not None:
                    query += " AND visible_to_parents = %s"
                    params.append(visible_to_parents)
                query += " ORDER BY month_period DESC, report_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching monthly reports: {e}")
            return []

    # =========================================================================
    # 6. Incident Logs
    # =========================================================================
    def log_incident(
        self,
        student_id: int,
        branch_id: str,
        category: str,
        description: str,
        incident_date: Optional[Any] = None,
        action_taken: Optional[str] = None,
        reported_by_staff_id: Optional[int] = None,
        parent_notified: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Logs a behavioral, eating, sleeping, or learning problem incident."""
        clean_cat = category.upper()
        if clean_cat not in VALID_INCIDENT_CATEGORIES:
            raise ValueError(
                f"Invalid incident category '{category}'. Must be one of {VALID_INCIDENT_CATEGORIES}"
            )
        i_date = incident_date if incident_date else date.today()
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_incident (
                        student_id, branch_id, incident_date, category, description,
                        action_taken, reported_by_staff_id, parent_notified
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        student_id,
                        branch_id.strip().upper(),
                        i_date,
                        clean_cat,
                        description.strip(),
                        action_taken,
                        reported_by_staff_id,
                        parent_notified,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error logging incident: {e}")
            return None

    def acknowledge_incident(self, incident_id: int, parent_acknowledgment: str) -> Optional[Dict[str, Any]]:
        """Records parent acknowledgment and signature of an incident report."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE kg_incident
                    SET parent_acknowledgment = %s, parent_notified = TRUE
                    WHERE incident_id = %s
                    RETURNING *;
                    """,
                    (parent_acknowledgment, incident_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error acknowledging incident {incident_id}: {e}")
            return None

    def get_incidents(
        self,
        branch_id: Optional[str] = None,
        student_id: Optional[int] = None,
        category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves incidents filtered by branch, child, or category."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM kg_incident WHERE 1=1"
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip().upper())
                if student_id is not None:
                    query += " AND student_id = %s"
                    params.append(student_id)
                if category:
                    query += " AND category = %s"
                    params.append(category.upper())
                query += " ORDER BY incident_date DESC, incident_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching incidents: {e}")
            return []

    # =========================================================================
    # 7. Orthophonist / Specialist Clinical Notes
    # =========================================================================
    def record_specialist_note(
        self,
        student_id: int,
        specialist_id: int,
        observation_type: str,
        clinical_observations: str,
        session_date: Optional[Any] = None,
        recommendations: Optional[str] = None,
        visibility: str = "STAFF_ONLY",
    ) -> Optional[Dict[str, Any]]:
        """Records specialist orthophonie or behavioral consultation notes."""
        clean_vis = visibility.upper() if visibility.upper() in VALID_VISIBILITIES else "STAFF_ONLY"
        s_date = session_date if session_date else date.today()
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_specialist_note (
                        student_id, specialist_id, session_date, observation_type,
                        clinical_observations, recommendations, visibility
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        student_id,
                        specialist_id,
                        s_date,
                        observation_type.strip(),
                        clinical_observations.strip(),
                        recommendations,
                        clean_vis,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error recording specialist note: {e}")
            return None

    def get_specialist_notes(
        self,
        student_id: Optional[int] = None,
        viewer_role: str = "STAFF",
    ) -> List[Dict[str, Any]]:
        """
        Retrieves clinical specialist notes.
        If viewer_role == 'PARENT', only returns notes explicitly marked 'STAFF_AND_PARENTS'.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM kg_specialist_note WHERE 1=1"
                params: List[Any] = []
                if student_id is not None:
                    query += " AND student_id = %s"
                    params.append(student_id)
                if viewer_role.upper() == "PARENT":
                    query += " AND visibility = 'STAFF_AND_PARENTS'"
                query += " ORDER BY session_date DESC, specialist_note_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching specialist notes: {e}")
            return []

    # =========================================================================
    # 8. Child Habit Profile (Food, Sleep, Clothing, Illness, Temperament)
    # =========================================================================
    def upsert_child_habit_profile(
        self,
        student_id: int,
        food_preferences: Optional[str] = None,
        eating_habits: Optional[str] = None,
        sleep_habits: Optional[str] = None,
        clothing_notes: Optional[str] = None,
        allergies_medical: Optional[str] = None,
        illness_history: Optional[str] = None,
        temperament: Optional[str] = None,
        soothing_methods: Optional[str] = None,
        updated_by_user_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates or updates the parent-filled child habit profile."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_child_habit_profile (
                        student_id, food_preferences, eating_habits, sleep_habits,
                        clothing_notes, allergies_medical, illness_history, temperament,
                        soothing_methods, updated_by_user_id, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (student_id) DO UPDATE
                    SET food_preferences = COALESCE(EXCLUDED.food_preferences, kg_child_habit_profile.food_preferences),
                        eating_habits = COALESCE(EXCLUDED.eating_habits, kg_child_habit_profile.eating_habits),
                        sleep_habits = COALESCE(EXCLUDED.sleep_habits, kg_child_habit_profile.sleep_habits),
                        clothing_notes = COALESCE(EXCLUDED.clothing_notes, kg_child_habit_profile.clothing_notes),
                        allergies_medical = COALESCE(EXCLUDED.allergies_medical, kg_child_habit_profile.allergies_medical),
                        illness_history = COALESCE(EXCLUDED.illness_history, kg_child_habit_profile.illness_history),
                        temperament = COALESCE(EXCLUDED.temperament, kg_child_habit_profile.temperament),
                        soothing_methods = COALESCE(EXCLUDED.soothing_methods, kg_child_habit_profile.soothing_methods),
                        updated_by_user_id = EXCLUDED.updated_by_user_id,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *;
                    """,
                    (
                        student_id,
                        food_preferences,
                        eating_habits,
                        sleep_habits,
                        clothing_notes,
                        allergies_medical,
                        illness_history,
                        temperament,
                        soothing_methods,
                        updated_by_user_id,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error upserting child habit profile for {student_id}: {e}")
            return None

    def get_child_habit_profile(self, student_id: int) -> Optional[Dict[str, Any]]:
        """Fetches the habit profile for a child."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM kg_child_habit_profile WHERE student_id = %s;",
                    (student_id,),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching habit profile for student {student_id}: {e}")
            return None

    # =========================================================================
    # 9. Weekly Rotating Cafeteria Menu
    # =========================================================================
    def set_menu_entry(
        self,
        branch_id: str,
        week_number: int,
        day_of_week: int,
        meal_type: str,
        menu_items: str,
        allergen_info: Optional[str] = None,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Sets a cafeteria meal entry (weeks 1-4, days 1-7, breakfast/lunch/snack)."""
        clean_meal = meal_type.upper()
        if clean_meal not in VALID_MEAL_TYPES:
            raise ValueError(f"Invalid meal_type '{meal_type}'. Must be one of {VALID_MEAL_TYPES}")
        if not (1 <= week_number <= 4):
            raise ValueError("week_number must be between 1 and 4")
        if not (1 <= day_of_week <= 7):
            raise ValueError("day_of_week must be between 1 (Mon) and 7 (Sun)")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO kg_menu_entry (
                        branch_id, week_number, day_of_week, meal_type, menu_items, allergen_info, is_active
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (branch_id, week_number, day_of_week, meal_type) DO UPDATE
                    SET menu_items = EXCLUDED.menu_items,
                        allergen_info = EXCLUDED.allergen_info,
                        is_active = EXCLUDED.is_active
                    RETURNING *;
                    """,
                    (branch_id.strip().upper(), week_number, day_of_week, clean_meal, menu_items.strip(), allergen_info, is_active),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error setting menu entry: {e}")
            return None

    def get_weekly_menu(
        self, branch_id: str, week_number: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves cafeteria menu schedule for parents and kitchen staff."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM kg_menu_entry WHERE branch_id = %s"
                params: List[Any] = [branch_id.strip().upper()]
                if week_number is not None:
                    query += " AND week_number = %s"
                    params.append(week_number)
                query += " ORDER BY week_number ASC, day_of_week ASC, meal_type ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching weekly menu: {e}")
            return []
