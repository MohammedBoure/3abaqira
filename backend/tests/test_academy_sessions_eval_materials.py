"""
backend/tests/test_academy_sessions_eval_materials.py
------------------------------------------------------
Unit tests for Sessions, Attendance, Absence Phone Call Logs, Make-up Sessions,
Dynamic Evaluations with Double-Blind Review Workflow, and Course Material Access Control.
"""

import uuid
import pytest
from backend.database import (
    Database,
    CorePersonManager,
    CoreAuditManager,
    OrgManager,
    AcadWorkshopManager,
    AcadCourseManager,
    AcadTimetableManager,
    AcadSessionManager,
    AcadMakeupManager,
    AcadEvaluationManager,
    AcadMaterialManager,
)


@pytest.fixture(scope="module")
def db():
    return Database()


@pytest.fixture
def person_mgr(db):
    return CorePersonManager(db)


@pytest.fixture
def audit_mgr(db):
    return CoreAuditManager(db)


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


@pytest.fixture
def session_mgr(db):
    return AcadSessionManager(db)


@pytest.fixture
def makeup_mgr(db):
    return AcadMakeupManager(db)


@pytest.fixture
def eval_mgr(db):
    return AcadEvaluationManager(db)


@pytest.fixture
def material_mgr(db):
    return AcadMaterialManager(db)


class TestSessionsAttendanceAndMakeup:
    """Tests session rosters, absence phone logging, and auto make-up generation."""

    def test_attendance_absence_triggers_automatic_makeup(
        self, person_mgr, org_mgr, workshop_mgr, course_mgr, timetable_mgr, session_mgr, makeup_mgr
    ):
        curr_year = org_mgr.get_current_academic_year()
        uid = uuid.uuid4().hex[:6]

        ws = workshop_mgr.create_workshop(code=f"WS_ATT_{uid.upper()}", name_ar="ورشة الحضور")
        course = course_mgr.create_course(ws["workshop_id"], 1, f"C-ATT-{uid}", "L1", "B1", f"B-ATT-{uid}")

        student_p = person_mgr.create_person(full_name_ar=f"نبيل زايدي {uid}", person_type="STUDENT")
        student = person_mgr.create_student(person_id=student_p["person_id"])
        student_id = student["student_id"]

        group = timetable_mgr.create_group(
            branch_id="BR-01",
            course_id=course["course_id"],
            academic_year_id=curr_year["academic_year_id"],
            group_name=f"Group Attendance Test {uid}",
        )

        # 2. Create Session
        session = session_mgr.create_session(
            group_id=group["group_id"],
            session_date="2026-11-07",
            start_time="09:00",
            end_time="11:00",
            topic="Direct Additions 1 to 4 on Abacus",
        )
        session_id = session["session_id"]

        # 3. Mark Student as ABSENT
        att = session_mgr.mark_attendance(
            session_id=session_id,
            student_id=student_id,
            status="ABSENT",
            notes="Missed Saturday session",
        )
        assert att["status"] == "ABSENT"

        # 4. Verify Automatic Make-Up generation in acad_makeup
        makeups = makeup_mgr.get_makeups(student_id=student_id, reason="ABSENCE")
        assert len(makeups) >= 1
        latest_makeup = makeups[0]
        assert latest_makeup["status"] == "OWED"
        assert latest_makeup["source_session_id"] == session_id

        # 5. Log Absence Phone Call with Parent & Justification
        staff_caller = person_mgr.create_person(full_name_ar=f"موظفة الاستقبال {uid}", person_type="STAFF")
        call_log = session_mgr.log_absence_telephone_call(
            attendance_id=att["attendance_id"],
            caller_person_id=staff_caller["person_id"],
            call_answered=True,
            absence_justification="Child had dentist appointment; parent requested make-up session",
            parent_contacted_phone="+213-555-001122",
        )
        assert bool(call_log["call_logged"]) is True
        assert bool(call_log["call_answered"]) is True
        assert "dentist appointment" in call_log["absence_justification"]

        # 6. Fulfill Make-Up: Assign to session and complete
        makeup_session = session_mgr.create_session(
            group_id=group["group_id"],
            session_date="2026-11-11",
            start_time="14:00",
            end_time="16:00",
            is_makeup=True,
            topic="Make-up catchup session",
        )
        assigned = makeup_mgr.assign_makeup_to_session(
            makeup_id=latest_makeup["makeup_id"],
            assigned_session_id=makeup_session["session_id"],
        )
        assert assigned["status"] == "SCHEDULED"

        completed = makeup_mgr.complete_makeup(makeup_id=latest_makeup["makeup_id"])
        assert completed["status"] == "COMPLETED"


