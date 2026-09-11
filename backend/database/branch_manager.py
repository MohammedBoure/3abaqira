"""
backend/database/branch_manager.py
-----------------------------------
Data Access Manager for the 'branches' table.
Encapsulates CRUD operations, multi-tenant branch routing, and active status toggles.
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


class BranchManager:
    """
    Manages operations for the 'branches' table (CENTER, RAWDA, and future branch locations).
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """Retrieves all registered branches with optional active-only filter."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM branches"
                params = []
                if active_only:
                    query += " WHERE is_active = TRUE"
                query += " ORDER BY created_at ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching branches: {e}")
            return []

    def get_by_id(self, branch_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a branch by its unique identifier (e.g. 'CENTER', 'RAWDA')."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM branches WHERE branch_id = %s;", (branch_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching branch '{branch_id}': {e}")
            return None

    def create(
        self,
        branch_id: str,
        name_ar: str,
        branch_type: str,
        name_en: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        address: Optional[str] = None,
        is_active: bool = True
    ) -> Optional[Dict[str, Any]]:
        """Registers a new organizational branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO branches (
                        branch_id, name_ar, name_en, branch_type, phone, email, address, is_active
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *;
                """
                cursor.execute(
                    query,
                    (branch_id, name_ar, name_en, branch_type, phone, email, address, is_active)
                )
                branch = _dict_fetchone(cursor)
                logger.info(f"Branch '{branch_id}' registered successfully.")
                return branch
        except Exception as e:
            # Fallback for databases without RETURNING clause
            try:
                with self.db.get_db_connection() as conn:
                    cursor = conn.cursor()
                    insert_query = """
                        INSERT INTO branches (
                            branch_id, name_ar, name_en, branch_type, phone, email, address, is_active
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
                    """
                    cursor.execute(
                        insert_query,
                        (branch_id, name_ar, name_en, branch_type, phone, email, address, is_active)
                    )
                    return self.get_by_id(branch_id)
            except Exception as fallback_err:
                logger.error(f"Error registering branch '{branch_id}': {fallback_err}")
                return None

    def update(self, branch_id: str, **kwargs) -> bool:
        """Updates attributes of an existing branch."""
        allowed_fields = {
            'name_ar', 'name_en', 'branch_type', 'phone', 'email', 'address', 'is_active'
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        if not updates:
            return False

        set_clauses = [f"{k} = %s" for k in updates.keys()]
        set_clauses.append("updated_at = CURRENT_TIMESTAMP")
        values = list(updates.values())
        values.append(branch_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"UPDATE branches SET {', '.join(set_clauses)} WHERE branch_id = %s;"
                cursor.execute(query, values)
                logger.info(f"Branch '{branch_id}' updated successfully.")
                return True
        except Exception as e:
            logger.error(f"Error updating branch '{branch_id}': {e}")
            return False

    def toggle_status(self, branch_id: str, is_active: bool) -> bool:
        """Enables or disables an operational branch."""
        return self.update(branch_id, is_active=is_active)

    def delete(self, branch_id: str) -> bool:
        """
        Deletes a branch record.
        Fails if foreign key references (classrooms, programs, etc.) exist.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM branches WHERE branch_id = %s;", (branch_id,))
                logger.info(f"Branch '{branch_id}' deleted successfully.")
                return True
        except Exception as e:
            logger.error(f"Error deleting branch '{branch_id}': {e}")
            return False

    def count(self) -> int:
        """Returns the total number of branches."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM branches;")
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error counting branches: {e}")
            return 0
