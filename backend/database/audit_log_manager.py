"""
backend/database/audit_log_manager.py
--------------------------------------
Data Access Managers for 'audit_logs' and 'AppMetadata'.
Encapsulates:
  - Enterprise audit logging & historical tracking for all database entities
  - Recording user actions (INSERT, UPDATE, DELETE) with snapshots of old & new states
  - Querying audit trails, recent system activity streams, and administrative telemetry
  - Centralized application metadata & key-value configuration store (AppMetadata)
"""

import json
import logging
from datetime import datetime, date
from typing import List, Dict, Optional, Any, Tuple

from .base.config import CustomJSONEncoder
try:
    from . import active_user_id
except ImportError:
    from contextvars import ContextVar
    active_user_id = ContextVar("active_user_id", default=None)

logger = logging.getLogger("ABAQIRA_SYS")


def _dict_fetchone(cursor) -> Optional[Dict[str, Any]]:
    row = cursor.fetchone()
    if not row:
        return None
    if isinstance(row, dict):
        return row
    cols = [col[0] for col in cursor.description]
    return dict(zip(cols, row))


def _dict_fetchall(cursor) -> List[Dict[str, Any]]:
    rows = cursor.fetchall()
    if not rows:
        return []
    if rows and isinstance(rows[0], dict):
        return rows
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, r)) for r in rows]


def _to_json_param(val: Any) -> Optional[Any]:
    """Prepares value for JSONB / JSON column storage."""
    if val is None:
        return None
    try:
        from psycopg2.extras import Json
        if isinstance(val, (dict, list)):
            return Json(val, dumps=lambda o: json.dumps(o, cls=CustomJSONEncoder))
    except Exception:
        pass
    if isinstance(val, (dict, list)):
        return json.dumps(val, cls=CustomJSONEncoder)
    if isinstance(val, str):
        return val
    return json.dumps(val, cls=CustomJSONEncoder)