class TestDynamicEvaluationsAndDoubleBlindReview:
    """Tests dynamic templates, typed fields, double-blind review constraint, and grade audits."""

    def test_dynamic_template_and_double_blind_review_workflow(
        self, person_mgr, workshop_mgr, course_mgr, eval_mgr, makeup_mgr, audit_mgr
    ):
        uid = uuid.uuid4().hex[:6]
        ws = workshop_mgr.create_workshop(code=f"WS_EV_{uid.upper()}", name_ar="ورشة التقييم", evaluation_type="TIMED_OPERATIONS")
        course = course_mgr.create_course(ws["workshop_id"], 1, f"C-EV-{uid}", "L1", "B1", f"B-EV-{uid}")

        # 1. Create Dynamic Evaluation Template with Typed Fields
        tmpl = eval_mgr.create_template(
            workshop_id=ws["workshop_id"],
            name=f"Exam Template {uid}",
            eval_type="SOROBAN_TIMED",
            description="3-minute speed race plus accuracy audit",
        )
        tmpl_id = tmpl["template_id"]

        f1 = eval_mgr.add_field(tmpl_id, "Operations Attempted", "INTEGER", field_order=1)
        f2 = eval_mgr.add_field(tmpl_id, "Operations Correct", "INTEGER", field_order=2)
        f3 = eval_mgr.add_field(tmpl_id, "Time Taken (Seconds)", "DECIMAL", field_order=3)

        template_full = eval_mgr.get_template(tmpl_id)
        assert len(template_full["fields"]) == 3

        # 2. Create Evaluation Event
        event = eval_mgr.create_event(
            course_id=course["course_id"],
            template_id=tmpl_id,
            event_name=f"Final Test 1 {uid}",
            event_date="2026-11-15",
            pass_score=80.0,
            max_score=100.0,
        )
        event_id = event["event_id"]

        # 3. Setup Corrector, Reviewer, and Student
        corrector = person_mgr.create_person(full_name_ar=f"المصحح عادل {uid}", person_type="STAFF")
        reviewer = person_mgr.create_person(full_name_ar=f"المراجع يوسف {uid}", person_type="STAFF")
        student_p = person_mgr.create_person(full_name_ar=f"إسراء قاسي {uid}", person_type="STUDENT")
        student = person_mgr.create_student(person_id=student_p["person_id"])

        # 4. Stage 1: Corrector Submits Test Correction (Score 70.0 - Fail)
        result = eval_mgr.submit_correction(
            event_id=event_id,
            student_id=student["student_id"],
            corrector_person_id=corrector["person_id"],
            total_score=70.0,
            field_values=[
                {"field_id": f1["field_id"], "value_numeric": 20},
                {"field_id": f2["field_id"], "value_numeric": 14},
                {"field_id": f3["field_id"], "value_numeric": 178.5},
            ],
            feedback_notes="Struggled on operations 15 through 20",
        )
        assert result["status"] == "CORRECTED"
        assert bool(result["passed"]) is False

        # 5. Stage 2: DOUBLE-BLIND CONSTRAINT TEST
        # If the corrector tries to review their OWN correction -> MUST FAIL!
        with pytest.raises(ValueError, match="Double-blind review violation"):
            eval_mgr.review_evaluation(
                result_id=result["result_id"],
                reviewer_person_id=corrector["person_id"],  # Same person as corrector!
                approved=True,
            )

        # Independent reviewer reviews and approves -> SUCCEEDS
        reviewed = eval_mgr.review_evaluation(
            result_id=result["result_id"],
            reviewer_person_id=reviewer["person_id"],  # Different reviewer!
            approved=True,
            feedback_notes="Confirmed score 70.0. Student failed pass mark 80.0.",
        )
        assert reviewed["status"] == "PUBLISHED"

        # 6. Verify Automatic Make-Up generation for failed test
        test_makeups = makeup_mgr.get_makeups(
            student_id=student["student_id"], reason="FAILED_TEST"
        )
        assert len(test_makeups) >= 1
        assert test_makeups[0]["source_eval_result_id"] == result["result_id"]

        # 7. Sensitive Action: Admin overrides score to 82.0 with mandatory reason
        with pytest.raises(ValueError, match="justification reason is mandatory"):
            eval_mgr.update_evaluation_score(
                result_id=result["result_id"],
                new_score=82.0,
                actor_person_id=reviewer["person_id"],
                reason="",  # Empty reason forbidden
            )

        updated_grade = eval_mgr.update_evaluation_score(
            result_id=result["result_id"],
            new_score=82.0,
            actor_person_id=reviewer["person_id"],
            reason="Official re-checking: 2 correct operations in question 18 were miscounted",
            actor_username="director_admin",
        )
        assert float(updated_grade["total_score"]) == 82.0
        assert bool(updated_grade["passed"]) is True

        # Check GRADE_CHANGE audit log
        grade_audits = audit_mgr.get_logs(
            action_type="GRADE_CHANGE",
            entity_id=str(result["result_id"]),
        )
        assert len(grade_audits) >= 1
        assert "miscounted" in grade_audits[0]["reason"]


