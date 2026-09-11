"""
backend/database/infrastructure_manager.py
-------------------------------------------
Consolidated Facade Manager for Core Organizational Infrastructure.
Provides unified aggregation methods across branches, academic years, and classrooms.
"""

import logging
from typing import Dict, Any

from .branch_manager import BranchManager
from .academic_year_manager import AcademicYearManager
from .classroom_manager import ClassroomManager

logger = logging.getLogger("ABAQIRA_SYS")


class InfrastructureManager:
    """
    Coordinates multi-tenant organizational infrastructure queries across
    branches, academic fiscal cycles, and classrooms.
    """

    def __init__(self, db_instance):
        self.db = db_instance
        self.branches = BranchManager(db_instance)
        self.academic_years = AcademicYearManager(db_instance)
        self.classrooms = ClassroomManager(db_instance)

    def get_system_overview(self) -> Dict[str, Any]:
        """Returns consolidated multi-branch infrastructure status."""
        current_year = self.academic_years.get_current()
        all_branches = self.branches.get_all()

        branches_summary = []
        total_capacity = 0
        total_classrooms = 0

        for b in all_branches:
            rooms = self.classrooms.get_by_branch(b['branch_id'])
            room_count = len(rooms)
            branch_cap = sum(r.get('capacity', 0) for r in rooms)
            total_classrooms += room_count
            total_capacity += branch_cap

            branches_summary.append({
                "branch_id": b['branch_id'],
                "name_ar": b['name_ar'],
                "name_en": b.get('name_en'),
                "branch_type": b['branch_type'],
                "is_active": b['is_active'],
                "classrooms_count": room_count,
                "total_student_capacity": branch_cap
            })

        return {
            "current_academic_year": current_year,
            "total_branches": len(all_branches),
            "total_classrooms": total_classrooms,
            "total_capacity": total_capacity,
            "branches": branches_summary
        }

    def get_branch_detail(self, branch_id: str) -> Dict[str, Any]:
        """Returns deep profile of a branch including its rooms and capacity."""
        branch = self.branches.get_by_id(branch_id)
        if not branch:
            return None

        rooms = self.classrooms.get_by_branch(branch_id)
        return {
            **branch,
            "classrooms": rooms,
            "total_classrooms": len(rooms),
            "total_capacity": sum(r.get('capacity', 0) for r in rooms)
        }
