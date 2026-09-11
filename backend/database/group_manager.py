"""
backend/database/group_manager.py
---------------------------------
Data Access Manager for the 'groups' table.
Encapsulates:
  - Student study groups, cohorts, and classes across branches
  - Classroom capacity management and live headcount tracking
  - Teacher allocations and academic year assignments
  - Schedule associations and roster lookups
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


class GroupManager:
    """
    Manages operations for student groups, classes, and cohorts.
    """

    SAFE_COLUMNS = (
        "group_id, branch_id, level_id, academic_year_id, group_name, lead_teacher_id, "
        "secondary_teacher_id, max_capacity, current_headcount, status, created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        academic_year_id: Optional[int] = None,
        level_id: Optional[int] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves groups with rich relational context: branch name, program, level, and cycle.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        g.*,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        l.name_ar AS level_name_ar,
                        l.level_code,
                        l.color_tag AS level_color_tag,
                        p.program_id,
                        p.name_ar AS program_name_ar,
                        p.code AS program_code,
                        ay.name AS academic_year_name
                    FROM groups g
                    JOIN branches b ON g.branch_id = b.branch_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN academic_years ay ON g.academic_year_id = ay.academic_year_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND g.branch_id = %s"
                    params.append(branch_id.strip())
                if academic_year_id is not None:
                    query += " AND g.academic_year_id = %s"
                    params.append(academic_year_id)
                if level_id is not None:
                    query += " AND g.level_id = %s"
                    params.append(level_id)
                if status and status.strip():
                    query += " AND g.status = %s"
                    params.append(status.strip().upper())

                query += " ORDER BY g.branch_id ASC, g.group_id ASC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching groups: {e}")
            return []

    def get_by_id(
        self, group_id: int, include_schedules: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Retrieves a single group record by ID with relational labels and weekly schedules."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        g.*,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        l.name_ar AS level_name_ar,
                        l.level_code,
                        l.color_tag AS level_color_tag,
                        p.program_id,
                        p.name_ar AS program_name_ar,
                        p.code AS program_code,
                        ay.name AS academic_year_name
                    FROM groups g
                    JOIN branches b ON g.branch_id = b.branch_id
                    JOIN levels l ON g.level_id = l.level_id
                    JOIN programs p ON l.program_id = p.program_id
                    JOIN academic_years ay ON g.academic_year_id = ay.academic_year_id
                    WHERE g.group_id = %s;
                """
                cursor.execute(query, (group_id,))
                group = _dict_fetchone(cursor)
                if not group:
                    return None

                if include_schedules:
                    group["schedules"] = self.get_schedules(group_id, conn=conn)

                return group
        except Exception as e:
            logger.error(f"Error fetching group ID {group_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        level_id: int,
        academic_year_id: int,
        group_name: str,
        lead_teacher_id: Optional[int] = None,
        secondary_teacher_id: Optional[int] = None,
        max_capacity: int = 18,
        status: str = "ACTIVE",
    ) -> Optional[Dict[str, Any]]:
        """Registers a new study group or cohort."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO groups (
                    branch_id, level_id, academic_year_id, group_name,
                    lead_teacher_id, secondary_teacher_id, max_capacity, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        level_id,
                        academic_year_id,
                        group_name.strip(),
                        lead_teacher_id,
                        secondary_teacher_id,
                        max_capacity,
                        status.upper(),
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating group '{group_name}' in branch '{branch_id}': {e}")
            return None

    def update(self, group_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable group attributes."""
        allowed = {
            "level_id", "group_name", "lead_teacher_id", "secondary_teacher_id",
            "max_capacity", "status"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [group_id]
                query = f"UPDATE groups SET {', '.join(set_clauses)} WHERE group_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating group ID {group_id}: {e}")
            return False

    def toggle_status(self, group_id: int, new_status: str) -> bool:
        """Updates group operational status (ACTIVE, PLANNED, COMPLETED, MERGED, CANCELLED)."""
        valid_statuses = {"ACTIVE", "PLANNED", "COMPLETED", "MERGED", "CANCELLED"}
        norm_status = new_status.upper()
        if norm_status not in valid_statuses:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "UPDATE groups SET status = %s WHERE group_id = %s;"
                cursor.execute(query, (norm_status, group_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error changing status for group ID {group_id}: {e}")
            return False

    def delete(self, group_id: int) -> bool:
        """Deletes a group. Cascades to schedules and fails if enrollments exist."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM groups WHERE group_id = %s;"
                cursor.execute(query, (group_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting group ID {group_id}: {e}")
            return False

    def get_schedules(self, group_id: int, conn=None) -> List[Dict[str, Any]]:
        """Retrieves all weekly schedule time slots for this group."""
        def _exec(c):
            cursor = c.cursor()
            query = """
                SELECT 
                    gs.*,
                    cr.name AS classroom_name,
                    cr.capacity AS classroom_capacity,
                    cr.floor_number
                FROM group_schedules gs
                JOIN classrooms cr ON gs.classroom_id = cr.classroom_id
                WHERE gs.group_id = %s
                ORDER BY gs.schedule_id ASC;
            """
            cursor.execute(query, (group_id,))
            return _dict_fetchall(cursor)

        try:
            if conn:
                return _exec(conn)
            with self.db.get_db_connection() as local_conn:
                return _exec(local_conn)
        except Exception as e:
            logger.error(f"Error fetching schedules for group ID {group_id}: {e}")
            return []

    def recalculate_headcount(self, group_id: int) -> int:
        """Synchronizes current_headcount column with active enrollments."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    UPDATE groups
                    SET current_headcount = (
                        SELECT COUNT(*) FROM student_enrollments
                        WHERE group_id = %s AND enrollment_status = 'ACTIVE'
                    )
                    WHERE group_id = %s
                    RETURNING current_headcount;
                """
                cursor.execute(query, (group_id, group_id))
                conn.commit()
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error recalculating headcount for group ID {group_id}: {e}")
            return 0