class TestCourseMaterialAccessControl:
    """Tests digital material downloads restricted strictly to enrolled students."""

    def test_material_download_access_control(
        self, person_mgr, workshop_mgr, course_mgr, material_mgr
    ):
        uid = uuid.uuid4().hex[:6]
        ws = workshop_mgr.create_workshop(code=f"WS_MAT_{uid.upper()}", name_ar="ورشة المواد")
        c1 = course_mgr.create_course(ws["workshop_id"], 1, f"C1-M-{uid}", "L1", "B1", f"B1-M-{uid}")
        c2 = course_mgr.create_course(ws["workshop_id"], 2, f"C2-M-{uid}", "L2", "B2", f"B2-M-{uid}")

        # Register course materials
        mat1 = material_mgr.create_material(
            course_id=c1["course_id"],
            title="Soroban Level 1 Student Practice Workbook PDF",
            material_type="BOOK",
            file_path="/storage/books/soroban_level_1.pdf",
            file_size_bytes=4500000,
        )
        mat2 = material_mgr.create_material(
            course_id=c2["course_id"],
            title="Soroban Level 2 Homework Sheet PDF",
            material_type="HOMEWORK",
            file_path="/storage/homework/soroban_l2_hw1.pdf",
            file_size_bytes=1200000,
        )

        # Student enrolled in Level 1 ONLY
        p = person_mgr.create_person(full_name_ar="سيرين دريدي", person_type="STUDENT")
        s = person_mgr.create_student(person_id=p["person_id"])
        student_id = s["student_id"]

        course_mgr.enroll_student(student_id=student_id, course_id=c1["course_id"])

        # 1. Download Level 1 material (enrolled) -> SUCCEEDS
        assert material_mgr.can_student_access_material(student_id, mat1["material_id"]) is True
        downloaded = material_mgr.download_material(student_id, mat1["material_id"])
        assert downloaded["title"] == "Soroban Level 1 Student Practice Workbook PDF"

        # 2. Download Level 2 material (not enrolled) -> MUST RAISE PermissionError!
        assert material_mgr.can_student_access_material(student_id, mat2["material_id"]) is False
        with pytest.raises(PermissionError, match="Access denied: Student #.* is not actively enrolled"):
            material_mgr.download_material(student_id, mat2["material_id"])
