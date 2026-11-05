"""
backend/tests/test_core_and_iam.py
-----------------------------------
Unit tests for Core Person Registry, Confidential Medical Data, IAM Accounts,
Fee Payment Activation, Dynamic Permission Catalog, and Multi-Branch Roles.
"""

import uuid
import pytest
from backend.database import (
    Database,
    CorePersonManager,
    CoreAuditManager,
    IAMManager,
)
from backend.apis.security import hash_password


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
def iam_mgr(db):
    return IAMManager(db)


class TestCorePersonAndMedical:
    """Tests for core_person, student profiles, medical audits, and guardian links."""

    def test_create_and_retrieve_person(self, person_mgr):
        person = person_mgr.create_person(
            full_name_ar="محمد العربي بوزيد",
            first_name="Mohammed",
            last_name="Bouzid",
            full_name_fr="Mohammed Larbi Bouzid",
            birth_date="2016-05-12",
            gender="MALE",
            phone="+213-550-123456",
            email="m.bouzid@example.dz",
            person_type="STUDENT",
        )
        assert person is not None
        assert person["person_id"] is not None
        assert person["full_name_ar"] == "محمد العربي بوزيد"

        retrieved = person_mgr.get_person_by_id(person["person_id"])
        assert retrieved["full_name_fr"] == "Mohammed Larbi Bouzid"

    def test_create_student_profile(self, person_mgr):
        unique_code = f"STD-TEST-{uuid.uuid4().hex[:6]}"
        person = person_mgr.create_person(
            full_name_ar="ياسمين بن علي",
            person_type="STUDENT",
        )
        student = person_mgr.create_student(
            person_id=person["person_id"],
            student_code=unique_code,
            school_grade="3AP",
            previous_schools="Ecole Primaire Freres Khellaf",
        )
        assert student is not None
        assert student["student_code"] == unique_code

        student_details = person_mgr.get_student_by_id(student["student_id"])
        assert student_details["school_grade"] == "3AP"
        assert student_details["full_name_ar"] == "ياسمين بن علي"

    def test_medical_access_triggers_mandatory_audit_log(self, person_mgr, audit_mgr):
        # Create student
        person = person_mgr.create_person(full_name_ar="علي بن عيسى", person_type="STUDENT")
        student = person_mgr.create_student(person_id=person["person_id"])
        student_id = student["student_id"]

        # Create doctor/staff actor
        actor = person_mgr.create_person(full_name_ar="د. أحمد المدير", person_type="STAFF")
        actor_id = actor["person_id"]

        # Upsert medical info
        person_mgr.upsert_student_medical(
            student_id=student_id,
            blood_group="O+",
            allergies="Peanuts and penicillin",
            special_needs="Asthma inhaler in backpack",
            food_restrictions="Gluten sensitive",
            emergency_contact_name="Farid Ben Aissa",
            emergency_contact_phone="+213-551-998877",
            actor_person_id=actor_id,
            actor_username="director_user",
        )

        # Access medical record with actor info -> MUST create audit record
        retrieved = person_mgr.get_student_medical(
            student_id=student_id,
            actor_person_id=actor_id,
            actor_username="director_user",
            ip_address="192.168.1.50",
        )
        assert retrieved is not None
        assert retrieved["blood_group"] == "O+"

        # Verify audit log record exists for MEDICAL_VIEW
        audit_logs = audit_mgr.get_logs(
            action_type="MEDICAL_VIEW",
            entity_type="core_student_medical",
            entity_id=str(student_id),
        )
        assert len(audit_logs) >= 1
        latest_audit = audit_logs[0]
        assert latest_audit["actor_username"] == "director_user"
        assert latest_audit["action_type"] == "MEDICAL_VIEW"

    def test_guardian_link_and_pickup_authorization(self, person_mgr):
        # Create child and mother
        child_p = person_mgr.create_person(full_name_ar="ريان حمادي", person_type="STUDENT")
        student = person_mgr.create_student(person_id=child_p["person_id"])
        mother_p = person_mgr.create_person(
            full_name_ar="فاطمة الزهراء قاسمي",
            phone="+213-660-112233",
            person_type="GUARDIAN",
        )

        # Link mother with custody flag
        link = person_mgr.link_guardian(
            student_id=student["student_id"],
            guardian_person_id=mother_p["person_id"],
            relationship="Mother",
            is_primary=True,
            custody_flag=True,
        )
        assert link is not None
        assert link["relationship"] == "Mother"
        assert bool(link["custody_flag"]) is True

        # Add external authorized pickup person
        pickup = person_mgr.add_pickup_authorization(
            student_id=student["student_id"],
            full_name="عمر قاسمي (الخال)",
            relationship="Uncle",
            national_id="DZ-987654321",
            phone="+213-770-445566",
            authorized_by_person_id=mother_p["person_id"],
        )
        assert pickup is not None
        assert pickup["full_name"] == "عمر قاسمي (الخال)"

        active_pickups = person_mgr.get_pickup_authorizations(student["student_id"])
        assert len(active_pickups) == 1


