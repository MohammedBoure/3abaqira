"""
backend/database/__init__.py
-----------------------------
Central Database Package Entrypoint & Dynamic Manager Registry.
Includes direct FastAPI dependency injection providers (`get_db`, `get_database`).
"""

from importlib import import_module
from contextvars import ContextVar
from typing import Generator

from .base import (
    Database,
    CustomJSONEncoder,
    TABLE_IMPORT_ORDER,
    ARCHIVE_VIEW_FLAG_FILE,
    HARD_RESET_PASSWORD,
    get_external_path,
    logger,
)

# Request context variable for FastAPI auth middleware
active_user_id: ContextVar = ContextVar("active_user_id", default=None)


def log_methods(cls):
    """Optional class decorator for auditing manager method executions."""
    return cls


# ─── Dynamic / Lazy Domain Manager Registry ──────────────────────────────────
# Maps Manager class names to (module_name, class_name) for on-demand loading
_MANAGER_EXPORTS = {
    # Core Identity & Branches
    "UserManager": ("user_manager", "UserManager"),
    "EmployeeManager": ("employee_manager", "EmployeeManager"),
    "BranchManager": ("branch_manager", "BranchManager"),
    "AcademicYearManager": ("academic_year_manager", "AcademicYearManager"),
    "ClassroomManager": ("classroom_manager", "ClassroomManager"),
    "InfrastructureManager": ("infrastructure_manager", "InfrastructureManager"),
    
    # Students, Guardians & Groups
    "StudentManager": ("student_manager", "StudentManager"),
    "GuardianManager": ("guardian_manager", "GuardianManager"),
    "GroupManager": ("group_manager", "GroupManager"),
    "ScheduleManager": ("schedule_manager", "ScheduleManager"),
    "AttendanceManager": ("attendance_manager", "AttendanceManager"),
    
    # Academics & Programs
    "ProgramManager": ("program_manager", "ProgramManager"),
    "LevelManager": ("level_manager", "LevelManager"),
    "PricingManager": ("pricing_manager", "PricingManager"),
    "EnrollmentManager": ("enrollment_manager", "EnrollmentManager"),
    
    # Billing, Treasury & Invoicing
    "InvoiceManager": ("invoice_manager", "InvoiceManager"),
    "PaymentManager": ("payment_manager", "PaymentManager"),
    "CashRegisterManager": ("cash_register_manager", "CashRegisterManager"),
    "CashHandoverManager": ("cash_handover_manager", "CashHandoverManager"),
    
    # Expenses & Kitchen Supplies
    "ExpenseCategoryManager": ("expense_manager", "ExpenseCategoryManager"),
    "ExpenseManager": ("expense_manager", "ExpenseManager"),
    "BudgetVarianceManager": ("budget_variance_manager", "BudgetVarianceManager"),
    "DailyBreadLogManager": ("kitchen_procurement_manager", "DailyBreadLogManager"),
    "ProvisionsOrderManager": ("kitchen_procurement_manager", "ProvisionsOrderManager"),
    "KitchenProcurementManager": ("kitchen_procurement_manager", "KitchenProcurementManager"),
    
    # Competitions & HR Payroll
    "CompetitionManager": ("competition_manager", "CompetitionManager"),
    "CompetitionRegistrationManager": ("competition_manager", "CompetitionRegistrationManager"),
    "PayrollManager": ("payroll_manager", "PayrollManager"),
    "PayrollItemManager": ("payroll_manager", "PayrollItemManager"),
    "AuditLogManager": ("audit_log_manager", "AuditLogManager"),
    "AppMetadataManager": ("audit_log_manager", "AppMetadataManager"),
}


def __getattr__(name: str):
    """Dynamically loads managers upon first attribute access."""
    if name in _MANAGER_EXPORTS:
        module_name, class_name = _MANAGER_EXPORTS[name]
        try:
            mod = import_module(f".{module_name}", package=__name__)
            cls = getattr(mod, class_name)
            globals()[name] = cls
            return cls
        except ModuleNotFoundError as e:
            logger.debug(f"Domain manager '{module_name}' is not yet implemented: {e}")
            raise AttributeError(f"Manager '{name}' in module '{module_name}' is not yet created.") from e

    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__():
    return sorted(list(globals().keys()) + list(_MANAGER_EXPORTS.keys()))


# =============================================================================
# FastAPI Dependency Injection Providers
# =============================================================================

def get_database() -> Database:
    """
    FastAPI dependency returning the Database singleton.
    
    Usage:
        @router.get("/status")
        def check_status(db: Database = Depends(get_database)):
            return db.get_archive_view_status()
    """
    return Database()


def get_db() -> Generator:
    """
    FastAPI dependency yielding a pooled database connection with auto-commit/rollback.
    
    Usage:
        @router.get("/students")
        def list_students(conn = Depends(get_db)):
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM students LIMIT 10;")
            return cursor.fetchall()
    """
    db = Database()
    with db.get_db_connection() as conn:
        yield conn


__all__ = [
    "Database",
    "get_database",
    "get_db",
    "active_user_id",
    "log_methods",
    "CustomJSONEncoder",
    "TABLE_IMPORT_ORDER",
    "ARCHIVE_VIEW_FLAG_FILE",
    "HARD_RESET_PASSWORD",
    "get_external_path",
    "logger",
]
