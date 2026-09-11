"""
backend/database/program_manager.py
-----------------------------------
Data Access Manager for the 'programs' table.
Encapsulates:
  - Multi-tenant educational programs (Soroban, Quran, Daycare, Robotics, Languages)
  - Billing structure categorization (INSTALLMENT_PLAN, MONTHLY_RECURRING, etc.)
  - Branch-scoped program catalogs and associated levels
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


class ProgramManager:
    """
    Manages operations for educational and extracurricular programs across branches.
    """

    SAFE_COLUMNS = (
        "program_id, branch_id, code, name_ar, name_en, billing_type, description, is_active, created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        billing_type: Optional[str] = None,
        active_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all educational programs with optional filtering by branch, billing model, and active state.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT p.*, b.name_ar AS branch_name_ar, b.name_en AS branch_name_en
                    FROM programs p
                    JOIN branches b ON p.branch_id = b.branch_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND p.branch_id = %s"
                    params.append(branch_id.strip())
                if billing_type:
                    query += " AND p.billing_type = %s"
                    params.append(billing_type.strip().upper())
                if active_only:
                    query += " AND p.is_active = TRUE"

                query += " ORDER BY p.branch_id ASC, p.program_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching programs: {e}")
            return []

    def get_by_id(
        self, program_id: int, include_levels: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single program by primary key, optionally aggregating all associated levels.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT p.*, b.name_ar AS branch_name_ar, b.name_en AS branch_name_en
                    FROM programs p
                    JOIN branches b ON p.branch_id = b.branch_id
                    WHERE p.program_id = %s;
                """
                cursor.execute(query, (program_id,))
                program = _dict_fetchone(cursor)
                if not program:
                    return None

                if include_levels:
                    program["levels"] = self.get_levels(program_id, conn=conn)

                return program
        except Exception as e:
            logger.error(f"Error fetching program ID {program_id}: {e}")
            return None

    def get_by_code(self, branch_id: str, code: str) -> Optional[Dict[str, Any]]:
        """Retrieves program by unique branch code combination."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM programs WHERE branch_id = %s AND code = %s;"
                cursor.execute(query, (branch_id.strip(), code.strip()))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching program by code '{code}' in branch '{branch_id}': {e}")
            return None

    def create(
        self,
        branch_id: str,
        code: str,
        name_ar: str,
        name_en: Optional[str] = None,
        billing_type: str = "INSTALLMENT_PLAN",
        description: Optional[str] = None,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Registers a new educational program under a branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO programs (
                    branch_id, code, name_ar, name_en, billing_type, description, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        code.strip().upper(),
                        name_ar.strip(),
                        name_en.strip() if name_en else None,
                        billing_type.strip().upper(),
                        description.strip() if description else None,
                        is_active,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating program '{code}' in branch '{branch_id}': {e}")
            return None

    def update(self, program_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable program attributes."""
        allowed = {"code", "name_ar", "name_en", "billing_type", "description", "is_active"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [program_id]
                query = f"UPDATE programs SET {', '.join(set_clauses)} WHERE program_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating program ID {program_id}: {e}")
            return False

    def toggle_status(self, program_id: int, is_active: bool) -> bool:
        """Enables or disables an educational program."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "UPDATE programs SET is_active = %s WHERE program_id = %s;"
                cursor.execute(query, (is_active, program_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error toggling status for program ID {program_id}: {e}")
            return False

    def delete(self, program_id: int) -> bool:
        """Deletes a program. Fails if child levels or active enrollments exist."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM programs WHERE program_id = %s;"
                cursor.execute(query, (program_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting program ID {program_id}: {e}")
            return False

    def get_levels(self, program_id: int, conn=None) -> List[Dict[str, Any]]:
        """Lists all sequential curriculum levels assigned to this program."""
        def _exec(c):
            cursor = c.cursor()
            query = """
                SELECT * FROM levels
                WHERE program_id = %s
                ORDER BY sequence_order ASC, level_id ASC;
            """
            cursor.execute(query, (program_id,))
            return _dict_fetchall(cursor)

        try:
            if conn:
                return _exec(conn)
            with self.db.get_db_connection() as local_conn:
                return _exec(local_conn)
        except Exception as e:
            logger.error(f"Error fetching levels for program ID {program_id}: {e}")
            return []

    def get_pricing_plans(
        self, program_id: int, academic_year_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Lists active pricing models configured for this program."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM pricing_plans WHERE program_id = %s"
                params: List[Any] = [program_id]
                if academic_year_id:
                    query += " AND academic_year_id = %s"
                    params.append(academic_year_id)
                query += " ORDER BY is_active DESC, pricing_plan_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching pricing plans for program ID {program_id}: {e}")
            return []
