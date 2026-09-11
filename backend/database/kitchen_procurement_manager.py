"""
backend/database/kitchen_procurement_manager.py
-----------------------------------------------
Data Access Managers for:
  - 'daily_bread_logs' (سجل استهلاك الخبز اليومي للروضة)
  - 'provisions_orders' (طلبيات المواد التموينية والغذائية الأسبوعية والشهرية)
  - 'KitchenProcurementManager' (Consolidated facade for daycare cafeteria procurement and kitchen KPIs)
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


DAY_NAME_MAP_AR = {
    0: "الإثنين",
    1: "الثلاثاء",
    2: "الأربعاء",
    3: "الخميس",
    4: "الجمعة",
    5: "السبت",
    6: "الأحد",
}

VALID_DAYS_OF_WEEK = {
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
    "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
}

VALID_UNIT_MEASURES = {
    "Kg", "Piece", "Tray", "Bottle", "Pack", "Box", "Liter"
}


# =============================================================================
# 1. DAILY BREAD LOG MANAGER
# =============================================================================

class DailyBreadLogManager:
    """
    Manages daily bread deliveries, meal assignments, and bakery expenses.
    """

    SAFE_COLUMNS = (
        "b.bread_log_id, b.branch_id, b.log_date, b.day_of_week, b.scheduled_meal, "
        "b.loaf_count, b.unit_price, (b.loaf_count * b.unit_price) AS total_cost, "
        "b.supplier_name, b.remarks, b.created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    @staticmethod
    def derive_day_of_week(target_date: Any, preferred_lang: str = "ar") -> str:
        """Derives day name string in Arabic or English from date."""
        if isinstance(target_date, str):
            try:
                target_date = datetime.strptime(target_date[:10], "%Y-%m-%d").date()
            except ValueError:
                target_date = date.today()
        elif not hasattr(target_date, "weekday"):
            target_date = date.today()

        if preferred_lang == "ar":
            return DAY_NAME_MAP_AR.get(target_date.weekday(), "الأحد")
        return target_date.strftime("%A")

    def get_all(
        self,
        branch_id: Optional[str] = None,
        date_from: Optional[Any] = None,
        date_to: Optional[Any] = None,
        supplier_name: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves bread logs with joined branch names."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        br.name_ar AS branch_name_ar,
                        br.name_en AS branch_name_en
                    FROM daily_bread_logs b
                    JOIN branches br ON b.branch_id = br.branch_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND b.branch_id = %s"
                    params.append(branch_id.strip())
                if date_from:
                    query += " AND b.log_date >= %s"
                    params.append(date_from)
                if date_to:
                    query += " AND b.log_date <= %s"
                    params.append(date_to)
                if supplier_name:
                    query += " AND b.supplier_name ILIKE %s"
                    params.append(f"%{supplier_name.strip()}%")

                query += " ORDER BY b.log_date DESC, b.bread_log_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching daily bread logs: {e}")
            return []

    def get_by_id(self, bread_log_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single bread log record by ID."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        br.name_ar AS branch_name_ar,
                        br.name_en AS branch_name_en
                    FROM daily_bread_logs b
                    JOIN branches br ON b.branch_id = br.branch_id
                    WHERE b.bread_log_id = %s;
                """
                cursor.execute(query, (bread_log_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching bread log ID {bread_log_id}: {e}")
            return None

    def get_by_date(self, branch_id: str, log_date: Any) -> Optional[Dict[str, Any]]:
        """Retrieves daily bread log for a branch and specific date."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        br.name_ar AS branch_name_ar
                    FROM daily_bread_logs b
                    JOIN branches br ON b.branch_id = br.branch_id
                    WHERE b.branch_id = %s AND b.log_date = %s;
                """
                cursor.execute(query, (branch_id.strip(), log_date))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching bread log for branch {branch_id} on {log_date}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        log_date: Any,
        scheduled_meal: str,
        loaf_count: int,
        unit_price: float = 15.00,
        day_of_week: Optional[str] = None,
        supplier_name: Optional[str] = None,
        remarks: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a daily bread log entry. Auto-derives day_of_week if not provided.
        """
        if loaf_count < 0 or unit_price < 0:
            logger.error("Loaf count and unit price must be non-negative.")
            return None

        clean_branch = branch_id.strip()
        meal_name = scheduled_meal.strip()

        # Derive or validate day_of_week
        if not day_of_week or day_of_week.strip() not in VALID_DAYS_OF_WEEK:
            day_str = self.derive_day_of_week(log_date, preferred_lang="ar")
        else:
            day_str = day_of_week.strip()

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO daily_bread_logs (
                        branch_id, log_date, day_of_week, scheduled_meal,
                        loaf_count, unit_price, supplier_name, remarks
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        bread_log_id, branch_id, log_date, day_of_week,
                        scheduled_meal, loaf_count, unit_price,
                        (loaf_count * unit_price) AS total_cost,
                        supplier_name, remarks, created_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        log_date,
                        day_str,
                        meal_name,
                        int(loaf_count),
                        float(unit_price),
                        supplier_name.strip() if supplier_name else None,
                        remarks.strip() if remarks else None,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating bread log for branch {branch_id} on {log_date}: {e}")
            return None

    def update(
        self,
        bread_log_id: int,
        scheduled_meal: Optional[str] = None,
        loaf_count: Optional[int] = None,
        unit_price: Optional[float] = None,
        supplier_name: Optional[str] = None,
        remarks: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates fields of an existing bread log."""
        fields: List[str] = []
        params: List[Any] = []

        if scheduled_meal is not None:
            fields.append("scheduled_meal = %s")
            params.append(scheduled_meal.strip())
        if loaf_count is not None:
            if loaf_count < 0:
                return None
            fields.append("loaf_count = %s")
            params.append(int(loaf_count))
        if unit_price is not None:
            if unit_price < 0:
                return None
            fields.append("unit_price = %s")
            params.append(float(unit_price))
        if supplier_name is not None:
            fields.append("supplier_name = %s")
            params.append(supplier_name.strip() if supplier_name else None)
        if remarks is not None:
            fields.append("remarks = %s")
            params.append(remarks.strip() if remarks else None)

        if not fields:
            return self.get_by_id(bread_log_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    UPDATE daily_bread_logs
                    SET {', '.join(fields)}
                    WHERE bread_log_id = %s
                    RETURNING 
                        bread_log_id, branch_id, log_date, day_of_week,
                        scheduled_meal, loaf_count, unit_price,
                        (loaf_count * unit_price) AS total_cost,
                        supplier_name, remarks, created_at;
                """
                params.append(bread_log_id)
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating bread log ID {bread_log_id}: {e}")
            return None

    def delete(self, bread_log_id: int) -> bool:
        """Deletes a bread log entry."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM daily_bread_logs WHERE bread_log_id = %s;", (bread_log_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting bread log ID {bread_log_id}: {e}")
            return False

    def get_monthly_summary(self, branch_id: str, month_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates monthly bread consumption, total cost, average cost per day,
        and meal distribution breakdown.
        """
        clean_branch = branch_id.strip()
        month = month_code.strip() if month_code else date.today().strftime("%Y-%m")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Aggregate metrics
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) AS total_recorded_days,
                        COALESCE(SUM(loaf_count), 0) AS total_loaves,
                        COALESCE(SUM(loaf_count * unit_price), 0.00) AS total_bread_cost,
                        COALESCE(AVG(loaf_count), 0.0) AS avg_loaves_per_day
                    FROM daily_bread_logs
                    WHERE branch_id = %s AND TO_CHAR(log_date, 'YYYY-MM') = %s;
                    """,
                    (clean_branch, month),
                )
                totals = _dict_fetchone(cursor) or {}

                # Scheduled meal breakdown
                cursor.execute(
                    """
                    SELECT 
                        scheduled_meal,
                        COUNT(*) AS meal_days_count,
                        COALESCE(SUM(loaf_count), 0) AS meal_loaves,
                        COALESCE(SUM(loaf_count * unit_price), 0.00) AS meal_cost
                    FROM daily_bread_logs
                    WHERE branch_id = %s AND TO_CHAR(log_date, 'YYYY-MM') = %s
                    GROUP BY scheduled_meal
                    ORDER BY meal_cost DESC;
                    """,
                    (clean_branch, month),
                )
                meals_breakdown = _dict_fetchall(cursor)

                return {
                    "branch_id": clean_branch,
                    "month_code": month,
                    "total_recorded_days": totals.get("total_recorded_days", 0),
                    "total_loaves": totals.get("total_loaves", 0),
                    "total_bread_cost": float(totals.get("total_bread_cost") or 0.0),
                    "avg_loaves_per_day": round(float(totals.get("avg_loaves_per_day") or 0.0), 1),
                    "meals_breakdown": meals_breakdown,
                }
        except Exception as e:
            logger.error(f"Error computing bread monthly summary for {branch_id} ({month}): {e}")
            return {
                "branch_id": clean_branch,
                "month_code": month,
                "total_recorded_days": 0,
                "total_loaves": 0,
                "total_bread_cost": 0.0,
                "avg_loaves_per_day": 0.0,
                "meals_breakdown": [],
            }


# =============================================================================
# 2. PROVISIONS ORDER MANAGER
# =============================================================================

class ProvisionsOrderManager:
    """
    Manages kitchen food provisions orders (vegetables, meat, dairy, dry goods)
    with weekly scheduling and optional link to operational expenses.
    """

    SAFE_COLUMNS = (
        "p.order_id, p.branch_id, p.order_date, p.order_month, p.week_number, "
        "p.item_category, p.quantity, p.unit_measure, p.unit_price, "
        "(p.quantity * p.unit_price) AS total_amount, "
        "p.supplier_name, p.expense_id, p.notes, p.created_at"
    )

    def __init__(self, db_instance):
        self.db = db_instance

    @staticmethod
    def derive_week_number(order_date: Any) -> int:
        """Derives month week number (1 to 5) from calendar day."""
        if isinstance(order_date, str):
            try:
                order_date = datetime.strptime(order_date[:10], "%Y-%m-%d").date()
            except ValueError:
                order_date = date.today()
        elif not hasattr(order_date, "day"):
            order_date = date.today()

        return min(5, max(1, (order_date.day - 1) // 7 + 1))

    def get_all(
        self,
        branch_id: Optional[str] = None,
        order_month: Optional[str] = None,
        week_number: Optional[int] = None,
        item_category: Optional[str] = None,
        supplier_name: Optional[str] = None,
        has_expense: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """Retrieves provisions orders with joined branch and expense voucher numbers."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        br.name_ar AS branch_name_ar,
                        br.name_en AS branch_name_en,
                        e.voucher_number AS expense_voucher_number,
                        e.payment_method AS expense_payment_method
                    FROM provisions_orders p
                    JOIN branches br ON p.branch_id = br.branch_id
                    LEFT JOIN expenses e ON p.expense_id = e.expense_id
                    WHERE 1=1
                """
                params: List[Any] = []

                if branch_id:
                    query += " AND p.branch_id = %s"
                    params.append(branch_id.strip())
                if order_month:
                    query += " AND p.order_month = %s"
                    params.append(order_month.strip())
                if week_number is not None:
                    query += " AND p.week_number = %s"
                    params.append(week_number)
                if item_category:
                    query += " AND p.item_category ILIKE %s"
                    params.append(f"%{item_category.strip()}%")
                if supplier_name:
                    query += " AND p.supplier_name ILIKE %s"
                    params.append(f"%{supplier_name.strip()}%")
                if has_expense is not None:
                    if has_expense:
                        query += " AND p.expense_id IS NOT NULL"
                    else:
                        query += " AND p.expense_id IS NULL"

                query += " ORDER BY p.order_date DESC, p.order_id DESC LIMIT %s OFFSET %s;"
                params.extend([max(1, limit), max(0, offset)])

                cursor.execute(query, params)
                return _dict_fetchall(cursor)
        except Exception as e:
            logger.error(f"Error fetching provisions orders: {e}")
            return []

    def get_by_id(self, order_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves single provisions order details with joined expense metadata."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    SELECT 
                        {self.SAFE_COLUMNS},
                        br.name_ar AS branch_name_ar,
                        br.name_en AS branch_name_en,
                        e.voucher_number AS expense_voucher_number,
                        e.amount AS expense_amount,
                        e.payment_method AS expense_payment_method
                    FROM provisions_orders p
                    JOIN branches br ON p.branch_id = br.branch_id
                    LEFT JOIN expenses e ON p.expense_id = e.expense_id
                    WHERE p.order_id = %s;
                """
                cursor.execute(query, (order_id,))
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error fetching provisions order ID {order_id}: {e}")
            return None

    def create(
        self,
        branch_id: str,
        order_date: Any,
        item_category: str,
        quantity: float,
        unit_price: float,
        unit_measure: str = "Kg",
        order_month: Optional[str] = None,
        week_number: Optional[int] = None,
        supplier_name: Optional[str] = None,
        expense_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Creates a kitchen food provisions order record.
        Auto-derives order_month (YYYY-MM) and week_number (1-5) if omitted.
        """
        if quantity <= 0 or unit_price < 0:
            logger.error("Quantity must be positive and unit price non-negative.")
            return None

        clean_branch = branch_id.strip()
        category = item_category.strip()
        unit = unit_measure.strip() if unit_measure and unit_measure.strip() in VALID_UNIT_MEASURES else "Kg"

        # Derive month
        if not order_month:
            if hasattr(order_date, "strftime"):
                final_month = order_date.strftime("%Y-%m")
            else:
                final_month = str(order_date)[:7]
        else:
            final_month = order_month.strip()

        # Derive week number (1 to 5)
        if week_number is None or week_number < 1 or week_number > 5:
            final_week = self.derive_week_number(order_date)
        else:
            final_week = int(week_number)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = """
                    INSERT INTO provisions_orders (
                        branch_id, order_date, order_month, week_number,
                        item_category, quantity, unit_measure, unit_price,
                        supplier_name, expense_id, notes
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING 
                        order_id, branch_id, order_date, order_month,
                        week_number, item_category, quantity, unit_measure,
                        unit_price, (quantity * unit_price) AS total_amount,
                        supplier_name, expense_id, notes, created_at;
                """
                cursor.execute(
                    query,
                    (
                        clean_branch,
                        order_date,
                        final_month,
                        final_week,
                        category,
                        float(quantity),
                        unit,
                        float(unit_price),
                        supplier_name.strip() if supplier_name else None,
                        expense_id,
                        notes.strip() if notes else None,
                    ),
                )
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error creating provisions order for branch {branch_id}: {e}")
            return None

    def update(
        self,
        order_id: int,
        item_category: Optional[str] = None,
        quantity: Optional[float] = None,
        unit_measure: Optional[str] = None,
        unit_price: Optional[float] = None,
        supplier_name: Optional[str] = None,
        expense_id: Optional[int] = None,
        notes: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """Updates fields of an existing provisions order."""
        fields: List[str] = []
        params: List[Any] = []

        if item_category is not None:
            fields.append("item_category = %s")
            params.append(item_category.strip())
        if quantity is not None:
            if quantity <= 0:
                return None
            fields.append("quantity = %s")
            params.append(float(quantity))
        if unit_measure is not None:
            unit = unit_measure.strip() if unit_measure.strip() in VALID_UNIT_MEASURES else "Kg"
            fields.append("unit_measure = %s")
            params.append(unit)
        if unit_price is not None:
            if unit_price < 0:
                return None
            fields.append("unit_price = %s")
            params.append(float(unit_price))
        if supplier_name is not None:
            fields.append("supplier_name = %s")
            params.append(supplier_name.strip() if supplier_name else None)
        if expense_id is not None:
            fields.append("expense_id = %s")
            params.append(expense_id if expense_id > 0 else None)
        if notes is not None:
            fields.append("notes = %s")
            params.append(notes.strip() if notes else None)

        if not fields:
            return self.get_by_id(order_id)

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                query = f"""
                    UPDATE provisions_orders
                    SET {', '.join(fields)}
                    WHERE order_id = %s
                    RETURNING 
                        order_id, branch_id, order_date, order_month,
                        week_number, item_category, quantity, unit_measure,
                        unit_price, (quantity * unit_price) AS total_amount,
                        supplier_name, expense_id, notes, created_at;
                """
                params.append(order_id)
                cursor.execute(query, params)
                return _dict_fetchone(cursor)
        except Exception as e:
            logger.error(f"Error updating provisions order ID {order_id}: {e}")
            return None

    def delete(self, order_id: int) -> bool:
        """Deletes a provisions order record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM provisions_orders WHERE order_id = %s;", (order_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error deleting provisions order ID {order_id}: {e}")
            return False

    def link_expense(self, order_id: int, expense_id: Optional[int]) -> bool:
        """Links or unlinks an order with an operational expense record."""
        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE provisions_orders
                    SET expense_id = %s
                    WHERE order_id = %s;
                    """,
                    (expense_id if expense_id and expense_id > 0 else None, order_id),
                )
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Error linking order ID {order_id} to expense ID {expense_id}: {e}")
            return False

    def get_monthly_summary(self, branch_id: str, order_month: Optional[str] = None) -> Dict[str, Any]:
        """
        Aggregates monthly provisions expenditure, breakdown by food category,
        and weekly expenditure trends (Week 1 through 5).
        """
        clean_branch = branch_id.strip()
        month = order_month.strip() if order_month else date.today().strftime("%Y-%m")

        try:
            with self.db.get_db_connection() as conn:
                cursor = conn.cursor()

                # Overall monthly totals
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) AS total_orders_count,
                        COALESCE(SUM(quantity * unit_price), 0.00) AS total_provisions_cost,
                        COUNT(DISTINCT supplier_name) AS active_suppliers_count
                    FROM provisions_orders
                    WHERE branch_id = %s AND order_month = %s;
                    """,
                    (clean_branch, month),
                )
                totals = _dict_fetchone(cursor) or {}

                # Category breakdown
                cursor.execute(
                    """
                    SELECT 
                        item_category,
                        COUNT(*) AS items_count,
                        COALESCE(SUM(quantity), 0.00) AS total_quantity,
                        COALESCE(SUM(quantity * unit_price), 0.00) AS category_cost
                    FROM provisions_orders
                    WHERE branch_id = %s AND order_month = %s
                    GROUP BY item_category
                    ORDER BY category_cost DESC;
                    """,
                    (clean_branch, month),
                )
                categories_breakdown = _dict_fetchall(cursor)

                # Weekly breakdown (Weeks 1 to 5)
                cursor.execute(
                    """
                    SELECT 
                        week_number,
                        COUNT(*) AS weekly_orders,
                        COALESCE(SUM(quantity * unit_price), 0.00) AS weekly_cost
                    FROM provisions_orders
                    WHERE branch_id = %s AND order_month = %s
                    GROUP BY week_number
                    ORDER BY week_number ASC;
                    """,
                    (clean_branch, month),
                )
                weekly_breakdown = _dict_fetchall(cursor)

                return {
                    "branch_id": clean_branch,
                    "order_month": month,
                    "total_orders_count": totals.get("total_orders_count", 0),
                    "total_provisions_cost": float(totals.get("total_provisions_cost") or 0.0),
                    "active_suppliers_count": totals.get("active_suppliers_count", 0),
                    "categories_breakdown": categories_breakdown,
                    "weekly_breakdown": weekly_breakdown,
                }
        except Exception as e:
            logger.error(f"Error computing provisions monthly summary for {branch_id} ({month}): {e}")
            return {
                "branch_id": clean_branch,
                "order_month": month,
                "total_orders_count": 0,
                "total_provisions_cost": 0.0,
                "active_suppliers_count": 0,
                "categories_breakdown": [],
                "weekly_breakdown": [],
            }


# =============================================================================
# 3. KITCHEN PROCUREMENT FACADE MANAGER
# =============================================================================

class KitchenProcurementManager:
    """
    Consolidated Facade coordinator for Daycare Cafeteria Kitchen operations.
    Coordinates daily bread delivery tracking and weekly bulk provisions.
    """

    def __init__(self, db_instance):
        self.db = db_instance
        self.bread = DailyBreadLogManager(db_instance)
        self.provisions = ProvisionsOrderManager(db_instance)

    def get_cafeteria_dashboard(self, branch_id: str, month_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Executive Cafeteria KPI Dashboard combining bread deliveries, food provisions orders,
        and overall kitchen procurement expenditure.
        """
        clean_branch = branch_id.strip()
        month = month_code.strip() if month_code else date.today().strftime("%Y-%m")

        bread_summary = self.bread.get_monthly_summary(clean_branch, month)
        provisions_summary = self.provisions.get_monthly_summary(clean_branch, month)

        total_kitchen_expenditure = (
            bread_summary.get("total_bread_cost", 0.0) +
            provisions_summary.get("total_provisions_cost", 0.0)
        )

        return {
            "branch_id": clean_branch,
            "month_code": month,
            "total_kitchen_expenditure": round(total_kitchen_expenditure, 2),
            "bread": {
                "total_days": bread_summary.get("total_recorded_days", 0),
                "total_loaves": bread_summary.get("total_loaves", 0),
                "total_cost": bread_summary.get("total_bread_cost", 0.0),
                "avg_loaves_per_day": bread_summary.get("avg_loaves_per_day", 0.0),
                "meals_breakdown": bread_summary.get("meals_breakdown", []),
            },
            "provisions": {
                "total_orders": provisions_summary.get("total_orders_count", 0),
                "total_cost": provisions_summary.get("total_provisions_cost", 0.0),
                "categories_breakdown": provisions_summary.get("categories_breakdown", []),
                "weekly_breakdown": provisions_summary.get("weekly_breakdown", []),
            },
        }
