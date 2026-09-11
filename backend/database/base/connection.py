"""
backend/database/base/connection.py
------------------------------------
Connection Manager supporting Connection Pooling (PostgreSQL / MySQL / SQLite) and SQLAlchemy Engine.
Provides thread-safe connection context managers with auto-commit/rollback semantics.
Includes transparent SQLite compatibility layer and automatic development fallback
when external database engines are unreachable.
"""

import os
import re
import sqlite3
import logging
import urllib.parse
from typing import Optional, Any, Dict
from contextlib import contextmanager
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        pass

from .config import get_external_path

logger = logging.getLogger("ABAQIRA_SYS")


# =============================================================================
# SQLITE COMPATIBILITY WRAPPERS
# =============================================================================

class SQLiteCompatCursor:
    """
    Wraps sqlite3.Cursor to provide psycopg2-compatible parameter placeholder
    translation (%s -> ?), ILIKE -> LIKE mapping, and standard row description.
    """

    def __init__(self, cur: sqlite3.Cursor):
        self._cur = cur

    def execute(self, sql: str, params: Optional[Any] = None):
        cleaned_sql = sql.replace("ILIKE", "LIKE")
        if params is not None:
            # Substitute %s with ? for SQLite qmark parameter style
            cleaned_sql = re.sub(r'(?<!%)(?:%%)*%s', '?', cleaned_sql)
            return self._cur.execute(cleaned_sql, params)
        return self._cur.execute(cleaned_sql)

    def executemany(self, sql: str, seq_of_params):
        cleaned_sql = re.sub(r'(?<!%)(?:%%)*%s', '?', sql.replace("ILIKE", "LIKE"))
        return self._cur.executemany(cleaned_sql, seq_of_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def fetchmany(self, size: Optional[int] = None):
        return self._cur.fetchmany(size) if size else self._cur.fetchmany()

    @property
    def description(self):
        return self._cur.description

    @property
    def rowcount(self):
        return self._cur.rowcount

    def close(self):
        self._cur.close()

    def __getattr__(self, name):
        return getattr(self._cur, name)


class SQLiteCompatConnection:
    """
    Wraps sqlite3.Connection with auto-commit/rollback semantics and
    custom functions for PostgreSQL compatibility (e.g. TO_CHAR).
    """

    def __init__(self, conn: sqlite3.Connection):
        self._conn = conn

    def cursor(self):
        return SQLiteCompatCursor(self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


# =============================================================================
# MYSQL COMPATIBILITY WRAPPERS
# =============================================================================

class MySQLCompatCursor:
    """
    Wraps mysql.connector cursor to provide cross-dialect compatibility:
    - Maps ILIKE -> LIKE (MySQL UTF-8 collation is case-insensitive by default)
    - Translates ON CONFLICT clauses (DO NOTHING -> INSERT IGNORE, DO UPDATE SET -> ON DUPLICATE KEY UPDATE)
    - Emulates the RETURNING clause for INSERT and UPDATE statements
    - Replaces PostgreSQL TIMESTAMPTZ keywords with DATETIME
    """
    _pk_cache: Dict[str, str] = {}

    def __init__(self, cur, conn=None):
        self._cur = cur
        self._conn = conn

    def _get_primary_key(self, table_name: str) -> str:
        clean_table = table_name.strip('`" ')
        if clean_table in MySQLCompatCursor._pk_cache:
            return MySQLCompatCursor._pk_cache[clean_table]
        try:
            self._cur.execute(f"SHOW KEYS FROM `{clean_table}` WHERE Key_name = 'PRIMARY';")
            row = self._cur.fetchone()
            pk = row[4] if row else f"{clean_table.rstrip('s')}_id"
        except Exception:
            pk = f"{clean_table.rstrip('s')}_id"
        MySQLCompatCursor._pk_cache[clean_table] = pk
        return pk

    def _adapt_sql(self, sql: str) -> str:
        cleaned = sql.replace("ILIKE", "LIKE")
        cleaned = cleaned.replace("TIMESTAMPTZ", "DATETIME")
        if re.search(r'ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*NOTHING', cleaned, re.IGNORECASE):
            cleaned = re.sub(r'ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*NOTHING;?', '', cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r'^(\s*)INSERT\s+INTO\b', r'\1INSERT IGNORE INTO', cleaned, flags=re.IGNORECASE)
        elif re.search(r'ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*UPDATE\s+SET', cleaned, re.IGNORECASE):
            cleaned = re.sub(r'ON\s+CONFLICT\s*\([^)]*\)\s*DO\s*UPDATE\s+SET', 'ON DUPLICATE KEY UPDATE', cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r'EXCLUDED\.(\w+)', r'VALUES(\1)', cleaned, flags=re.IGNORECASE)
        return cleaned

    def execute(self, sql: str, params: Optional[Any] = None):
        cleaned_sql = self._adapt_sql(sql)
        ret_match = re.search(r'\s+RETURNING\s+(.*?)(?:;|\s*$)', cleaned_sql, re.IGNORECASE)
        if not ret_match:
            if params is not None:
                return self._cur.execute(cleaned_sql, params)
            return self._cur.execute(cleaned_sql)

        ret_clause = ret_match.group(1).strip()
        sql_without_ret = cleaned_sql[:ret_match.start()].strip()
        if not sql_without_ret.endswith(';'):
            sql_without_ret += ';'

        if params is not None:
            self._cur.execute(sql_without_ret, params)
        else:
            self._cur.execute(sql_without_ret)

        # Emulate RETURNING for INSERT
        ins_match = re.search(r'^\s*INSERT\s+(?:IGNORE\s+)?INTO\s+([`"\w]+)', sql_without_ret, re.IGNORECASE)
        if ins_match:
            table_name = ins_match.group(1).strip('`"')
            last_id = self._cur.lastrowid
            pk_col = self._get_primary_key(table_name)
            if last_id:
                select_sql = f"SELECT {ret_clause} FROM `{table_name}` WHERE `{pk_col}` = %s;"
                return self._cur.execute(select_sql, (last_id,))
            else:
                cols_match = re.search(r'\(([^)]+)\)\s*VALUES', sql_without_ret, re.IGNORECASE)
                if cols_match and params and pk_col:
                    cols = [c.strip().strip('`"') for c in cols_match.group(1).split(',')]
                    if pk_col in cols:
                        idx = cols.index(pk_col)
                        pk_val = params[idx]
                        select_sql = f"SELECT {ret_clause} FROM `{table_name}` WHERE `{pk_col}` = %s;"
                        return self._cur.execute(select_sql, (pk_val,))
            return

        # Emulate RETURNING for UPDATE
        upd_match = re.search(r'^\s*UPDATE\s+([`"\w]+)', sql_without_ret, re.IGNORECASE)
        where_match = re.search(r'\s+WHERE\s+(.*?)(?:;|\s*$)', sql_without_ret, re.IGNORECASE)
        if upd_match and where_match:
            table_name = upd_match.group(1).strip('`"')
            where_clause = where_match.group(1).strip()
            before_where = sql_without_ret[:where_match.start()]
            set_placeholders = len(re.findall(r'(?<!%)(?:%%)*%s', before_where))
            where_params = params[set_placeholders:] if params else ()
            select_sql = f"SELECT {ret_clause} FROM `{table_name}` WHERE {where_clause};"
            return self._cur.execute(select_sql, where_params)

    def executemany(self, sql: str, seq_of_params):
        cleaned_sql = self._adapt_sql(sql)
        return self._cur.executemany(cleaned_sql, seq_of_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def fetchmany(self, size: Optional[int] = None):
        return self._cur.fetchmany(size) if size else self._cur.fetchmany()

    @property
    def description(self):
        return self._cur.description

    @property
    def rowcount(self):
        return self._cur.rowcount

    @property
    def lastrowid(self):
        return self._cur.lastrowid

    def close(self):
        self._cur.close()

    def __getattr__(self, name):
        return getattr(self._cur, name)


class MySQLCompatConnection:
    """
    Wraps mysql.connector Connection with thread-safe auto-commit/rollback semantics,
    returning MySQLCompatCursor for seamless cross-dialect operations.
    """

    def __init__(self, conn):
        self._conn = conn

    def cursor(self, **kwargs):
        kwargs.pop('dictionary', None)
        return MySQLCompatCursor(self._conn.cursor(dictionary=False, **kwargs), conn=self._conn)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __getattr__(self, name):
        return getattr(self._conn, name)


# =============================================================================
# CENTRAL CONNECTION MANAGER
# =============================================================================

class ConnectionManager:
    """
    Manages connection pooling and the underlying SQLAlchemy Engine.
    Used internally by the central Database singleton.
    """

    _pool = None
    _engine = None

    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.db_type = db_config.get('type', 'sqlite').lower()
        self._init_pool()
        self._init_engine()

    # ── Connection Pool Initialization ────────────────────────────────────────
    def _init_pool(self) -> None:
        if ConnectionManager._pool is not None:
            return

        try:
            if self.db_type in ('postgresql', 'postgres'):
                try:
                    import psycopg2
                    from psycopg2 import pool as pg_pool
                    ConnectionManager._pool = pg_pool.ThreadedConnectionPool(
                        minconn=2,
                        maxconn=20,
                        host=self.db_config.get('host', 'localhost'),
                        port=self.db_config.get('port', 5432),
                        user=self.db_config.get('user', 'postgres'),
                        password=self.db_config.get('password', ''),
                        database=self.db_config.get('database', 'abaqira_db'),
                        connect_timeout=3,
                    )
                    logger.info("🚀 PostgreSQL ThreadedConnectionPool initialized successfully.")
                except ImportError:
                    logger.warning("psycopg2 not directly installed; delegating pool to SQLAlchemy Engine.")
                    ConnectionManager._pool = "SQLALCHEMY_DELEGATED"
                except Exception as conn_err:
                    logger.warning(
                        f"⚠️ PostgreSQL server unreachable ({conn_err}). "
                        f"Switching to local SQLite development database."
                    )
                    self._fallback_to_sqlite()

            elif self.db_type == 'mysql':
                import mysql.connector
                from mysql.connector import pooling
                conn_cfg = {k: v for k, v in self.db_config.items() if k not in ('type', 'url')}
                conn_cfg.setdefault('charset', 'utf8mb4')
                conn_cfg.setdefault('collation', 'utf8mb4_unicode_ci')
                conn_cfg.setdefault('use_unicode', True)
                ConnectionManager._pool = pooling.MySQLConnectionPool(
                    pool_name="abaqira_pool",
                    pool_size=10,
                    pool_reset_session=True,
                    use_pure=True,
                    **conn_cfg
                )
                logger.info("🚀 MySQL Connection Pool initialized successfully.")

            elif self.db_type == 'sqlite':
                ConnectionManager._pool = "SQLITE_DIRECT"
                logger.info("🚀 SQLite database engine initialized.")

            else:
                ConnectionManager._pool = "SQLALCHEMY_DELEGATED"

        except Exception as e:
            logger.warning(f"Connection Pool notice: {e}; falling back to SQLite.")
            self._fallback_to_sqlite()

    def _fallback_to_sqlite(self) -> None:
        """Gracefully switches the active connection manager to SQLite mode."""
        self.db_type = 'sqlite'
        sqlite_file = self.db_config.get('database')
        if not sqlite_file or not str(sqlite_file).endswith(('.db', '.sqlite')):
            self.db_config['database'] = get_external_path('3abaqira_dev.db')
        ConnectionManager._pool = "SQLITE_DIRECT"
        logger.info(f"✅ Active database switched to SQLite: '{self.db_config['database']}'")

    # ── SQLAlchemy Engine Initialization ──────────────────────────────────────
    def _init_engine(self) -> None:
        if ConnectionManager._engine is not None:
            self.engine = ConnectionManager._engine
            return

        if self.db_type == 'sqlite':
            try:
                from sqlalchemy import create_engine
                db_path = self.db_config.get('database', get_external_path('3abaqira_dev.db'))
                ConnectionManager._engine = create_engine(
                    f"sqlite:///{db_path}",
                    connect_args={"check_same_thread": False},
                )
                self.engine = ConnectionManager._engine
            except Exception:
                self.engine = None
            return

        try:
            from sqlalchemy import create_engine

            db_url = self.db_config.get('url')
            if not db_url:
                pw = urllib.parse.quote_plus(self.db_config.get('password', ''))
                user = self.db_config.get('user', 'postgres')
                host = self.db_config.get('host', 'localhost')
                port = self.db_config.get('port', 5432)
                db_name = self.db_config.get('database', 'abaqira')

                if self.db_type in ('postgresql', 'postgres'):
                    db_url = f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{db_name}"
                else:
                    db_url = f"mysql+mysqlconnector://{user}:{pw}@{host}:{port}/{db_name}?charset=utf8mb4"

            ConnectionManager._engine = create_engine(
                db_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
            self.engine = ConnectionManager._engine
            logger.info("🚀 SQLAlchemy Engine initialized successfully.")
        except Exception as e:
            logger.warning(f"SQLAlchemy Engine warning: {e}")
            self.engine = None

    # ── Context Manager & Raw Connections ─────────────────────────────────────
    @contextmanager
    def get_db_connection(self):
        """Context manager yielding a pooled connection with auto-commit and auto-rollback."""
        conn = None
        try:
            conn = self.get_raw_connection()
            yield conn
            if hasattr(conn, 'commit'):
                conn.commit()
        except Exception as err:
            logger.error(f"Database error encountered: {err}")
            if conn and hasattr(conn, 'rollback'):
                conn.rollback()
            raise
        finally:
            if conn:
                self.release_connection(conn)

    def _get_sqlite_connection(self) -> SQLiteCompatConnection:
        """Spawns an isolated, thread-safe SQLite connection with compatibility extensions."""
        db_path = self.db_config.get('database') or get_external_path('3abaqira_dev.db')
        raw = sqlite3.connect(db_path, check_same_thread=False, timeout=10.0)
        raw.execute("PRAGMA foreign_keys = ON;")

        # Custom PostgreSQL compatibility function: TO_CHAR(date, 'YYYY-MM')
        def _to_char(val, fmt):
            if not val:
                return ""
            s = str(val)
            if fmt == "YYYY-MM":
                return s[:7]
            return s

        raw.create_function("TO_CHAR", 2, _to_char)
        return SQLiteCompatConnection(raw)

    def get_raw_connection(self):
        """Checkout a raw connection from the pool, engine, or SQLite."""
        if self.db_type == 'sqlite' or ConnectionManager._pool == "SQLITE_DIRECT":
            return self._get_sqlite_connection()

        if ConnectionManager._pool is not None and ConnectionManager._pool not in ("SQLALCHEMY_DELEGATED", "SQLITE_DIRECT"):
            if self.db_type in ('postgresql', 'postgres'):
                return ConnectionManager._pool.getconn()
            elif self.db_type == 'mysql':
                raw_conn = ConnectionManager._pool.get_connection()
                return MySQLCompatConnection(raw_conn)

        if self.engine is not None:
            try:
                raw_conn = self.engine.raw_connection()
                if self.db_type == 'mysql':
                    return MySQLCompatConnection(raw_conn)
                return raw_conn
            except Exception as e:
                logger.warning(f"Engine connection failed: {e}; falling back to SQLite.")
                self._fallback_to_sqlite()
                return self._get_sqlite_connection()

        # Final safety fallback to SQLite
        self._fallback_to_sqlite()
        return self._get_sqlite_connection()

    def release_connection(self, conn) -> None:
        """Safely returns connection to its respective pool or closes SQLite handles."""
        try:
            if isinstance(conn, (SQLiteCompatConnection, MySQLCompatConnection)):
                conn.close()
                return

            if ConnectionManager._pool is not None and ConnectionManager._pool not in ("SQLALCHEMY_DELEGATED", "SQLITE_DIRECT"):
                if self.db_type in ('postgresql', 'postgres'):
                    ConnectionManager._pool.putconn(conn)
                    return
                elif self.db_type == 'mysql':
                    conn.close()
                    return

            if hasattr(conn, 'close'):
                conn.close()
        except Exception as e:
            logger.warning(f"Warning releasing connection: {e}")


# ── Standalone Utility Functions ─────────────────────────────────────────────

def load_db_config() -> dict:
    """
    Reads database connectivity credentials from .env or environment variables.
    Defaults to SQLite ('3abaqira_dev.db') for frictionless out-of-the-box operation
    unless PostgreSQL or MySQL is explicitly configured.
    """
    env_path = get_external_path(".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)

    db_type = os.getenv('DB_TYPE')
    if not db_type:
        # If DATABASE_URL or DB_HOST is explicitly defined, target postgresql, else sqlite
        if os.getenv('DATABASE_URL') or os.getenv('DB_HOST'):
            db_type = 'postgresql'
        else:
            db_type = 'sqlite'
    db_type = db_type.lower()

    if db_type == 'sqlite':
        return {
            'type':     'sqlite',
            'database': os.getenv('DB_NAME', get_external_path('3abaqira_dev.db')),
        }

    default_port = 5432 if db_type in ('postgresql', 'postgres') else 3306
    default_user = 'postgres' if db_type in ('postgresql', 'postgres') else 'root'

    return {
        'type':     db_type,
        'host':     os.getenv('DB_HOST', 'localhost'),
        'user':     os.getenv('DB_USER', default_user),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'abaqira'),
        'port':     int(os.getenv('DB_PORT', default_port)),
        'url':      os.getenv('DATABASE_URL', None),
    }


def ensure_database_exists(db_config: dict) -> None:
    """Verifies target database existence or creates if missing."""
    db_type = db_config.get('type', 'sqlite').lower()

    if db_type == 'sqlite':
        db_path = db_config.get('database') or get_external_path('3abaqira_dev.db')
        parent_dir = os.path.dirname(os.path.abspath(db_path))
        if parent_dir and not os.path.exists(parent_dir):
            os.makedirs(parent_dir, exist_ok=True)
        return

    db_name = db_config.get('database', 'abaqira')

    try:
        if db_type in ('postgresql', 'postgres'):
            try:
                import psycopg2
                from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
                conn = psycopg2.connect(
                    host=db_config.get('host', 'localhost'),
                    port=db_config.get('port', 5432),
                    user=db_config.get('user', 'postgres'),
                    password=db_config.get('password', ''),
                    database='postgres',
                    connect_timeout=3,
                )
                conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
                with conn.cursor() as cur:
                    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (db_name,))
                    if not cur.fetchone():
                        cur.execute(f'CREATE DATABASE "{db_name}" ENCODING \'UTF8\';')
                        logger.info(f"✅ PostgreSQL database '{db_name}' created successfully.")
                    else:
                        logger.info(f"✅ PostgreSQL database '{db_name}' verified.")
                conn.close()
            except ImportError:
                logger.info("psycopg2 not installed; database presence check deferred to runtime.")
            except Exception as pg_err:
                logger.warning(f"PostgreSQL verification check notice: {pg_err}")

        elif db_type == 'mysql':
            try:
                import mysql.connector
                conn_cfg = {k: v for k, v in db_config.items() if k not in ('database', 'type', 'url')}
                with mysql.connector.connect(**conn_cfg) as conn:
                    with conn.cursor() as cursor:
                        cursor.execute(
                            f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
                            f"CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
                        )
                        logger.info(f"✅ MySQL database '{db_name}' verified/created.")
            except ImportError:
                pass
            except Exception as my_err:
                logger.warning(f"MySQL verification notice: {my_err}")

    except Exception as err:
        logger.warning(f"Could not verify/create database: {err}")
