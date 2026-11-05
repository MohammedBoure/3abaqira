"""
backend/database/hr_manager.py
-------------------------------
Data Access Manager for the Staff & HR Module.
Encapsulates:
  - Standard job titles & positions (teaching, administrative, nannies, cooks, cleaning, maintenance, orthophonist)
  - Staff profiles & qualifications
  - Multi-branch staff assignments (split-allocations across 13 branches)
  - Daily staff attendance marked by administration (with source field for biometric/manual)
  - Online job application pipeline and interview scheduling (screening -> interview -> offer/reject)
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


VALID_HR_CATEGORIES = {
    "TEACHING", "ADMINISTRATIVE", "NANNY", "COOK", "CLEANING",
    "MAINTENANCE", "ORTHOPHONIST", "SPECIALIST", "OTHER"
}
VALID_ATTENDANCE_STATUSES = {"PRESENT", "ABSENT", "LATE", "EXCUSED", "ON_LEAVE", "HALF_DAY"}
VALID_ATTENDANCE_SOURCES = {"MANUAL", "BIOMETRIC", "DEVICE_IMPORT", "MOBILE"}
VALID_PIPELINE_STATUSES = {
    "APPLIED", "SCREENING", "INTERVIEW_SCHEDULED", "INTERVIEWED", "OFFERED", "HIRED", "REJECTED"
}


class HRManager:
    """
    Central database manager for HR, Multi-branch Staffing, Daily Attendance & Recruitment.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # 1. Standard Job Titles & Positions
    # =========================================================================
    def get_positions(
        self, category: Optional[str] = None, is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Retrieves system job positions."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM hr_position WHERE 1=1"
                params: List[Any] = []
                if category:
                    query += " AND category = %s"
                    params.append(category.upper())
                if is_active is not None:
                    query += " AND is_active = %s"
                    params.append(is_active)
                query += " ORDER BY category ASC, title_en ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching HR positions: {e}")
            return []

    def create_position(
        self,
        code: str,
        title_ar: str,
        title_en: str,
        category: str,
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new job position catalogue entry."""
        clean_cat = category.upper()
        if clean_cat not in VALID_HR_CATEGORIES:
            raise ValueError(f"Category '{category}' must be one of {VALID_HR_CATEGORIES}")
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO hr_position (code, title_ar, title_en, category, description)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (code.strip().upper(), title_ar.strip(), title_en.strip(), clean_cat, description),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error creating position {code}: {e}")
            return None

    # =========================================================================
    # 2. Staff Profiles
    # =========================================================================
    def create_staff_profile(
        self,
        employee_id: int,
        position_id: Optional[int] = None,
        national_id: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        qualifications: Optional[str] = None,
        specialization: Optional[str] = None,
        emergency_contact: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates or links an extended HR profile for an employee."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO hr_staff (
                        employee_id, position_id, national_id, phone, email,
                        qualifications, specialization, emergency_contact
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (employee_id) DO UPDATE
                    SET position_id = COALESCE(EXCLUDED.position_id, hr_staff.position_id),
                        national_id = COALESCE(EXCLUDED.national_id, hr_staff.national_id),
                        phone = COALESCE(EXCLUDED.phone, hr_staff.phone),
                        email = COALESCE(EXCLUDED.email, hr_staff.email),
                        qualifications = COALESCE(EXCLUDED.qualifications, hr_staff.qualifications),
                        specialization = COALESCE(EXCLUDED.specialization, hr_staff.specialization),
                        emergency_contact = COALESCE(EXCLUDED.emergency_contact, hr_staff.emergency_contact),
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *;
                    """,
                    (employee_id, position_id, national_id, phone, email, qualifications, specialization, emergency_contact),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error creating staff profile for employee {employee_id}: {e}")
            return None

    def get_staff_profiles(
        self, position_id: Optional[int] = None, is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Queries staff profiles joining base employee and position details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        s.*,
                        e.employee_code,
                        e.full_name AS employee_name,
                        e.branch_id AS home_branch_id,
                        e.role AS employee_base_role,
                        p.code AS position_code,
                        p.title_ar AS position_title_ar,
                        p.title_en AS position_title_en,
                        p.category AS position_category
                    FROM hr_staff s
                    JOIN employees e ON s.employee_id = e.employee_id
                    LEFT JOIN hr_position p ON s.position_id = p.position_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if position_id is not None:
                    query += " AND s.position_id = %s"
                    params.append(position_id)
                if is_active is not None:
                    query += " AND s.is_active = %s"
                    params.append(is_active)
                query += " ORDER BY e.full_name ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching staff profiles: {e}")
            return []

    # =========================================================================
    # 3. Multi-Branch Staff Assignments
    # =========================================================================
    def assign_staff_to_branch(
        self,
        employee_id: int,
        branch_id: str,
        position_id: Optional[int] = None,
        role_in_branch: Optional[str] = None,
        allocation_percentage: float = 100.0,
        is_primary: bool = True,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Assigns an employee to operate at a specific branch with percentage allocation."""
        s_date = start_date if start_date else date.today()
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO hr_staff_assignment (
                        employee_id, branch_id, position_id, role_in_branch,
                        allocation_percentage, is_primary, start_date, end_date, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                    """,
                    (
                        employee_id,
                        branch_id.strip().upper(),
                        position_id,
                        role_in_branch,
                        allocation_percentage,
                        is_primary,
                        s_date,
                        end_date,
                        notes,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error assigning employee {employee_id} to branch {branch_id}: {e}")
            return None

    def get_staff_assignments(
        self,
        employee_id: Optional[int] = None,
        branch_id: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """Fetches active or historical multi-branch staff assignments."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        a.*,
                        e.employee_code,
                        e.full_name AS staff_name,
                        p.title_ar AS position_title_ar,
                        p.title_en AS position_title_en
                    FROM hr_staff_assignment a
                    JOIN employees e ON a.employee_id = e.employee_id
                    LEFT JOIN hr_position p ON a.position_id = p.position_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if employee_id is not None:
                    query += " AND a.employee_id = %s"
                    params.append(employee_id)
                if branch_id:
                    query += " AND a.branch_id = %s"
                    params.append(branch_id.strip().upper())
                if is_active is not None:
                    query += " AND a.is_active = %s"
                    params.append(is_active)
                query += " ORDER BY a.is_primary DESC, a.start_date DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching staff assignments: {e}")
            return []

    def end_staff_assignment(self, assignment_id: int, end_date: Optional[Any] = None) -> bool:
        """Deactivates an active assignment and records completion date."""
        e_date = end_date if end_date else date.today()
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE hr_staff_assignment
                    SET is_active = FALSE, end_date = %s
                    WHERE assignment_id = %s;
                    """,
                    (e_date, assignment_id),
                )
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error ending assignment {assignment_id}: {e}")
            return False

    # =========================================================================
    # 4. Daily Staff Attendance (Manual & Biometric)
    # =========================================================================
    def mark_staff_attendance(
        self,
        employee_id: int,
        branch_id: str,
        attendance_date: Any,
        status: str = "PRESENT",
        check_in_time: Optional[str] = None,
        check_out_time: Optional[str] = None,
        source: str = "MANUAL",
        marked_by_user_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Marks staff attendance with source attribution (MANUAL or BIOMETRIC device feed).
        """
        clean_status = status.upper()
        clean_source = source.upper()
        if clean_status not in VALID_ATTENDANCE_STATUSES:
            raise ValueError(f"Invalid status '{status}'. Must be one of {VALID_ATTENDANCE_STATUSES}")
        if clean_source not in VALID_ATTENDANCE_SOURCES:
            raise ValueError(f"Invalid source '{source}'. Must be one of {VALID_ATTENDANCE_SOURCES}")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO hr_staff_attendance (
                        employee_id, branch_id, attendance_date, check_in_time, check_out_time,
                        status, source, marked_by_user_id, notes
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (employee_id, attendance_date) DO UPDATE
                    SET status = EXCLUDED.status,
                        check_in_time = COALESCE(EXCLUDED.check_in_time, hr_staff_attendance.check_in_time),
                        check_out_time = COALESCE(EXCLUDED.check_out_time, hr_staff_attendance.check_out_time),
                        source = EXCLUDED.source,
                        marked_by_user_id = COALESCE(EXCLUDED.marked_by_user_id, hr_staff_attendance.marked_by_user_id),
                        notes = COALESCE(EXCLUDED.notes, hr_staff_attendance.notes)
                    RETURNING *;
                    """,
                    (
                        employee_id,
                        branch_id.strip().upper(),
                        attendance_date,
                        check_in_time,
                        check_out_time,
                        clean_status,
                        clean_source,
                        marked_by_user_id,
                        notes,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error marking staff attendance for {employee_id}: {e}")
            return None

    def bulk_mark_staff_attendance(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Marks attendance for multiple staff members simultaneously."""
        successful = 0
        failed = []
        for item in items:
            res = self.mark_staff_attendance(
                employee_id=item["employee_id"],
                branch_id=item.get("branch_id", "RAWDA"),
                attendance_date=item.get("attendance_date", date.today()),
                status=item.get("status", "PRESENT"),
                check_in_time=item.get("check_in_time"),
                check_out_time=item.get("check_out_time"),
                source=item.get("source", "MANUAL"),
                marked_by_user_id=item.get("marked_by_user_id"),
                notes=item.get("notes"),
            )
            if res:
                successful += 1
            else:
                failed.append(item.get("employee_id"))
        return {"processed": len(items), "successful": successful, "failed_employee_ids": failed}

    def get_staff_attendance(
        self,
        branch_id: Optional[str] = None,
        attendance_date: Optional[Any] = None,
        employee_id: Optional[int] = None,
        source: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Queries daily staff attendance."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        sa.*,
                        e.employee_code,
                        e.full_name AS staff_name,
                        e.role AS staff_role
                    FROM hr_staff_attendance sa
                    JOIN employees e ON sa.employee_id = e.employee_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if branch_id:
                    query += " AND sa.branch_id = %s"
                    params.append(branch_id.strip().upper())
                if attendance_date:
                    query += " AND sa.attendance_date = %s"
                    params.append(attendance_date)
                if employee_id is not None:
                    query += " AND sa.employee_id = %s"
                    params.append(employee_id)
                if source:
                    query += " AND sa.source = %s"
                    params.append(source.upper())
                query += " ORDER BY sa.attendance_date DESC, e.full_name ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching staff attendance: {e}")
            return []

    # =========================================================================
    # 5. Online Job Applications & Recruitment Pipeline
    # =========================================================================
    def submit_application(
        self,
        applicant_name: str,
        email: str,
        phone: str,
        applied_position: str,
        branch_id: Optional[str] = None,
        position_id: Optional[int] = None,
        experience_years: int = 0,
        resume_url: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new job application in the recruitment pipeline."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO hr_staff_application (
                        applicant_name, email, phone, applied_position, branch_id,
                        position_id, experience_years, resume_url, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'APPLIED')
                    RETURNING *;
                    """,
                    (
                        applicant_name.strip(),
                        email.strip().lower(),
                        phone.strip(),
                        applied_position.strip(),
                        branch_id.strip().upper() if branch_id else None,
                        position_id,
                        experience_years,
                        resume_url,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error submitting job application: {e}")
            return None

    def schedule_interview(
        self,
        application_id: int,
        interview_date: Any,
        interviewer_employee_id: Optional[int] = None,
        interview_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Schedules candidate interview and updates application status to INTERVIEW_SCHEDULED."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE hr_staff_application
                    SET status = 'INTERVIEW_SCHEDULED',
                        interview_date = %s,
                        interviewer_employee_id = %s,
                        interview_notes = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE application_id = %s
                    RETURNING *;
                    """,
                    (interview_date, interviewer_employee_id, interview_notes, application_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error scheduling interview for app {application_id}: {e}")
            return None

    def record_interview_result(
        self,
        application_id: int,
        interview_rating: int,
        interview_notes: str,
        new_status: str = "INTERVIEWED",
        decision_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Records interview evaluation score (1-5) and candidate impressions."""
        if not (1 <= interview_rating <= 5):
            raise ValueError("interview_rating must be an integer between 1 and 5")
        clean_status = new_status.upper()
        if clean_status not in VALID_PIPELINE_STATUSES:
            raise ValueError(f"Invalid status '{new_status}'")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE hr_staff_application
                    SET status = %s,
                        interview_rating = %s,
                        interview_notes = %s,
                        decision_notes = COALESCE(%s, decision_notes),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE application_id = %s
                    RETURNING *;
                    """,
                    (clean_status, interview_rating, interview_notes, decision_notes, application_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error recording interview result for {application_id}: {e}")
            return None

    def update_application_status(
        self, application_id: int, status: str, decision_notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Transitions application along pipeline (e.g. OFFERED, HIRED, REJECTED)."""
        clean_status = status.upper()
        if clean_status not in VALID_PIPELINE_STATUSES:
            raise ValueError(f"Invalid status '{status}'. Must be one of {VALID_PIPELINE_STATUSES}")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE hr_staff_application
                    SET status = %s, decision_notes = COALESCE(%s, decision_notes), updated_at = CURRENT_TIMESTAMP
                    WHERE application_id = %s
                    RETURNING *;
                    """,
                    (clean_status, decision_notes, application_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error updating application status: {e}")
            return None

    def get_applications(
        self,
        branch_id: Optional[str] = None,
        status: Optional[str] = None,
        applied_position: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves job applications with filtering."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM hr_staff_application WHERE 1=1"
                params: List[Any] = []
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip().upper())
                if status:
                    query += " AND status = %s"
                    params.append(status.upper())
                if applied_position:
                    query += " AND applied_position ILIKE %s"
                    params.append(f"%{applied_position.strip()}%")
                query += " ORDER BY created_at DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching applications: {e}")
            return []

    def get_pipeline_statistics(self) -> Dict[str, int]:
        """Provides summary counts of applications at each pipeline stage."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT status, COUNT(*) AS count
                    FROM hr_staff_application
                    GROUP BY status;
                    """
                )
                rows = cursor.fetchall()
                stats = {s: 0 for s in VALID_PIPELINE_STATUSES}
                for r in rows:
                    st = r[0] if not isinstance(r, dict) else r["status"]
                    cnt = r[1] if not isinstance(r, dict) else r["count"]
                    stats[st] = cnt
                return stats
        except Exception as e:
            logger.error(f"Error getting pipeline stats: {e}")
            return {}
