"""
backend/tests/test_academy_progression_and_clash.py
----------------------------------------------------
Unit tests for Academy Module:
  - 12 Workshops
  - Sequential book progression rules (one book per course, one open book per workshop, pass required, placement notes)
  - Dynamic pass rules (Soroban 3 tests 80/100)
  - Timetable clash detection (trainer, room, group double-booking prevention, branch isolation)
"""

import uuid
import pytest
from backend.database import (
    Database,
    CorePersonManager,
    OrgManager,
    AcadWorkshopManager,
    AcadCourseManager,
    AcadTimetableManager,
)
from backend.database.acad_timetable_manager import TimetableClashError


@pytest.fixture(scope="module")
def db():
    return Database()


@pytest.fixture
def person_mgr(db):
    return CorePersonManager(db)


@pytest.fixture
def org_mgr(db):
    return OrgManager(db)


@pytest.fixture
def workshop_mgr(db):
    return AcadWorkshopManager(db)


@pytest.fixture
def course_mgr(db):
    return AcadCourseManager(db)


@pytest.fixture
def timetable_mgr(db):
    return AcadTimetableManager(db)


class TestAcademyWorkshopsAndProgression:
    """Tests for workshops, sequential books, pass rules, and progression."""

    def test_twelve_workshops_seeded(self, workshop_mgr):
        workshops = workshop_mgr.get_all_workshops()
        assert len(workshops) == 12

        codes = {w["code"] for w in workshops}
        expected = {
            "SOROBAN", "ROBOTICS", "FRENCH", "ENGLISH", "AI", "RUBIK",
            "QURAN", "HORSE_RIDING", "SWIMMING", "SUPPORT", "SUMMER_CLUB", "COMPETITION"
        }
        assert expected.issubset(codes)

    def test_sequential_courses_and_pass_rules(self, workshop_mgr, course_mgr):
        # Create a dedicated workshop to test progression isolation
        uid = uuid.uuid4().hex[:6]
        ws = workshop_mgr.create_workshop(
            code=f"WS_{uid.upper()}",
            name_ar=f"ورشة تجريبية {uid}",
            evaluation_type="TIMED_OPERATIONS",
        )
        ws_id = ws["workshop_id"]

        # Level 1 Course & Book
        c1 = course_mgr.create_course(
            workshop_id=ws_id,
            sequence_order=1,
            course_code=f"CRS-L1-{uid}",
            name_ar="المستوى الأول",
            book_title="الكتاب الأول",
            book_code=f"BK-1-{uid}",
        )
        assert c1["sequence_order"] == 1
        assert c1["book_code"] == f"BK-1-{uid}"

        # Level 1 Dynamic Pass Rule: 3 tests, 80/100 each
        rule = course_mgr.set_course_rule(
            course_id=c1["course_id"],
            rule_type="SOROBAN_TESTS",
            pass_mark=80.0,
            max_mark=100.0,
            required_tests_count=3,
            min_score_per_test=80.0,
        )
        assert rule["required_tests_count"] == 3
        assert float(rule["min_score_per_test"]) == 80.0

        # Level 2 Course & Book
        c2 = course_mgr.create_course(
            workshop_id=ws_id,
            sequence_order=2,
            course_code=f"CRS-L2-{uid}",
            name_ar="المستوى الثاني",
            book_title="الكتاب الثاني",
            book_code=f"BK-2-{uid}",
        )
        assert c2["sequence_order"] == 2

        # Level 3 Course & Book
        c3 = course_mgr.create_course(
            workshop_id=ws_id,
            sequence_order=3,
            course_code=f"CRS-L3-{uid}",
            name_ar="المستوى الثالث",
            book_title="الكتاب الثالث",
            book_code=f"BK-3-{uid}",
        )
        assert c3["sequence_order"] == 3

    def test_one_open_book_rule_enforcement(self, person_mgr, workshop_mgr, course_mgr):
        uid = uuid.uuid4().hex[:6]
        ws = workshop_mgr.create_workshop(
            code=f"WS_OOB_{uid.upper()}",
            name_ar="ورشة الكتاب الواحد",
            evaluation_type="STANDARD_SCORE",
        )
        c1 = course_mgr.create_course(ws["workshop_id"], 1, f"C1-{uid}", "L1", "B1", f"BK1-{uid}")
        c2 = course_mgr.create_course(ws["workshop_id"], 2, f"C2-{uid}", "L2", "B2", f"BK2-{uid}")

        # Register new student
        p = person_mgr.create_person(full_name_ar="بلال بوقرة", person_type="STUDENT")
        s = person_mgr.create_student(person_id=p["person_id"])
        student_id = s["student_id"]

        # Enroll in Level 1 (Book 1) -> SUCCEEDS
        enr1 = course_mgr.enroll_student(student_id=student_id, course_id=c1["course_id"])
        assert enr1["status"] == "ACTIVE"

        # Attempting to enroll in Level 2 while Level 1 is still ACTIVE -> MUST FAIL
        with pytest.raises(ValueError, match="One open book rule violation"):
            course_mgr.enroll_student(student_id=student_id, course_id=c2["course_id"])

    def test_sequential_advancement_and_placement_notes(self, person_mgr, workshop_mgr, course_mgr):
        uid = uuid.uuid4().hex[:6]
        ws = workshop_mgr.create_workshop(
            code=f"WS_SEQ_{uid.upper()}",
            name_ar="ورشة التدرج",
            evaluation_type="STANDARD_SCORE",
        )
        c1 = course_mgr.create_course(ws["workshop_id"], 1, f"C1-S-{uid}", "L1", "B1", f"B1-{uid}")
        c2 = course_mgr.create_course(ws["workshop_id"], 2, f"C2-S-{uid}", "L2", "B2", f"B2-{uid}")
        c3 = course_mgr.create_course(ws["workshop_id"], 3, f"C3-S-{uid}", "L3", "B3", f"B3-{uid}")

        # New student attempting to enroll directly into Level 2 without passing Level 1 -> FAILS
        p1 = person_mgr.create_person(full_name_ar="هدى مسعودي", person_type="STUDENT")
        s1 = person_mgr.create_student(person_id=p1["person_id"])
        with pytest.raises(ValueError, match="Sequential progression rule violation"):
            course_mgr.enroll_student(student_id=s1["student_id"], course_id=c2["course_id"])

        # Same student enrolling with authorized placement note -> SUCCEEDS
        enr_placement = course_mgr.enroll_student(
            student_id=s1["student_id"],
            course_id=c2["course_id"],
            placement_note="Tested into Level 2 by Head Trainer: Previous knowledge from another academy.",
        )
        assert enr_placement["status"] == "ACTIVE"
        assert "Tested into Level 2" in enr_placement["placement_note"]

        # Student who finishes Level 2 and passes
        course_mgr.complete_enrollment(enr_placement["enrollment_id"], passed=True)

        # Now can advance to Level 3 without placement note
        enr3 = course_mgr.enroll_student(student_id=s1["student_id"], course_id=c3["course_id"])
        assert enr3["status"] == "ACTIVE"

    def test_repeat_book_on_failure(self, person_mgr, workshop_mgr, course_mgr):
        uid = uuid.uuid4().hex[:6]
        ws = workshop_mgr.create_workshop(code=f"WS_RPT_{uid.upper()}", name_ar="ورشة الإعادة")
        c1 = course_mgr.create_course(ws["workshop_id"], 1, f"C1-R-{uid}", "L1", "B1", f"B1-R-{uid}")

        p = person_mgr.create_person(full_name_ar="حمزة بوعكاز", person_type="STUDENT")
        s = person_mgr.create_student(person_id=p["person_id"])

        enr = course_mgr.enroll_student(student_id=s["student_id"], course_id=c1["course_id"])
        assert enr["status"] == "ACTIVE"

        # Fails the level -> status set to FAILED_REPEATING
        failed = course_mgr.complete_enrollment(enr["enrollment_id"], passed=False)
        assert failed["status"] == "FAILED_REPEATING"


