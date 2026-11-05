"""
backend/database/acad_course_manager.py
----------------------------------------
Data Access Manager for Courses, Sequential Books, Pass Rules, and Progression Triggers:
  - acad_course: Sequential levels per workshop with strict one-book-per-course mapping
  - acad_course_rule: Dynamic pass rules per course (Soroban 3 tests 80/100, oral, projects, milestones)
  - acad_enrollment: Sequential progression enforcement (cannot skip, one open book per workshop, placement notes, repeat on failure)
"""

import json
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


class AcadCourseManager:
    """
    Manages course levels, one-book rules, dynamic pass rules,
    and strict sequential progression enforcement.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # COURSES & ONE BOOK PER COURSE MAPPING
    # =========================================================================
    def create_course(
        self,
        workshop_id: int,
        sequence_order: int,
        course_code: str,
        name_ar: str,
        book_title: str,
        book_code: str,
        name_en: Optional[str] = None,
        description: Optional[str] = None,
        min_age: Optional[int] = None,
        max_age: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a new course level within a workshop.
        Enforces strict sequence_order and one book per course.
        """
        if sequence_order < 1:
            raise ValueError("Sequence order must be a positive integer (Level 1, Level 2, ...).")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_course (
                    workshop_id, sequence_order, course_code, name_ar, name_en,
                    book_title, book_code, description, min_age, max_age, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        workshop_id,
                        sequence_order,
                        course_code.strip(),
                        name_ar.strip(),
                        name_en.strip() if name_en else None,
                        book_title.strip(),
                        book_code.strip(),
                        description,
                        min_age,
                        max_age,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating course '{course_code}': {e}")
            raise

    def get_courses_by_workshop(
        self, workshop_id: int, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """Lists all sequential courses for a workshop ordered by sequence_order ASC."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM acad_course WHERE workshop_id = %s"
                params = [workshop_id]
                if active_only:
                    query += " AND is_active = TRUE"
                query += " ORDER BY sequence_order ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching courses for workshop {workshop_id}: {e}")
            return []

    def get_course_by_id(self, course_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single course with its workshop details and pass rule."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT c.*, w.name_ar AS workshop_name_ar, w.code AS workshop_code, w.evaluation_type
                FROM acad_course c
                JOIN acad_workshop w ON c.workshop_id = w.workshop_id
                WHERE c.course_id = %s;
                """
                cursor.execute(query, (course_id,))
                course = _dict_fetchone(cursor)
                if not course:
                    return None

                # Attach course rule
                cursor.execute("SELECT * FROM acad_course_rule WHERE course_id = %s;", (course_id,))
                course["rule"] = _dict_fetchone(cursor)
                return course
        except Exception as e:
            logger.error(f"Error fetching course {course_id}: {e}")
            return None

    # =========================================================================
    # DYNAMIC PASS RULES PER COURSE
    # =========================================================================
    def set_course_rule(
        self,
        course_id: int,
        rule_type: str,
        pass_mark: float = 80.0,
        max_mark: float = 100.0,
        required_tests_count: int = 3,
        min_score_per_test: float = 80.0,
        rule_config: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Defines or updates progression pass rules for a course:
          - Soroban: 3 tests, 80/100 each.
          - Oral: right/wrong questions pass mark.
          - Robotics: project score.
          - Horse riding / swimming: challenge milestones.
        """
        try:
            config_json = json.dumps(rule_config) if rule_config else None
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_course_rule (
                    course_id, rule_type, pass_mark, max_mark,
                    required_tests_count, min_score_per_test, rule_config, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (course_id) DO UPDATE SET
                    rule_type = EXCLUDED.rule_type,
                    pass_mark = EXCLUDED.pass_mark,
                    max_mark = EXCLUDED.max_mark,
                    required_tests_count = EXCLUDED.required_tests_count,
                    min_score_per_test = EXCLUDED.min_score_per_test,
                    rule_config = EXCLUDED.rule_config,
                    notes = EXCLUDED.notes
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        course_id,
                        rule_type.strip().upper(),
                        pass_mark,
                        max_mark,
                        required_tests_count,
                        min_score_per_test,
                        config_json,
                        notes,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error setting course rule for course {course_id}: {e}")
            raise

    def get_course_rule(self, course_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves pass rule configuration for a course."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM acad_course_rule WHERE course_id = %s;", (course_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching rule for course {course_id}: {e}")
            return None

    # =========================================================================
    # SEQUENTIAL PROGRESSION ENFORCEMENT & ENROLLMENT
    # =========================================================================
    def enroll_student(
        self,
        student_id: int,
        course_id: int,
        group_id: Optional[int] = None,
        placement_note: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Enrolls a student in a course and book.
        Strictly enforces:
          1. One open book per workshop rule:
             A student cannot take two books of the same workshop at once.
          2. Sequential progression rule:
             Level N requires passing Level N-1, unless an authorized placement note is recorded.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Get target course details
                cursor.execute(
                    "SELECT course_id, workshop_id, sequence_order, name_ar FROM acad_course WHERE course_id = %s;",
                    (course_id,),
                )
                target_course = _dict_fetchone(cursor)
                if not target_course:
                    raise ValueError(f"Course {course_id} does not exist.")

                workshop_id = target_course["workshop_id"]
                seq_order = target_course["sequence_order"]

                # ── RULE 1: One open book per workshop ────────────────────────
                open_book_query = """
                SELECT e.enrollment_id, c.name_ar, c.sequence_order
                FROM acad_enrollment e
                JOIN acad_course c ON e.course_id = c.course_id
                WHERE e.student_id = %s
                  AND c.workshop_id = %s
                  AND e.status = 'ACTIVE';
                """
                cursor.execute(open_book_query, (student_id, workshop_id))
                active_enrollment = _dict_fetchone(cursor)
                if active_enrollment and not placement_note:
                    raise ValueError(
                        f"One open book rule violation: Student already has an active book in this workshop "
                        f"('{active_enrollment['name_ar']}'). Complete or drop it before starting a new book."
                    )

                # ── RULE 2: Strict sequential progression (Level N-1 must be passed) ──
                if seq_order > 1 and not (placement_note and placement_note.strip()):
                    # Find previous course
                    prev_course_query = """
                    SELECT course_id, name_ar FROM acad_course
                    WHERE workshop_id = %s AND sequence_order = %s;
                    """
                    cursor.execute(prev_course_query, (workshop_id, seq_order - 1))
                    prev_course = _dict_fetchone(cursor)

                    if prev_course:
                        prev_id = prev_course["course_id"]
                        # Verify completion status of previous course
                        check_pass_query = """
                        SELECT enrollment_id FROM acad_enrollment
                        WHERE student_id = %s AND course_id = %s AND status = 'COMPLETED';
                        """
                        cursor.execute(check_pass_query, (student_id, prev_id))
                        passed_prev = _dict_fetchone(cursor)
                        if not passed_prev:
                            raise ValueError(
                                f"Sequential progression rule violation: Cannot start Level {seq_order} ('{target_course['name_ar']}') "
                                f"without passing Level {seq_order - 1} ('{prev_course['name_ar']}'). "
                                f"An authorized placement note is required to skip levels."
                            )

                # Create enrollment
                insert_query = """
                INSERT INTO acad_enrollment (
                    student_id, course_id, group_id, status, placement_note, enrolled_at
                )
                VALUES (%s, %s, %s, 'ACTIVE', %s, CURRENT_TIMESTAMP)
                RETURNING *;
                """
                cursor.execute(
                    insert_query,
                    (
                        student_id,
                        course_id,
                        group_id,
                        placement_note.strip() if placement_note else None,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error enrolling student {student_id} into course {course_id}: {e}")
            raise

    def complete_enrollment(
        self, enrollment_id: int, passed: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Marks an enrollment as completed (passed) or failed (repeating).
        If failed, student must repeat the book.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                new_status = "COMPLETED" if passed else "FAILED_REPEATING"
                query = """
                UPDATE acad_enrollment
                SET status = %s,
                    completed_at = CURRENT_TIMESTAMP
                WHERE enrollment_id = %s
                RETURNING *;
                """
                cursor.execute(query, (new_status, enrollment_id))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating enrollment {enrollment_id}: {e}")
            raise

    def get_student_enrollments(
        self,
        student_id: int,
        workshop_id: Optional[int] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves enrollments for a student."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT e.*, c.name_ar AS course_name_ar, c.sequence_order, c.book_title, c.book_code,
                       w.code AS workshop_code, w.name_ar AS workshop_name_ar, w.evaluation_type
                FROM acad_enrollment e
                JOIN acad_course c ON e.course_id = c.course_id
                JOIN acad_workshop w ON c.workshop_id = w.workshop_id
                WHERE e.student_id = %s
                """
                params = [student_id]
                if workshop_id:
                    query += " AND c.workshop_id = %s"
                    params.append(workshop_id)
                if status:
                    query += " AND e.status = %s"
                    params.append(status.strip().upper())
                query += " ORDER BY e.enrollment_id DESC;"

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching enrollments for student {student_id}: {e}")
            return []
