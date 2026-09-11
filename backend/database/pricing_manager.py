"""
backend/database/pricing_manager.py
-----------------------------------
Data Access Manager for the 'pricing_plans' table.
Encapsulates:
  - Multi-tier tuition pricing matrices across branches and academic cycles
  - Sibling discounts, cash upfront discounts, and annual prepay incentives
  - Registration fees and installment counts
  - Effective price computation engine
"""

import logging
from decimal import Decimal
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


class PricingManager:
    """
    Manages operations for multi-tier program pricing matrices and discount plans.
    """

    SAFE_COLUMNS = (
        "pricing_plan_id, branch_id, program_id, level_id, academic_year_id, plan_name, "
        "standard_installment_price, cash_discount, sibling_discount, annual_prepaid_discount, "
        "monthly_standard_rate, registration_fee, installments_count, notes, is_active, created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    def get_all(
        self,
        branch_id: Optional[str] = None,
        program_id: Optional[int] = None,
        level_id: Optional[int] = None,
        academic_year_id: Optional[int] = None,
        active_only: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves pricing plans with rich relational labels (branch, program, level, academic year names).
        """
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        pp.*,
                        b.name_ar AS branch_name_ar,
                        p.name_ar AS program_name_ar,
                        p.code AS program_code,
                        l.name_ar AS level_name_ar,
                        l.level_code,
                        ay.name AS academic_year_name
                    FROM pricing_plans pp
                    JOIN branches b ON pp.branch_id = b.branch_id
                    LEFT JOIN programs p ON pp.program_id = p.program_id
                    LEFT JOIN levels l ON pp.level_id = l.level_id
                    JOIN academic_years ay ON pp.academic_year_id = ay.academic_year_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND pp.branch_id = %s"
                    params.append(branch_id.strip())
                if program_id is not None:
                    query += " AND pp.program_id = %s"
                    params.append(program_id)
                if level_id is not None:
                    query += " AND pp.level_id = %s"
                    params.append(level_id)
                if academic_year_id is not None:
                    query += " AND pp.academic_year_id = %s"
                    params.append(academic_year_id)
                if active_only:
                    query += " AND pp.is_active = TRUE"

                query += " ORDER BY pp.branch_id ASC, pp.academic_year_id DESC, pp.pricing_plan_id ASC;"
                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching pricing plans: {e}")
            return []

    def get_by_id(self, pricing_plan_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single pricing plan by ID with associated entity metadata."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        pp.*,
                        b.name_ar AS branch_name_ar,
                        p.name_ar AS program_name_ar,
                        p.code AS program_code,
                        l.name_ar AS level_name_ar,
                        l.level_code,
                        ay.name AS academic_year_name
                    FROM pricing_plans pp
                    JOIN branches b ON pp.branch_id = b.branch_id
                    LEFT JOIN programs p ON pp.program_id = p.program_id
                    LEFT JOIN levels l ON pp.level_id = l.level_id
                    JOIN academic_years ay ON pp.academic_year_id = ay.academic_year_id
                    WHERE pp.pricing_plan_id = %s;
                """
                cursor.execute(query, (pricing_plan_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching pricing plan ID {pricing_plan_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        academic_year_id: int,
        plan_name: str,
        program_id: Optional[int] = None,
        level_id: Optional[int] = None,
        standard_installment_price: float = 0.0,
        cash_discount: float = 500.0,
        sibling_discount: float = 500.0,
        annual_prepaid_discount: float = 0.0,
        monthly_standard_rate: float = 0.0,
        registration_fee: float = 0.0,
        installments_count: int = 4,
        notes: Optional[str] = None,
        is_active: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Creates a new pricing plan matrix."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                INSERT INTO pricing_plans (
                    branch_id, academic_year_id, plan_name, program_id, level_id,
                    standard_installment_price, cash_discount, sibling_discount,
                    annual_prepaid_discount, monthly_standard_rate, registration_fee,
                    installments_count, notes, is_active
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """
                cursor.execute(
                    query,
                    (
                        branch_id.strip(),
                        academic_year_id,
                        plan_name.strip(),
                        program_id,
                        level_id,
                        standard_installment_price,
                        cash_discount,
                        sibling_discount,
                        annual_prepaid_discount,
                        monthly_standard_rate,
                        registration_fee,
                        installments_count,
                        notes.strip() if notes else None,
                        is_active,
                    ),
                )
                conn.commit()
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating pricing plan '{plan_name}': {e}")
            return None

    def update(self, pricing_plan_id: int, **kwargs) -> bool:
        """Dynamically updates safe mutable pricing parameters."""
        allowed = {
            "branch_id", "program_id", "level_id", "academic_year_id", "plan_name",
            "standard_installment_price", "cash_discount", "sibling_discount",
            "annual_prepaid_discount", "monthly_standard_rate", "registration_fee",
            "installments_count", "notes", "is_active"
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return False

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                set_clauses = [f"{k} = %s" for k in updates.keys()]
                values = list(updates.values()) + [pricing_plan_id]
                query = f"UPDATE pricing_plans SET {', '.join(set_clauses)} WHERE pricing_plan_id = %s;"
                cursor.execute(query, values)
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error updating pricing plan ID {pricing_plan_id}: {e}")
            return False

    def toggle_status(self, pricing_plan_id: int, is_active: bool) -> bool:
        """Enables or disables a pricing plan."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "UPDATE pricing_plans SET is_active = %s WHERE pricing_plan_id = %s;"
                cursor.execute(query, (is_active, pricing_plan_id))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error toggling status for pricing plan ID {pricing_plan_id}: {e}")
            return False

    def delete(self, pricing_plan_id: int) -> bool:
        """Deletes a pricing plan record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = "DELETE FROM pricing_plans WHERE pricing_plan_id = %s;"
                cursor.execute(query, (pricing_plan_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting pricing plan ID {pricing_plan_id}: {e}")
            return False

    def calculate_effective_price(
        self,
        pricing_plan_id: int,
        is_cash_upfront: bool = False,
        is_sibling: bool = False,
        is_annual_package: bool = False,
    ) -> Optional[Dict[str, Any]]:
        """
        Calculates exact fee breakdown and discounts based on plan configuration and enrollment conditions.
        """
        plan = self.get_by_id(pricing_plan_id)
        if not plan:
            return None

        installment_price = float(plan.get("standard_installment_price") or 0.0)
        installments_count = int(plan.get("installments_count") or 1)
        registration_fee = float(plan.get("registration_fee") or 0.0)
        monthly_rate = float(plan.get("monthly_standard_rate") or 0.0)

        # Calculate base tuition
        if installment_price > 0:
            base_tuition = installment_price * installments_count
        else:
            base_tuition = monthly_rate

        # Calculate applicable discounts
        cash_disc = float(plan.get("cash_discount") or 0.0) if is_cash_upfront else 0.0
        sibling_disc = float(plan.get("sibling_discount") or 0.0) if is_sibling else 0.0
        annual_disc = float(plan.get("annual_prepaid_discount") or 0.0) if is_annual_package else 0.0
        total_discount = cash_disc + sibling_disc + annual_disc

        agreed_total = max(0.0, base_tuition - total_discount + registration_fee)

        return {
            "pricing_plan_id": pricing_plan_id,
            "plan_name": plan.get("plan_name"),
            "base_tuition_fee": base_tuition,
            "registration_fee": registration_fee,
            "discounts": {
                "cash_discount": cash_disc,
                "sibling_discount": sibling_disc,
                "annual_discount": annual_disc,
                "total_discount": total_discount,
            },
            "agreed_total_amount": agreed_total,
            "installments_count": installments_count,
            "installment_amount": round((agreed_total - registration_fee) / max(1, installments_count), 2) if installments_count > 0 else agreed_total,
        }
