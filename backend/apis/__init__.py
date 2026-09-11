"""
backend/apis/__init__.py
------------------------
Unified REST API Routing Gateway for 3abaqira Enterprise Platform.
Aggregates all modular domain sub-routers:
  - /api/auth           -> Authentication, JWT Token lifecycle, Swagger login
  - /api/users          -> User account administration & RBAC permissions
  - /api/branches       -> Multi-tenant operational branches
  - /api/academic-years -> Fiscal academic cycles and active period toggling
  - /api/classrooms     -> Lecture halls, room capacity, floor assignments
  - /api/system         -> Service telemetry, system overview, and archive modes
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .branches import router as branches_router
from .academic_years import router as academic_years_router
from .classrooms import router as classrooms_router
from .guardians import router as guardians_router
from .students import router as students_router
from .programs import router as programs_router
from .levels import router as levels_router
from .pricing_plans import router as pricing_plans_router
from .groups import router as groups_router
from .schedules import router as schedules_router
from .sessions import router as sessions_router
from .enrollments import router as enrollments_router
from .invoices import router as invoices_router
from .registers import router as registers_router
from .payments import router as payments_router
from .handovers import router as handovers_router
from .expenses import router as expenses_router
from .budgets import router as budgets_router
from .kitchen import router as kitchen_router
from .competitions import router as competitions_router
from .payroll import router as payroll_router
from .audit import router as audit_router
from .system import router as system_router, system_health_check

# Master API Router mounted under '/api'
api_router = APIRouter(prefix="/api")

# Mount Sub-Routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(branches_router)
api_router.include_router(academic_years_router)
api_router.include_router(classrooms_router)
api_router.include_router(guardians_router)
api_router.include_router(students_router)
api_router.include_router(programs_router)
api_router.include_router(levels_router)
api_router.include_router(pricing_plans_router)
api_router.include_router(groups_router)
api_router.include_router(schedules_router)
api_router.include_router(sessions_router)
api_router.include_router(enrollments_router)
api_router.include_router(invoices_router)
api_router.include_router(registers_router)
api_router.include_router(payments_router)
api_router.include_router(handovers_router)
api_router.include_router(expenses_router)
api_router.include_router(budgets_router)
api_router.include_router(kitchen_router)
api_router.include_router(competitions_router)
api_router.include_router(payroll_router)
api_router.include_router(audit_router)
api_router.include_router(system_router)

# Top-level direct health check alias: GET /api/health
api_router.add_api_route(
    "/health",
    system_health_check,
    methods=["GET"],
    tags=["System Health"],
    summary="Direct Health Check",
    description="Convenience shortcut for GET /api/system/health.",
)

__all__ = [
    "api_router",
    "auth_router",
    "users_router",
    "branches_router",
    "academic_years_router",
    "classrooms_router",
    "guardians_router",
    "students_router",
    "programs_router",
    "levels_router",
    "pricing_plans_router",
    "groups_router",
    "schedules_router",
    "sessions_router",
    "enrollments_router",
    "invoices_router",
    "registers_router",
    "payments_router",
    "handovers_router",
    "expenses_router",
    "budgets_router",
    "kitchen_router",
    "competitions_router",
    "payroll_router",
    "audit_router",
    "system_router",
]
