"""
backend/database/base/views_indexes.py
---------------------------------------
SQL View and Index definitions for reporting optimization and search acceleration.
"""

# =====================================================================================
# REPORTING VIEWS (EXCEL EMULATION & LIVE CONSOLIDATION)
# =====================================================================================
VIEW_QUERIES = [
    """
    CREATE OR REPLACE VIEW v_active_student_roster AS
    SELECT 
        s.student_id,
        s.student_code,
        s.full_name_ar,
        s.full_name_fr,
        s.birth_date,
        b.name_ar AS branch_name,
        p.name_ar AS program_name,
        l.level_code,
        l.name_ar AS level_name,
        l.color_tag AS belt_color,
        g.group_name,
        e.full_name AS lead_instructor,
        se.agreed_total_amount,
        se.payment_mode,
        se.enrollment_status
    FROM student_enrollments se
    JOIN students s ON se.student_id = s.student_id
    JOIN groups g ON se.group_id = g.group_id
    JOIN levels l ON g.level_id = l.level_id
    JOIN programs p ON l.program_id = p.program_id
    JOIN branches b ON p.branch_id = b.branch_id
    LEFT JOIN employees e ON g.lead_teacher_id = e.employee_id
    WHERE se.enrollment_status = 'ACTIVE';
    """,
    """
    CREATE OR REPLACE VIEW v_soroban_master_registry AS
    SELECT 
        COALESCE(s.legacy_seq_number, s.student_id) AS seq_number,
        s.full_name_ar,
        s.full_name_fr,
        e.full_name AS coach_name,
        l.level_code,
        se.agreed_total_amount AS total_fee_due,
        MAX(CASE WHEN inv.installment_number = 1 THEN inv.amount_paid END) AS installment_1_amount,
        MAX(CASE WHEN inv.installment_number = 1 THEN pay.receipt_number END) AS installment_1_receipt,
        MAX(CASE WHEN inv.installment_number = 2 THEN inv.amount_paid END) AS installment_2_amount,
        MAX(CASE WHEN inv.installment_number = 2 THEN pay.receipt_number END) AS installment_2_receipt,
        MAX(CASE WHEN inv.installment_number = 3 THEN inv.amount_paid END) AS installment_3_amount,
        MAX(CASE WHEN inv.installment_number = 3 THEN pay.receipt_number END) AS installment_3_receipt,
        MAX(CASE WHEN inv.installment_number = 4 THEN inv.amount_paid END) AS installment_4_amount,
        MAX(CASE WHEN inv.installment_number = 4 THEN pay.receipt_number END) AS installment_4_receipt,
        COALESCE(SUM(pay.amount), 0.00) AS total_paid,
        (se.agreed_total_amount - COALESCE(SUM(pay.amount), 0.00)) AS remaining_balance,
        se.notes
    FROM student_enrollments se
    JOIN students s ON se.student_id = s.student_id
    JOIN groups g ON se.group_id = g.group_id
    JOIN levels l ON g.level_id = l.level_id
    JOIN programs p ON l.program_id = p.program_id AND p.code = 'SOROBAN'
    LEFT JOIN employees e ON g.lead_teacher_id = e.employee_id
    LEFT JOIN invoices inv ON se.enrollment_id = inv.enrollment_id
    LEFT JOIN payments pay ON inv.invoice_id = pay.invoice_id
    GROUP BY 
        s.legacy_seq_number, s.student_id, s.full_name_ar, s.full_name_fr, 
        e.full_name, l.level_code, se.agreed_total_amount, se.notes;
    """,
    """
    CREATE OR REPLACE VIEW v_daycare_monthly_roster AS
    SELECT 
        COALESCE(s.legacy_seq_number, s.student_id) AS child_seq_number,
        COALESCE(l.age_group_cohort, l.name_ar) AS age_group,
        s.full_name_ar AS child_full_name,
        se.registration_fee_amount AS registration_fee,
        CASE WHEN se.has_annual_package THEN se.agreed_total_amount ELSE NULL END AS annual_package_fee,
        CASE WHEN se.has_annual_package THEN 0.00 ELSE pp.monthly_standard_rate END AS monthly_due_amount,
        MAX(CASE WHEN inv.period_label ILIKE '%سبتمبر%' OR inv.period_label ILIKE '%september%' THEN inv.amount_paid END) AS payment_september,
        MAX(CASE WHEN inv.period_label ILIKE '%أكتوبر%' OR inv.period_label ILIKE '%october%' THEN inv.amount_paid END) AS payment_october,
        MAX(CASE WHEN inv.period_label ILIKE '%نوفمبر%' OR inv.period_label ILIKE '%november%' THEN inv.amount_paid END) AS payment_november,
        MAX(CASE WHEN inv.period_label ILIKE '%ديسمبر%' OR inv.period_label ILIKE '%december%' THEN inv.amount_paid END) AS payment_december,
        MAX(CASE WHEN inv.period_label ILIKE '%جانفي%' OR inv.period_label ILIKE '%january%' THEN inv.amount_paid END) AS payment_january,
        MAX(CASE WHEN inv.period_label ILIKE '%فيفري%' OR inv.period_label ILIKE '%february%' THEN inv.amount_paid END) AS payment_february,
        MAX(CASE WHEN inv.period_label ILIKE '%مارس%' OR inv.period_label ILIKE '%march%' THEN inv.amount_paid END) AS payment_march,
        MAX(CASE WHEN inv.period_label ILIKE '%أفريل%' OR inv.period_label ILIKE '%april%' THEN inv.amount_paid END) AS payment_april,
        MAX(CASE WHEN inv.period_label ILIKE '%ماي%' OR inv.period_label ILIKE '%may%' THEN inv.amount_paid END) AS payment_may,
        MAX(CASE WHEN inv.period_label ILIKE '%جوان%' OR inv.period_label ILIKE '%june%' THEN inv.amount_paid END) AS payment_june,
        MAX(CASE WHEN inv.period_label ILIKE '%جويلية%' OR inv.period_label ILIKE '%july%' THEN inv.amount_paid END) AS payment_july,
        COALESCE(SUM(pay.amount), 0.00) AS total_paid,
        (se.agreed_total_amount - COALESCE(SUM(pay.amount), 0.00)) AS balance
    FROM student_enrollments se
    JOIN students s ON se.student_id = s.student_id
    JOIN groups g ON se.group_id = g.group_id
    JOIN levels l ON g.level_id = l.level_id
    JOIN programs p ON l.program_id = p.program_id AND p.code = 'DAYCARE'
    LEFT JOIN pricing_plans pp ON se.pricing_plan_id = pp.pricing_plan_id
    LEFT JOIN invoices inv ON se.enrollment_id = inv.enrollment_id
    LEFT JOIN payments pay ON inv.invoice_id = pay.invoice_id
    GROUP BY 
        s.legacy_seq_number, s.student_id, l.age_group_cohort, l.name_ar, 
        s.full_name_ar, se.registration_fee_amount, se.has_annual_package, 
        se.agreed_total_amount, pp.monthly_standard_rate;
    """,
    """
    CREATE OR REPLACE VIEW v_daily_cash_reconciliation AS
    SELECT 
        r.register_id,
        r.branch_id,
        b.name_ar AS branch_name,
        r.register_date,
        r.opening_balance,
        r.total_revenues,
        r.total_expenses,
        r.total_remitted,
        r.closing_balance,
        r.actual_cash_counted,
        r.discrepancy,
        r.is_closed,
        e.full_name AS reconciled_by_name,
        r.notes
    FROM daily_cash_registers r
    JOIN branches b ON r.branch_id = b.branch_id
    LEFT JOIN employees e ON r.reconciled_by = e.employee_id;
    """,
    """
    CREATE OR REPLACE VIEW v_monthly_staff_payroll AS
    SELECT 
        pr.payroll_run_id,
        pr.branch_id,
        pr.month_period,
        e.employee_code,
        e.full_name AS employee_name,
        e.role,
        e.compensation_model,
        pi.base_amount,
        pi.headcount_count,
        pi.headcount_bonus,
        pi.session_count,
        pi.variable_session_amount,
        pi.overtime_or_allowance,
        pi.deductions,
        pi.net_payout,
        pi.payment_voucher_no,
        pi.disbursement_date,
        pr.status AS run_status
    FROM payroll_items pi
    JOIN payroll_runs pr ON pi.payroll_run_id = pr.payroll_run_id
    JOIN employees e ON pi.employee_id = e.employee_id;
    """,
    """
    CREATE OR REPLACE VIEW v_kitchen_provisions_monthly_summary AS
    SELECT 
        po.branch_id,
        po.order_month,
        po.item_category,
        COUNT(po.order_id) AS total_orders,
        SUM(po.quantity) AS total_quantity,
        po.unit_measure,
        AVG(po.unit_price) AS average_unit_price,
        SUM(po.total_amount) AS total_spent
    FROM provisions_orders po
    GROUP BY po.branch_id, po.order_month, po.item_category, po.unit_measure;
    """
]

