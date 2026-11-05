"""
backend/database/acad_workshop_manager.py
------------------------------------------
Data Access Manager for Academy Workshops (acad_workshop):
  - Workshop disciplines (Soroban, Robotics, Languages, AI, Speedcubing, Quran, Sports, etc.)
  - Evaluation type classification (TIMED_OPERATIONS, ORAL_RIGHT_WRONG, PROJECT, CHALLENGE_MILESTONES, STANDARD_SCORE)
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


class AcadWorkshopManager:
    """
    Manages educational workshops and disciplines taught across Academy branches.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all_workshops(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """Retrieves all workshops."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM acad_workshop"
                if active_only:
                    query += " WHERE is_active = TRUE"
                query += " ORDER BY workshop_id ASC;"
                cursor.execute(query)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching workshops: {e}")
            return []

    def get_workshop_by_id(self, workshop_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves workshop by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM acad_workshop WHERE workshop_id = %s;", (workshop_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching workshop {workshop_id}: {e}")
            return None

    def get_workshop_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Retrieves workshop by unique code."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM acad_workshop WHERE code = %s;", (code.strip().upper(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching workshop by code '{code}': {e}")
            return None

    def create_workshop(
        self,
        code: str,
        name_ar: str,
        name_en: Optional[str] = None,
        evaluation_type: str = "STANDARD_SCORE",
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new educational workshop."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_workshop (code, name_ar, name_en, evaluation_type, description, is_active)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        code.strip().upper(),
                        name_ar.strip(),
                        name_en.strip() if name_en else None,
                        evaluation_type.strip().upper(),
                        description,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating workshop '{code}': {e}")
            raise
