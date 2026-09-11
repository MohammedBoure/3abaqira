"""
backend/database/level_manager.py
---------------------------------
Data Access Manager for the 'levels' table.
Encapsulates:
  - Curriculum progression stages (p1, p2, s1, s2, preparatory cohorts, language tiers)
  - Color tagging for visual UI badging
  - Sequence order management and reordering
  - Age group cohort bounds
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


class LevelManager:
    """
    Manages operations for curriculum progression levels within educational programs.
    """

    SAFE_COLUMNS = (
        "level_id, program_id, level_code, name_ar, name_en, age_group_cohort, color_tag, sequence_order, created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        program_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves curriculum levels, optionally filtered by parent educational program.
        Sorted by sequence order ascending.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT l.*, p.name_ar AS program_name_ar, p.code AS program_code, p.branch_id
                    FROM levels l
                    JOIN programs p ON l.program_id = p.program_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if program_id is not None:
                    query += " AND l.program_id = %s"
                    params.append(program_id)

                query += " ORDER BY l.program_id ASC, l.sequence_order ASC, l.level_id ASC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching levels: {e}")
            return []

    def get_by_id(self, level_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single level by ID with program context."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT l.*, p.name_ar AS program_name_ar, p.code AS program_code, p.branch_id
                    FROM levels l
                    JOIN programs p ON l.program_id = p.program_id
                    WHERE l.level_id = %s;
                """
                cursor.execute(query, (level_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching level ID {level_id}: {e}")
            return None

    def get_by_code(self, program_id: int, level_code: str) -> Optional[Dict[str, Any]]:
        """Retrieves a level by unique program and level_code pair."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM levels WHERE program_id = %s AND level_code = %s;"
                cursor.execute(query, (program_id, level_code.strip()))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching level by code '{level_code}' in program {program_id}: {e}")
            return None

    def create(
        self,
        program_id: int,
        level_code: str,
        name_ar: str,
        name_en: Optional[str] = None,
        age_group_cohort: Optional[str] = None,
        color_tag: Optional[str] = None,
        sequence_order: int = 1,
    ) -> Optional[Dict[str, Any]]:
        """Registers a new curriculum level."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO levels (
                    program_id, level_code, name_ar, name_en, age_group_cohort, color_tag, sequence_order
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        program_id,
                        level_code.strip(),
                        name_ar.strip(),
                        name_en.strip() if name_en else None,
                        age_group_cohort.strip() if age_group_cohort else None,
                        color_tag.strip() if color_tag else None,
                        sequence_order,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating level '{level_code}' for program {program_id}: {e}")
            return None

    def update(self, level_id: int, **kwargs) -> bool:
        """Updates level attributes (name, sequence order, age group, color tag)."""
        allowed = {"level_code", "name_ar", "name_en", "age_group_cohort", "color_tag", "sequence_order"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [level_id]
                query = f"UPDATE levels SET {', '.join(set_clauses)} WHERE level_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating level ID {level_id}: {e}")
            return False

    def delete(self, level_id: int) -> bool:
        """Deletes a level. Fails if dependent student groups or pricing plans exist."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM levels WHERE level_id = %s;"
                cursor.execute(query, (level_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting level ID {level_id}: {e}")
            return False

    def reorder_levels(self, program_id: int, ordered_level_ids: List[int]) -> bool:
        """Atomically updates sequence orders for a list of level IDs under a program."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                for idx, lvl_id in enumerate(ordered_level_ids, start=1):
                    cursor.execute(
                        "UPDATE levels SET sequence_order = %s WHERE level_id = %s AND program_id = %s;",
                        (idx, lvl_id, program_id),
                    )
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error reordering levels for program {program_id}: {e}")
            return False
