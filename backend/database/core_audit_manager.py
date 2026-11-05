"""
backend/database/core_audit_manager.py
---------------------------------------
Dedicated Audit Log Manager for tracking sensitive actions in the 3abaqira Enterprise ERP:
  - Grade changes (evaluations/marks overrides)
  - Price overrides (custom tuition discounts)
  - Payment voids (immutable transaction receipts)
  - Medical data views (confidential student health records)
"""

import json
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime

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


class CoreAuditManager:
    """
    Manages immutable audit logging for core actions and sensitive security events.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    def log_action(
        self,
        action_type: str,
        entity_type: str,
        entity_id: str,
        actor_person_id: Optional[int] = None,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        old_values: Optional[Any] = None,
        new_values: Optional[Any] = None,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Inserts an immutable audit log record.
        """
        try:
            old_str = json.dumps(old_values, default=str) if old_values is not None else None
            new_str = json.dumps(new_values, default=str) if new_values is not None else None

            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO core_audit_log (
                    actor_person_id, actor_username, action_type, entity_type,
                    entity_id, branch_id, old_values, new_values, reason, ip_address, performed_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        actor_person_id,
                        actor_username,
                        action_type,
                        entity_type,
                        str(entity_id),
                        branch_id,
                        old_str,
                        new_str,
                        reason,
                        ip_address,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            return None

    def log_grade_change(
        self,
        actor_person_id: Optional[int],
        result_id: int,
        old_score: float,
        new_score: float,
        reason: str,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Logs a sensitive grade or evaluation score change. Reason is mandatory.
        """
        if not reason or not reason.strip():
            raise ValueError("Audit requirement: A justification reason is mandatory for grade changes.")

        return self.log_action(
            action_type="GRADE_CHANGE",
            entity_type="acad_eval_result",
            entity_id=str(result_id),
            actor_person_id=actor_person_id,
            actor_username=actor_username,
            branch_id=branch_id,
            old_values={"total_score": old_score},
            new_values={"total_score": new_score},
            reason=reason.strip(),
            ip_address=ip_address,
        )

    def log_price_override(
        self,
        actor_person_id: Optional[int],
        entity_type: str,
        entity_id: str,
        standard_price: float,
        overridden_price: float,
        reason: str,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Logs a sensitive price override. Reason is mandatory.
        """
        if not reason or not reason.strip():
            raise ValueError("Audit requirement: A justification reason is mandatory for price overrides.")

        return self.log_action(
            action_type="PRICE_OVERRIDE",
            entity_type=entity_type,
            entity_id=str(entity_id),
            actor_person_id=actor_person_id,
            actor_username=actor_username,
            branch_id=branch_id,
            old_values={"standard_price": standard_price},
            new_values={"overridden_price": overridden_price},
            reason=reason.strip(),
            ip_address=ip_address,
        )

    def log_payment_void(
        self,
        actor_person_id: Optional[int],
        payment_id: str,
        amount: float,
        reason: str,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Logs a sensitive payment voiding action. Reason is mandatory.
        """
        if not reason or not reason.strip():
            raise ValueError("Audit requirement: A justification reason is mandatory for payment voids.")

        return self.log_action(
            action_type="PAYMENT_VOID",
            entity_type="fin_payment",
            entity_id=str(payment_id),
            actor_person_id=actor_person_id,
            actor_username=actor_username,
            branch_id=branch_id,
            old_values={"amount": amount, "voided": False},
            new_values={"amount": amount, "voided": True},
            reason=reason.strip(),
            ip_address=ip_address,
        )

    def log_medical_view(
        self,
        actor_person_id: Optional[int],
        student_id: int,
        actor_username: Optional[str] = None,
        branch_id: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Logs an audit entry whenever confidential student medical data is accessed or viewed.
        """
        return self.log_action(
            action_type="MEDICAL_VIEW",
            entity_type="core_student_medical",
            entity_id=str(student_id),
            actor_person_id=actor_person_id,
            actor_username=actor_username,
            branch_id=branch_id,
            old_values=None,
            new_values=None,
            reason="Confidential health record accessed",
            ip_address=ip_address,
        )

    def get_logs(
        self,
        action_type: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        actor_person_id: Optional[int] = None,
        branch_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Queries audit log records with optional filtering.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM core_audit_log WHERE 1=1"
                params = []

                if action_type:
                    query += " AND action_type = %s"
                    params.append(action_type.strip())
                if entity_type:
                    query += " AND entity_type = %s"
                    params.append(entity_type.strip())
                if entity_id:
                    query += " AND entity_id = %s"
                    params.append(str(entity_id).strip())
                if actor_person_id:
                    query += " AND actor_person_id = %s"
                    params.append(actor_person_id)
                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id.strip())

                query += " ORDER BY audit_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error querying core audit logs: {e}")
            return []