def _deserialize_json_fields(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Ensures old_values and new_values are parsed Python dicts/lists if returned as strings."""
    if not row:
        return None
    for k in ("old_values", "new_values"):
        if k in row and isinstance(row[k], str):
            try:
                row[k] = json.loads(row[k])
            except Exception:
                pass
    return row


# =============================================================================
# 1. AUDIT LOG MANAGER
# =============================================================================

class AuditLogManager:
    """
    Manages audit logging, entity modification history, and administrative activity feeds.
    """

    SAFE_COLUMNS = (
        "audit_id, table_name, record_id, action, "
        "old_values, new_values, performed_by, performed_at"
    )

    VALID_ACTIONS = {"INSERT", "UPDATE", "DELETE"}

    def __init__(self, db_instance):
        self.db = db_instance

    def log_event(
        self,
        table_name: str,
        record_id: int,
        action: str,
        old_values: Optional[Any] = None,
        new_values: Optional[Any] = None,
        performed_by: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records an audit log entry for a database modification event.
        """
        clean_action = action.strip().upper()
        if clean_action not in self.VALID_ACTIONS:
            logger.warning(f"Invalid audit action '{action}'. Defaulting to 'UPDATE'.")
            clean_action = "UPDATE"

        actor = performed_by or active_user_id.get() or "SYSTEM"
        old_json = _to_json_param(old_values)
        new_json = _to_json_param(new_values)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO audit_logs (
                        table_name, record_id, action,
                        old_values, new_values, performed_by
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING 
                        audit_id, table_name, record_id, action,
                        old_values, new_values, performed_by, performed_at;
                """
                cursor.execute(
                    query,
                    (
                        table_name.strip(),
                        record_id,
                        clean_action,
                        old_json,
                        new_json,
                        actor,
                    ),
                )
                res = _dict_fetchone(cursor)
                return _deserialize_json_fields(res)
        except Exception as e:
            logger.error(f"Error recording audit log for {table_name} #{record_id}: {e}")
            return None

    def get_all(
        self,
        table_name: Optional[str] = None,
        action: Optional[str] = None,
        performed_by: Optional[str] = None,
        from_date: Optional[Any] = None,
        to_date: Optional[Any] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves paginated audit trail logs with filtering."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT {self.SAFE_COLUMNS}
                    FROM audit_logs
                    WHERE 1=1
                """
                params: List[Any] = []

                if table_name:
                    query += " AND table_name = %s"
                    params.append(table_name.strip())
                if action:
                    query += " AND action = %s"
                    params.append(action.strip().upper())
                if performed_by:
                    query += " AND performed_by ILIKE %s"
                    params.append(f"%{performed_by.strip()}%")
                if from_date:
                    query += " AND performed_at >= %s"
                    params.append(from_date)
                if to_date:
                    query += " AND performed_at <= %s"
                    params.append(to_date)

                query += " ORDER BY audit_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                rows = _dict_fetchall(cursor)
                return [_deserialize_json_fields(r) for r in rows]
        except Exception as e:
            logger.error(f"Error fetching audit logs: {e}")
            return []

    def get_by_id(self, audit_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single audit entry by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM audit_logs WHERE audit_id = %s;"
                cursor.execute(query, (audit_id,))
                res = _dict_fetchone(cursor)
                return _deserialize_json_fields(res)
        except Exception as e:
            logger.error(f"Error fetching audit entry {audit_id}: {e}")
            return None

    def get_by_record(self, table_name: str, record_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves full modification timeline for a specific table record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT {self.SAFE_COLUMNS}
                    FROM audit_logs
                    WHERE table_name = %s AND record_id = %s
                    ORDER BY audit_id DESC
                    LIMIT %s;
                """
                cursor.execute(query, (table_name.strip(), record_id, max(1, limit)))
                rows = _dict_fetchall(cursor)
                return [_deserialize_json_fields(r) for r in rows]
        except Exception as e:
            logger.error(f"Error fetching audit history for {table_name} #{record_id}: {e}")
            return []

    def get_recent(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Returns recent activity entries for admin dashboards."""
        return self.get_all(limit=limit, offset=0)

    def get_stats(self) -> Dict[str, Any]:
        """
        Aggregates operational activity statistics:
        - Total audit events
        - Counts by action (INSERT, UPDATE, DELETE)
        - Top 5 most modified tables
        - Top 5 most active actors
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Action breakdown
                cursor.execute(
                    """
                    SELECT action, COUNT(*) AS count
                    FROM audit_logs
                    GROUP BY action;
                    """
                )
                action_rows = cursor.fetchall()
                action_counts = {"INSERT": 0, "UPDATE": 0, "DELETE": 0}
                total = 0
                for r in action_rows:
                    act = r[0] if isinstance(r, (list, tuple)) else r.get("action")
                    cnt = int(r[1] if isinstance(r, (list, tuple)) else r.get("count"))
                    if act in action_counts:
                        action_counts[act] = cnt
                    total += cnt

                # Top tables
                cursor.execute(
                    """
                    SELECT table_name, COUNT(*) AS count
                    FROM audit_logs
                    GROUP BY table_name
                    ORDER BY count DESC
                    LIMIT 5;
                    """
                )
                table_rows = cursor.fetchall()
                top_tables = [
                    {
                        "table_name": r[0] if isinstance(r, (list, tuple)) else r.get("table_name"),
                        "count": int(r[1] if isinstance(r, (list, tuple)) else r.get("count")),
                    }
                    for r in table_rows
                ]

                # Top actors
                cursor.execute(
                    """
                    SELECT performed_by, COUNT(*) AS count
                    FROM audit_logs
                    GROUP BY performed_by
                    ORDER BY count DESC
                    LIMIT 5;
                    """
                )
                actor_rows = cursor.fetchall()
                top_actors = [
                    {
                        "performed_by": r[0] if isinstance(r, (list, tuple)) else r.get("performed_by"),
                        "count": int(r[1] if isinstance(r, (list, tuple)) else r.get("count")),
                    }
                    for r in actor_rows
                ]

                return {
                    "total_events": total,
                    "action_counts": action_counts,
                    "top_tables": top_tables,
                    "top_actors": top_actors,
                }
        except Exception as e:
            logger.error(f"Error computing audit stats: {e}")
            return {
                "total_events": 0,
                "action_counts": {"INSERT": 0, "UPDATE": 0, "DELETE": 0},
                "top_tables": [],
                "top_actors": [],
            }


# =============================================================================
# 2. APPLICATION METADATA MANAGER
# =============================================================================

DEFAULT_APP_METADATA = {
    "academy_name_ar": "أكاديمية العباقرة للتعليم والحساب الذهني",
    "academy_name_en": "3abaqira Academy for Education & Mental Arithmetic",
    "system_version": "1.0.0",
    "currency": "DZD",
    "country": "Algeria",
    "timezone": "Africa/Algiers",
    "default_academic_year": "2026-2027",
    "maintenance_mode": "false",
}


class AppMetadataManager:
    """
    Manages key-value system configuration and branding parameters in AppMetadata.
    """

    SAFE_COLUMNS = "meta_key, meta_value, updated_at"

    def __init__(self, db_instance):
        self.db = db_instance

    def get(self, meta_key: str, default: Optional[str] = None) -> Optional[str]:
        """Retrieves raw meta_value string for a given key, or default if not set."""
        rec = self.get_by_key(meta_key)
        if rec and rec.get("meta_value") is not None:
            return rec["meta_value"]
        return default

    def get_by_key(self, meta_key: str) -> Optional[Dict[str, Any]]:
        """Retrieves full metadata entry {meta_key, meta_value, updated_at}."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM AppMetadata WHERE meta_key = %s;"
                cursor.execute(query, (meta_key.strip(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching metadata key '{meta_key}': {e}")
            return None

    def get_all(self) -> Dict[str, str]:
        """Retrieves all metadata as a convenient {key: value} mapping."""
        records = self.get_all_records()
        return {r["meta_key"]: r["meta_value"] for r in records}

    def get_all_records(self) -> List[Dict[str, Any]]:
        """Retrieves all metadata entries as a list of records."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM AppMetadata ORDER BY meta_key ASC;"
                cursor.execute(query)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching all metadata records: {e}")
            return []

    def set(self, meta_key: str, meta_value: str) -> Optional[Dict[str, Any]]:
        """
        Upserts a metadata key-value pair.
        """
        clean_key = meta_key.strip()
        str_val = str(meta_value)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO AppMetadata (meta_key, meta_value, updated_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (meta_key) DO UPDATE
                    SET meta_value = EXCLUDED.meta_value,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING meta_key, meta_value, updated_at;
                """
                cursor.execute(query, (clean_key, str_val))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error setting metadata key '{clean_key}': {e}")
            return None

    def bulk_set(self, items: Dict[str, str]) -> Dict[str, str]:
        """
        Upserts multiple metadata keys in a single transaction.
        """
        results = {}
        if not items:
            return results

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                for k, v in items.items():
                    query = """
                        INSERT INTO AppMetadata (meta_key, meta_value, updated_at)
                        VALUES (%s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (meta_key) DO UPDATE
                        SET meta_value = EXCLUDED.meta_value,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING meta_key, meta_value;
                    """
                    cursor.execute(query, (k.strip(), str(v)))
                    row = _dict_fetchone(cursor)
                    if row:
                        results[row["meta_key"]] = row["meta_value"]
                conn.commit()
            return results
        except Exception as e:
            logger.error(f"Error in bulk_set metadata: {e}")
            return results

    def delete(self, meta_key: str) -> bool:
        """Deletes a metadata key."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM AppMetadata WHERE meta_key = %s;", (meta_key.strip(),))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting metadata key '{meta_key}': {e}")
            return False

    def initialize_defaults(self) -> None:
        """Ensures core system metadata defaults are seeded if absent."""
        current_keys = set(self.get_all().keys())
        missing = {k: v for k, v in DEFAULT_APP_METADATA.items() if k not in current_keys}
        if missing:
            self.bulk_set(missing)
            logger.info(f"Seeded {len(missing)} default AppMetadata keys.")
