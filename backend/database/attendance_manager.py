"""
backend/database/attendance_manager.py
--------------------------------------
Data Access Manager for 'completed_sessions' and 'student_attendance' tables.
Encapsulates:
  - Conducted classroom session logs, duration, instructor wage accrual
  - Per-student attendance marking (PRESENT, ABSENT, EXCUSED, LATE)
  - Student gamification points scoring and session evaluation notes
  - Batch attendance submission and historical presence reporting
"""

import logging
from datetime import date
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


class AttendanceManager:
    """
    Manages operations for completed class sessions and student attendance records.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # ── Completed Session Logging ────────────────────────────────────────────

    def get_sessions(
        self,
        branch_id: Optional[str] = None,
        group_id: Optional[int] = None,
        instructor_id: Optional[int] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves session records with group, branch, and instructor labels."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        cs.*,
                        g.group_name,
                        g.branch_id AS group_branch_id,
                        cr.name AS classroom_name,
                        COALESCE(e.full_name, 'Unassigned') AS instructor_name
                    FROM completed_sessions cs
                    JOIN groups g ON cs.group_id = g.group_id
                    LEFT JOIN classrooms cr ON cs.classroom_id = cr.classroom_id
                    LEFT JOIN employees e ON cs.instructor_id = e.employee_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND cs.branch_id = %s"
                    params.append(branch_id.strip())
                if group_id is not None:
                    query += " AND cs.group_id = %s"
                    params.append(group_id)
                if instructor_id is not None:
                    query += " AND cs.instructor_id = %s"
                    params.append(instructor_id)
                if start_date:
                    query += " AND cs.session_date >= %s"
                    params.append(start_date)
                if end_date:
                    query += " AND cs.session_date <= %s"
                    params.append(end_date)

                query += " ORDER BY cs.session_date DESC, cs.session_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching sessions: {e}")
            return []

    def get_session_by_id(
        self, session_id: int, include_attendance: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Retrieves single session log with student attendance list."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        cs.*,
                        g.group_name,
                        g.branch_id AS group_branch_id,
                        cr.name AS classroom_name,
                        COALESCE(e.full_name, 'Unassigned') AS instructor_name
                    FROM completed_sessions cs
                    JOIN groups g ON cs.group_id = g.group_id
                    LEFT JOIN classrooms cr ON cs.classroom_id = cr.classroom_id
                    LEFT JOIN employees e ON cs.instructor_id = e.employee_id
                    WHERE cs.session_id = %s;
                """
                cursor.execute(query, (session_id,))
                session = _dict_fetchone(cursor)
                if not session:
                    return None

                if include_attendance:
                    session["attendance"] = self.get_session_attendance(session_id, conn=conn)

                return session
        except Exception as e:
            logger.error(f"Error fetching session ID {session_id}: {e}")
            return None

    def create_session(
        self,
        branch_id: str,
        group_id: int,
        instructor_id: int,
        session_date: date,
        start_time: Optional[Any] = None,
        end_time: Optional[Any] = None,
        duration_hours: float = 2.0,
        classroom_id: Optional[int] = None,
        shift_slot: Optional[str] = None,
        calculated_wage: float = 0.0,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Logs a completed instructional session."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO completed_sessions (
                    branch_id, group_id, instructor_id, classroom_id,
                    session_date, start_time, end_time, duration_hours,
                    shift_slot, calculated_wage, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        group_id,
                        instructor_id,
                        classroom_id,
                        session_date,
                        start_time,
                        end_time,
                        duration_hours,
                        shift_slot.strip() if shift_slot else None,
                        calculated_wage,
                        notes.strip() if notes else None,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating session for group {group_id}: {e}")
            return None

    def update_session(self, session_id: int, **kwargs) -> bool:
        """Updates safe mutable session fields."""
        allowed = {
            "instructor_id", "classroom_id", "session_date", "start_time",
            "end_time", "duration_hours", "shift_slot", "calculated_wage",
            "notes", "is_counted_for_payroll", "payroll_item_id"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [session_id]
                query = f"UPDATE completed_sessions SET {', '.join(set_clauses)} WHERE session_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating session ID {session_id}: {e}")
            return False

    def delete_session(self, session_id: int) -> bool:
        """Deletes a session log. Cascades to student_attendance."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM completed_sessions WHERE session_id = %s;"
                cursor.execute(query, (session_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting session ID {session_id}: {e}")
            return False

    # ── Student Attendance Records ───────────────────────────────────────────

    def get_session_attendance(
        self, session_id: int, conn=None
    ) -> List[Dict[str, Any]]:
        """Retrieves attendance roster for a specific completed session."""
        def _exec(c):
            cursor = c.cursor()
            query = """
                SELECT 
                    sa.attendance_id,
                    sa.session_id,
                    sa.student_id,
                    s.student_code,
                    s.full_name_ar,
                    s.full_name_fr,
                    sa.status,
                    sa.points_scored,
                    sa.evaluation_notes
                FROM student_attendance sa
                JOIN students s ON sa.student_id = s.student_id
                WHERE sa.session_id = %s
                ORDER BY s.student_id ASC;
            """
            cursor.execute(query, (session_id,))
            return _dict_fetchall(cursor)

        try:
            if conn:
                return _exec(conn)
            with self.db.get_db_connection() as local_conn:
                return _exec(local_conn)
        except Exception as e:
            logger.error(f"Error fetching attendance for session {session_id}: {e}")
            return []

    def record_attendance_batch(
        self, session_id: int, records: List[Dict[str, Any]]
    ) -> int:
        """
        Batch submits student attendance for a completed session.
        Upserts records into 'student_attendance' and synchronizes
        'attended_student_count' in 'completed_sessions'.
        Returns number of attendance records processed.
        """
        if not records:
            return 0

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                upsert_query = """
                INSERT INTO student_attendance (
                    session_id, student_id, status, points_scored, evaluation_notes
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (session_id, student_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    points_scored = EXCLUDED.points_scored,
                    evaluation_notes = EXCLUDED.evaluation_notes;
                """
                for item in records:
                    cursor.execute(
                        upsert_query,
                        (
                            session_id,
                            item["student_id"],
                            item.get("status", "PRESENT").upper(),
                            item.get("points_scored", 0),
                            item.get("evaluation_notes"),
                        ),
                    )

                # Recompute attended_student_count (status in ('PRESENT', 'LATE'))
                count_query = """
                UPDATE completed_sessions
                SET attended_student_count = (
                    SELECT COUNT(*) FROM student_attendance
                    WHERE session_id = %s AND status IN ('PRESENT', 'LATE')
                )
                WHERE session_id = %s;
                """
                cursor.execute(count_query, (session_id, session_id))

                conn.commit()
                return len(records)
        except Exception as e:
            logger.error(f"Error recording attendance for session {session_id}: {e}")
            return 0

    def get_student_attendance_history(
        self, student_id: int, group_id: Optional[int] = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieves chronological attendance log for a specific student."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        sa.*,
                        cs.session_date,
                        cs.start_time,
                        cs.end_time,
                        cs.shift_slot,
                        g.group_name
                    FROM student_attendance sa
                    JOIN completed_sessions cs ON sa.session_id = cs.session_id
                    JOIN groups g ON cs.group_id = g.group_id
                    WHERE sa.student_id = %s
                """
                params: List[Any] = [student_id]
                if group_id is not None:
                    query += " AND cs.group_id = %s"
                    params.append(group_id)

                query += " ORDER BY cs.session_date DESC LIMIT %s;"
                params.append(limit)

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching attendance history for student {student_id}: {e}")
            return []