class TestSensitiveActionAuditLogging:
    """Tests that sensitive actions (grade change, price override, void) require reasons and log."""

    def test_grade_change_audit_requires_reason(self, audit_mgr):
        # Missing reason must raise ValueError
        with pytest.raises(ValueError, match="justification reason is mandatory"):
            audit_mgr.log_grade_change(
                actor_person_id=None,
                result_id=10,
                old_score=75.0,
                new_score=85.0,
                reason="",
            )

        # Providing reason succeeds and logs
        entry = audit_mgr.log_grade_change(
            actor_person_id=None,
            result_id=10,
            old_score=75.0,
            new_score=85.0,
            reason="Recounting Soroban speed race operation 4 error in addition line",
        )
        assert entry["action_type"] == "GRADE_CHANGE"
        assert entry["reason"] == "Recounting Soroban speed race operation 4 error in addition line"

    def test_price_override_and_payment_void_audits(self, audit_mgr):
        # Price override
        price_log = audit_mgr.log_price_override(
            actor_person_id=None,
            entity_type="fin_fee_plan",
            entity_id="PLAN-SOROBAN-L1",
            standard_price=12000.0,
            overridden_price=9500.0,
            reason="Orphan scholarship 25% discount approved by executive director",
            branch_id="BR-01",
        )
        assert price_log["action_type"] == "PRICE_OVERRIDE"

        # Payment void
        void_log = audit_mgr.log_payment_void(
            actor_person_id=None,
            payment_id="PAY-REC-00042",
            amount=5000.0,
            reason="Mistaken duplicate invoice entry by receptionist; cash returned immediately",
            branch_id="BR-01",
        )
        assert void_log["action_type"] == "PAYMENT_VOID"


class TestIAMAccountActivationAndRoles:
    """Tests IAM account lifecycle, fee payment auto-activation, and multi-branch roles."""

    def test_account_creation_is_pending_until_fees_paid(self, person_mgr, iam_mgr):
        person = person_mgr.create_person(full_name_ar="سامي بلقاسم", person_type="STUDENT")
        person_id = person["person_id"]

        pw_hash = hash_password("SuperSecretPass123!")
        account = iam_mgr.create_account(
            person_id=person_id,
            username=f"sami_b_{uuid.uuid4().hex[:6]}",
            password_hash=pw_hash,
            is_under_14=True,
        )
        assert account["status"] == "PENDING"
        assert bool(account["registration_fee_paid"]) is False
        assert bool(account["first_level_fee_paid"]) is False

        # Pay only registration fee -> Status should still be PENDING
        step1 = iam_mgr.record_fee_payment_and_evaluate_activation(person_id, "REGISTRATION")
        assert bool(step1["registration_fee_paid"]) is True
        assert bool(step1["first_level_fee_paid"]) is False
        assert step1["status"] == "PENDING"

        # Pay first level fee -> Auto-activated to ACTIVE!
        step2 = iam_mgr.record_fee_payment_and_evaluate_activation(person_id, "FIRST_LEVEL")
        assert bool(step2["first_level_fee_paid"]) is True
        assert step2["status"] == "ACTIVE"
        assert step2["activated_at"] is not None

    def test_multi_branch_role_assignments_and_effective_permissions(self, person_mgr, iam_mgr):
        # Create staff person
        staff = person_mgr.create_person(full_name_ar="أمينة خالف", person_type="STAFF")
        person_id = staff["person_id"]

        # Get existing seeded roles
        roles = iam_mgr.get_all_roles()
        receptionist_role = next(r for r in roles if r["code"] == "RECEPTIONIST")
        trainer_role = next(r for r in roles if r["code"] == "TRAINER")

        # Assign Receptionist role only to branch BR-01
        iam_mgr.assign_role_to_person(
            person_id=person_id,
            role_id=receptionist_role["role_id"],
            branch_id="BR-01",
        )

        # Assign Trainer role GLOBALLY (branch_id = None)
        iam_mgr.assign_role_to_person(
            person_id=person_id,
            role_id=trainer_role["role_id"],
            branch_id=None,
        )

        # Check effective permissions in BR-01: should have global + branch roles
        roles_br01 = iam_mgr.get_person_roles(person_id, branch_id="BR-01")
        assert len(roles_br01) == 2

        # Check effective permissions in BR-02: should have ONLY the global Trainer role
        roles_br02 = iam_mgr.get_person_roles(person_id, branch_id="BR-02")
        assert len(roles_br02) == 1
        assert roles_br02[0]["role_code"] == "TRAINER"

        # Check specific permission: 'acad.attendance.mark' is in TRAINER role
        # She should have it both in BR-01 and BR-02
        assert iam_mgr.has_permission(person_id, "acad.attendance.mark", branch_id="BR-02")
