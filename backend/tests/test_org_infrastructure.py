"""
backend/tests/test_org_infrastructure.py
-----------------------------------------
Unit tests for 13 Branches, Non-overlapping Academic Years, Single Current Year,
Classroom Capacity, and Room Equipment Inventory.
"""

import pytest
from backend.database import Database, OrgManager


@pytest.fixture(scope="module")
def db():
    return Database()


@pytest.fixture
def org_mgr(db):
    return OrgManager(db)


class TestOrganizationInfrastructure:
    """Tests for 13 branches, academic years, and rooms."""

    def test_thirteen_branches_seeded_with_types(self, org_mgr):
        branches = org_mgr.get_all_branches()
        assert len(branches) == 13

        academies = org_mgr.get_all_branches(branch_type="ACADEMY")
        kindergartens = org_mgr.get_all_branches(branch_type="KINDERGARTEN")

        assert len(academies) >= 7
        assert len(kindergartens) >= 4
        assert len(academies) + len(kindergartens) == 13

        # Spot check key Jijel locations
        center_acad = org_mgr.get_branch_by_id("BR-01")
        assert center_acad["branch_type"] == "ACADEMY"
        assert "جيجل وسط" in center_acad["name_ar"]

        center_kg = org_mgr.get_branch_by_id("BR-02")
        assert center_kg["branch_type"] == "KINDERGARTEN"

    def test_academic_years_non_overlapping_constraint(self, org_mgr):
        # Existing seeded: 2024-2025 (2024-09-01 to 2025-07-31), 2025-2026 (2025-09-01 to 2026-07-31)
        # Attempting to add an overlapping cycle (e.g. 2025-01-01 to 2025-12-31) MUST FAIL!
        with pytest.raises(ValueError, match="Non-overlapping rule violation"):
            org_mgr.create_academic_year(
                name="2025-Conflict",
                start_date="2025-01-01",
                end_date="2025-12-31",
            )

        # Adding a non-overlapping future cycle (e.g. 2026-09-01 to 2027-07-31) MUST SUCCEED
        future_year = org_mgr.create_academic_year(
            name="2026-2027",
            start_date="2026-09-01",
            end_date="2027-07-31",
            is_current=False,
        )
        assert future_year is not None
        assert future_year["name"] == "2026-2027"

    def test_single_current_academic_year_enforcement(self, org_mgr):
        # Set 2026-2027 as current
        years = org_mgr.get_all_academic_years()
        target_year = next(y for y in years if y["name"] == "2026-2027")

        org_mgr.set_current_academic_year(target_year["academic_year_id"])

        current = org_mgr.get_current_academic_year()
        assert current["academic_year_id"] == target_year["academic_year_id"]
        assert current["name"] == "2026-2027"

        # Verify all other academic years are is_current = FALSE
        all_years = org_mgr.get_all_academic_years()
        active_count = sum(1 for y in all_years if y["is_current"])
        assert active_count == 1

    def test_rooms_and_room_equipment(self, org_mgr):
        # Create a room in BR-01
        room = org_mgr.create_room(
            branch_id="BR-01",
            name="قاعة الخوارزمي للحساب الذهني",
            capacity=18,
            floor_number=1,
            description="Soroban specialized classroom with large demonstration abacus",
        )
        assert room is not None
        assert room["capacity"] == 18

        room_id = room["room_id"]

        # Add equipment
        eq1 = org_mgr.add_room_equipment(
            room_id=room_id,
            name="معداد ياباني تعليمي جداري كبير (Soroban Master Board)",
            quantity=1,
            condition="EXCELLENT",
        )
        assert eq1["quantity"] == 1

        eq2 = org_mgr.add_room_equipment(
            room_id=room_id,
            name="معداد طلابي 17 عمود (Student Sorobans)",
            quantity=20,
            condition="GOOD",
        )
        assert eq2["quantity"] == 20

        equipment_list = org_mgr.get_room_equipment(room_id)
        assert len(equipment_list) == 2
