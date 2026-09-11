"""
backend/database/base/schema_initializer.py
--------------------------------------------
Executes CREATE / INSERT / VIEW / INDEX queries for schema initialization.
Calculates a SHA256 schema fingerprint to bypass redundant checks on subsequent startups.
"""

import hashlib
import logging

from .tables import ALL_SCHEMA_QUERIES
from .views_indexes import VIEW_QUERIES, INDEX_QUERIES

logger = logging.getLogger("ABAQIRA_SYS")

SCHEMA_FINGERPRINT_KEY = "schema_fingerprint"


class SchemaInitializer:
    """Executes and manages full schema initialization on the provided ConnectionManager."""

    def __init__(self, connection_manager):
        self._cm = connection_manager

    def initialize(self, force: bool = False) -> None:
        """Runs initialization queries if schema fingerprint has changed or force=True."""
        try:
            fingerprint = self._schema_fingerprint()
            with self._cm.get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Check if current schema already matches fingerprint
                if not force and self._is_schema_current(cursor, fingerprint):
                    self._create_default_admin(cursor)
                    logger.info("⚡ Database schema already current; skipped startup DDL checks.")
                    return

                logger.info("🔄 Applying schema migrations and updates...")
                self._run_queries(cursor, ALL_SCHEMA_QUERIES, "Schema Tables")
                self._run_queries(cursor, VIEW_QUERIES, "Reporting Views")
                self._run_queries(cursor, INDEX_QUERIES, "Performance Indexes", ignore_errors=True)

                self._create_default_admin(cursor)
                self._store_schema_fingerprint(cursor, fingerprint)

                logger.info("✅ Database schema initialized successfully.")

        except Exception as err:
            logger.error(f"❌ Failed to initialize schema: {err}")

    @staticmethod
    def _schema_fingerprint() -> str:
        """Computes SHA256 checksum of all combined schema and view definitions."""
        payload = "\n".join(ALL_SCHEMA_QUERIES + VIEW_QUERIES + INDEX_QUERIES)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def _is_schema_current(self, cursor, fingerprint: str) -> bool:
        """Returns True if the stored database fingerprint equals the current code fingerprint."""
        try:
            self._ensure_metadata_table(cursor)
            cursor.execute(
                "SELECT meta_value FROM AppMetadata WHERE meta_key = %s;",
                (SCHEMA_FINGERPRINT_KEY,)
            )
            row = cursor.fetchone()
            if row:
                stored = row[0] if isinstance(row, (list, tuple)) else row.get('meta_value')
                return stored == fingerprint
            return False
        except Exception as e:
            logger.warning(f"Could not verify schema fingerprint: {e}")
            return False

    @staticmethod
    def _ensure_metadata_table(cursor) -> None:
        """Ensures the AppMetadata table exists for tracking schema state and version."""
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS AppMetadata (
                meta_key VARCHAR(100) PRIMARY KEY,
                meta_value TEXT NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """
        )

    @staticmethod
    def _store_schema_fingerprint(cursor, fingerprint: str) -> None:
        """Records current schema fingerprint in AppMetadata."""
        try:
            cursor.execute(
                """
                INSERT INTO AppMetadata (meta_key, meta_value, updated_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (meta_key) DO UPDATE
                SET meta_value = EXCLUDED.meta_value,
                    updated_at = CURRENT_TIMESTAMP;
                """,
                (SCHEMA_FINGERPRINT_KEY, fingerprint)
            )
        except Exception:
            # Fallback for databases without ON CONFLICT (e.g. MySQL / SQLite)
            cursor.execute(
                "REPLACE INTO AppMetadata (meta_key, meta_value) VALUES (%s, %s);",
                (SCHEMA_FINGERPRINT_KEY, fingerprint)
            )

    @staticmethod
    def _run_queries(cursor, queries: list, label: str, ignore_errors: bool = False) -> None:
        """Executes a list of queries sequentially with clean logging."""
        logger.info(f"Executing {label} ({len(queries)} queries)...")
        for query in queries:
            clean_q = query.strip()
            if not clean_q:
                continue
            try:
                cursor.execute(clean_q)
                if hasattr(cursor, 'nextset'):
                    while cursor.nextset():
                        pass
            except Exception as err:
                if ignore_errors:
                    continue
                logger.warning(f"{label} execution warning (safe to ignore if existing): {err}")

    def _create_default_admin(self, cursor) -> None:
        """Provisions default administrative employee or user record if missing."""
        try:
            cursor.execute(
                """
                INSERT INTO employees (
                    branch_id, employee_code, full_name, role, compensation_model, base_salary, is_active
                ) VALUES (
                    'CENTER', 'EMP-ADMIN-001', 'مدير النظام (Admin)', 'ADMIN', 'FIXED_MONTHLY', 0.00, TRUE
                )
                ON CONFLICT (employee_code) DO NOTHING;
                """
            )
        except Exception as e:
            logger.warning(f"Default admin employee setup note: {e}")
