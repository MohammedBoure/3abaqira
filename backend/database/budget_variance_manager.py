"""
backend/database/budget_variance_manager.py
--------------------------------------------
Data Access Manager for the 'budget_variances' table.
Encapsulates:
  - Monthly operational budget allocations per expense category (ملخص المصاريف)
  - Live tracking of variable multipliers (units / headcounts / provisions factor)
  - Real-time comparison of planned budgets vs actual expenditures
  - Automated variance calculation (budgeted - actual) and favorable/unfavorable tracking
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


class BudgetVarianceManager:
    """
    Manages operations for monthly category budgets, actual spent syncing, and variance reporting.
    """

    SAFE_COLUMNS = (
        "budget_variance_id, branch_id, category_id, month_period, variable_factor, "
        "budgeted_amount, actual_amount, (budgeted_amount - actual_amount) AS variance, "
        "notes, created_at, updated_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        month_period: Optional[str] = None,
        category_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves budget variance entries with category and branch metadata.
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        bv.budget_variance_id,
                        bv.branch_id,
                        bv.category_id,
                        bv.month_period,
                        bv.variable_factor,
                        bv.budgeted_amount,
                        bv.actual_amount,
                        (bv.budgeted_amount - bv.actual_amount) AS variance,
                        bv.notes,
                        bv.created_at,
                        bv.updated_at,
                        c.code AS category_code,
                        c.name_ar AS category_name_ar,
                        c.is_cafeteria_related,
                        b.name_ar AS branch_name_ar
                    FROM budget_variances bv
                    JOIN expense_categories c ON bv.category_id = c.category_id
                    JOIN branches b ON bv.branch_id = b.branch_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND bv.branch_id = %s"
                    params.append(branch_id.strip())
                if month_period and month_period.strip():
                    query += " AND bv.month_period = %s"
                    params.append(month_period.strip())
                if category_id is not None:
                    query += " AND bv.category_id = %s"
                    params.append(category_id)

                query += " ORDER BY bv.month_period DESC, bv.branch_id ASC, c.code ASC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching budget variances: {e}")
            return []

    def get_by_id(self, budget_variance_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single budget variance entry."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        bv.budget_variance_id,
                        bv.branch_id,
                        bv.category_id,
                        bv.month_period,
                        bv.variable_factor,
                        bv.budgeted_amount,
                        bv.actual_amount,
                        (bv.budgeted_amount - bv.actual_amount) AS variance,
                        bv.notes,
                        bv.created_at,
                        bv.updated_at,
                        c.code AS category_code,
                        c.name_ar AS category_name_ar,
                        c.is_cafeteria_related,
                        b.name_ar AS branch_name_ar
                    FROM budget_variances bv
                    JOIN expense_categories c ON bv.category_id = c.category_id
                    JOIN branches b ON bv.branch_id = b.branch_id
                    WHERE bv.budget_variance_id = %s;
                """
                cursor.execute(query, (budget_variance_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching budget variance ID {budget_variance_id}: {e}")
            return None

    def set_budget(
        self,
        branch_id: str,
        category_id: int,
        month_period: str,
        budgeted_amount: float,
        variable_factor: float = 0.0,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Sets or updates monthly budget target for a category, syncing the current actuals.
        """
        clean_branch = branch_id.strip()
        clean_period = month_period.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Calculate current live actuals from expenses table
                cursor.execute(
                    """
                    SELECT COALESCE(SUM(amount), 0.00) FROM expenses
                    WHERE branch_id = %s AND category_id = %s AND month_code = %s;
                    """,
                    (clean_branch, category_id, clean_period),
                )
                row = cursor.fetchone()
                current_actual = float(row[0]) if row else 0.0

                # Check if record already exists
                cursor.execute(
                    """
                    SELECT budget_variance_id FROM budget_variances
                    WHERE branch_id = %s AND category_id = %s AND month_period = %s;
                    """,
                    (clean_branch, category_id, clean_period),
                )
                existing = cursor.fetchone()

                if existing:
                    bv_id = existing[0]
                    update_query = """
                    UPDATE budget_variances
                    SET budgeted_amount = %s,
                        variable_factor = %s,
                        actual_amount = %s,
                        notes = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE budget_variance_id = %s
                    RETURNING 
                        budget_variance_id, branch_id, category_id, month_period,
                        variable_factor, budgeted_amount, actual_amount,
                        (budgeted_amount - actual_amount) AS variance,
                        notes, created_at, updated_at;
                    """
                    cursor.execute(
                        update_query,
                        (
                            max(0.0, float(budgeted_amount)),
                            float(variable_factor),
                            current_actual,
                            notes.strip() if notes else None,
                            bv_id,
                        ),
                    )
                else:
                    insert_query = """
                    INSERT INTO budget_variances (
                        branch_id, category_id, month_period,
                        variable_factor, budgeted_amount, actual_amount, notes
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        budget_variance_id, branch_id, category_id, month_period,
                        variable_factor, budgeted_amount, actual_amount,
                        (budgeted_amount - actual_amount) AS variance,
                        notes, created_at, updated_at;
                    """
                    cursor.execute(
                        insert_query,
                        (
                            clean_branch,
                            category_id,
                            clean_period,
                            float(variable_factor),
                            max(0.0, float(budgeted_amount)),
                            current_actual,
                            notes.strip() if notes else None,
                        ),
                    )

                res = _dict_fetchone(cursor)
                conn.commit()
                return res
        except Exception as e:
            logger.error(f"Error setting budget for category {category_id} ({month_period}): {e}")
            return None

    def sync_actuals(self, branch_id: str, month_period: str) -> int:
        """
        Synchronizes actual_amount for all category budgets for the specified branch and month.
        Returns count of synced rows.
        """
        clean_branch = branch_id.strip()
        clean_period = month_period.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                UPDATE budget_variances bv
                SET actual_amount = (
                    SELECT COALESCE(SUM(e.amount), 0.00) FROM expenses e
                    WHERE e.branch_id = bv.branch_id 
                      AND e.category_id = bv.category_id 
                      AND e.month_code = bv.month_period
                ),
                updated_at = CURRENT_TIMESTAMP
                WHERE bv.branch_id = %s AND bv.month_period = %s;
                """
                cursor.execute(query, (clean_branch, clean_period))
                conn.commit()
                return cursor.rowcount
        except Exception as e:
            logger.error(f"Error syncing actuals for {branch_id} ({month_period}): {e}")
            return 0

    def get_monthly_report(self, branch_id: str, month_period: str) -> Dict[str, Any]:
        """
        Generates comprehensive monthly variance analytics report comparing
        budgeted amounts against actual expenditures across all active categories.
        """
        items = self.get_all(branch_id=branch_id, month_period=month_period, limit=200)

        total_budgeted = sum(float(i.get("budgeted_amount") or 0.0) for i in items)
        total_actual = sum(float(i.get("actual_amount") or 0.0) for i in items)
        net_variance = total_budgeted - total_actual

        enriched_items = []
        for i in items:
            b_amt = float(i.get("budgeted_amount") or 0.0)
            a_amt = float(i.get("actual_amount") or 0.0)
            var = b_amt - a_amt

            if var > 0:
                var_status = "UNDER_BUDGET"  # Favorable
            elif var < 0:
                var_status = "OVER_BUDGET"   # Unfavorable
            else:
                var_status = "ON_TARGET"

            i["variance_status"] = var_status
            i["percentage_utilized"] = round((a_amt / b_amt * 100.0), 2) if b_amt > 0 else 0.0
            enriched_items.append(i)

        return {
            "branch_id": branch_id,
            "month_period": month_period,
            "total_budgeted": total_budgeted,
            "total_actual": total_actual,
            "net_variance": net_variance,
            "is_overall_under_budget": net_variance >= 0,
            "categories_count": len(enriched_items),
            "breakdown": enriched_items,
        }

    def delete(self, budget_variance_id: int) -> bool:
        """Deletes a budget variance entry."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM budget_variances WHERE budget_variance_id = %s;", (budget_variance_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting budget variance ID {budget_variance_id}: {e}")
            return False
