"""
backend/database/org_manager.py
--------------------------------
Data Access Manager for Organization Entities:
  - org_branch: 13 multi-tenant branches (Academy vs Kindergarten)
  - org_academic_year: Non-overlapping fiscal/academic years with single current year enforcement
  - org_room: Physical classrooms and activity rooms with branch isolation & capacity limits
  - org_room_equipment: Inventory of equipment per room
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


class OrgManager:
    """
    Manages branches, non-overlapping academic years, rooms, and room equipment.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # BRANCHES (13 BRANCHES: ACADEMY VS KINDERGARTEN)
    # =========================================================================
    def get_all_branches(
        self, branch_type: Optional[str] = None, active_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Retrieves all branches with optional filtering."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM org_branch WHERE 1=1"
                params = []
                if branch_type:
                    query += " AND branch_type = %s"
                    params.append(branch_type.strip().upper())
                if active_only:
                    query += " AND is_active = TRUE"
                query += " ORDER BY branch_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching branches: {e}")
            return []

    def get_branch_by_id(self, branch_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a branch by primary key."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM org_branch WHERE branch_id = %s;", (branch_id.strip(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching branch '{branch_id}': {e}")
            return None

    def create_branch(
        self,
        branch_id: str,
        code: str,
        name_ar: str,
        name_en: Optional[str] = None,
        branch_type: str = "ACADEMY",
        address: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new branch record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO org_branch (
                    branch_id, code, name_ar, name_en, branch_type, address, phone, email, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        code.strip(),
                        name_ar.strip(),
                        name_en.strip() if name_en else None,
                        branch_type.strip().upper(),
                        address.strip() if address else None,
                        phone.strip() if phone else None,
                        email.strip() if email else None,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating branch '{branch_id}': {e}")
            raise

    # =========================================================================
    # ACADEMIC YEARS (NON-OVERLAPPING & SINGLE CURRENT)
    # =========================================================================
    def get_all_academic_years(self) -> List[Dict[str, Any]]:
        """Returns all registered academic cycles ordered by start date."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM org_academic_year ORDER BY start_date DESC;")
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching academic years: {e}")
            return []

    def get_current_academic_year(self) -> Optional[Dict[str, Any]]:
        """Returns the uniquely active current academic year."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM org_academic_year WHERE is_current = TRUE LIMIT 1;")
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching current academic year: {e}")
            return None

    def create_academic_year(
        self,
        name: str,
        start_date: Any,
        end_date: Any,
        is_current: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates an academic year.
        Enforces:
          1. end_date > start_date.
          2. Non-overlapping dates rule with existing academic years.
          3. Single current year: If is_current=True, unset all others.
        """
        start_str = str(start_date)
        end_str = str(end_date)
        if end_str <= start_str:
            raise ValueError("Academic year constraint violation: end_date must be strictly after start_date.")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Check for overlapping dates
                check_query = """
                SELECT academic_year_id, name, start_date, end_date
                FROM org_academic_year
                WHERE (start_date <= %s AND end_date >= %s);
                """
                cursor.execute(check_query, (end_str, start_str))
                conflict = _dict_fetchone(cursor)
                if conflict:
                    raise ValueError(
                        f"Non-overlapping rule violation: Date range [{start_str} to {end_str}] "
                        f"overlaps with existing academic year '{conflict['name']}' "
                        f"[{conflict['start_date']} to {conflict['end_date']}]."
                    )

                if is_current:
                    cursor.execute("UPDATE org_academic_year SET is_current = FALSE;")

                query = """
                INSERT INTO org_academic_year (name, start_date, end_date, is_current)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(query, (name.strip(), start_str, end_str, is_current))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating academic year '{name}': {e}")
            raise

    def set_current_academic_year(self, academic_year_id: int) -> Optional[Dict[str, Any]]:
        """Sets an academic year as the single current active year."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("UPDATE org_academic_year SET is_current = FALSE;")
                cursor.execute(
                    "UPDATE org_academic_year SET is_current = TRUE WHERE academic_year_id = %s RETURNING *;",
                    (academic_year_id,),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error setting current academic year {academic_year_id}: {e}")
            raise

    # =========================================================================
    # ROOMS & EQUIPMENT
    # =========================================================================
    def create_room(
        self,
        branch_id: str,
        name: str,
        capacity: int = 20,
        floor_number: int = 0,
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a room assigned to a branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO org_room (branch_id, name, capacity, floor_number, description, is_active)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (branch_id.strip(), name.strip(), capacity, floor_number, description),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating room '{name}' for branch '{branch_id}': {e}")
            raise

    def get_rooms_by_branch(self, branch_id: str, active_only: bool = True) -> List[Dict[str, Any]]:
        """Retrieves all rooms for a branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM org_room WHERE branch_id = %s"
                params = [branch_id.strip()]
                if active_only:
                    query += " AND is_active = TRUE"
                query += " ORDER BY name ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching rooms for branch '{branch_id}': {e}")
            return []

    def get_room_by_id(self, room_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a room by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM org_room WHERE room_id = %s;", (room_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching room {room_id}: {e}")
            return None

    def add_room_equipment(
        self,
        room_id: int,
        name: str,
        quantity: int = 1,
        condition: str = "GOOD",
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Registers equipment inside a room."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO org_room_equipment (room_id, name, quantity, condition, notes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (room_id, name.strip(), quantity, condition.strip().upper(), notes),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error adding equipment to room {room_id}: {e}")
            raise

    def get_room_equipment(self, room_id: int) -> List[Dict[str, Any]]:
        """Lists all equipment in a given room."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM org_room_equipment WHERE room_id = %s ORDER BY equipment_id ASC;",
                    (room_id,),
                )
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching equipment for room {room_id}: {e}")
            return []
