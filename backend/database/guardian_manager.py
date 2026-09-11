"""
backend/database/guardian_manager.py
-------------------------------------
Data Access Manager for the 'guardians' table and student-guardian relationships.
Encapsulates CRUD operations, contact lookups, relationship validation,
and child student linkages.
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


class GuardianManager:
    """
    Manages operations for the 'guardians' table and related guardian queries.
    """

    SAFE_COLUMNS = (
        "guardian_id, full_name_ar, full_name_fr, phone_primary, phone_secondary, "
        "relationship, national_id, address, email, notes, created_at, updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        search: Optional[str] = None,
        relationship: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves guardians with optional search filter across names, phone numbers, and national ID.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM guardians WHERE 1=1"
                params: List[Any] = []

                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        full_name_ar ILIKE %s OR
                        COALESCE(full_name_fr, '') ILIKE %s OR
                        phone_primary ILIKE %s OR
                        COALESCE(phone_secondary, '') ILIKE %s OR
                        COALESCE(national_id, '') ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern, pattern, pattern])

                if relationship and relationship.strip():
                    query += " AND relationship = %s"
                    params.append(relationship.strip())

                query += " ORDER BY guardian_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching guardians: {e}")
            return []

    def get_by_id(self, guardian_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single guardian details by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM guardians WHERE guardian_id = %s;"
                cursor.execute(query, (guardian_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching guardian ID {guardian_id}: {e}")
            return None

    def get_by_phone(self, phone: str) -> List[Dict[str, Any]]:
        """Finds guardians matching primary or secondary phone number."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cleaned_phone = phone.strip()
                query = f"""
                    SELECT {self.SAFE_COLUMNS} FROM guardians
                    WHERE phone_primary = %s OR phone_secondary = %s
                    ORDER BY guardian_id ASC;
                """
                cursor.execute(query, (cleaned_phone, cleaned_phone))
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error searching guardian by phone '{phone}': {e}")
            return []

    def create(
        self,
        full_name_ar: str,
        phone_primary: str,
        full_name_fr: Optional[str] = None,
        phone_secondary: Optional[str] = None,
        relationship: str = "Parent",
        national_id: Optional[str] = None,
        address: Optional[str] = None,
        email: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Registers a new guardian / parent record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO guardians (
                    full_name_ar, full_name_fr, phone_primary, phone_secondary,
                    relationship, national_id, address, email, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        full_name_ar.strip(),
                        full_name_fr.strip() if full_name_fr else None,
                        phone_primary.strip(),
                        phone_secondary.strip() if phone_secondary else None,
                        relationship.strip() if relationship else "Parent",
                        national_id.strip() if national_id else None,
                        address.strip() if address else None,
                        email.strip() if email else None,
                        notes.strip() if notes else None,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating guardian '{full_name_ar}': {e}")
            return None

    def update(self, guardian_id: int, **kwargs) -> bool:
        """Dynamically updates attributes of a guardian record."""
        allowed = {
            "full_name_ar", "full_name_fr", "phone_primary", "phone_secondary",
            "relationship", "national_id", "address", "email", "notes"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values = list(updates.values()) + [guardian_id]
                query = f"UPDATE guardians SET {', '.join(set_clauses)} WHERE guardian_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating guardian ID {guardian_id}: {e}")
            return False

    def delete(self, guardian_id: int) -> bool:
        """Deletes a guardian record. Cascades or restricts based on schema relations."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM guardians WHERE guardian_id = %s;"
                cursor.execute(query, (guardian_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting guardian ID {guardian_id}: {e}")
            return False

    def get_students_for_guardian(self, guardian_id: int) -> List[Dict[str, Any]]:
        """
        Retrieves all students linked to this guardian through 'student_guardians',
        including pickup authorization and relationship metadata.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        s.student_id,
                        s.student_code,
                        s.first_name,
                        s.last_name,
                        s.full_name_ar,
                        s.full_name_fr,
                        s.birth_date,
                        s.gender,
                        s.blood_group,
                        s.emergency_phone,
                        s.is_active,
                        sg.is_primary_guardian,
                        sg.is_emergency_contact,
                        sg.can_pickup,
                        sg.relationship_type
                    FROM student_guardians sg
                    JOIN students s ON sg.student_id = s.student_id
                    WHERE sg.guardian_id = %s
                    ORDER BY s.student_id ASC;
                """
                cursor.execute(query, (guardian_id,))
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching students for guardian ID {guardian_id}: {e}")
            return []

    def count(self, search: Optional[str] = None) -> int:
        """Returns total count of guardians matching optional search query."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT COUNT(*) FROM guardians WHERE 1=1"
                params: List[Any] = []
                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        full_name_ar ILIKE %s OR
                        COALESCE(full_name_fr, '') ILIKE %s OR
                        phone_primary ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern])
                cursor.execute(query, params)
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error counting guardians: {e}")
            return 0
