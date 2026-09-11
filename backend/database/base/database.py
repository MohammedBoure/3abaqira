"""
backend/database/base/database.py
----------------------------------
Central Database Singleton coordinating:
  ┌─ ConnectionManager   -> Connection Pooling & SQLAlchemy Engine
  ├─ SchemaInitializer   -> Schema migration & fingerprinted DDL execution
  ├─ BackupManager       -> CSV/ZIP/Excel backups, restores & table purging
  └─ ArchiveViewManager  -> Non-destructive historical archive inspection mode
"""

import logging

from .config import (
    TABLE_IMPORT_ORDER,
    ARCHIVE_VIEW_FLAG_FILE,
    HARD_RESET_PASSWORD,
    CustomJSONEncoder,
)
from .connection import ConnectionManager, load_db_config, ensure_database_exists
from .schema_initializer import SchemaInitializer
from .backup_manager import BackupManager
from .archive_view_manager import ArchiveViewManager

logger = logging.getLogger("ABAQIRA_SYS")


class Database:
    """
    Central Database Singleton for the enterprise application.
    Guarantees a single coordinated connection pool, engine, and schema manager.
    """

    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization if already initialized
        if hasattr(self, '_initialized') and self._initialized:
            return

        db_config = load_db_config()
        ensure_database_exists(db_config)

        # ── Core Sub-Managers ────────────────────────────────────────────────
        self._conn_mgr = ConnectionManager(db_config)
        self._schema = SchemaInitializer(self._conn_mgr)
        self._backup = BackupManager(self._conn_mgr)
        self._archive = ArchiveViewManager(self._conn_mgr)

        # Direct engine exposure for ORM/Pydantic/Pandas integration
        self.engine = self._conn_mgr.engine

        # Initialize schema and seed data
        self._schema.initialize()
        self._initialized = True

    # =========================================================================
    # Connection Interface
    # =========================================================================
    def get_db_connection(self):
        """Context manager yielding a pooled connection with auto-commit/rollback."""
        return self._conn_mgr.get_db_connection()

    def get_raw_connection(self):
        """Raw connection checkout from pool. Caller must release with release_connection()."""
        return self._conn_mgr.get_raw_connection()

    def release_connection(self, conn):
        """Returns connection to pool."""
        self._conn_mgr.release_connection(conn)

    # =========================================================================
    # Backup & Purge Interface
    # =========================================================================
    def backup_database_csv(self, output_zip_path='backup_csv.zip'):
        return self._backup.backup_database_csv(output_zip_path)

    def restore_database_csv(self, input_zip_path):
        return self._backup.restore_database_csv(input_zip_path)

    def export_and_purge_tables(self, output_zip_path, days_to_keep=365):
        return self._backup.export_and_purge_tables(output_zip_path, days_to_keep)

    def restore_table_from_file(self, table_name, file_path):
        return self._backup.restore_table_from_file(table_name, file_path)

    def export_all_tables_to_csv_zip(self, output_zip_path='backup_csv.zip'):
        return self._backup.backup_database_csv(output_zip_path)

    def restore_from_archive_zip_destructive(self, input_zip_path, tables_to_restore=None):
        return self._backup.restore_database_csv(input_zip_path)

    # =========================================================================
    # Archive Mode Interface
    # =========================================================================
    def activate_archive_view(self, input_zip_path):
        return self._archive.activate_archive_view(input_zip_path)

    def deactivate_archive_view(self):
        return self._archive.deactivate_archive_view()

    def get_table(self, table_name):
        return self._archive.get_table(table_name)

    def is_archive_view_mode(self):
        return self._archive.is_archive_view_mode()

    def get_archive_view_tables(self):
        return self._archive.get_archive_view_tables()

    def get_archive_view_status(self):
        return self._archive.get_archive_view_status()

    def get_available_archives(self):
        return self._archive.get_available_archives()

    # =========================================================================
    # Hard Reset & Database Clearing
    # =========================================================================
    def hard_reset_database(self, password: str) -> tuple:
        """Destructively clears all tables and views, re-running complete DDL migration."""
        if password != HARD_RESET_PASSWORD:
            return False, "Incorrect authorization password. Hard reset aborted."

        try:
            with self.get_db_connection() as conn:
                cursor = conn.cursor()
                # Disable FK checks during drop
                try:
                    cursor.execute("SET session_replication_role = 'replica';")  # PostgreSQL
                except Exception:
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")                # MySQL

                # Drop views
                cursor.execute("""
                    DO $$ DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
                            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                        END LOOP;
                        FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = current_schema()) LOOP
                            EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE';
                        END LOOP;
                    END $$;
                """)

                try:
                    cursor.execute("SET session_replication_role = 'origin';")
                except Exception:
                    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
                conn.commit()

            self._schema.initialize(force=True)
            return True, "Database successfully reset and re-initialized."
        except Exception as e:
            logger.error(f"Error during hard reset: {e}")
            return False, f"Hard reset error: {e}"

    def truncate_all_tables(self, password: str) -> tuple:
        return self.hard_reset_database(password)
