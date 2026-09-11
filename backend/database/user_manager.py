"""
backend/database/user_manager.py
---------------------------------
Data Access Manager for the 'users' authentication table.
Provides user identity retrieval, credential verification lookups,
role-based queries, and password updates for API JWT authentication.
"""

import logging
from datetime import datetime
from typing import List, Dict, Optional, Any

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


class UserManager:
    """
    Manages operations for the 'users' table supporting authentication,
    multi-branch user isolation, and role authorization.
    """

    SAFE_COLUMNS = (
        "user_id, branch_id, username, full_name, email, role, is_active, last_login, created_at, updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_by_username(
        self, username: str, include_password_hash: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieves user record by unique username.
        Used primarily during JWT authentication and token issuance.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                if include_password_hash:
                    query = "SELECT user_id, branch_id, username, password_hash, full_name, email, role, is_active, last_login, created_at, updated_at FROM users WHERE username = %s;"
                else:
                    query = f"SELECT {self.SAFE_COLUMNS} FROM users WHERE username = %s;"
                cursor.execute(query, (username.strip(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching user by username '{username}': {e}")
            return None

    def get_by_id(
        self, user_id: int, include_password_hash: bool = False
    ) -> Optional[Dict[str, Any]]:
        """Retrieves a single user by their primary key."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                if include_password_hash:
                    query = "SELECT user_id, branch_id, username, password_hash, full_name, email, role, is_active, last_login, created_at, updated_at FROM users WHERE user_id = %s;"
                else:
                    query = f"SELECT {self.SAFE_COLUMNS} FROM users WHERE user_id = %s;"
                cursor.execute(query, (user_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching user ID {user_id}: {e}")
            return None

    def get_all(
        self,
        branch_id: Optional[str] = None,
        role: Optional[str] = None,
        active_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """Lists system users with optional filtering by branch, role, and active status."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"SELECT {self.SAFE_COLUMNS} FROM users WHERE 1=1"
                params = []

                if branch_id:
                    query += " AND branch_id = %s"
                    params.append(branch_id)
                if role:
                    query += " AND role = %s"
                    params.append(role.upper())
                if active_only:
                    query += " AND is_active = TRUE"

                query += " ORDER BY user_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error listing users: {e}")
            return []

    def create(
        self,
        username: str,
        password_hash: str,
        full_name: str,
        email: Optional[str] = None,
        role: str = "STAFF",
        branch_id: Optional[str] = None,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new user record with hashed credentials."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO users (username, password_hash, full_name, email, role, branch_id, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING user_id, branch_id, username, full_name, email, role, is_active, created_at;
                """
                cursor.execute(
                    query,
                    (
                        username.strip().lower(),
                        password_hash,
                        full_name.strip(),
                        email.strip() if email else None,
                        role.upper(),
                        branch_id,
                        is_active,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating user '{username}': {e}")
            return None

    def update(self, user_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable attributes for a user record."""
        allowed_fields = {"full_name", "email", "role", "branch_id", "is_active"}
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                set_clauses.append("updated_at = CURRENT_TIMESTAMP")
                values = list(updates.values()) + [user_id]
                query = f"UPDATE users SET {', '.join(set_clauses)} WHERE user_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating user ID {user_id}: {e}")
            return False

    def update_password(self, user_id: int, new_password_hash: str) -> bool:
        """Updates user password hash securely."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE users
                SET password_hash = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s;
                """
                cursor.execute(query, (new_password_hash, user_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating password for user ID {user_id}: {e}")
            return False

    def update_last_login(self, user_id: int) -> bool:
        """Records successful login timestamp."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = %s;"
                cursor.execute(query, (user_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating last login for user ID {user_id}: {e}")
            return False

    def toggle_status(self, user_id: int, is_active: bool) -> bool:
        """Enables or disables user access."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE users
                SET is_active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = %s;
                """
                cursor.execute(query, (is_active, user_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error toggling status for user ID {user_id}: {e}")
            return False

    def delete(self, user_id: int) -> bool:
        """Deletes a user account."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM users WHERE user_id = %s;"
                cursor.execute(query, (user_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting user ID {user_id}: {e}")
            return False
