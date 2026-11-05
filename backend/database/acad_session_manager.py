"""
backend/database/acad_session_manager.py
-----------------------------------------
Data Access Manager for Sessions, Attendance, and Telephone Call Justification Logging:
  - acad_session: Conducted or planned classroom/workshop sessions
  - acad_attendance: Per-student attendance with automatic make-up session generation on absence
  - Absence telephone call logging: Telephone follow-ups and verbal justification capture
"""

import logging
from typing import List, Dict, Optional, Any
from .acad_makeup_manager import AcadMakeupManager

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


class AcadSessionManager:
    """
    Manages session execution, session-level attendance rosters,
    telephone justification call logs, and automatic make-up generation.
    """

    def __init__(self, db_instance):
        self.db = db_instance
        self.makeup_mgr = AcadMakeupManager(db_instance)

    # =========================================================================
    # SESSIONS
    # =========================================================================
    def create_session(
        self,
        group_id: int,
        session_date: Any,
        start_time: str,
        end_time: str,
        room_id: Optional[int] = None,
        trainer_person_id: Optional[int] = None,
        is_makeup: bool = False,
        topic: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates an academic session."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_session (
                    group_id, session_date, start_time, end_time,
                    room_id, trainer_person_id, is_makeup, status, topic, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'SCHEDULED', %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        group_id,
                        str(session_date),
                        start_time.strip(),
                        end_time.strip(),
                        room_id,
                        trainer_person_id,
                        is_makeup,
                        topic,
                        notes,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating session for group {group_id}: {e}")
            raise

    def get_session_by_id(self, session_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves session details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT s.*, g.group_name, c.name_ar AS course_name, r.name AS room_name,
                       p.full_name_ar AS trainer_name
                FROM acad_session s
                JOIN acad_group g ON s.group_id = g.group_id
                JOIN acad_course c ON g.course_id = c.course_id
                LEFT JOIN org_room r ON s.room_id = r.room_id
                LEFT JOIN core_person p ON s.trainer_person_id = p.person_id
                WHERE s.session_id = %s;
                """
                cursor.execute(query, (session_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching session {session_id}: {e}")
            return None

    # =========================================================================
    # ATTENDANCE & AUTOMATIC MAKE-UP ON ABSENCE
    # =========================================================================
    def mark_attendance(
        self,
        session_id: int,
        student_id: int,
        status: str,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Marks attendance for a student.
        AUTOMATIC TRIGGER: If status is 'ABSENT', automatically generates
        a make-up session credit in acad_makeup!
        """
        stat_norm = status.strip().upper()
        if stat_norm not in ("PRESENT", "ABSENT", "LATE", "EXCUSED"):
            raise ValueError(f"Invalid attendance status '{status}'. Must be PRESENT, ABSENT, LATE, or EXCUSED.")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_attendance (
                    session_id, student_id, status, notes
                )
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (session_id, student_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes
                RETURNING *;
                """
                cursor.execute(query, (session_id, student_id, stat_norm, notes))
                attendance_row = _dict_fetchone(cursor)

            # Trigger automatic make-up session generation on absence
            if stat_norm == "ABSENT":
                self.makeup_mgr.create_makeup_credit(
                    student_id=student_id,
                    reason="ABSENCE",
                    source_session_id=session_id,
                    notes=f"Auto-generated make-up credit from absence in session #{session_id}",
                )

            return attendance_row
        except Exception as e:
            logger.error(f"Error marking attendance for student {student_id} in session {session_id}: {e}")
            raise

    # =========================================================================
    # ABSENCE TELEPHONE CALL LOGGING
    # =========================================================================
    def log_absence_telephone_call(
        self,
        attendance_id: int,
        caller_person_id: Optional[int],
        call_answered: bool,
        absence_justification: Optional[str] = None,
        parent_contacted_phone: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Logs a phone call made to the parent regarding an absence or tardiness.
        Captures verbal justifications received by telephone.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE acad_attendance
                SET call_logged = TRUE,
                    call_timestamp = CURRENT_TIMESTAMP,
                    caller_person_id = %s,
                    call_answered = %s,
                    absence_justification = %s,
                    parent_contacted_phone = %s,
                    notes = COALESCE(%s, notes)
                WHERE attendance_id = %s
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        caller_person_id,
                        call_answered,
                        absence_justification.strip() if absence_justification else None,
                        parent_contacted_phone.strip() if parent_contacted_phone else None,
                        notes,
                        attendance_id,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error logging absence telephone call for attendance {attendance_id}: {e}")
            raise

    def get_session_attendance(self, session_id: int) -> List[Dict[str, Any]]:
        """Retrieves attendance roster for a session with student info and call logs."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT a.*, p.full_name_ar AS student_name, p.phone AS student_phone,
                       caller.full_name_ar AS caller_name
                FROM acad_attendance a
                JOIN core_student s ON a.student_id = s.student_id
                JOIN core_person p ON s.person_id = p.person_id
                LEFT JOIN core_person caller ON a.caller_person_id = caller.person_id
                WHERE a.session_id = %s
                ORDER BY p.full_name_ar ASC;
                """
                cursor.execute(query, (session_id,))
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching attendance for session {session_id}: {e}")
            return []
