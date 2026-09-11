"""
backend/database/base/base.py
------------------------------
Backward-Compatibility Shim.
Re-exports the core Database singleton and configuration primitives so that imports
from either `backend.database.base` or `backend.database.base.base` resolve cleanly.
"""

from .database import Database
from .config import (
    get_external_path,
    TABLE_IMPORT_ORDER,
    ARCHIVE_VIEW_FLAG_FILE,
    HARD_RESET_PASSWORD,
    CustomJSONEncoder,
    logger,
)

__all__ = [
    "Database",
    "CustomJSONEncoder",
    "TABLE_IMPORT_ORDER",
    "ARCHIVE_VIEW_FLAG_FILE",
    "HARD_RESET_PASSWORD",
    "get_external_path",
    "logger",
]
