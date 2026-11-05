"""
backend/database/core_person_manager.py
----------------------------------------
Data Access Manager for Unified Person, Students, Guardians, Medical Info, and Pickup Authorizations:
  - core_person: Unified individual registry (students, parents, staff)
  - core_student: Student specialized profiles
  - core_student_medical: Confidential medical & dietary info (with audit-logged access)
  - core_guardian_link: Family links with custody flags
  - core_pickup_authorization: Authorized pickup registry
"""

import logging
from typing import List, Dict, Optional, Any
from .core_audit_manager import CoreAuditManager

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


class CorePersonManager:
    """
    Manages CRUD and relation operations for core person entities, student profiles,
    guardians, sensitive medical data, and pickup authorizations.
    """

    def __init__(self, db_instance):
        self.db = db_instance
        self.audit = CoreAuditManager(db_instance)

    # =========================================================================
    # CORE PERSON REGISTRY
    # =========================================================================
    def create_person(
        self,
        full_name_ar: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        full_name_fr: Optional[str] = None,
        birth_date: Optional[Any] = None,
        gender: Optional[str] = None,
        national_id: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        address: Optional[str] = None,
        person_type: str = "STUDENT",
    ) -> Optional[Dict[str, Any]]:
        """Registers a new unified person record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO core_person (
                    first_name, last_name, full_name_ar, full_name_fr,
                    birth_date, gender, national_id, phone, email, address, person_type, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        first_name.strip() if first_name else None,
                        last_name.strip() if last_name else None,
                        full_name_ar.strip(),
                        full_name_fr.strip() if full_name_fr else None,
                        birth_date,
                        gender.upper() if gender else None,
                        national_id.strip() if national_id else None,
                        phone.strip() if phone else None,
                        email.strip() if email else None,
                        address.strip() if address else None,
                        person_type.upper(),
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating core_person: {e}")
            raise

    def get_person_by_id(self, person_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves person by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM core_person WHERE person_id = %s;", (person_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching person {person_id}: {e}")
            return None

    def get_all_persons(
        self,
        person_type: Optional[str] = None,
        search: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Queries persons with filtering and search."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM core_person WHERE 1=1"
                params = []

                if person_type:
                    query += " AND person_type = %s"
                    params.append(person_type.upper())
                if is_active is not None:
                    query += " AND is_active = %s"
                    params.append(is_active)
                if search:
                    term = f"%{search.strip()}%"
                    query += " AND (full_name_ar LIKE %s OR full_name_fr LIKE %s OR phone LIKE %s)"
                    params.extend([term, term, term])

                query += " ORDER BY person_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching persons: {e}")
            return []

    def update_person(self, person_id: int, **fields) -> Optional[Dict[str, Any]]:
        """Updates core person attributes."""
        if not fields:
            return self.get_person_by_id(person_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = []
                params = []

                allowed_cols = {
                    "first_name", "last_name", "full_name_ar", "full_name_fr",
                    "birth_date", "gender", "national_id", "phone", "email",
                    "address", "person_type", "is_active"
                }

                for col, val in fields.items():
                    if col in allowed_cols:
                        set_clauses.append(f"{col} = %s")
                        params.append(val)

                if not set_clauses:
                    return self.get_person_by_id(person_id)

                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                params.append(person_id)

                query = f"UPDATE core_person SET {', '.join(set_clauses)} WHERE person_id = %s RETURNING *;"
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating core_person {person_id}: {e}")
            raise

    # =========================================================================
    # CORE STUDENT EXTENSION
    # =========================================================================
    def create_student(
        self,
        person_id: int,
        student_code: Optional[str] = None,
        school_grade: Optional[str] = None,
        previous_schools: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Extends a core_person with student academic profile."""
        try:
            code = student_code.strip() if student_code else f"STD-{person_id:05d}"
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO core_student (
                    person_id, student_code, school_grade, previous_schools, notes
                )
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        person_id,
                        code,
                        school_grade.strip() if school_grade else None,
                        previous_schools.strip() if previous_schools else None,
                        notes.strip() if notes else None,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating core_student: {e}")
            raise

    def get_student_by_id(self, student_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves student with person details."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT s.*, p.first_name, p.last_name, p.full_name_ar, p.full_name_fr,
                       p.birth_date, p.gender, p.national_id, p.phone, p.email, p.address, p.is_active
                FROM core_student s
                JOIN core_person p ON s.person_id = p.person_id
                WHERE s.student_id = %s;
                """
                cursor.execute(query, (student_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching student {student_id}: {e}")
            return None

    def get_student_by_person_id(self, person_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves student record by person ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM core_student WHERE person_id = %s;", (person_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching student by person_id {person_id}: {e}")
            return None

    # =========================================================================
    # CORE STUDENT MEDICAL (AUDIT-LOGGED SENSITIVE ACCESS)
    # =========================================================================
    def upsert_student_medical(
        self,
        student_id: int,
        blood_group: Optional[str] = None,
        allergies: Optional[str] = None,
        special_needs: Optional[str] = None,
        food_restrictions: Optional[str] = None,
        emergency_contact_name: Optional[str] = None,
        emergency_contact_phone: Optional[str] = None,
        medical_notes: Optional[str] = None,
        actor_person_id: Optional[int] = None,
        actor_username: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates or updates confidential medical data."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO core_student_medical (
                    student_id, blood_group, allergies, special_needs, food_restrictions,
                    emergency_contact_name, emergency_contact_phone, medical_notes, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (student_id) DO UPDATE SET
                    blood_group = EXCLUDED.blood_group,
                    allergies = EXCLUDED.allergies,
                    special_needs = EXCLUDED.special_needs,
                    food_restrictions = EXCLUDED.food_restrictions,
                    emergency_contact_name = EXCLUDED.emergency_contact_name,
                    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
                    medical_notes = EXCLUDED.medical_notes,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        student_id,
                        blood_group.strip().upper() if blood_group else None,
                        allergies.strip() if allergies else None,
                        special_needs.strip() if special_needs else None,
                        food_restrictions.strip() if food_restrictions else None,
                        emergency_contact_name.strip() if emergency_contact_name else None,
                        emergency_contact_phone.strip() if emergency_contact_phone else None,
                        medical_notes.strip() if medical_notes else None,
                    ),
                )
                row = _dict_fetchone(cursor)

            # Log sensitive modification
            self.audit.log_action(
                action_type="STATUS_CHANGE",
                entity_type="core_student_medical",
                entity_id=str(student_id),
                actor_person_id=actor_person_id,
                actor_username=actor_username,
                reason="Medical information updated",
            )
            return row
        except Exception as e:
            logger.error(f"Error upserting student medical for {student_id}: {e}")
            raise

    def get_student_medical(
        self,
        student_id: int,
        actor_person_id: Optional[int] = None,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves sensitive medical info.
        MANDATORY AUDIT LOG: Automatically logs MEDICAL_VIEW into core_audit_log!
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM core_student_medical WHERE student_id = %s;",
                    (student_id,)
                )
                medical = _dict_fetchone(cursor)

            # Record mandatory audit view log
            self.audit.log_medical_view(
                actor_person_id=actor_person_id,
                student_id=student_id,
                actor_username=actor_username,
                branch_id=branch_id,
                ip_address=ip_address,
            )

            return medical
        except Exception as e:
            logger.error(f"Error fetching medical record for student {student_id}: {e}")
            return None

    # =========================================================================
    # CORE GUARDIAN LINKS
    # =========================================================================
    def link_guardian(
        self,
        student_id: int,
        guardian_person_id: int,
        relationship: str = "Parent",
        is_primary: bool = False,
        is_emergency_contact: bool = False,
        custody_flag: bool = True,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Links a student to a guardian person."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO core_guardian_link (
                    student_id, guardian_person_id, relationship,
                    is_primary, is_emergency_contact, custody_flag, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (student_id, guardian_person_id) DO UPDATE SET
                    relationship = EXCLUDED.relationship,
                    is_primary = EXCLUDED.is_primary,
                    is_emergency_contact = EXCLUDED.is_emergency_contact,
                    custody_flag = EXCLUDED.custody_flag,
                    notes = EXCLUDED.notes
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        student_id,
                        guardian_person_id,
                        relationship,
                        is_primary,
                        is_emergency_contact,
                        custody_flag,
                        notes,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error linking guardian {guardian_person_id} to student {student_id}: {e}")
            raise

    def get_guardians_for_student(self, student_id: int) -> List[Dict[str, Any]]:
        """Fetches all guardians linked to a student."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT l.*, p.first_name, p.last_name, p.full_name_ar, p.full_name_fr,
                       p.phone, p.email, p.national_id, p.address
                FROM core_guardian_link l
                JOIN core_person p ON l.guardian_person_id = p.person_id
                WHERE l.student_id = %s
                ORDER BY l.is_primary DESC, l.link_id ASC;
                """
                cursor.execute(query, (student_id,))
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching guardians for student {student_id}: {e}")
            return []

    # =========================================================================
    # CORE PICKUP AUTHORIZATIONS
    # =========================================================================
    def add_pickup_authorization(
        self,
        student_id: int,
        full_name: str,
        relationship: str,
        national_id: Optional[str] = None,
        phone: Optional[str] = None,
        authorized_person_id: Optional[int] = None,
        authorized_by_person_id: Optional[int] = None,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Authorizes a person to pick up a student."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO core_pickup_authorization (
                    student_id, authorized_person_id, full_name, relationship,
                    national_id, phone, is_active, authorized_by_person_id,
                    start_date, end_date, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, TRUE, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        student_id,
                        authorized_person_id,
                        full_name.strip(),
                        relationship.strip(),
                        national_id.strip() if national_id else None,
                        phone.strip() if phone else None,
                        authorized_by_person_id,
                        start_date,
                        end_date,
                        notes,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error adding pickup authorization for student {student_id}: {e}")
            raise

    def get_pickup_authorizations(self, student_id: int, active_only: bool = True) -> List[Dict[str, Any]]:
        """Retrieves authorized pickup persons for a student."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM core_pickup_authorization WHERE student_id = %s"
                params = [student_id]
                if active_only:
                    query += " AND is_active = TRUE"
                query += " ORDER BY pickup_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching pickup authorizations for student {student_id}: {e}")
            return []
