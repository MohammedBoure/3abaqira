"""
backend/database/student_manager.py
-----------------------------------
Data Access Manager for the 'students' directory and 'student_guardians' junction table.
Encapsulates:
  - Bilingual student master profiles (Arabic & French names)
  - Automated student code generation (STD-YYYY-XXXX)
  - Medical, allergy, and emergency contact registries
  - Multi-guardian linkages with pickup authorization and primary contact flags
"""

import logging
from datetime import datetime, date
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


class StudentManager:
    """
    Manages operations for the 'students' table and 'student_guardians' junction links.
    """

    SAFE_COLUMNS = (
        "student_id, student_code, legacy_seq_number, first_name, last_name, "
        "full_name_ar, full_name_fr, birth_date, gender, blood_group, "
        "allergies, medical_notes, emergency_phone, is_active, created_at, updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def _generate_student_code(self, cursor) -> str:
        """
        Generates an automated, professional sequential student code (e.g., STD-2025-0042).
        """
        year = datetime.now().year
        cursor.execute("SELECT MAX(student_id) FROM students;")
        row = cursor.fetchone()
        next_id = (row[0] or 0) + 1
        return f"STD-{year}-{next_id:04d}"

    def get_all(
        self,
        search: Optional[str] = None,
        gender: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Lists students with bilingual search (Arabic/French names, student code, emergency phone),
        gender filtering, active status toggle, and pagination.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM students WHERE 1=1"
                params: List[Any] = []

                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        full_name_ar ILIKE %s OR
                        COALESCE(full_name_fr, '') ILIKE %s OR
                        COALESCE(student_code, '') ILIKE %s OR
                        COALESCE(emergency_phone, '') ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern, pattern])

                if gender and gender.strip():
                    query += " AND UPPER(gender) = UPPER(%s)"
                    params.append(gender.strip())

                if is_active is not None:
                    query += " AND is_active = %s"
                    params.append(is_active)

                query += " ORDER BY student_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching students: {e}")
            return []

    def get_by_id(
        self, student_id: int, include_guardians: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single student record by ID, optionally aggregating linked guardians.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM students WHERE student_id = %s;"
                cursor.execute(query, (student_id,))
                student = _dict_fetchone(cursor)
                if not student:
                    return None

                if include_guardians:
                    student["guardians"] = self.get_guardians_for_student(student_id, conn=conn)

                return student
        except Exception as e:
            logger.error(f"Error fetching student ID {student_id}: {e}")
            return None

    def get_by_code(self, student_code: str) -> Optional[Dict[str, Any]]:
        """Retrieves a student record by their unique student code."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM students WHERE student_code = %s;"
                cursor.execute(query, (student_code.strip(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching student by code '{student_code}': {e}")
            return None

    def create(
        self,
        full_name_ar: str,
        student_code: Optional[str] = None,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        full_name_fr: Optional[str] = None,
        birth_date: Optional[Any] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        allergies: Optional[str] = None,
        medical_notes: Optional[str] = None,
        emergency_phone: Optional[str] = None,
        is_active: bool = True,
        legacy_seq_number: Optional[int] = None,
        initial_guardian_id: Optional[int] = None,
        initial_relationship: str = "Parent",
    ) -> Optional[Dict[str, Any]]:
        """
        Registers a new student. Auto-generates student code if not provided.
        Optionally links an initial guardian in the same atomic transaction.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                code = student_code.strip() if student_code else self._generate_student_code(cursor)

                query = """
                INSERT INTO students (
                    student_code, legacy_seq_number, first_name, last_name,
                    full_name_ar, full_name_fr, birth_date, gender, blood_group,
                    allergies, medical_notes, emergency_phone, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        code,
                        legacy_seq_number,
                        first_name.strip() if first_name else None,
                        last_name.strip() if last_name else None,
                        full_name_ar.strip(),
                        full_name_fr.strip() if full_name_fr else None,
                        birth_date,
                        gender.capitalize() if gender else None,
                        blood_group.strip().upper() if blood_group else None,
                        allergies.strip() if allergies else None,
                        medical_notes.strip() if medical_notes else None,
                        emergency_phone.strip() if emergency_phone else None,
                        is_active,
                    ),
                )
                student = _dict_fetchone(cursor)

                # Atomically link initial guardian if provided
                if student and initial_guardian_id:
                    link_query = """
                    INSERT INTO student_guardians (
                        student_id, guardian_id, is_primary_guardian,
                        is_emergency_contact, can_pickup, relationship_type
                    )
                    VALUES (%s, %s, TRUE, TRUE, TRUE, %s)
                    ON CONFLICT (student_id, guardian_id) DO NOTHING;
                    """
                    cursor.execute(link_query, (student["student_id"], initial_guardian_id, initial_relationship))

                conn.commit()

                if student:
                    student["guardians"] = self.get_guardians_for_student(student["student_id"])

                return student
        except Exception as e:
            logger.error(f"Error creating student '{full_name_ar}': {e}")
            return None

    def update(self, student_id: int, **kwargs) -> bool:
        """Dynamically updates student parameters."""
        allowed = {
            "first_name", "last_name", "full_name_ar", "full_name_fr",
            "birth_date", "gender", "blood_group", "allergies",
            "medical_notes", "emergency_phone", "is_active", "legacy_seq_number", "student_code"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values = list(updates.values()) + [student_id]
                query = f"UPDATE students SET {', '.join(set_clauses)} WHERE student_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating student ID {student_id}: {e}")
            return False

    def toggle_status(self, student_id: int, is_active: bool) -> bool:
        """Enables or suspends a student profile."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "UPDATE students SET is_active = %s, updated_at = CURRENT_TIMESTAMP WHERE student_id = %s;"
                cursor.execute(query, (is_active, student_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error toggling student ID {student_id} status: {e}")
            return False

    def delete(self, student_id: int) -> bool:
        """Deletes student record. Cascades to student_guardians and attendance."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM students WHERE student_id = %s;"
                cursor.execute(query, (student_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting student ID {student_id}: {e}")
            return False

    # ── Guardian Relationship Linking Operations ─────────────────────────────

    def get_guardians_for_student(
        self, student_id: int, conn=None
    ) -> List[Dict[str, Any]]:
        """
        Lists all guardians assigned to a student along with junction relationship flags.
        """
        def _exec(c):
            cursor = c.cursor()
            query = """
                SELECT 
                    g.guardian_id,
                    g.full_name_ar,
                    g.full_name_fr,
                    g.phone_primary,
                    g.phone_secondary,
                    g.relationship AS guardian_default_relation,
                    g.national_id,
                    g.address,
                    g.email,
                    sg.is_primary_guardian,
                    sg.is_emergency_contact,
                    sg.can_pickup,
                    sg.relationship_type
                FROM student_guardians sg
                JOIN guardians g ON sg.guardian_id = g.guardian_id
                WHERE sg.student_id = %s
                ORDER BY sg.is_primary_guardian DESC, g.guardian_id ASC;
            """
            cursor.execute(query, (student_id,))
            return _dict_fetchall(cursor)

        try:
            if conn:
                return _exec(conn)
            with self.db.get_db_connection() as local_conn:
                return _exec(local_conn)
        except Exception as e:
            logger.error(f"Error fetching guardians for student ID {student_id}: {e}")
            return []

    def assign_guardian(
        self,
        student_id: int,
        guardian_id: int,
        is_primary_guardian: bool = True,
        is_emergency_contact: bool = True,
        can_pickup: bool = True,
        relationship_type: str = "Parent",
    ) -> bool:
        """
        Links a guardian to a student.
        If is_primary_guardian is True, atomically demotes other guardians of this student.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # If primary, reset other primary flags for this student
                if is_primary_guardian:
                    cursor.execute(
                        "UPDATE student_guardians SET is_primary_guardian = FALSE WHERE student_id = %s;",
                        (student_id,),
                    )

                query = """
                INSERT INTO student_guardians (
                    student_id, guardian_id, is_primary_guardian,
                    is_emergency_contact, can_pickup, relationship_type
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (student_id, guardian_id) DO UPDATE SET
                    is_primary_guardian = EXCLUDED.is_primary_guardian,
                    is_emergency_contact = EXCLUDED.is_emergency_contact,
                    can_pickup = EXCLUDED.can_pickup,
                    relationship_type = EXCLUDED.relationship_type;
                """
                cursor.execute(
                    query,
                    (
                        student_id,
                        guardian_id,
                        is_primary_guardian,
                        is_emergency_contact,
                        can_pickup,
                        relationship_type,
                    ),
                )
                conn.commit()
                return True
        except Exception as e:
            logger.error(
                f"Error assigning guardian ID {guardian_id} to student ID {student_id}: {e}"
            )
            return False

    def update_guardian_link(
        self,
        student_id: int,
        guardian_id: int,
        is_primary_guardian: Optional[bool] = None,
        is_emergency_contact: Optional[bool] = None,
        can_pickup: Optional[bool] = None,
        relationship_type: Optional[str] = None,
    ) -> bool:
        """Updates relationship flags between student and guardian."""
        updates = {}
        if is_primary_guardian is not None:
            updates["is_primary_guardian"] = is_primary_guardian
        if is_emergency_contact is not None:
            updates["is_emergency_contact"] = is_emergency_contact
        if can_pickup is not None:
            updates["can_pickup"] = can_pickup
        if relationship_type is not None:
            updates["relationship_type"] = relationship_type

        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                if updates.get("is_primary_guardian"):
                    cursor.execute(
                        "UPDATE student_guardians SET is_primary_guardian = FALSE WHERE student_id = %s;",
                        (student_id,),
                    )

                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [student_id, guardian_id]
                query = f"UPDATE student_guardians SET {', '.join(set_clauses)} WHERE student_id = %s AND guardian_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(
                f"Error updating link between student {student_id} and guardian {guardian_id}: {e}"
            )
            return False

    def remove_guardian(self, student_id: int, guardian_id: int) -> bool:
        """Removes association between student and guardian."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM student_guardians WHERE student_id = %s AND guardian_id = %s;"
                cursor.execute(query, (student_id, guardian_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(
                f"Error removing guardian {guardian_id} from student {student_id}: {e}"
            )
            return False

    def count(self, search: Optional[str] = None, is_active: Optional[bool] = None) -> int:
        """Returns total student headcount matching filters."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT COUNT(*) FROM students WHERE 1=1"
                params: List[Any] = []

                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += " AND (full_name_ar ILIKE %s OR COALESCE(full_name_fr, '') ILIKE %s OR COALESCE(student_code, '') ILIKE %s)"
                    params.extend([pattern, pattern, pattern])

                if is_active is not None:
                    query += " AND is_active = %s"
                    params.append(is_active)

                cursor.execute(query, params)
                row = cursor.fetchone()
                return row[0] if row else 0
        except Exception as e:
            logger.error(f"Error counting students: {e}")
            return 0
