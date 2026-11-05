"""
backend/database/communication_manager.py
------------------------------------------
Data Access Manager for the Parent & Multi-Channel Communication Module.
Encapsulates:
  - Admin switchable time window policy for parent notes (branch-level open hours & day schedules)
  - Two-way parent notes (parent note submission -> staff review -> staff single reply -> close)
  - Outbound notification queue (SMS, WhatsApp, Telegram, Email)
  - Pluggable delivery queue worker interface with simulated/real gateway transports & retry logic
"""

import logging
from datetime import datetime, date, time
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


VALID_CHANNELS = {"SMS", "WHATSAPP", "TELEGRAM", "EMAIL"}
VALID_NOTIFICATION_TYPES = {
    "ABSENCE_ALERT", "PAYMENT_RECEIPT", "REPORT_APPROVAL",
    "INTERVIEW_INVITATION", "ANNOUNCEMENT", "GENERAL"
}
VALID_NOTE_ROLES = {"TEACHER", "ADMIN", "DIRECTOR", "SPECIALIST"}
VALID_NOTE_STATUSES = {"OPEN", "ANSWERED", "CLOSED"}


class CommunicationManager:
    """
    Central database manager for parent communication policies, notes, and notification queueing.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # 1. Parent Note Policy & Time Window Toggle
    # =========================================================================
    def get_policy(self, branch_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves parent communication note policy for a branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM comm_note_policy WHERE branch_id = %s;",
                    (branch_id.strip().upper(),),
                )
                policy = _dict_fetchone(cursor)
                if not policy:
                    # Return default open policy if not yet explicitly saved
                    return {
                        "branch_id": branch_id.strip().upper(),
                        "is_enabled": True,
                        "window_start_time": "08:00",
                        "window_end_time": "18:00",
                        "allowed_days": "1,2,3,4,5,6,7",
                    }
                return policy
        except Exception as e:
            logger.error(f"Error fetching note policy for branch {branch_id}: {e}")
            return None

    def update_policy(
        self,
        branch_id: str,
        is_enabled: bool = True,
        window_start_time: str = "08:00",
        window_end_time: str = "18:00",
        allowed_days: str = "1,2,3,4,5,6,7",
        updated_by_user_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """Sets administrative policy controls on parent note submission hours."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO comm_note_policy (
                        branch_id, is_enabled, window_start_time, window_end_time, allowed_days, updated_by_user_id, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (branch_id) DO UPDATE
                    SET is_enabled = EXCLUDED.is_enabled,
                        window_start_time = EXCLUDED.window_start_time,
                        window_end_time = EXCLUDED.window_end_time,
                        allowed_days = EXCLUDED.allowed_days,
                        updated_by_user_id = EXCLUDED.updated_by_user_id,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING *;
                    """,
                    (
                        branch_id.strip().upper(),
                        is_enabled,
                        window_start_time.strip(),
                        window_end_time.strip(),
                        allowed_days.strip(),
                        updated_by_user_id,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error updating note policy for branch {branch_id}: {e}")
            return None

    def is_time_window_open(self, branch_id: str, check_time: Optional[datetime] = None) -> bool:
        """
        Determines whether the communication window is currently accepting parent notes.
        Verifies:
          1. Branch policy is_enabled == TRUE
          2. Today's ISO weekday is in allowed_days (1=Monday ... 7=Sunday)
          3. Current local time falls between window_start_time and window_end_time
        """
        policy = self.get_policy(branch_id)
        if not policy or not policy.get("is_enabled", True):
            return False

        now = check_time if check_time else datetime.now()
        iso_weekday = str(now.isoweekday())
        allowed_days = [d.strip() for d in str(policy.get("allowed_days", "1,2,3,4,5,6,7")).split(",")]
        if iso_weekday not in allowed_days:
            return False

        # Parse start and end time strings (e.g. "08:00" or "08:00:00")
        try:
            start_parts = [int(p) for p in str(policy.get("window_start_time", "08:00")).split(":")[:2]]
            end_parts = [int(p) for p in str(policy.get("window_end_time", "18:00")).split(":")[:2]]
            start_t = time(start_parts[0], start_parts[1])
            end_t = time(end_parts[0], end_parts[1])
            curr_t = now.time()
            return start_t <= curr_t <= end_t
        except Exception as err:
            logger.warning(f"Error comparing note policy window times: {err}")
            return True

    # =========================================================================
    # 2. Two-Way Parent Notes
    # =========================================================================
    def submit_parent_note(
        self,
        student_id: int,
        branch_id: str,
        subject: str,
        message: str,
        recipient_role: str = "TEACHER",
        parent_user_id: Optional[int] = None,
        bypass_policy: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Submits a parent inquiry or note regarding their child.
        Enforces time-window constraints unless bypass_policy=True (e.g. for staff testing).
        """
        clean_role = recipient_role.upper()
        if clean_role not in VALID_NOTE_ROLES:
            raise ValueError(f"recipient_role must be one of {VALID_NOTE_ROLES}")

        if not bypass_policy and not self.is_time_window_open(branch_id):
            raise PermissionError(
                f"Communication window is closed for branch '{branch_id}'. "
                "Notes can only be submitted during allowed administrative schedule hours."
            )

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO comm_note (
                        student_id, parent_user_id, branch_id, recipient_role,
                        subject, message, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, 'OPEN')
                    RETURNING *;
                    """,
                    (student_id, parent_user_id, branch_id.strip().upper(), clean_role, subject.strip(), message.strip()),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error submitting parent note: {e}")
            raise

    def respond_to_note(
        self, note_id: int, staff_response: str, answered_by_employee_id: int
    ) -> Optional[Dict[str, Any]]:
        """Records a single formal staff reply to an open parent note."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE comm_note
                    SET staff_response = %s,
                        answered_by_employee_id = %s,
                        answered_at = CURRENT_TIMESTAMP,
                        status = 'ANSWERED',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE note_id = %s
                    RETURNING *;
                    """,
                    (staff_response.strip(), answered_by_employee_id, note_id),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error responding to note {note_id}: {e}")
            return None

    def close_note(self, note_id: int) -> bool:
        """Marks a resolved parent note as closed."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE comm_note
                    SET status = 'CLOSED', updated_at = CURRENT_TIMESTAMP
                    WHERE note_id = %s;
                    """,
                    (note_id,),
                )
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error closing note {note_id}: {e}")
            return False

    def get_notes(
        self,
        student_id: Optional[int] = None,
        branch_id: Optional[str] = None,
        status: Optional[str] = None,
        parent_user_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Queries parent notes with optional filters."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        n.*,
                        s.full_name_ar AS student_name_ar,
                        s.full_name_fr AS student_name_fr,
                        e.full_name AS answered_by_name
                    FROM comm_note n
                    JOIN students s ON n.student_id = s.student_id
                    LEFT JOIN employees e ON n.answered_by_employee_id = e.employee_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if student_id is not None:
                    query += " AND n.student_id = %s"
                    params.append(student_id)
                if branch_id:
                    query += " AND n.branch_id = %s"
                    params.append(branch_id.strip().upper())
                if status:
                    query += " AND n.status = %s"
                    params.append(status.upper())
                if parent_user_id is not None:
                    query += " AND n.parent_user_id = %s"
                    params.append(parent_user_id)
                query += " ORDER BY n.created_at DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching notes: {e}")
            return []

    def get_note(self, note_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single note by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM comm_note WHERE note_id = %s;", (note_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching note {note_id}: {e}")
            return None

    # =========================================================================
    # 3. Outbound Multi-Channel Notification Queue
    # =========================================================================
    def queue_notification(
        self,
        channel: str,
        notification_type: str,
        recipient_name: str,
        recipient_target: str,
        title: str,
        body_text: str,
        student_id: Optional[int] = None,
        scheduled_at: Optional[Any] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Enqueues an outbound notification (SMS, WhatsApp, Telegram, Email).
        """
        clean_channel = channel.upper()
        clean_type = notification_type.upper()
        if clean_channel not in VALID_CHANNELS:
            raise ValueError(f"Invalid channel '{channel}'. Must be one of {VALID_CHANNELS}")
        if clean_type not in VALID_NOTIFICATION_TYPES:
            raise ValueError(f"Invalid notification_type '{notification_type}'. Must be one of {VALID_NOTIFICATION_TYPES}")

        sched = scheduled_at if scheduled_at else datetime.now()
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO comm_notification (
                        channel, notification_type, recipient_name, recipient_target,
                        student_id, title, body_text, status, attempts, scheduled_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'QUEUED', 0, %s)
                    RETURNING *;
                    """,
                    (
                        clean_channel,
                        clean_type,
                        recipient_name.strip(),
                        recipient_target.strip(),
                        student_id,
                        title.strip(),
                        body_text.strip(),
                        sched,
                    ),
                )
                row = _dict_fetchone(cursor)
                conn.commit()
                return row
        except Exception as e:
            logger.error(f"Error queueing notification: {e}")
            return None

    def get_queued_notifications(
        self, channel: Optional[str] = None, status: str = "QUEUED", limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Fetches pending or queued notifications ready for delivery dispatch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM comm_notification WHERE status = %s"
                params: List[Any] = [status.upper()]
                if channel:
                    query += " AND channel = %s"
                    params.append(channel.upper())
                query += " ORDER BY scheduled_at ASC, notification_id ASC LIMIT %s;"
                params.append(limit)
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching queued notifications: {e}")
            return []

    def process_delivery_queue(self, batch_size: int = 50) -> Dict[str, Any]:
        """
        Worker delivery cycle: dispatches queued notifications through appropriate channel gateway adapters.
        Simulates / executes gateway delivery, records attempt counts and timestamps.
        """
        pending = self.get_queued_notifications(status="QUEUED", limit=batch_size)
        sent_count = 0
        failed_count = 0

        for notif in pending:
            n_id = notif["notification_id"]
            channel = notif["channel"]
            target = notif["recipient_target"]
            attempts = notif.get("attempts", 0) + 1
            max_attempts = notif.get("max_attempts", 3)

            # Simulated carrier dispatch (can be connected to Twilio, WhatsApp Business API, Telegram Bot API, SMTP)
            success = bool(target and len(target) >= 3)
            error_message = None if success else f"Invalid contact target '{target}' for channel '{channel}'"

            try:
                with self.db.get_db_connection() as conn:
                    cursor = conn.cursor()
                    if success:
                        cursor.execute(
                            """
                            UPDATE comm_notification
                            SET status = 'SENT',
                                attempts = %s,
                                sent_at = CURRENT_TIMESTAMP
                            WHERE notification_id = %s;
                            """,
                            (attempts, n_id),
                        )
                        sent_count += 1
                    else:
                        new_status = "FAILED" if attempts >= max_attempts else "QUEUED"
                        cursor.execute(
                            """
                            UPDATE comm_notification
                            SET status = %s,
                                attempts = %s,
                                error_log = %s
                            WHERE notification_id = %s;
                            """,
                            (new_status, attempts, error_message, n_id),
                        )
                        failed_count += 1
                    conn.commit()
            except Exception as e:
                logger.error(f"Error processing notification {n_id}: {e}")
                failed_count += 1

        return {
            "processed": len(pending),
            "sent": sent_count,
            "failed_or_retried": failed_count,
        }

    def get_notification_stats(self) -> Dict[str, int]:
        """Returns aggregate distribution of notifications by status and channel."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT status, channel, COUNT(*) AS count
                    FROM comm_notification
                    GROUP BY status, channel;
                    """
                )
                rows = cursor.fetchall()
                results = {}
                for r in rows:
                    st = r[0] if not isinstance(r, dict) else r["status"]
                    ch = r[1] if not isinstance(r, dict) else r["channel"]
                    cnt = r[2] if not isinstance(r, dict) else r["count"]
                    key = f"{ch.lower()}_{st.lower()}"
                    results[key] = cnt
                return results
        except Exception as e:
            logger.error(f"Error fetching notification stats: {e}")
            return {}
