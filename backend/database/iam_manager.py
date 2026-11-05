"""
backend/database/iam_manager.py
--------------------------------
Data Access Manager for Identity & Access Management (IAM):
  - iam_account: Account lifecycle (pending until registration and first-level fees paid, auto-activated)
  - iam_permission: Dynamic permission catalog across modules (core, iam, org, acad, kg, fin)
  - iam_role & iam_role_permission: Dynamic roles built from permission catalog
  - iam_person_role: Multi-branch role assignments (branch-specific or global)
"""

import logging
from typing import List, Dict, Optional, Any, Set
from datetime import datetime

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


class IAMManager:
    """
    Manages accounts, authentication states, dynamic permission catalog,
    configurable roles, and branch-level role assignments.
    """

    def __init__(self, db_instance):
        self.db = db_instance

    # =========================================================================
    # ACCOUNT LIFECYCLE & FEE PAYMENT ACTIVATION
    # =========================================================================
    def create_account(
        self,
        person_id: int,
        username: str,
        password_hash: str,
        is_under_14: bool = False,
        status: str = "PENDING",
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a new system account. Defaults to PENDING status until fees are paid.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO iam_account (
                    person_id, username, password_hash, status, is_under_14,
                    registration_fee_paid, first_level_fee_paid
                )
                VALUES (%s, %s, %s, %s, %s, FALSE, FALSE)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        person_id,
                        username.strip(),
                        password_hash,
                        status.upper(),
                        is_under_14,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating account for person {person_id}: {e}")
            raise

    def get_account_by_person_id(self, person_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves account record by person ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM iam_account WHERE person_id = %s;", (person_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching account for person {person_id}: {e}")
            return None

    def get_account_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Retrieves account record by username."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM iam_account WHERE username = %s;", (username.strip(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching account by username '{username}': {e}")
            return None

    def record_fee_payment_and_evaluate_activation(
        self, person_id: int, fee_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Account activation lifecycle trigger:
        Accounts stay PENDING until registration and first-level fees are paid.
        When both conditions are met, account is automatically activated.
        """
        try:
            fee_type_norm = fee_type.strip().upper()
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM iam_account WHERE person_id = %s;",
                    (person_id,)
                )
                account = _dict_fetchone(cursor)
                if not account:
                    return None

                reg_paid = account.get("registration_fee_paid", False)
                lvl_paid = account.get("first_level_fee_paid", False)

                if fee_type_norm in ("REGISTRATION", "REGISTRATION_FEE"):
                    reg_paid = True
                elif fee_type_norm in ("FIRST_LEVEL", "FIRST_LEVEL_FEE", "TUITION"):
                    lvl_paid = True
                elif fee_type_norm in ("FULL", "BOTH", "ALL"):
                    reg_paid = True
                    lvl_paid = True

                # Determine if activation rule is satisfied
                new_status = account.get("status")
                activated_at = account.get("activated_at")

                if reg_paid and lvl_paid and new_status == "PENDING":
                    new_status = "ACTIVE"
                    query = """
                    UPDATE iam_account
                    SET registration_fee_paid = %s,
                        first_level_fee_paid = %s,
                        status = 'ACTIVE',
                        activated_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE person_id = %s
                    RETURNING *;
                    """
                    cursor.execute(query, (reg_paid, lvl_paid, person_id))
                else:
                    query = """
                    UPDATE iam_account
                    SET registration_fee_paid = %s,
                        first_level_fee_paid = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE person_id = %s
                    RETURNING *;
                    """
                    cursor.execute(query, (reg_paid, lvl_paid, person_id))

                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error evaluating fee payment activation for person {person_id}: {e}")
            raise

    # =========================================================================
    # DYNAMIC PERMISSION CATALOG
    # =========================================================================
    def get_all_permissions(self, module: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves permissions from dynamic catalog, optionally filtered by module."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "SELECT * FROM iam_permission"
                params = []
                if module:
                    query += " WHERE module = %s"
                    params.append(module.strip().lower())
                query += " ORDER BY module ASC, code ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching permissions: {e}")
            return []

    def create_permission(
        self, code: str, name: str, module: str, description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Registers a new permission into the dynamic catalog."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO iam_permission (code, name, module, description)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(query, (code.strip(), name.strip(), module.strip().lower(), description))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating permission '{code}': {e}")
            raise

    # =========================================================================
    # DYNAMIC ROLES & ROLE-PERMISSION ASSIGNMENTS
    # =========================================================================
    def create_role(
        self,
        code: str,
        name: str,
        description: Optional[str] = None,
        permission_ids: Optional[List[int]] = None,
        is_system: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """Creates a dynamic role composed of permissions from the catalog."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO iam_role (code, name, description, is_system)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(query, (code.strip().upper(), name.strip(), description, is_system))
                role = _dict_fetchone(cursor)

                if role and permission_ids:
                    role_id = role["role_id"]
                    for pid in permission_ids:
                        cursor.execute(
                            "INSERT INTO iam_role_permission (role_id, permission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                            (role_id, pid),
                        )
                return role
        except Exception as e:
            logger.error(f"Error creating role '{code}': {e}")
            raise

    def get_all_roles(self) -> List[Dict[str, Any]]:
        """Lists all roles in the system."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM iam_role ORDER BY role_id ASC;")
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching roles: {e}")
            return []

    def get_role_by_id(self, role_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves a role with its associated permissions."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM iam_role WHERE role_id = %s;", (role_id,))
                role = _dict_fetchone(cursor)
                if not role:
                    return None

                perm_query = """
                SELECT p.* FROM iam_permission p
                JOIN iam_role_permission rp ON p.permission_id = rp.permission_id
                WHERE rp.role_id = %s
                ORDER BY p.module, p.code;
                """
                cursor.execute(perm_query, (role_id,))
                role["permissions"] = _dict_fetchall(cursor)
                return role
        except Exception as e:
            logger.error(f"Error fetching role {role_id}: {e}")
            return None

    def assign_permissions_to_role(self, role_id: int, permission_ids: List[int]) -> bool:
        """Sets the exact permissions assigned to a dynamic role."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM iam_role_permission WHERE role_id = %s;", (role_id,))
                for pid in permission_ids:
                    cursor.execute(
                        "INSERT INTO iam_role_permission (role_id, permission_id) VALUES (%s, %s) ON CONFLICT DO NOTHING;",
                        (role_id, pid),
                    )
                return True
        except Exception as e:
            logger.error(f"Error updating permissions for role {role_id}: {e}")
            raise

    # =========================================================================
    # ROLE ASSIGNMENT PER BRANCH OR GLOBAL
    # =========================================================================
    def assign_role_to_person(
        self, person_id: int, role_id: int, branch_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Assigns a role to a person.
        If branch_id is None, the role is applied globally across all branches.
        Otherwise, it applies only within the specified branch.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO iam_person_role (person_id, role_id, branch_id)
                VALUES (%s, %s, %s)
                ON CONFLICT (person_id, role_id, branch_id) DO NOTHING
                RETURNING *;
                """
                cursor.execute(query, (person_id, role_id, branch_id.strip() if branch_id else None))
                row = _dict_fetchone(cursor)
                if not row:
                    # Retrieve existing if conflict occurred
                    cursor.execute(
                        "SELECT * FROM iam_person_role WHERE person_id = %s AND role_id = %s AND (branch_id = %s OR (branch_id IS NULL AND %s IS NULL));",
                        (person_id, role_id, branch_id, branch_id),
                    )
                    row = _dict_fetchone(cursor)
                return row
        except Exception as e:
            logger.error(f"Error assigning role {role_id} to person {person_id}: {e}")
            raise

    def remove_role_from_person(
        self, person_id: int, role_id: int, branch_id: Optional[str] = None
    ) -> bool:
        """Removes a role assignment from a person."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                if branch_id:
                    cursor.execute(
                        "DELETE FROM iam_person_role WHERE person_id = %s AND role_id = %s AND branch_id = %s;",
                        (person_id, role_id, branch_id.strip()),
                    )
                else:
                    cursor.execute(
                        "DELETE FROM iam_person_role WHERE person_id = %s AND role_id = %s AND branch_id IS NULL;",
                        (person_id, role_id),
                    )
                return True
        except Exception as e:
            logger.error(f"Error removing role {role_id} from person {person_id}: {e}")
            return False

    def get_person_roles(
        self, person_id: int, branch_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves all roles assigned to a person, including global roles and branch-specific roles.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT pr.assignment_id, pr.person_id, pr.role_id, pr.branch_id, pr.created_at,
                       r.code AS role_code, r.name AS role_name, r.description AS role_description
                FROM iam_person_role pr
                JOIN iam_role r ON pr.role_id = r.role_id
                WHERE pr.person_id = %s
                """
                params = [person_id]
                if branch_id:
                    query += " AND (pr.branch_id = %s OR pr.branch_id IS NULL)"
                    params.append(branch_id.strip())
                query += " ORDER BY pr.branch_id NULLS FIRST, r.name ASC;"

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching roles for person {person_id}: {e}")
            return []

    def get_effective_permissions(
        self, person_id: int, branch_id: Optional[str] = None
    ) -> Set[str]:
        """
        Calculates the complete set of effective permission codes for a person in a given branch.
        Includes permissions from global roles (branch_id IS NULL) and branch-specific roles.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                SELECT DISTINCT p.code
                FROM iam_person_role pr
                JOIN iam_role_permission rp ON pr.role_id = rp.role_id
                JOIN iam_permission p ON rp.permission_id = p.permission_id
                WHERE pr.person_id = %s
                """
                params = [person_id]
                if branch_id:
                    query += " AND (pr.branch_id = %s OR pr.branch_id IS NULL)"
                    params.append(branch_id.strip())
                else:
                    query += " AND pr.branch_id IS NULL"

                cursor.execute(query, params)
                rows = cursor.fetchall()
                perms = set()
                for r in rows:
                    perms.add(r[0] if isinstance(r, (list, tuple)) else r.get("code"))
                return perms
        except Exception as e:
            logger.error(f"Error calculating effective permissions for person {person_id}: {e}")
            return set()

    def has_permission(
        self, person_id: int, permission_code: str, branch_id: Optional[str] = None
    ) -> bool:
        """Checks if a person holds a specific permission in the requested scope."""
        effective = self.get_effective_permissions(person_id, branch_id=branch_id)
        return permission_code in effective
