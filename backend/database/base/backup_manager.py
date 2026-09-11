"""
backend/database/base/backup_manager.py
----------------------------------------
Enterprise Database Backup, Restore, and Archiving Engine.
Supports CSV/ZIP and Excel export/import, differential archiving, and table purging.
"""

import os
import shutil
import logging
import zipfile
from datetime import date, timedelta

from .config import TABLE_IMPORT_ORDER

logger = logging.getLogger("ABAQIRA_SYS")


def _load_pandas():
    try:
        import pandas as pd
        return pd
    except ImportError:
        logger.warning("Pandas is not installed. Backup/restore routines requiring DataFrame operations will be unavailable.")
        return None


def _load_numpy():
    try:
        import numpy as np
        return np
    except ImportError:
        return None


class BackupManager:
    """
    Provides comprehensive database backup, restore, and table pruning capabilities:
      - backup_database_csv        -> Full export to ZIP containing CSVs
      - restore_database_csv       -> Full restore from ZIP containing CSVs
      - export_to_excel            -> Export database tables into an Excel workbook
      - restore_from_excel         -> Import tables from an Excel workbook
      - export_and_purge_tables    -> Archives and purges historical records older than X days
      - restore_table_from_file    -> Restores an individual table from a CSV file
    """

    def __init__(self, db_connection):
        self._db = db_connection

    # ── CSV / ZIP Backup ──────────────────────────────────────────────────────
    def backup_database_csv(self, output_zip_path: str = 'backup_csv.zip') -> tuple:
        """Exports all registered tables to individual CSV files and compresses into a ZIP archive."""
        temp_dir = 'temp_backup_csv'
        try:
            pd = _load_pandas()
            if pd is None:
                return False, "Pandas library is required for CSV backup."

            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            os.makedirs(temp_dir, exist_ok=True)

            engine = getattr(self._db, 'engine', None)
            if engine is None:
                return False, "Active SQLAlchemy engine is required for data export."

            for table_name in TABLE_IMPORT_ORDER:
                try:
                    df = pd.read_sql_table(table_name, con=engine)
                    csv_path = os.path.join(temp_dir, f"{table_name}.csv")
                    df.to_csv(csv_path, index=False, encoding='utf-8')
                except Exception as table_err:
                    logger.warning(f"Notice exporting table {table_name}: {table_err}")

            with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(temp_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        zipf.write(file_path, arcname=file)

            shutil.rmtree(temp_dir)
            logger.info(f"✅ Full backup archive created successfully: {output_zip_path}")
            return True, f"Backup successfully created at {output_zip_path}"

        except Exception as e:
            logger.error(f"❌ Backup failed: {e}")
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return False, str(e)

    # ── CSV / ZIP Restore ─────────────────────────────────────────────────────
    def restore_database_csv(self, input_zip_path: str) -> tuple:
        """Restores database tables from a compressed ZIP archive of CSV files."""
        temp_dir = 'temp_restore_csv'
        try:
            pd = _load_pandas()
            if pd is None:
                return False, "Pandas library is required for CSV restore."

            if not os.path.exists(input_zip_path):
                return False, f"Backup file {input_zip_path} not found."

            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            os.makedirs(temp_dir, exist_ok=True)

            with zipfile.ZipFile(input_zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            engine = getattr(self._db, 'engine', None)
            if engine is None:
                return False, "Active SQLAlchemy engine is required for data restore."

            # Restore tables respecting dependency order
            for table_name in TABLE_IMPORT_ORDER:
                csv_path = os.path.join(temp_dir, f"{table_name}.csv")
                if os.path.exists(csv_path):
                    try:
                        df = pd.read_csv(csv_path, encoding='utf-8')
                        df.to_sql(table_name, con=engine, if_exists='append', index=False)
                        logger.info(f"Restored table: {table_name}")
                    except Exception as rest_err:
                        logger.warning(f"Notice restoring table {table_name}: {rest_err}")

            shutil.rmtree(temp_dir)
            return True, "Database successfully restored from archive."

        except Exception as e:
            logger.error(f"❌ Restore failed: {e}")
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
            return False, str(e)

    # ── Excel Export / Import ─────────────────────────────────────────────────
    def export_to_excel(self, output_excel_path: str = 'database_export.xlsx') -> tuple:
        """Exports all key tables to separate sheets in a single Excel workbook."""
        try:
            pd = _load_pandas()
            if pd is None:
                return False, "Pandas is required for Excel export."

            engine = getattr(self._db, 'engine', None)
            if engine is None:
                return False, "Active SQLAlchemy engine is required."

            with pd.ExcelWriter(output_excel_path, engine='openpyxl') as writer:
                for table_name in TABLE_IMPORT_ORDER:
                    try:
                        df = pd.read_sql_table(table_name, con=engine)
                        # Excel sheet names max 31 chars
                        sheet_name = table_name[:31]
                        df.to_excel(writer, sheet_name=sheet_name, index=False)
                    except Exception:
                        pass

            return True, f"Data exported successfully to {output_excel_path}"
        except Exception as e:
            return False, str(e)

    def restore_from_excel(self, input_excel_path: str) -> tuple:
        """Restores tables from sheets in an Excel workbook."""
        try:
            pd = _load_pandas()
            if pd is None:
                return False, "Pandas is required for Excel restore."

            engine = getattr(self._db, 'engine', None)
            if engine is None:
                return False, "Active SQLAlchemy engine is required."

            excel_file = pd.ExcelFile(input_excel_path)
            for sheet_name in excel_file.sheet_names:
                df = excel_file.parse(sheet_name)
                df.to_sql(sheet_name, con=engine, if_exists='append', index=False)

            return True, "Data successfully restored from Excel workbook."
        except Exception as e:
            return False, str(e)

    # ── Historical Purge & Single Table Restore ───────────────────────────────
    def export_and_purge_tables(self, output_zip_path: str, days_to_keep: int = 365) -> tuple:
        """Archives and purges historical records older than days_to_keep threshold."""
        try:
            success, msg = self.backup_database_csv(output_zip_path)
            if not success:
                return False, f"Archival backup failed, purge aborted: {msg}"

            cutoff_date = date.today() - timedelta(days=days_to_keep)
            with self._db.get_db_connection() as conn:
                cursor = conn.cursor()
                # Purge historical sessions and audit logs older than cutoff
                cursor.execute("DELETE FROM audit_logs WHERE performed_at < %s;", (cutoff_date,))
                logger.info(f"Purged historical audit logs older than {cutoff_date}")

            return True, f"Historical records purged up to {cutoff_date}. Archive saved to {output_zip_path}"
        except Exception as e:
            return False, str(e)

    def restore_table_from_file(self, table_name: str, file_path: str) -> tuple:
        """Imports an individual CSV or Excel file into the specified database table."""
        try:
            pd = _load_pandas()
            if pd is None:
                return False, "Pandas library is required."

            engine = getattr(self._db, 'engine', None)
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path, encoding='utf-8')
            elif file_path.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file_path)
            else:
                return False, "Unsupported file format (must be .csv or .xlsx)."

            df.to_sql(table_name, con=engine, if_exists='append', index=False)
            return True, f"Table {table_name} populated successfully from {file_path}"
        except Exception as e:
            return False, str(e)

    # Aliases for compatibility
    def export_all_tables_to_csv_zip(self, output_zip_path: str = 'backup_csv.zip'):
        return self.backup_database_csv(output_zip_path)

    def restore_from_archive_zip_destructive(self, input_zip_path: str, tables_to_restore=None):
        return self.restore_database_csv(input_zip_path)