class TestTimetableClashDetection:
    """Tests collision detection for trainers, rooms, groups, and branch matching."""

    @pytest.fixture
    def setup_timetable_data(self, org_mgr, course_mgr, workshop_mgr, person_mgr):
        curr_year = org_mgr.get_current_academic_year()
        year_id = curr_year["academic_year_id"]
        uid = uuid.uuid4().hex[:6]

        r1 = org_mgr.create_room("BR-01", f"Room {uid}-A", capacity=15)
        r3 = org_mgr.create_room("BR-03", f"Room {uid}-B", capacity=15)

        trainer = person_mgr.create_person(full_name_ar=f"المدرب كمال {uid}", person_type="INSTRUCTOR")
        trainer_id = trainer["person_id"]

        ws = workshop_mgr.create_workshop(code=f"WS_TIME_{uid.upper()}", name_ar="ورشة التوقيت")
        c1 = course_mgr.create_course(ws["workshop_id"], 1, f"C-TIME-{uid}", "L1", "B1", f"B1-T-{uid}")

        return {
            "year_id": year_id,
            "room_br1": r1,
            "room_br3": r3,
            "trainer_id": trainer_id,
            "course_id": c1["course_id"],
        }

    def test_branch_mismatch_clash_prevention(self, timetable_mgr, setup_timetable_data):
        data = setup_timetable_data
        uid = uuid.uuid4().hex[:4]
        # Group in BR-01 cannot use a room from BR-03!
        with pytest.raises(TimetableClashError, match="Branch mismatch"):
            timetable_mgr.create_group(
                branch_id="BR-01",
                course_id=data["course_id"],
                academic_year_id=data["year_id"],
                group_name=f"Group Alpha {uid}",
                room_id=data["room_br3"]["room_id"],  # Room from BR-03!
            )

    def test_room_double_booking_clash(self, timetable_mgr, setup_timetable_data, person_mgr):
        data = setup_timetable_data
        uid = uuid.uuid4().hex[:4]
        trainer2 = person_mgr.create_person(full_name_ar=f"المدرب حسان {uid}", person_type="INSTRUCTOR")

        # Create two groups in BR-01
        g1 = timetable_mgr.create_group(
            branch_id="BR-01",
            course_id=data["course_id"],
            academic_year_id=data["year_id"],
            group_name=f"Group Morning A {uid}",
            room_id=data["room_br1"]["room_id"],
            trainer_person_id=data["trainer_id"],
        )
        g2 = timetable_mgr.create_group(
            branch_id="BR-01",
            course_id=data["course_id"],
            academic_year_id=data["year_id"],
            group_name=f"Group Morning B {uid}",
            room_id=data["room_br1"]["room_id"],
            trainer_person_id=trainer2["person_id"],
        )

        # Slot for Group 1: Saturday (day 6), 09:00 - 11:00 in room Room A
        slot1 = timetable_mgr.add_group_slot(
            group_id=g1["group_id"],
            room_id=data["room_br1"]["room_id"],
            trainer_person_id=data["trainer_id"],
            day_of_week=6,
            start_time="09:00",
            end_time="11:00",
        )
        assert slot1 is not None

        # Attempting to schedule Group 2 in the SAME room on Saturday 10:00 - 12:00 -> OVERLAP CLASH!
        with pytest.raises(TimetableClashError, match="Room '.*' is already booked"):
            timetable_mgr.add_group_slot(
                group_id=g2["group_id"],
                room_id=data["room_br1"]["room_id"],
                trainer_person_id=trainer2["person_id"],
                day_of_week=6,
                start_time="10:00",
                end_time="12:00",
            )

    def test_trainer_double_booking_clash(self, timetable_mgr, setup_timetable_data, org_mgr):
        data = setup_timetable_data
        uid = uuid.uuid4().hex[:4]
        room2 = org_mgr.create_room("BR-01", f"Room Extra {uid}", capacity=15)

        g3 = timetable_mgr.create_group(
            branch_id="BR-01",
            course_id=data["course_id"],
            academic_year_id=data["year_id"],
            group_name=f"Group Parallel {uid}",
        )

        # First book trainer in Room A on Saturday 09:00 - 11:00
        timetable_mgr.add_group_slot(
            group_id=g3["group_id"],
            room_id=data["room_br1"]["room_id"],
            trainer_person_id=data["trainer_id"],
            day_of_week=6,
            start_time="09:00",
            end_time="11:00",
        )

        g4 = timetable_mgr.create_group(
            branch_id="BR-01",
            course_id=data["course_id"],
            academic_year_id=data["year_id"],
            group_name=f"Group Parallel 2 {uid}",
        )

        # Group 4 tries to use Room Extra with the SAME trainer during overlapping Saturday slot 09:30 - 11:30
        # The room is free, but the TRAINER is already booked in Room A!
        with pytest.raises(TimetableClashError, match="Trainer '.*' is already booked"):
            timetable_mgr.add_group_slot(
                group_id=g4["group_id"],
                room_id=room2["room_id"],
                trainer_person_id=data["trainer_id"],  # Same trainer!
                day_of_week=6,
                start_time="09:30",
                end_time="11:30",
            )