# =====================================================================================
# PERFORMANCE & SEARCH ACCELERATION INDEXES
# =====================================================================================
INDEX_QUERIES = [
    "CREATE INDEX IF NOT EXISTS idx_classrooms_branch ON classrooms(branch_id);",
    "CREATE INDEX IF NOT EXISTS idx_programs_branch ON programs(branch_id);",
    "CREATE INDEX IF NOT EXISTS idx_levels_program ON levels(program_id);",
    "CREATE INDEX IF NOT EXISTS idx_pricing_lookup ON pricing_plans(branch_id, level_id, academic_year_id);",
    "CREATE INDEX IF NOT EXISTS idx_employees_branch_role ON employees(branch_id, role);",
    "CREATE INDEX IF NOT EXISTS idx_coach_wage_lookup ON coach_wage_matrices(program_id, level_id, part_number);",
    "CREATE INDEX IF NOT EXISTS idx_groups_level_year ON groups(level_id, academic_year_id);",
    "CREATE INDEX IF NOT EXISTS idx_groups_teacher ON groups(lead_teacher_id);",
    "CREATE INDEX IF NOT EXISTS idx_schedules_group ON group_schedules(group_id);",
    "CREATE INDEX IF NOT EXISTS idx_sessions_group_date ON completed_sessions(group_id, session_date);",
    "CREATE INDEX IF NOT EXISTS idx_sessions_instructor ON completed_sessions(instructor_id);",
    "CREATE INDEX IF NOT EXISTS idx_attendance_session ON student_attendance(session_id);",
    "CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);",
    "CREATE INDEX IF NOT EXISTS idx_enrollments_group ON student_enrollments(group_id);",
    "CREATE INDEX IF NOT EXISTS idx_invoices_enrollment ON invoices(enrollment_id);",
    "CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);",
    "CREATE INDEX IF NOT EXISTS idx_payments_register ON payments(register_id);",
    "CREATE INDEX IF NOT EXISTS idx_handovers_register ON cash_handovers(register_id);",
    "CREATE INDEX IF NOT EXISTS idx_expenses_register ON expenses(register_id);",
    "CREATE INDEX IF NOT EXISTS idx_expenses_category_month ON expenses(branch_id, category_id, month_code);",
    "CREATE INDEX IF NOT EXISTS idx_budget_lookup ON budget_variances(branch_id, category_id, month_period);",
    "CREATE INDEX IF NOT EXISTS idx_bread_branch_date ON daily_bread_logs(branch_id, log_date);",
    "CREATE INDEX IF NOT EXISTS idx_provisions_branch_month ON provisions_orders(branch_id, order_month, week_number);",
    "CREATE INDEX IF NOT EXISTS idx_competitions_year ON competitions(branch_id, academic_year_id);",
    "CREATE INDEX IF NOT EXISTS idx_comp_reg_competition ON competition_registrations(competition_id);",
    "CREATE INDEX IF NOT EXISTS idx_payroll_items_run ON payroll_items(payroll_run_id);",
    "CREATE INDEX IF NOT EXISTS idx_payroll_items_emp ON payroll_items(employee_id);",
    "CREATE INDEX IF NOT EXISTS idx_students_name_ar ON students(full_name_ar);",
    "CREATE INDEX IF NOT EXISTS idx_students_name_fr ON students(full_name_fr);",
    "CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);",
    "CREATE INDEX IF NOT EXISTS idx_guardians_phone ON guardians(phone_primary);",
    "CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_number);",
    "CREATE INDEX IF NOT EXISTS idx_registers_branch_date ON daily_cash_registers(branch_id, register_date);",
    "CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);"
]
