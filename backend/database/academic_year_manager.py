"""
backend/database/academic_year_manager.py
------------------------------------------
Data Access Manager for the 'academic_years' table.
Handles academic fiscal years, date validation, and atomic current-year switching.
"""

import logging
from typing import List, Dict, Optional, Any
from datetime import date

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


class AcademicYearManager:
    """
    Manages operations for the 'academic_years' table.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(self) -> List[Dict[str, Any]]:
        """Returns all registered academic years sorted by start_date descending."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM academic_years ORDER BY start_date DESC;")
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching academic years: {e}")
            return []

    def get_by_id(self, academic_year_id: int) -> Optional[Dict[str, Any]]:
        """Fetches an academic year by its primary key ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM academic_years WHERE academic_year_id = %s;",
                    (academic_year_id,)
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching academic year ID {academic_year_id}: {e}")
            return None

    def get_current(self) -> Optional[Dict[str, Any]]:
        """Retrieves the currently active academic fiscal year (is_current = TRUE)."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM academic_years WHERE is_current = TRUE LIMIT 1;"
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching current academic year: {e}")
            return None

    def create(
        self,
        name: str,
        start_date: Any,
        end_date: Any,
        is_current: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a new academic year.
        If is_current=True, it deactivates is_current on all other academic years.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                if is_current:
                    cursor.execute("UPDATE academic_years SET is_current = FALSE;")

                query = """
                    INSERT INTO academic_years (name, start_date, end_date, is_current)
                    VALUES (%s, %s, %s, %s)
                    RETURNING *;
                """
                cursor.execute(query, (name, start_date, end_date, is_current))
                result = _dict_fetchone(cursor)
                logger.info(f"Academic year '{name}' created successfully.")
                return result
        except Exception as e:
            # Fallback for standard SQL
            try:
                with self.db.get_db_connection() as conn:
                    cursor = conn.cursor()
                    if is_current:
                        cursor.execute("UPDATE academic_years SET is_current = FALSE;")
                    cursor.execute(
                        "INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (%s, %s, %s, %s);",
                        (name, start_date, end_date, is_current)
                    )
                    cursor.execute("SELECT * FROM academic_years WHERE name = %s;", (name,))
                    return _dict_fetchone(cursor)
            except Exception as fallback_err:
                logger.error(f"Error creating academic year '{name}': {fallback_err}")
                return None

    def update(self, academic_year_id: int, **kwargs) -> bool:
        """Updates properties of an existing academic year."""
        allowed_fields = {'name', 'start_date', 'end_date', 'is_current'}
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                if updates.get('is_current') is True:
                    cursor.execute(
                        "UPDATE academic_years SET is_current = FALSE WHERE academic_year_id != %s;",
                        (academic_year_id,)
                    )

                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values())
                values.append(academic_year_id)

                query = f"UPDATE academic_years SET {', '.join(set_clauses)} WHERE academic_year_id = %s;"
                cursor.execute(query, values)
                logger.info(f"Academic year ID {academic_year_id} updated successfully.")
                return True
        except Exception as e:
            logger.error(f"Error updating academic year ID {academic_year_id}: {e}")
            return False

    def set_current(self, academic_year_id: int) -> bool:
        """Atomically switches the active academic year."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE academic_years SET is_current = FALSE;")
                cursor.execute(
                    "UPDATE academic_years SET is_current = TRUE WHERE academic_year_id = %s;",
                    (academic_year_id,)
                )
                logger.info(f"Academic year ID {academic_year_id} set as current.")
                return True
        except Exception as e:
            logger.error(f"Error setting current academic year ID {academic_year_id}: {e}")
            return False

    def delete(self, academic_year_id: int) -> bool:
        """Deletes an academic year record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "DELETE FROM academic_years WHERE academic_year_id = %s;",
                    (academic_year_id,)
                )
                logger.info(f"Academic year ID {academic_year_id} deleted successfully.")
                return True
        except Exception as e:
            logger.error(f"Error deleting academic year ID {academic_year_id}: {e}")
            return False

    def count(self) -> int:
        """Returns total academic years count."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM academic_years;")
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error counting academic years: {e}")
            return 0
