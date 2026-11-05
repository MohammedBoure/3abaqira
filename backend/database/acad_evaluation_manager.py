"""
backend/database/acad_evaluation_manager.py
--------------------------------------------
Data Access Manager for Dynamic Evaluations and Double-Blind Review Workflows:
  - acad_eval_template & acad_eval_field: Dynamic templates with typed fields (timed operations, oral questions, robotics projects, challenge milestones)
  - acad_eval_event: Evaluation events tied to course and template
  - acad_eval_result: Results with DOUBLE-BLIND review workflow (corrector != reviewer)
  - acad_eval_result_value: Per-field evaluation responses and metrics
  - Sensitive action audit logging on grade modifications
  - Automatic make-up session generation on failed test attempts
"""

import logging
from typing import List, Dict, Optional, Any
from .core_audit_manager import CoreAuditManager
from .acad_makeup_manager import AcadMakeupManager

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


class AcadEvaluationManager:
    """
    Manages evaluation templates, dynamic field scoring, and the double-blind
    review workflow where the reviewer cannot be the corrector.
    """

    def __init__(self, db_instance):
        self.db = db_instance
        self.audit = CoreAuditManager(db_instance)
        self.makeup_mgr = AcadMakeupManager(db_instance)

    # =========================================================================
    # EVALUATION TEMPLATES & TYPED FIELDS
    # =========================================================================
    def create_template(
        self,
        workshop_id: int,
        name: str,
        eval_type: str,
        description: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a dynamic evaluation template."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_eval_template (workshop_id, name, eval_type, description, is_active)
                VALUES (%s, %s, %s, %s, TRUE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (workshop_id, name.strip(), eval_type.strip().upper(), description),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating eval template '{name}': {e}")
            raise

    def add_field(
        self,
        template_id: int,
        field_name: str,
        field_type: str,
        field_order: int = 1,
        max_value: Optional[float] = None,
        weight: float = 1.0,
        is_required: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Adds a typed field to an evaluation template."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_eval_field (
                    template_id, field_name, field_type, field_order, max_value, weight, is_required
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        template_id,
                        field_name.strip(),
                        field_type.strip().upper(),
                        field_order,
                        max_value,
                        weight,
                        is_required,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error adding field '{field_name}' to template {template_id}: {e}")
            raise

    def get_template(self, template_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves template and all its configured fields."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM acad_eval_template WHERE template_id = %s;", (template_id,))
                template = _dict_fetchone(cursor)
                if not template:
                    return None

                cursor.execute(
                    "SELECT * FROM acad_eval_field WHERE template_id = %s ORDER BY field_order ASC;",
                    (template_id,),
                )
                template["fields"] = _dict_fetchall(cursor)
                return template
        except Exception as e:
            logger.error(f"Error fetching template {template_id}: {e}")
            return None

    # =========================================================================
    # EVALUATION EVENTS
    # =========================================================================
    def create_event(
        self,
        course_id: int,
        template_id: int,
        event_name: str,
        event_date: Any,
        pass_score: float = 80.0,
        max_score: float = 100.0,
        group_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates an evaluation event for a course level."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_eval_event (
                    course_id, template_id, group_id, event_name, event_date, pass_score, max_score
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        course_id,
                        template_id,
                        group_id,
                        event_name.strip(),
                        str(event_date),
                        pass_score,
                        max_score,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating evaluation event '{event_name}': {e}")
            raise

    # =========================================================================
    # CORRECTIONS & DOUBLE-BLIND REVIEW WORKFLOW
    # =========================================================================
    def submit_correction(
        self,
        event_id: int,
        student_id: int,
        corrector_person_id: int,
        total_score: float,
        field_values: Optional[List[Dict[str, Any]]] = None,
        feedback_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Stage 1 of Double-Blind Review:
        The teacher or corrector scores the test and submits the values.
        Status becomes 'CORRECTED' awaiting independent review.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Get event pass score
                cursor.execute("SELECT pass_score FROM acad_eval_event WHERE event_id = %s;", (event_id,))
                event = _dict_fetchone(cursor)
                if not event:
                    raise ValueError(f"Evaluation event {event_id} does not exist.")

                passed = total_score >= event["pass_score"]

                query = """
                INSERT INTO acad_eval_result (
                    event_id, student_id, total_score, passed, corrector_person_id,
                    corrected_at, status, feedback_notes
                )
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP, 'CORRECTED', %s)
                ON CONFLICT (event_id, student_id) DO UPDATE SET
                    total_score = EXCLUDED.total_score,
                    passed = EXCLUDED.passed,
                    corrector_person_id = EXCLUDED.corrector_person_id,
                    corrected_at = CURRENT_TIMESTAMP,
                    status = 'CORRECTED',
                    feedback_notes = EXCLUDED.feedback_notes,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        event_id,
                        student_id,
                        total_score,
                        passed,
                        corrector_person_id,
                        feedback_notes,
                    ),
                )
                result = _dict_fetchone(cursor)
                result_id = result["result_id"]

                # Save individual field values if provided
                if field_values:
                    for f in field_values:
                        cursor.execute(
                            """
                            INSERT INTO acad_eval_result_value (
                                result_id, field_id, value_text, value_numeric, value_boolean
                            )
                            VALUES (%s, %s, %s, %s, %s)
                            ON CONFLICT (result_id, field_id) DO UPDATE SET
                                value_text = EXCLUDED.value_text,
                                value_numeric = EXCLUDED.value_numeric,
                                value_boolean = EXCLUDED.value_boolean;
                            """,
                            (
                                result_id,
                                f["field_id"],
                                f.get("value_text"),
                                f.get("value_numeric"),
                                f.get("value_boolean"),
                            ),
                        )

                return result
        except Exception as e:
            logger.error(f"Error submitting correction for event {event_id}, student {student_id}: {e}")
            raise

    def review_evaluation(
        self,
        result_id: int,
        reviewer_person_id: int,
        approved: bool = True,
        feedback_notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Stage 2 of Double-Blind Review:
        An independent reviewer validates the test correction.
        DOUBLE-BLIND RULE: reviewer_person_id CANNOT be the same as corrector_person_id!
        If approved and the student failed the test, a make-up session credit is auto-generated!
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Fetch current result
                cursor.execute(
                    """
                    SELECT r.*, e.course_id
                    FROM acad_eval_result r
                    JOIN acad_eval_event e ON r.event_id = e.event_id
                    WHERE r.result_id = %s;
                    """,
                    (result_id,),
                )
                result = _dict_fetchone(cursor)
                if not result:
                    raise ValueError(f"Evaluation result {result_id} does not exist.")

                # ── CRITICAL DOUBLE-BLIND CONSTRAINT ─────────────────────────
                if reviewer_person_id == result["corrector_person_id"]:
                    raise ValueError(
                        "Double-blind review violation: The person reviewing the evaluation result "
                        f"(person #{reviewer_person_id}) cannot be the same person who corrected it "
                        f"(corrector #{result['corrector_person_id']})."
                    )

                new_status = "PUBLISHED" if approved else "REJECTED"

                query = """
                UPDATE acad_eval_result
                SET reviewer_person_id = %s,
                    reviewed_at = CURRENT_TIMESTAMP,
                    status = %s,
                    feedback_notes = COALESCE(%s, feedback_notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE result_id = %s
                RETURNING *;
                """
                cursor.execute(query, (reviewer_person_id, new_status, feedback_notes, result_id))
                updated_result = _dict_fetchone(cursor)

            # If finalized and failed, automatically generate a make-up session for the failed test
            if approved and not result["passed"]:
                self.makeup_mgr.create_makeup_credit(
                    student_id=result["student_id"],
                    reason="FAILED_TEST",
                    source_eval_result_id=result_id,
                    course_id=result.get("course_id"),
                    notes=f"Auto-generated make-up session credit for failed test in result #{result_id}",
                )

            return updated_result
        except Exception as e:
            logger.error(f"Error reviewing evaluation {result_id}: {e}")
            raise

    # =========================================================================
    # SENSITIVE ACTION: GRADE CHANGE WITH AUDIT LOGGING
    # =========================================================================
    def update_evaluation_score(
        self,
        result_id: int,
        new_score: float,
        actor_person_id: Optional[int],
        reason: str,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Modifies an existing evaluation score.
        AUDIT REQUIREMENT: A justification reason is mandatory, and the action
        is logged to core_audit_log under 'GRADE_CHANGE'.
        """
        if not reason or not reason.strip():
            raise ValueError("Audit requirement: A justification reason is mandatory for grade changes.")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT r.total_score, r.event_id, e.pass_score
                    FROM acad_eval_result r
                    JOIN acad_eval_event e ON r.event_id = e.event_id
                    WHERE r.result_id = %s;
                    """,
                    (result_id,),
                )
                current = _dict_fetchone(cursor)
                if not current:
                    raise ValueError(f"Result {result_id} does not exist.")

                old_score = float(current["total_score"])
                new_passed = new_score >= current["pass_score"]

                cursor.execute(
                    """
                    UPDATE acad_eval_result
                    SET total_score = %s,
                        passed = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE result_id = %s
                    RETURNING *;
                    """,
                    (new_score, new_passed, result_id),
                )
                updated = _dict_fetchone(cursor)

            # Record mandatory sensitive action audit log
            self.audit.log_grade_change(
                actor_person_id=actor_person_id,
                result_id=result_id,
                old_score=old_score,
                new_score=new_score,
                reason=reason.strip(),
                actor_username=actor_username,
                branch_id=branch_id,
                ip_address=ip_address,
            )

            return updated
        except Exception as e:
            logger.error(f"Error modifying grade for result {result_id}: {e}")
            raise

    def get_result(self, result_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves evaluation result with field values, corrector, and reviewer."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT r.*, e.event_name, e.event_date, e.pass_score, e.max_score,
                       p_stud.full_name_ar AS student_name,
                       p_corr.full_name_ar AS corrector_name,
                       p_rev.full_name_ar AS reviewer_name
                FROM acad_eval_result r
                JOIN acad_eval_event e ON r.event_id = e.event_id
                JOIN core_student s ON r.student_id = s.student_id
                JOIN core_person p_stud ON s.person_id = p_stud.person_id
                LEFT JOIN core_person p_corr ON r.corrector_person_id = p_corr.person_id
                LEFT JOIN core_person p_rev ON r.reviewer_person_id = p_rev.person_id
                WHERE r.result_id = %s;
                """
                cursor.execute(query, (result_id,))
                result = _dict_fetchone(cursor)
                if not result:
                    return None

                cursor.execute(
                    """
                    SELECT v.*, f.field_name, f.field_type, f.max_value
                    FROM acad_eval_result_value v
                    JOIN acad_eval_field f ON v.field_id = f.field_id
                    WHERE v.result_id = %s;
                    """,
                    (result_id,),
                )
                result["values"] = _dict_fetchall(cursor)
                return result
        except Exception as e:
            logger.error(f"Error fetching result {result_id}: {e}")
            return None
