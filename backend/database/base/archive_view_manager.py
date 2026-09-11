"""
backend/database/base/archive_view_manager.py
----------------------------------------------
Manages "Archive View Mode": Loads a historical ZIP backup into isolated temporary tables
prefixed with ARCHIVE_VIEW_*, redirecting queries to view historical records without altering live data.
"""

import os
import shutil
import logging
import zipfile

from .config import ARCHIVE_VIEW_FLAG_FILE, get_external_path

logger = logging.getLogger("ABAQIRA_SYS")


def _load_pandas():
    try:
        import pandas as pd
        return pd
    except ImportError:
        return None


class ArchiveViewManager:
    """
    Loads archived records from a backup ZIP into ARCHIVE_VIEW_* temporary tables
    in the database, allowing managers and API routes to inspect them seamlessly.
    """

    ARCHIVE_PREFIX = "ARCHIVE_VIEW_"

    def __init__(self, db_connection):
        self._db = db_connection
        self.table_map: dict = {}
        self.is_archive_mode: bool = False

    # ── Activate Archive Mode ────────────────────────────────────────────────
    def activate_archive_view(self, input_zip_path: str) -> tuple:
        """Extracts CSVs from ZIP and creates isolated ARCHIVE_VIEW_* tables."""
        temp_dir = 'temp_view_archive'

        try:
            pd = _load_pandas()
            if pd is None:
                return False, "Pandas library is required for Archive View."

            if self.is_archive_mode:
                return False, "Archive mode is already active. Deactivate first."

            if not os.path.exists(input_zip_path):
                return False, f"Archive file {input_zip_path} not found."

            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            os.makedirs(temp_dir, exist_ok=True)

            with zipfile.ZipFile(input_zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            engine = getattr(self._db, 'engine', None)
            csv_files = [f for f in os.listdir(temp_dir) if f.endswith('.csv')]
            if not csv_files:
                return False, "No CSV data tables found in archive file."

            self.table_map = {}
            for csv_file in csv_files:
                table_base_name = os.path.splitext(csv_file)[0]
                archive_table_name = f"{self.ARCHIVE_PREFIX}{table_base_name}"
                csv_path = os.path.join(temp_dir, csv_file)

                df = pd.read_csv(csv_path, encoding='utf-8')
                if engine is not None:
                    df.to_sql(archive_table_name, con=engine, if_exists='replace', index=False)
                self.table_map[table_base_name] = archive_table_name

            flag_path = get_external_path(ARCHIVE_VIEW_FLAG_FILE)
            with open(flag_path, 'w') as f:
                f.write(input_zip_path)

            self.is_archive_mode = True
            shutil.rmtree(temp_dir)
            logger.info(f"✅ Archive View Mode activated from {input_zip_path}")
            return True, f"Archive View active. Loaded {len(self.table_map)} tables."

        except Exception as e:
            logger.error(f"❌ Failed to activate Archive View: {e}")
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return False, str(e)

    # ── Deactivate Archive Mode ──────────────────────────────────────────────
    def deactivate_archive_view(self) -> tuple:
        """Drops all ARCHIVE_VIEW_* temporary tables and restores standard production routing."""
        try:
            with self._db.get_db_connection() as conn:
                cursor = conn.cursor()
                for archive_table in self.table_map.values():
                    try:
                        cursor.execute(f'DROP TABLE IF EXISTS "{archive_table}" CASCADE;')
                    except Exception:
                        cursor.execute(f"DROP TABLE IF EXISTS `{archive_table}`;")

            flag_path = get_external_path(ARCHIVE_VIEW_FLAG_FILE)
            if os.path.exists(flag_path):
                os.remove(flag_path)

            self.table_map = {}
            self.is_archive_mode = False
            logger.info("✅ Archive View Mode deactivated; production routing restored.")
            return True, "Archive View deactivated successfully."

        except Exception as e:
            logger.error(f"Error deactivating Archive View: {e}")
            return False, str(e)

    # ── Query Routing Helper ─────────────────────────────────────────────────
    def get_table(self, table_name: str) -> str:
        """Returns the archive table name if archive mode is active; otherwise returns original name."""
        if self.is_archive_mode and table_name in self.table_map:
            return self.table_map[table_name]
        return table_name

    def is_archive_view_mode(self) -> bool:
        return self.is_archive_mode

    def get_archive_view_tables(self) -> dict:
        return self.table_map.copy()

    def get_archive_view_status(self) -> dict:
        return {
            "is_active": self.is_archive_mode,
            "tables_loaded": len(self.table_map),
            "tables": list(self.table_map.keys())
        }

    def get_available_archives(self, directory: str = ".") -> list:
        """Lists ZIP backup files available in the specified directory."""
        archives = []
        if os.path.exists(directory):
            for file in os.listdir(directory):
                if file.endswith(".zip") and ("backup" in file.lower() or "archive" in file.lower()):
                    archives.append(os.path.join(directory, file))
        return archives
