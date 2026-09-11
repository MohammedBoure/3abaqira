"""
backend/database/classroom_manager.py
--------------------------------------
Data Access Manager for the 'classrooms' table.
Handles classroom allocations, room capacities, floor plans, and branch associations.
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


class ClassroomManager:
    """
    Manages operations for the 'classrooms' table across all branches.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Retrieves classrooms with optional filtering by branch and active status."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT c.*, b.name_ar AS branch_name_ar, b.name_en AS branch_name_en
                    FROM classrooms c
                    JOIN branches b ON c.branch_id = b.branch_id
                """
                clauses = []
                params = []

                if branch_id:
                    clauses.append("c.branch_id = %s")
                    params.append(branch_id)
                if active_only:
                    clauses.append("c.is_active = TRUE")

                if clauses:
                    query += " WHERE " + " AND ".join(clauses)

                query += " ORDER BY c.branch_id, c.floor_number, c.name;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching classrooms: {e}")
            return []

    def get_by_id(self, classroom_id: int) -> Optional[Dict[str, Any]]:
        """Fetches a specific classroom by ID with its parent branch details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT c.*, b.name_ar AS branch_name_ar, b.name_en AS branch_name_en
                    FROM classrooms c
                    JOIN branches b ON c.branch_id = b.branch_id
                    WHERE c.classroom_id = %s;
                """
                cursor.execute(query, (classroom_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching classroom ID {classroom_id}: {e}")
            return None

    def get_by_branch(self, branch_id: str, active_only: bool = False) -> List[Dict[str, Any]]:
        """Convenience method to retrieve all rooms for a specific branch."""
        return self.get_all(branch_id=branch_id, active_only=active_only)

    def create(
        self,
        branch_id: str,
        name: str,
        capacity: int = 20,
        floor_number: int = 0,
        description: Optional[str] = None,
        is_active: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Registers a new classroom/hall for a branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO classrooms (
                        branch_id, name, capacity, floor_number, description, is_active
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING *;
                """
                cursor.execute(
                    query,
                    (branch_id, name, capacity, floor_number, description, is_active)
                )
                result = _dict_fetchone(cursor)
                logger.info(f"Classroom '{name}' created for branch '{branch_id}'.")
                return result
        except Exception as e:
            try:
                with self.db.get_db_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        INSERT INTO classrooms (
                            branch_id, name, capacity, floor_number, description, is_active
                        ) VALUES (%s, %s, %s, %s, %s, %s);
                        """,
                        (branch_id, name, capacity, floor_number, description, is_active)
                    )
                    cursor.execute(
                        "SELECT * FROM classrooms WHERE branch_id = %s AND name = %s;",
                        (branch_id, name)
                    )
                    return _dict_fetchone(cursor)
            except Exception as fallback_err:
                logger.error(f"Error creating classroom '{name}': {fallback_err}")
                return None

    def update(self, classroom_id: int, **kwargs) -> bool:
        """Updates attributes of an existing classroom."""
        allowed_fields = {'name', 'capacity', 'floor_number', 'description', 'is_active', 'branch_id'}
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        if not updates:
            return False

        set_clauses = [f"{k} = %s" for k in updates.keys()]
        values = list(updates.values())
        values.append(classroom_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"UPDATE classrooms SET {', '.join(set_clauses)} WHERE classroom_id = %s;"
                cursor.execute(query, values)
                logger.info(f"Classroom ID {classroom_id} updated successfully.")
                return True
        except Exception as e:
            logger.error(f"Error updating classroom ID {classroom_id}: {e}")
            return False

    def toggle_status(self, classroom_id: int, is_active: bool) -> bool:
        """Enables or disables a classroom."""
        return self.update(classroom_id, is_active=is_active)

    def delete(self, classroom_id: int) -> bool:
        """Deletes a classroom record. Fails if referenced by group schedules."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM classrooms WHERE classroom_id = %s;", (classroom_id,))
                logger.info(f"Classroom ID {classroom_id} deleted successfully.")
                return True
        except Exception as e:
            logger.error(f"Error deleting classroom ID {classroom_id}: {e}")
            return False

    def count_by_branch(self, branch_id: str) -> int:
        """Returns total classrooms for a given branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT COUNT(*) FROM classrooms WHERE branch_id = %s;",
                    (branch_id,)
                )
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error counting classrooms for branch '{branch_id}': {e}")
            return 0
