"""
backend/database/employee_manager.py
------------------------------------
Data Access Manager for the 'employees' table.
Manages academic faculty, coaches, administrative directors, and operational staff.
"""

import logging
from datetime import datetime, date
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


VALID_ROLES = {
    "ADMIN", "DIRECTOR", "SOROBAN_COACH", "LANG_TEACHER", "QURAN_TEACHER",
    "PREP_TEACHER", "SUPPORT_TEACHER", "ROBOTICS_COACH", "NANNY", "COOK",
    "CLEANER", "SECURITY", "DRIVER", "OTHER"
}

VALID_COMPENSATION_MODELS = {
    "FIXED_MONTHLY", "PER_HEADCOUNT", "PER_SESSION", "HOURLY", "HYBRID"
}


class EmployeeManager:
    """
    Manages operations for employees, faculty coaches, and staff profiles.
    """

    SAFE_COLUMNS = (
        "e.employee_id, e.branch_id, e.employee_code, e.full_name, e.national_id, "
        "e.role, e.compensation_model, e.base_salary, e.hire_date, e.phone, "
        "e.email, e.bank_account_details, e.is_active, e.created_at, e.updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def _generate_employee_code(self, cursor, branch_id: str) -> str:
        """Generates sequential employee code (e.g., EMP-CENTER-0042)."""
        clean_branch = branch_id.strip().upper()
        cursor.execute(
            "SELECT COUNT(*) FROM employees WHERE branch_id = %s;",
            (clean_branch,),
        )
        row = cursor.fetchone()
        next_seq = (row[0] if row else 0) + 1
        return f"EMP-{clean_branch}-{next_seq:04d}"

    def get_all(
        self,
        branch_id: Optional[str] = None,
        role: Optional[str] = None,
        compensation_model: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves employees with joined branch information."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en
                    FROM employees e
                    JOIN branches b ON e.branch_id = b.branch_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND e.branch_id = %s"
                    params.append(branch_id.strip())
                if role:
                    query += " AND e.role = %s"
                    params.append(role.strip().upper())
                if compensation_model:
                    query += " AND e.compensation_model = %s"
                    params.append(compensation_model.strip().upper())
                if is_active is not None:
                    query += " AND e.is_active = %s"
                    params.append(is_active)
                if search:
                    query += " AND (e.full_name ILIKE %s OR e.employee_code ILIKE %s OR e.phone ILIKE %s)"
                    term = f"%{search.strip()}%"
                    params.extend([term, term, term])

                query += " ORDER BY e.is_active DESC, e.full_name ASC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching employees: {e}")
            return []

    def get_by_id(self, employee_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single employee record by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en
                    FROM employees e
                    JOIN branches b ON e.branch_id = b.branch_id
                    WHERE e.employee_id = %s;
                """
                cursor.execute(query, (employee_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching employee ID {employee_id}: {e}")
            return None

    def get_by_code(self, employee_code: str) -> Optional[Dict[str, Any]]:
        """Retrieves employee record by code."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT {self.SAFE_COLUMNS}
                    FROM employees e
                    WHERE e.employee_code = %s;
                """
                cursor.execute(query, (employee_code.strip(),))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching employee by code {employee_code}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        full_name: str,
        role: str,
        compensation_model: str = "FIXED_MONTHLY",
        base_salary: float = 0.0,
        employee_code: Optional[str] = None,
        national_id: Optional[str] = None,
        hire_date: Optional[Any] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        bank_account_details: Optional[str] = None,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new employee record."""
        clean_branch = branch_id.strip()
        clean_role = role.strip().upper() if role.strip().upper() in VALID_ROLES else "OTHER"
        clean_comp = compensation_model.strip().upper() if compensation_model.strip().upper() in VALID_COMPENSATION_MODELS else "FIXED_MONTHLY"
        salary = max(0.0, float(base_salary or 0.0))

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                code = employee_code.strip() if employee_code else self._generate_employee_code(cursor, clean_branch)

                query = """
                    INSERT INTO employees (
                        branch_id, employee_code, full_name, national_id,
                        role, compensation_model, base_salary, hire_date,
                        phone, email, bank_account_details, is_active
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        employee_id, branch_id, employee_code, full_name,
                        national_id, role, compensation_model, base_salary,
                        hire_date, phone, email, bank_account_details,
                        is_active, created_at, updated_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        code,
                        full_name.strip(),
                        national_id.strip() if national_id else None,
                        clean_role,
                        clean_comp,
                        salary,
                        hire_date or date.today(),
                        phone.strip() if phone else None,
                        email.strip() if email else None,
                        bank_account_details.strip() if bank_account_details else None,
                        is_active,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating employee '{full_name}': {e}")
            return None

    def update(
        self,
        employee_id: int,
        full_name: Optional[str] = None,
        role: Optional[str] = None,
        compensation_model: Optional[str] = None,
        base_salary: Optional[float] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        bank_account_details: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates employee profile fields."""
        fields: List[str] = []
        params: List[Any] = []

        if full_name is not None:
            fields.append("full_name = %s")
            params.append(full_name.strip())
        if role is not None:
            clean_role = role.strip().upper() if role.strip().upper() in VALID_ROLES else "OTHER"
            fields.append("role = %s")
            params.append(clean_role)
        if compensation_model is not None:
            clean_comp = compensation_model.strip().upper() if compensation_model.strip().upper() in VALID_COMPENSATION_MODELS else "FIXED_MONTHLY"
            fields.append("compensation_model = %s")
            params.append(clean_comp)
        if base_salary is not None:
            if base_salary < 0:
                return None
            fields.append("base_salary = %s")
            params.append(float(base_salary))
        if phone is not None:
            fields.append("phone = %s")
            params.append(phone.strip() if phone else None)
        if email is not None:
            fields.append("email = %s")
            params.append(email.strip() if email else None)
        if bank_account_details is not None:
            fields.append("bank_account_details = %s")
            params.append(bank_account_details.strip() if bank_account_details else None)
        if is_active is not None:
            fields.append("is_active = %s")
            params.append(is_active)

        if not fields:
            return self.get_by_id(employee_id)

        fields.append("updated_at = CURRENT_TIMESTAMP")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    UPDATE employees
                    SET {', '.join(fields)}
                    WHERE employee_id = %s
                    RETURNING 
                        employee_id, branch_id, employee_code, full_name,
                        national_id, role, compensation_model, base_salary,
                        hire_date, phone, email, bank_account_details,
                        is_active, created_at, updated_at;
                """
                params.append(employee_id)
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating employee ID {employee_id}: {e}")
            return None

    def delete(self, employee_id: int) -> bool:
        """Deletes an employee record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM employees WHERE employee_id = %s;", (employee_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting employee ID {employee_id}: {e}")
            return False
