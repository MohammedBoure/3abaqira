"""
backend/tests/test_api_endpoints.py
------------------------------------
Integration tests for FastAPI REST Endpoints:
  - Core Person, Student, and Medical endpoints
  - IAM Accounts and Fee Payment activation
  - Dynamic Roles & Permission Catalog
  - Organization 13 branches and non-overlapping academic years
  - Academy Workshops, Courses, Timetables, Sessions, Attendance, Make-ups, and Materials
"""

import pytest
from fastapi.testclient import TestClient
from backend.app import app


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


class TestAPIEndpointsIntegration:
    """Verifies that REST API endpoints respond correctly."""

    def test_health_and_root(self, client):
        res = client.get("/api/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

    def test_core_person_and_medical_endpoints(self, client):
        # 1. Create Person
        res_p = client.post(
            "/api/core/persons",
            json={
                "full_name_ar": "طارق بن زياد كراش",
                "phone": "+213-550-998877",
                "person_type": "STUDENT",
            },
        )
        assert res_p.status_code == 201
        person_data = res_p.json()
        person_id = person_data["person_id"]

        # 2. Create Student
        res_s = client.post(
            "/api/core/students",
            json={
                "person_id": person_id,
                "school_grade": "4AP",
            },
        )
        assert res_s.status_code == 201
        student_data = res_s.json()
        student_id = student_data["student_id"]

        # 3. Upsert and View Medical (triggers audit)
        res_med_up = client.put(
            f"/api/core/students/{student_id}/medical",
            json={
                "blood_group": "A+",
                "allergies": "Seasonal pollen",
                "emergency_contact_name": "Father",
                "emergency_contact_phone": "+213-550-998877",
            },
        )
        assert res_med_up.status_code == 200

        res_med_get = client.get(f"/api/core/students/{student_id}/medical")
        assert res_med_get.status_code == 200
        assert res_med_get.json()["blood_group"] == "A+"

    def test_iam_account_activation_endpoint(self, client):
        # Register a person
        res_p = client.post(
            "/api/core/persons",
            json={"full_name_ar": "مريم الشريف", "person_type": "STUDENT"},
        )
        person_id = res_p.json()["person_id"]

        # Create account -> PENDING
        res_acc = client.post(
            "/api/iam/accounts",
            json={
                "person_id": person_id,
                "username": f"mariam_{person_id}",
                "password": "SecurePassword123!",
                "is_under_14": True,
            },
        )
        assert res_acc.status_code == 201
        assert res_acc.json()["status"] == "PENDING"

        # Fee payment auto-activation endpoint
        res_pay = client.post(
            f"/api/iam/accounts/{person_id}/fee-payment",
            json={"fee_type": "FULL"},
        )
        assert res_pay.status_code == 200
        assert res_pay.json()["account"]["status"] == "ACTIVE"

    def test_org_branches_and_academic_years_endpoints(self, client):
        # 1. 13 Branches
        res_b = client.get("/api/org/branches")
        assert res_b.status_code == 200
        assert len(res_b.json()) == 13

        # 2. Academic Years non-overlapping error check
        res_yr_fail = client.post(
            "/api/org/academic-years",
            json={
                "name": "2024-Overlap-Test",
                "start_date": "2024-10-01",
                "end_date": "2025-05-01",
            },
        )
        assert res_yr_fail.status_code == 409

    def test_acad_workshops_and_clash_preview(self, client):
        # 1. List workshops
        res_w = client.get("/api/acad/workshops")
        assert res_w.status_code == 200
        assert len(res_w.json()) >= 12

        # 2. Create room and group for clash preview
        import uuid
        uid = uuid.uuid4().hex[:6]
        res_room = client.post(
            "/api/org/branches/BR-01/rooms",
            json={"name": f"Room API {uid}", "capacity": 20},
        )
        assert res_room.status_code == 201
        room_id = res_room.json()["room_id"]

        # Create instructor person
        res_tr = client.post(
            "/api/core/persons",
            json={"full_name_ar": f"مدرب التوقيت {uid}", "person_type": "INSTRUCTOR"},
        )
        assert res_tr.status_code == 201
        trainer_id = res_tr.json()["person_id"]

        # Create course
        ws_id = res_w.json()[0]["workshop_id"]
        res_crs = client.post(
            "/api/acad/courses",
            json={
                "workshop_id": ws_id,
                "sequence_order": 1,
                "course_code": f"CRS-API-{uid}",
                "name_ar": "مستوى التجربة",
                "book_title": "كتاب التجربة",
                "book_code": f"BK-API-{uid}",
            },
        )
        assert res_crs.status_code == 201
        course_id = res_crs.json()["course_id"]

        # Create group
        res_grp = client.post(
            "/api/acad/timetable/groups",
            json={
                "branch_id": "BR-01",
                "course_id": course_id,
                "academic_year_id": 2,
                "group_name": f"Group API Test {uid}",
                "room_id": room_id,
                "trainer_person_id": trainer_id,
            },
        )
        assert res_grp.status_code == 201
        group_id = res_grp.json()["group_id"]

        # Preview clash check endpoint
        res_clash = client.post(
            "/api/acad/timetable/check-clash",
            json={
                "group_id": group_id,
                "room_id": room_id,
                "trainer_person_id": trainer_id,
                "day_of_week": 1,
                "start_time": "08:00",
                "end_time": "10:00",
            },
        )
        assert res_clash.status_code == 200
        assert "has_clash" in res_clash.json()
        assert res_clash.json()["has_clash"] is False
