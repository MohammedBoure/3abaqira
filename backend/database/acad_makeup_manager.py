"""
backend/database/acad_makeup_manager.py
----------------------------------------
Data Access Manager for Make-Up Session Queue (acad_makeup):
  - Automatic make-up session generation on absence or failed test evaluations
  - Make-up credit lifecycle (OWED -> SCHEDULED -> COMPLETED / CANCELLED)
"""

import logging
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


class AcadMakeupManager:
    """
    Manages make-up session credits owed to students resulting from
    recorded absences or failed test attempts.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def create_makeup_credit(
        self,
        student_id: int,
        reason: str,
        source_session_id: Optional[int] = None,
        source_eval_result_id: Optional[int] = None,
        course_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a new make-up session owed to a student.
        Triggered automatically on session absence or failed test.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_makeup (
                    student_id, reason, source_session_id, source_eval_result_id,
                    course_id, status, notes, created_at
                )
                VALUES (%s, %s, %s, %s, %s, 'OWED', %s, CURRENT_TIMESTAMP)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        student_id,
                        reason.strip().upper(),
                        source_session_id,
                        source_eval_result_id,
                        course_id,
                        notes,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating make-up credit for student {student_id}: {e}")
            raise

    def get_makeups(
        self,
        student_id: Optional[int] = None,
        status: Optional[str] = None,
        reason: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves make-up records with optional status/student filtering."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT m.*, p.full_name_ar AS student_name, c.name_ar AS course_name
                FROM acad_makeup m
                JOIN core_student s ON m.student_id = s.student_id
                JOIN core_person p ON s.person_id = p.person_id
                LEFT JOIN acad_course c ON m.course_id = c.course_id
                WHERE 1=1
                """
                params = []
                if student_id:
                    query += " AND m.student_id = %s"
                    params.append(student_id)
                if status:
                    query += " AND m.status = %s"
                    params.append(status.strip().upper())
                if reason:
                    query += " AND m.reason = %s"
                    params.append(reason.strip().upper())

                query += " ORDER BY m.makeup_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching make-up credits: {e}")
            return []

    def assign_makeup_to_session(
        self, makeup_id: int, assigned_session_id: int
    ) -> Optional[Dict[str, Any]]:
        """Assigns an owed make-up credit to an upcoming make-up session."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE acad_makeup
                SET assigned_session_id = %s,
                    status = 'SCHEDULED'
                WHERE makeup_id = %s
                RETURNING *;
                """
                cursor.execute(query, (assigned_session_id, makeup_id))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error assigning make-up {makeup_id} to session {assigned_session_id}: {e}")
            raise

    def complete_makeup(self, makeup_id: int) -> Optional[Dict[str, Any]]:
        """Marks a make-up session as successfully fulfilled/completed."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE acad_makeup
                SET status = 'COMPLETED',
                    completed_at = CURRENT_TIMESTAMP
                WHERE makeup_id = %s
                RETURNING *;
                """
                cursor.execute(query, (makeup_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error completing make-up {makeup_id}: {e}")
            raise
