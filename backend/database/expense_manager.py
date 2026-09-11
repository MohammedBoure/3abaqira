"""
backend/database/expense_manager.py
------------------------------------
Data Access Managers for 'expense_categories' and 'expenses'.
Encapsulates:
  - Expense taxonomy / categories (المصاريف / ملخص المصاريف)
  - Daily operational expenses logging with auto-voucher generation (EXP-BRANCH-YYYY-XXXXX)
  - Two-way daily cash drawer synchronization (increments daily_cash_registers.total_expenses)
  - Budget variance actuals real-time synchronization
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


class ExpenseCategoryManager:
    """
    Manages operations for expense categories and cafeteria classification.
    """

    SAFE_COLUMNS = (
        "category_id, branch_id, code, name_ar, name_en, "
        "is_cafeteria_related, is_active, created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        is_cafeteria_related: Optional[bool] = None,
        is_active: Optional[bool] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieves expense categories with branch metadata."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        c.*,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en
                    FROM expense_categories c
                    JOIN branches b ON c.branch_id = b.branch_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND c.branch_id = %s"
                    params.append(branch_id.strip())
                if is_cafeteria_related is not None:
                    query += " AND c.is_cafeteria_related = %s"
                    params.append(is_cafeteria_related)
                if is_active is not None:
                    query += " AND c.is_active = %s"
                    params.append(is_active)

                query += " ORDER BY c.branch_id ASC, c.category_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching expense categories: {e}")
            return []

    def get_by_id(self, category_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single category by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        c.*,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en
                    FROM expense_categories c
                    JOIN branches b ON c.branch_id = b.branch_id
                    WHERE c.category_id = %s;
                """
                cursor.execute(query, (category_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching expense category ID {category_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        code: str,
        name_ar: str,
        name_en: Optional[str] = None,
        is_cafeteria_related: bool = False,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new expense category."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO expense_categories (
                    branch_id, code, name_ar, name_en, is_cafeteria_related, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        code.strip().upper(),
                        name_ar.strip(),
                        name_en.strip() if name_en else None,
                        is_cafeteria_related,
                        is_active,
                    ),
                )
                res = _dict_fetchone(cursor)
                conn.commit()
                return res
        except Exception as e:
            logger.error(f"Error creating expense category '{code}': {e}")
            return None

    def update(self, category_id: int, **kwargs) -> bool:
        """Dynamically updates safe category fields."""
        allowed = {"code", "name_ar", "name_en", "is_cafeteria_related", "is_active"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [category_id]
                query = f"UPDATE expense_categories SET {', '.join(set_clauses)} WHERE category_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating category ID {category_id}: {e}")
            return False

    def delete(self, category_id: int) -> bool:
        """Deletes category if no expenses or budget targets are associated."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                DELETE FROM expense_categories
                WHERE category_id = %s
                  AND NOT EXISTS (SELECT 1 FROM expenses WHERE category_id = %s)
                  AND NOT EXISTS (SELECT 1 FROM budget_variances WHERE category_id = %s);
                """
                cursor.execute(query, (category_id, category_id, category_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting category ID {category_id}: {e}")
            return False


class ExpenseManager:
    """
    Manages daily operational expenses, payment methods, vouchers, and drawer/budget integrations.
    """

    SAFE_COLUMNS = (
        "expense_id, branch_id, register_id, category_id, expense_date, "
        "month_code, description, amount, payment_method, voucher_number, "
        "paid_to, authorized_by_employee_id, receipt_attachment_url, notes, created_at"
    )

    VALID_PAYMENT_METHODS = {"CASH", "CHECK", "BANK_TRANSFER", "CARD"}

    def __init__(self, db_instance):
        self.db = db_instance
        self.categories = ExpenseCategoryManager(db_instance)

    def _generate_voucher_number(self, cursor, branch_id: str, expense_date: Any) -> str:
        """Generates sequential expense voucher number (e.g., EXP-CENTER-2025-00042)."""
        if hasattr(expense_date, "year"):
            year = expense_date.year
        elif isinstance(expense_date, str) and len(expense_date) >= 4:
            try:
                year = int(expense_date[:4])
            except (ValueError, TypeError):
                year = datetime.now().year
        else:
            year = datetime.now().year
        clean_branch = branch_id.strip().upper()

        cursor.execute(
            """
            SELECT COUNT(*) FROM expenses
            WHERE branch_id = %s AND EXTRACT(YEAR FROM expense_date) = %s;
            """,
            (clean_branch, year),
        )
        row = cursor.fetchone()
        next_seq = (row[0] if row else 0) + 1
        return f"EXP-{clean_branch}-{year}-{next_seq:05d}"

    def get_all(
        self,
        branch_id: Optional[str] = None,
        category_id: Optional[int] = None,
        register_id: Optional[int] = None,
        month_code: Optional[str] = None,
        payment_method: Optional[str] = None,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves expenses with relational category, employee, branch, and drawer details.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        e.expense_id,
                        e.branch_id,
                        e.register_id,
                        e.category_id,
                        e.expense_date,
                        e.month_code,
                        e.description,
                        e.amount,
                        e.payment_method,
                        e.voucher_number,
                        e.paid_to,
                        e.authorized_by_employee_id,
                        e.receipt_attachment_url,
                        e.notes,
                        e.created_at,
                        c.code AS category_code,
                        c.name_ar AS category_name_ar,
                        c.is_cafeteria_related,
                        b.name_ar AS branch_name_ar,
                        emp.full_name AS authorized_by_name,
                        r.register_date
                    FROM expenses e
                    JOIN expense_categories c ON e.category_id = c.category_id
                    JOIN branches b ON e.branch_id = b.branch_id
                    LEFT JOIN employees emp ON e.authorized_by_employee_id = emp.employee_id
                    LEFT JOIN daily_cash_registers r ON e.register_id = r.register_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND e.branch_id = %s"
                    params.append(branch_id.strip())
                if category_id is not None:
                    query += " AND e.category_id = %s"
                    params.append(category_id)
                if register_id is not None:
                    query += " AND e.register_id = %s"
                    params.append(register_id)
                if month_code and month_code.strip():
                    query += " AND e.month_code = %s"
                    params.append(month_code.strip())
                if payment_method and payment_method.strip():
                    query += " AND e.payment_method = %s"
                    params.append(payment_method.strip().upper())
                if date_from:
                    query += " AND e.expense_date >= %s"
                    params.append(date_from)
                if date_to:
                    query += " AND e.expense_date <= %s"
                    params.append(date_to)
                if search and search.strip():
                    pattern = f"%{search.strip()}%"
                    query += """ AND (
                        e.description ILIKE %s OR
                        COALESCE(e.paid_to, '') ILIKE %s OR
                        COALESCE(e.voucher_number, '') ILIKE %s
                    )"""
                    params.extend([pattern, pattern, pattern])

                query += " ORDER BY e.expense_date DESC, e.expense_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching expenses: {e}")
            return []

    def get_by_id(self, expense_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single expense record with category, branch, and authorizer info."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        e.expense_id,
                        e.branch_id,
                        e.register_id,
                        e.category_id,
                        e.expense_date,
                        e.month_code,
                        e.description,
                        e.amount,
                        e.payment_method,
                        e.voucher_number,
                        e.paid_to,
                        e.authorized_by_employee_id,
                        e.receipt_attachment_url,
                        e.notes,
                        e.created_at,
                        c.code AS category_code,
                        c.name_ar AS category_name_ar,
                        c.is_cafeteria_related,
                        b.name_ar AS branch_name_ar,
                        b.name_en AS branch_name_en,
                        emp.full_name AS authorized_by_name,
                        r.register_date
                    FROM expenses e
                    JOIN expense_categories c ON e.category_id = c.category_id
                    JOIN branches b ON e.branch_id = b.branch_id
                    LEFT JOIN employees emp ON e.authorized_by_employee_id = emp.employee_id
                    LEFT JOIN daily_cash_registers r ON e.register_id = r.register_id
                    WHERE e.expense_id = %s;
                """
                cursor.execute(query, (expense_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching expense ID {expense_id}: {e}")
            return None

    def record_expense(
        self,
        branch_id: str,
        category_id: int,
        description: str,
        amount: float,
        expense_date: Optional[Any] = None,
        month_code: Optional[str] = None,
        payment_method: str = "CASH",
        voucher_number: Optional[str] = None,
        paid_to: Optional[str] = None,
        authorized_by_employee_id: Optional[int] = None,
        register_id: Optional[int] = None,
        receipt_attachment_url: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Records an operational daily expense:
          1. Derives month_code (YYYY-MM) and voucher number if missing.
          2. Auto-links to open daily cash register if payment_method is CASH.
          3. Increments register total_expenses.
          4. Automatically synchronizes budget_variances actual_amount.
        """
        if amount <= 0:
            logger.error(f"Invalid expense amount: {amount}")
            return None

        norm_method = payment_method.upper().strip() if payment_method else "CASH"
        if norm_method not in self.VALID_PAYMENT_METHODS:
            norm_method = "CASH"

        e_date = expense_date or date.today()
        clean_branch = branch_id.strip()

        # Derive month_code
        if not month_code:
            if hasattr(e_date, "strftime"):
                final_month = e_date.strftime("%Y-%m")
            else:
                final_month = str(e_date)[:7]
        else:
            final_month = month_code.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Auto-link to open daily register if cash payment and register not supplied
                active_reg_id = register_id
                if not active_reg_id and norm_method == "CASH":
                    cursor.execute(
                        """
                        SELECT register_id FROM daily_cash_registers
                        WHERE branch_id = %s AND register_date = %s AND is_closed = FALSE
                        ORDER BY register_id DESC LIMIT 1;
                        """,
                        (clean_branch, e_date),
                    )
                    reg_row = cursor.fetchone()
                    if reg_row:
                        active_reg_id = reg_row[0]

                # Generate voucher number if not supplied
                v_no = voucher_number.strip() if voucher_number else None
                if not v_no:
                    v_no = self._generate_voucher_number(cursor, clean_branch, e_date)

                query = """
                INSERT INTO expenses (
                    branch_id, register_id, category_id, expense_date,
                    month_code, description, amount, payment_method,
                    voucher_number, paid_to, authorized_by_employee_id,
                    receipt_attachment_url, notes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING 
                    expense_id, branch_id, register_id, category_id,
                    expense_date, month_code, description, amount,
                    payment_method, voucher_number, paid_to,
                    authorized_by_employee_id, receipt_attachment_url,
                    notes, created_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        active_reg_id,
                        category_id,
                        e_date,
                        final_month,
                        description.strip(),
                        amount,
                        norm_method,
                        v_no,
                        paid_to.strip() if paid_to else None,
                        authorized_by_employee_id,
                        receipt_attachment_url.strip() if receipt_attachment_url else None,
                        notes.strip() if notes else None,
                    ),
                )
                expense = _dict_fetchone(cursor)
                if not expense:
                    return None

                # Increment register total_expenses if linked
                if active_reg_id:
                    cursor.execute(
                        """
                        UPDATE daily_cash_registers
                        SET total_expenses = total_expenses + %s, updated_at = CURRENT_TIMESTAMP
                        WHERE register_id = %s;
                        """,
                        (amount, active_reg_id),
                    )

                # Sync budget_variances actual_amount if target row exists
                cursor.execute(
                    """
                    UPDATE budget_variances
                    SET actual_amount = (
                        SELECT COALESCE(SUM(amount), 0.00) FROM expenses
                        WHERE branch_id = %s AND category_id = %s AND month_period = %s
                    ),
                    updated_at = CURRENT_TIMESTAMP
                    WHERE branch_id = %s AND category_id = %s AND month_period = %s;
                    """,
                    (clean_branch, category_id, final_month, clean_branch, category_id, final_month),
                )

                conn.commit()
                return expense

        except Exception as e:
            logger.error(f"Error recording expense: {e}")
            return None

    def update(self, expense_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable expense fields and syncs totals."""
        allowed = {
            "description", "amount", "payment_method", "paid_to",
            "authorized_by_employee_id", "receipt_attachment_url", "notes"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT branch_id, category_id, month_code, register_id, amount FROM expenses WHERE expense_id = %s;",
                    (expense_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return False

                branch_id, cat_id, month_code, reg_id, old_amt = row[0], row[1], row[2], row[3], float(row[4])

                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [expense_id]
                query = f"UPDATE expenses SET {', '.join(set_clauses)} WHERE expense_id = %s;"
                cursor.execute(query, values)

                # If amount changed, update register and budget
                if "amount" in updates:
                    new_amt = float(updates["amount"])
                    diff = new_amt - old_amt
                    if reg_id:
                        cursor.execute(
                            "UPDATE daily_cash_registers SET total_expenses = total_expenses + %s, updated_at = CURRENT_TIMESTAMP WHERE register_id = %s;",
                            (diff, reg_id),
                        )
                    cursor.execute(
                        """
                        UPDATE budget_variances
                        SET actual_amount = (
                            SELECT COALESCE(SUM(amount), 0.00) FROM expenses
                            WHERE branch_id = %s AND category_id = %s AND month_period = %s
                        ),
                        updated_at = CURRENT_TIMESTAMP
                        WHERE branch_id = %s AND category_id = %s AND month_period = %s;
                        """,
                        (branch_id, cat_id, month_code, branch_id, cat_id, month_code),
                    )

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error updating expense ID {expense_id}: {e}")
            return False

    def delete(self, expense_id: int) -> bool:
        """Deletes an expense, reversing drawer total_expenses and budget actuals."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT branch_id, category_id, month_code, register_id, amount FROM expenses WHERE expense_id = %s;",
                    (expense_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return False

                branch_id, cat_id, month_code, reg_id, amt = row[0], row[1], row[2], row[3], float(row[4])

                cursor.execute("DELETE FROM expenses WHERE expense_id = %s;", (expense_id,))

                # Reverse register
                if reg_id:
                    cursor.execute(
                        "UPDATE daily_cash_registers SET total_expenses = GREATEST(0.00, total_expenses - %s), updated_at = CURRENT_TIMESTAMP WHERE register_id = %s;",
                        (amt, reg_id),
                    )

                # Reverse budget actuals
                cursor.execute(
                    """
                    UPDATE budget_variances
                    SET actual_amount = (
                        SELECT COALESCE(SUM(amount), 0.00) FROM expenses
                        WHERE branch_id = %s AND category_id = %s AND month_period = %s
                    ),
                    updated_at = CURRENT_TIMESTAMP
                    WHERE branch_id = %s AND category_id = %s AND month_period = %s;
                    """,
                    (branch_id, cat_id, month_code, branch_id, cat_id, month_code),
                )

                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error deleting expense ID {expense_id}: {e}")
            return False

    def get_monthly_summary(
        self, branch_id: Optional[str] = None, month_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Calculates monthly total spent broken down by expense category."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        c.category_id,
                        c.code AS category_code,
                        c.name_ar AS category_name_ar,
                        c.is_cafeteria_related,
                        COUNT(e.expense_id) AS expense_count,
                        COALESCE(SUM(e.amount), 0.00) AS total_amount
                    FROM expense_categories c
                    LEFT JOIN expenses e ON c.category_id = e.category_id
                    WHERE 1=1
                """
                params: List[Any] = []
                if branch_id:
                    query += " AND c.branch_id = %s"
                    params.append(branch_id.strip())
                if month_code:
                    query += " AND (e.month_code = %s OR e.month_code IS NULL)"
                    params.append(month_code.strip())

                query += " GROUP BY c.category_id, c.code, c.name_ar, c.is_cafeteria_related ORDER BY total_amount DESC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error generating monthly expense summary: {e}")
            return []
