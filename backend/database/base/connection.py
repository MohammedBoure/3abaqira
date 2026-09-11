"""
backend/database/base/connection.py
------------------------------------
Connection Manager supporting Connection Pooling (PostgreSQL / MySQL) and SQLAlchemy Engine.
Provides thread-safe connection context managers with auto-commit/rollback semantics.
"""

import os
import logging
import urllib.parse
from contextlib import contextmanager
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs):
        pass

from .config import get_external_path

logger = logging.getLogger("ABAQIRA_SYS")


class ConnectionManager:
    """
    Manages connection pooling and the underlying SQLAlchemy Engine.
    Used internally by the central Database singleton.
    """

    _pool = None
    _engine = None

    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.db_type = db_config.get('type', 'postgresql').lower()
        self._init_pool()
        self._init_engine()

    # ── Connection Pool Initialization ────────────────────────────────────────
    def _init_pool(self) -> None:
        if ConnectionManager._pool is not None:
            return

        try:
            if self.db_type in ('postgresql', 'postgres'):
                # Try psycopg2 pool if available, otherwise rely on SQLAlchemy engine pool
                try:
                    import psycopg2
                    from psycopg2 import pool as pg_pool
                    ConnectionManager._pool = pg_pool.ThreadedConnectionPool(
                        minconn=2,
                        maxconn=20,
                        host=self.db_config['host'],
                        port=self.db_config['port'],
                        user=self.db_config['user'],
                        password=self.db_config['password'],
                        database=self.db_config['database']
                    )
                    logger.info("🚀 PostgreSQL ThreadedConnectionPool initialized successfully.")
                except ImportError:
                    logger.warning("psycopg2 not directly installed; delegating pool to SQLAlchemy Engine.")
                    ConnectionManager._pool = "SQLALCHEMY_DELEGATED"

            elif self.db_type == 'mysql':
                import mysql.connector
                from mysql.connector import pooling
                conn_cfg = {k: v for k, v in self.db_config.items() if k != 'type'}
                ConnectionManager._pool = pooling.MySQLConnectionPool(
                    pool_name="abaqira_pool",
                    pool_size=10,
                    pool_reset_session=True,
                    use_pure=True,
                    **conn_cfg
                )
                logger.info("🚀 MySQL Connection Pool initialized successfully.")
            else:
                ConnectionManager._pool = "SQLALCHEMY_DELEGATED"
        except Exception as e:
            logger.error(f"❌ Failed to initialize Connection Pool: {e}")
            # Fallback to engine delegation
            ConnectionManager._pool = "SQLALCHEMY_DELEGATED"

    # ── SQLAlchemy Engine Initialization ──────────────────────────────────────
    def _init_engine(self) -> None:
        if ConnectionManager._engine is not None:
            self.engine = ConnectionManager._engine
            return

        try:
            from sqlalchemy import create_engine

            db_url = self.db_config.get('url')
            if not db_url:
                pw = urllib.parse.quote_plus(self.db_config.get('password', ''))
                user = self.db_config.get('user', 'postgres')
                host = self.db_config.get('host', 'localhost')
                port = self.db_config.get('port', 5432)
                db_name = self.db_config.get('database', '3abaqira_db')

                if self.db_type in ('postgresql', 'postgres'):
                    db_url = f"postgresql+psycopg2://{user}:{pw}@{host}:{port}/{db_name}"
                else:
                    db_url = f"mysql+mysqlconnector://{user}:{pw}@{host}:{port}/{db_name}"

            ConnectionManager._engine = create_engine(
                db_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
            self.engine = ConnectionManager._engine
            logger.info("🚀 SQLAlchemy Engine initialized successfully.")
        except Exception as e:
            logger.warning(f"SQLAlchemy Engine warning (safe if drivers not installed yet): {e}")
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

    def get_raw_connection(self):
        """Checkout a raw connection from the pool or engine. Caller is responsible for release."""
        if ConnectionManager._pool is not None and ConnectionManager._pool != "SQLALCHEMY_DELEGATED":
            if self.db_type in ('postgresql', 'postgres'):
                return ConnectionManager._pool.getconn()
            elif self.db_type == 'mysql':
                return ConnectionManager._pool.get_connection()

        if self.engine is not None:
            return self.engine.raw_connection()

        raise RuntimeError("No active database pool or engine connection available.")

    def release_connection(self, conn) -> None:
        """Safely returns connection to its respective pool."""
        try:
            if ConnectionManager._pool is not None and ConnectionManager._pool != "SQLALCHEMY_DELEGATED":
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
    """Reads database connectivity credentials from .env or environment variables."""
    env_path = get_external_path(".env")
    if os.path.exists(env_path):
        load_dotenv(env_path)

    db_type = os.getenv('DB_TYPE', 'postgresql').lower()
    default_port = 5432 if db_type in ('postgresql', 'postgres') else 3306
    default_user = 'postgres' if db_type in ('postgresql', 'postgres') else 'root'

    return {
        'type':     db_type,
        'host':     os.getenv('DB_HOST', 'localhost'),
        'user':     os.getenv('DB_USER', default_user),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'abaqira_db'),
        'port':     int(os.getenv('DB_PORT', default_port)),
        'url':      os.getenv('DATABASE_URL', None),
    }


def ensure_database_exists(db_config: dict) -> None:
    """Verifies that the target database catalog exists on the database server; creates if missing."""
    db_type = db_config.get('type', 'postgresql').lower()
    db_name = db_config.get('database', 'abaqira_db')

    try:
        if db_type in ('postgresql', 'postgres'):
            try:
                import psycopg2
                from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
                conn = psycopg2.connect(
                    host=db_config['host'],
                    port=db_config['port'],
                    user=db_config['user'],
                    password=db_config['password'],
                    database='postgres'  # Connect to default system DB
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
