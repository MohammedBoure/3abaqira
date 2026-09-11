"""
backend/database/base/schema_initializer.py
--------------------------------------------
Executes CREATE / INSERT / VIEW / INDEX queries for schema initialization.
Calculates a SHA256 schema fingerprint to bypass redundant checks on subsequent startups.
"""

import hashlib
import logging
import re

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
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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

    def _run_queries(self, cursor, queries: list, label: str, ignore_errors: bool = False) -> None:
        """Executes a list of queries sequentially with clean logging and cross-dialect adaptation."""
        logger.info(f"Executing {label} ({len(queries)} queries)...")
        db_type = getattr(self._cm, "db_type", "sqlite")
        is_sqlite = (db_type == "sqlite")
        is_mysql = (db_type == "mysql")

        for query in queries:
            clean_q = query.strip()
            if not clean_q:
                continue

            if is_sqlite:
                # SQLite view translation: CREATE OR REPLACE VIEW -> DROP VIEW IF EXISTS + CREATE VIEW
                m = re.search(r'CREATE\s+OR\s+REPLACE\s+VIEW\s+(\w+)\s+AS', clean_q, re.IGNORECASE)
                if m:
                    view_name = m.group(1)
                    try:
                        cursor.execute(f"DROP VIEW IF EXISTS {view_name};")
                    except Exception:
                        pass
                    clean_q = re.sub(r'CREATE\s+OR\s+REPLACE\s+VIEW', 'CREATE VIEW', clean_q, flags=re.IGNORECASE)
                clean_q = clean_q.replace("ILIKE", "LIKE")

            elif is_mysql:
                clean_q = clean_q.replace("TIMESTAMPTZ", "DATETIME")
                clean_q = clean_q.replace("JSONB", "JSON")
                clean_q = clean_q.replace("ILIKE", "LIKE")
                clean_q = clean_q.replace("BIGSERIAL PRIMARY KEY", "SERIAL PRIMARY KEY")
                clean_q = re.sub(r'DEFAULT\s+CURRENT_DATE', '', clean_q, flags=re.IGNORECASE)
                clean_q = re.sub(r'CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS', 'CREATE INDEX', clean_q, flags=re.IGNORECASE)
                if re.search(r'ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*NOTHING', clean_q, re.IGNORECASE):
                    clean_q = re.sub(r'ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*NOTHING;?', '', clean_q, flags=re.IGNORECASE)
                    clean_q = re.sub(r'^(\s*)INSERT\s+INTO\b', r'\1INSERT IGNORE INTO', clean_q, flags=re.IGNORECASE)

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
