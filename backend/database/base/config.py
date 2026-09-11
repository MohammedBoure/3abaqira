"""
backend/database/base/config.py
---------------------------------
Global database and system configuration: UTF-8 console encoding, rotating loggers,
system constants, table dependency order, and custom JSON serializers.
"""

import sys
import codecs
import logging
import os
import json
import time
from datetime import datetime, date
from decimal import Decimal
import uuid
from logging.handlers import RotatingFileHandler


# ─── Force UTF-8 Encoding ────────────────────────────────────────────────────
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')
except (AttributeError, TypeError):
    try:
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
    except Exception as e:
        print(f"Warning: Could not force console to UTF-8. {e}")


# ─── Logging & Path Setup ─────────────────────────────────────────────────────
def get_external_path(filename: str) -> str:
    """Returns absolute file path whether running frozen (PyInstaller) or in development."""
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(os.path.dirname(sys.executable), filename)
    return os.path.join(os.path.abspath("."), filename)


class WindowsSafeRotatingFileHandler(RotatingFileHandler):
    """Prevents permission crashes on Windows when log rotation encounters an open file lock."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._rollover_blocked_until = 0.0

    def shouldRollover(self, record):
        if self._rollover_blocked_until and time.monotonic() < self._rollover_blocked_until:
            return False
        return super().shouldRollover(record)

    def doRollover(self):
        try:
            super().doRollover()
            self._rollover_blocked_until = 0.0
        except PermissionError:
            self._rollover_blocked_until = time.monotonic() + 60.0
            if self.stream is None:
                self.stream = self._open()
            try:
                self.stream.seek(0, os.SEEK_END)
            except OSError:
                pass


# Configure Root & Domain Logger
root_logger = logging.getLogger()
if root_logger.hasHandlers():
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)
        try:
            handler.close()
        except Exception:
            pass

log_file = get_external_path("app.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        WindowsSafeRotatingFileHandler(log_file, maxBytes=3_000_000, backupCount=5, encoding='utf-8')
    ]
)

for noisy_logger in ("urllib3", "charset_normalizer", "uvicorn.access", "sqlalchemy.engine"):
    logging.getLogger(noisy_logger).setLevel(logging.WARNING)

logger = logging.getLogger("ABAQIRA_SYS")


# ─── Table Dependency Order (For Backups & Restores) ─────────────────────────
TABLE_IMPORT_ORDER = [
    # Core Infrastructure & Auth
    'branches',
    'academic_years',
    'classrooms',
    'users',
    
    # Students & Guardians
    'guardians',
    'students',
    'student_guardians',
    
    # Programs, Levels & Pricing
    'programs',
    'levels',
    'pricing_plans',
    
    # Staff & Faculty
    'employees',
    'coach_wage_matrices',
    
    # Groups, Schedules & Sessions
    'groups',
    'group_schedules',
    'completed_sessions',
    'student_attendance',
    
    # Enrollments & Invoices
    'student_enrollments',
    'invoices',
    
    # Treasury & Payments
    'daily_cash_registers',
    'payments',
    'cash_handovers',
    
    # Expenses & Budget
    'expense_categories',
    'expenses',
    'budget_variances',
    
    # Daycare Kitchen & Procurement
    'daily_bread_logs',
    'provisions_orders',
    
    # Competitions
    'competitions',
    'competition_registrations',
    
    # Payroll Runs & Items
    'payroll_runs',
    'payroll_items',
    
    # System Audits
    'audit_logs',
    'AppMetadata'
]

ARCHIVE_VIEW_FLAG_FILE = 'archive_view.flag'

HARD_RESET_PASSWORD = "3abaqiraHardResetPassword2025!"


# ─── Custom JSON Encoder ──────────────────────────────────────────────────────
class CustomJSONEncoder(json.JSONEncoder):
    """Serializes datetime, date, Decimal, and UUID objects cleanly for JSON transport."""

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, uuid.UUID):
            return str(obj)
        return super().default(obj)
