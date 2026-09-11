"""
backend/database/schedule_manager.py
------------------------------------
Data Access Manager for the 'group_schedules' table.
Encapsulates:
  - Weekly recurring timetable schedule slots for study groups
  - Physical classroom occupancy and conflict/clash detection
  - Day-of-week indexing and shift slot labeling
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


class ScheduleManager:
    """
    Manages operations for group schedules, classroom timetables, and clash detection.
    """

    SAFE_COLUMNS = (
        "schedule_id, group_id, classroom_id, day_of_week, time_slot_label, start_time, end_time, created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        group_id: Optional[int] = None,
        classroom_id: Optional[int] = None,
        day_of_week: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Lists timetable schedule slots with group and classroom context.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        gs.*,
                        g.group_name,
                        g.branch_id,
                        cr.name AS classroom_name,
                        cr.floor_number
                    FROM group_schedules gs
                    JOIN groups g ON gs.group_id = g.group_id
                    JOIN classrooms cr ON gs.classroom_id = cr.classroom_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if group_id is not None:
                    query += " AND gs.group_id = %s"
                    params.append(group_id)
                if classroom_id is not None:
                    query += " AND gs.classroom_id = %s"
                    params.append(classroom_id)
                if day_of_week and day_of_week.strip():
                    query += " AND gs.day_of_week = %s"
                    params.append(day_of_week.strip())

                query += " ORDER BY gs.day_of_week ASC, gs.start_time ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching schedules: {e}")
            return []

    def get_by_id(self, schedule_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a single schedule record by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        gs.*,
                        g.group_name,
                        g.branch_id,
                        cr.name AS classroom_name,
                        cr.floor_number
                    FROM group_schedules gs
                    JOIN groups g ON gs.group_id = g.group_id
                    JOIN classrooms cr ON gs.classroom_id = cr.classroom_id
                    WHERE gs.schedule_id = %s;
                """
                cursor.execute(query, (schedule_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching schedule ID {schedule_id}: {e}")
            return None

    def check_clash(
        self,
        classroom_id: int,
        day_of_week: str,
        start_time: Any,
        end_time: Any,
        exclude_schedule_id: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Detects schedule overlaps in the same classroom on the same day.
        Returns conflicting schedule dictionary if a clash occurs, None otherwise.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        gs.*,
                        g.group_name
                    FROM group_schedules gs
                    JOIN groups g ON gs.group_id = g.group_id
                    WHERE gs.classroom_id = %s
                      AND gs.day_of_week = %s
                      AND gs.start_time < %s
                      AND gs.end_time > %s
                """
                params = [classroom_id, day_of_week.strip(), end_time, start_time]

                if exclude_schedule_id:
                    query += " AND gs.schedule_id <> %s"
                    params.append(exclude_schedule_id)

                query += " LIMIT 1;"
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error verifying schedule clash: {e}")
            return None

    def create(
        self,
        group_id: int,
        classroom_id: int,
        day_of_week: str,
        start_time: Any,
        end_time: Any,
        time_slot_label: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new recurring schedule slot."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO group_schedules (
                    group_id, classroom_id, day_of_week, start_time, end_time, time_slot_label
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        group_id,
                        classroom_id,
                        day_of_week.strip(),
                        start_time,
                        end_time,
                        time_slot_label.strip() if time_slot_label else None,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating schedule for group {group_id}: {e}")
            return None

    def update(self, schedule_id: int, **kwargs) -> bool:
        """Updates schedule parameters."""
        allowed = {"classroom_id", "day_of_week", "start_time", "end_time", "time_slot_label"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [schedule_id]
                query = f"UPDATE group_schedules SET {', '.join(set_clauses)} WHERE schedule_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating schedule ID {schedule_id}: {e}")
            return False

    def delete(self, schedule_id: int) -> bool:
        """Deletes a schedule slot."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM group_schedules WHERE schedule_id = %s;"
                cursor.execute(query, (schedule_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting schedule ID {schedule_id}: {e}")
            return False

    def get_timetable_by_classroom(self, classroom_id: int) -> List[Dict[str, Any]]:
        """Retrieves complete weekly occupation roster for a specific classroom."""
        return self.get_all(classroom_id=classroom_id)
