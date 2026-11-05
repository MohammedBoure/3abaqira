"""
backend/database/acad_timetable_manager.py
-------------------------------------------
Data Access Manager for Groups and Weekly Timetables with Strict Clash Detection:
  - acad_group: Student cohorts tied to branch, course, and academic year
  - acad_group_slot: Weekly recurring timetable slots
  - TimetableClashError: Automated collision detection for trainers, rooms, and groups
"""

import logging
from typing import List, Dict, Optional, Any

logger = logging.getLogger("ABAQIRA_SYS")


class TimetableClashError(ValueError):
    """Raised when a proposed timetable slot conflicts with trainer, room, or group schedules."""
    pass


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


def _times_overlap(s1: str, e1: str, s2: str, e2: str) -> bool:
    """Returns True if interval [s1, e1] overlaps with [s2, e2]."""
    return (s1 < e2) and (e1 > s2)


class AcadTimetableManager:
    """
    Manages group rosters, weekly timetable schedules, and timetable clash prevention.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # GROUPS
    # =========================================================================
    def create_group(
        self,
        branch_id: str,
        course_id: int,
        academic_year_id: int,
        group_name: str,
        trainer_person_id: Optional[int] = None,
        room_id: Optional[int] = None,
        max_capacity: int = 15,
    ) -> Optional[Dict[str, Any]]:
        """Creates an academic group for a specific course and branch."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Verify room branch constraint if room provided
                if room_id:
                    cursor.execute("SELECT branch_id FROM org_room WHERE room_id = %s;", (room_id,))
                    room = _dict_fetchone(cursor)
                    if room and room["branch_id"] != branch_id:
                        raise TimetableClashError(
                            f"Branch mismatch: Room belongs to branch '{room['branch_id']}', but group is in '{branch_id}'."
                        )

                query = """
                INSERT INTO acad_group (
                    branch_id, course_id, academic_year_id, group_name,
                    trainer_person_id, room_id, max_capacity, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE')
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        course_id,
                        academic_year_id,
                        group_name.strip(),
                        trainer_person_id,
                        room_id,
                        max_capacity,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating group '{group_name}': {e}")
            raise

    def get_group_by_id(self, group_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves group details with course, branch, and slots."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT g.*, c.name_ar AS course_name, c.book_title, b.name_ar AS branch_name,
                       p.full_name_ar AS trainer_name
                FROM acad_group g
                JOIN acad_course c ON g.course_id = c.course_id
                JOIN org_branch b ON g.branch_id = b.branch_id
                LEFT JOIN core_person p ON g.trainer_person_id = p.person_id
                WHERE g.group_id = %s;
                """
                cursor.execute(query, (group_id,))
                group = _dict_fetchone(cursor)
                if not group:
                    return None

                # Attach weekly slots
                cursor.execute("SELECT * FROM acad_group_slot WHERE group_id = %s ORDER BY day_of_week, start_time;", (group_id,))
                group["slots"] = _dict_fetchall(cursor)
                return group
        except Exception as e:
            logger.error(f"Error fetching group {group_id}: {e}")
            return None

    def get_groups(
        self,
        branch_id: Optional[str] = None,
        course_id: Optional[int] = None,
        academic_year_id: Optional[int] = None,
        status: Optional[str] = "ACTIVE",
    ) -> List[Dict[str, Any]]:
        """Queries groups with optional filters."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT g.*, c.name_ar AS course_name, b.name_ar AS branch_name,
                       p.full_name_ar AS trainer_name
                FROM acad_group g
                JOIN acad_course c ON g.course_id = c.course_id
                JOIN org_branch b ON g.branch_id = b.branch_id
                LEFT JOIN core_person p ON g.trainer_person_id = p.person_id
                WHERE 1=1
                """
                params = []
                if branch_id:
                    query += " AND g.branch_id = %s"
                    params.append(branch_id.strip())
                if course_id:
                    query += " AND g.course_id = %s"
                    params.append(course_id)
                if academic_year_id:
                    query += " AND g.academic_year_id = %s"
                    params.append(academic_year_id)
                if status:
                    query += " AND g.status = %s"
                    params.append(status.strip().upper())

                query += " ORDER BY g.group_id DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching groups: {e}")
            return []

    # =========================================================================
    # TIMETABLE CLASH DETECTION & SLOTS
    # =========================================================================
    def check_clash(
        self,
        group_id: int,
        room_id: int,
        trainer_person_id: int,
        day_of_week: int,
        start_time: str,
        end_time: str,
        exclude_slot_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Detects collisions across trainer schedules, room occupancy, and group slots.
        """
        s_time = start_time.strip()
        e_time = end_time.strip()
        if e_time <= s_time:
            raise ValueError("Timetable constraint violation: end_time must be strictly after start_time.")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # 1. Verify room branch matches group branch
                cursor.execute("SELECT branch_id FROM acad_group WHERE group_id = %s;", (group_id,))
                group_row = _dict_fetchone(cursor)
                if not group_row:
                    raise ValueError(f"Group {group_id} does not exist.")
                group_branch = group_row["branch_id"]

                cursor.execute("SELECT branch_id, name FROM org_room WHERE room_id = %s;", (room_id,))
                room_row = _dict_fetchone(cursor)
                if not room_row:
                    raise ValueError(f"Room {room_id} does not exist.")
                if room_row["branch_id"] != group_branch:
                    return {
                        "has_clash": True,
                        "clash_type": "BRANCH_MISMATCH",
                        "message": f"Room '{room_row['name']}' belongs to branch '{room_row['branch_id']}', but group is in '{group_branch}'.",
                    }

                # 2. Check Room Double-Booking
                room_query = """
                SELECT slot_id, group_id, start_time, end_time
                FROM acad_group_slot
                WHERE room_id = %s AND day_of_week = %s
                """
                params = [room_id, day_of_week]
                if exclude_slot_id:
                    room_query += " AND slot_id != %s"
                    params.append(exclude_slot_id)

                cursor.execute(room_query, params)
                existing_room_slots = _dict_fetchall(cursor)
                for slot in existing_room_slots:
                    if _times_overlap(s_time, e_time, slot["start_time"], slot["end_time"]):
                        return {
                            "has_clash": True,
                            "clash_type": "ROOM_DOUBLE_BOOKED",
                            "message": f"Room '{room_row['name']}' is already booked on day {day_of_week} between {slot['start_time']} and {slot['end_time']}.",
                            "conflict_slot": slot,
                        }

                # 3. Check Trainer Double-Booking (across all groups and branches)
                trainer_query = """
                SELECT slot_id, group_id, start_time, end_time
                FROM acad_group_slot
                WHERE trainer_person_id = %s AND day_of_week = %s
                """
                params = [trainer_person_id, day_of_week]
                if exclude_slot_id:
                    trainer_query += " AND slot_id != %s"
                    params.append(exclude_slot_id)

                cursor.execute(trainer_query, params)
                existing_trainer_slots = _dict_fetchall(cursor)
                for slot in existing_trainer_slots:
                    if _times_overlap(s_time, e_time, slot["start_time"], slot["end_time"]):
                        cursor.execute("SELECT full_name_ar FROM core_person WHERE person_id = %s;", (trainer_person_id,))
                        t_name = _dict_fetchone(cursor)
                        name_str = t_name["full_name_ar"] if t_name else f"ID {trainer_person_id}"
                        return {
                            "has_clash": True,
                            "clash_type": "TRAINER_DOUBLE_BOOKED",
                            "message": f"Trainer '{name_str}' is already booked on day {day_of_week} between {slot['start_time']} and {slot['end_time']}.",
                            "conflict_slot": slot,
                        }

                # 4. Check Group Double-Booking
                group_slot_query = """
                SELECT slot_id, start_time, end_time
                FROM acad_group_slot
                WHERE group_id = %s AND day_of_week = %s
                """
                params = [group_id, day_of_week]
                if exclude_slot_id:
                    group_slot_query += " AND slot_id != %s"
                    params.append(exclude_slot_id)

                cursor.execute(group_slot_query, params)
                existing_group_slots = _dict_fetchall(cursor)
                for slot in existing_group_slots:
                    if _times_overlap(s_time, e_time, slot["start_time"], slot["end_time"]):
                        return {
                            "has_clash": True,
                            "clash_type": "GROUP_DOUBLE_BOOKED",
                            "message": f"Group {group_id} already has a slot on day {day_of_week} between {slot['start_time']} and {slot['end_time']}.",
                            "conflict_slot": slot,
                        }

                return {"has_clash": False, "clash_type": None, "message": "No timetable collision detected."}
        except Exception as e:
            logger.error(f"Error during clash detection: {e}")
            raise

    def add_group_slot(
        self,
        group_id: int,
        room_id: int,
        trainer_person_id: int,
        day_of_week: int,
        start_time: str,
        end_time: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Adds a recurring slot to a group's timetable.
        Enforces automated clash checks.
        """
        clash = self.check_clash(
            group_id=group_id,
            room_id=room_id,
            trainer_person_id=trainer_person_id,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
        )
        if clash["has_clash"]:
            raise TimetableClashError(f"Timetable Clash: {clash['message']}")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO acad_group_slot (
                    group_id, room_id, trainer_person_id, day_of_week, start_time, end_time
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (group_id, room_id, trainer_person_id, day_of_week, start_time.strip(), end_time.strip()),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error adding group slot: {e}")
            raise

    def get_group_slots(self, group_id: int) -> List[Dict[str, Any]]:
        """Retrieves all weekly slots for a group."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT s.*, r.name AS room_name, p.full_name_ar AS trainer_name
                FROM acad_group_slot s
                JOIN org_room r ON s.room_id = r.room_id
                JOIN core_person p ON s.trainer_person_id = p.person_id
                WHERE s.group_id = %s
                ORDER BY s.day_of_week ASC, s.start_time ASC;
                """
                cursor.execute(query, (group_id,))
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching slots for group {group_id}: {e}")
            return []
