"""
backend/database/base/tables.py
--------------------------------
SQL Table definitions (CREATE TABLE IF NOT EXISTS / Initial Catalog Seeds).
Each list is modular and decoupled, allowing individual domains to be extended or migrated.
"""

# =====================================================================================
# 1. CORE ORGANIZATIONAL INFRASTRUCTURE & MULTI-TENANCY
# =====================================================================================
CORE_INFRASTRUCTURE_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS branches (
        branch_id VARCHAR(20) PRIMARY KEY,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        branch_type VARCHAR(50) NOT NULL CHECK (branch_type IN ('ACADEMY', 'DAYCARE', 'HYBRID', 'OTHER')),
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS academic_years (
        academic_year_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_academic_year_dates CHECK (end_date > start_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS classrooms (
        classroom_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        name VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 20 CHECK (capacity > 0),
        floor_number SMALLINT DEFAULT 0,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, name)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) REFERENCES branches(branch_id) ON DELETE SET NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'STAFF' CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'DIRECTOR', 'TEACHER', 'STAFF', 'ACCOUNTANT')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 2. GUARDIANS & STUDENTS MASTER DIRECTORY (BILINGUAL)
# =====================================================================================
STUDENT_GUARDIAN_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS guardians (
        guardian_id SERIAL PRIMARY KEY,
        full_name_ar VARCHAR(150) NOT NULL,
        full_name_fr VARCHAR(150),
        phone_primary VARCHAR(30) NOT NULL,
        phone_secondary VARCHAR(30),
        relationship VARCHAR(50) NOT NULL DEFAULT 'Parent' CHECK (relationship IN ('Father', 'Mother', 'Guardian', 'Grandparent', 'Other')),
        national_id VARCHAR(50),
        address TEXT,
        email VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS students (
        student_id SERIAL PRIMARY KEY,
        student_code VARCHAR(50) UNIQUE,
        legacy_seq_number INTEGER,
        first_name VARCHAR(75),
        last_name VARCHAR(75),
        full_name_ar VARCHAR(150) NOT NULL,
        full_name_fr VARCHAR(150),
        birth_date DATE,
        gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'MALE', 'FEMALE')),
        blood_group VARCHAR(10),
        allergies TEXT,
        medical_notes TEXT,
        emergency_phone VARCHAR(30),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS student_guardians (
        student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        guardian_id INTEGER NOT NULL REFERENCES guardians(guardian_id) ON DELETE CASCADE,
        is_primary_guardian BOOLEAN NOT NULL DEFAULT TRUE,
        is_emergency_contact BOOLEAN NOT NULL DEFAULT TRUE,
        can_pickup BOOLEAN NOT NULL DEFAULT TRUE,
        relationship_type VARCHAR(50) DEFAULT 'Parent',
        PRIMARY KEY (student_id, guardian_id)
    );
    """
]

# =====================================================================================
# 3. EDUCATIONAL PROGRAMS, LEVELS & PRICING MATRIX
# =====================================================================================
PROGRAM_LEVEL_PRICING_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS programs (
        program_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        code VARCHAR(50) NOT NULL,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        billing_type VARCHAR(30) NOT NULL CHECK (billing_type IN ('INSTALLMENT_PLAN', 'MONTHLY_RECURRING', 'PER_SESSION', 'ONE_TIME_EVENT', 'ANNUAL_PACKAGE')),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, code)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS levels (
        level_id SERIAL PRIMARY KEY,
        program_id INTEGER NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
        level_code VARCHAR(50) NOT NULL,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        age_group_cohort VARCHAR(50),
        color_tag VARCHAR(50),
        sequence_order INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (program_id, level_code)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS pricing_plans (
        pricing_plan_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        program_id INTEGER REFERENCES programs(program_id) ON DELETE SET NULL,
        level_id INTEGER REFERENCES levels(level_id) ON DELETE SET NULL,
        academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
        plan_name VARCHAR(150) NOT NULL,
        standard_installment_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (standard_installment_price >= 0),
        cash_discount DECIMAL(10,2) NOT NULL DEFAULT 500.00 CHECK (cash_discount >= 0),
        sibling_discount DECIMAL(10,2) NOT NULL DEFAULT 500.00 CHECK (sibling_discount >= 0),
        annual_prepaid_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (annual_prepaid_discount >= 0),
        monthly_standard_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (monthly_standard_rate >= 0),
        registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (registration_fee >= 0),
        installments_count SMALLINT NOT NULL DEFAULT 4 CHECK (installments_count BETWEEN 1 AND 12),
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 4. HUMAN RESOURCES, FACULTY & COACH COMPENSATION
# =====================================================================================
HR_FACULTY_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS employees (
        employee_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        employee_code VARCHAR(50) UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        national_id VARCHAR(50),
        role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'DIRECTOR', 'SOROBAN_COACH', 'LANG_TEACHER', 'QURAN_TEACHER', 'PREP_TEACHER', 'SUPPORT_TEACHER', 'ROBOTICS_COACH', 'NANNY', 'COOK', 'CLEANER', 'SECURITY', 'DRIVER', 'OTHER')),
        compensation_model VARCHAR(50) NOT NULL CHECK (compensation_model IN ('FIXED_MONTHLY', 'PER_HEADCOUNT', 'PER_SESSION', 'HOURLY', 'HYBRID')),
        base_salary DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (base_salary >= 0),
        hire_date DATE,
        phone VARCHAR(30),
        email VARCHAR(100),
        bank_account_details TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS coach_wage_matrices (
        wage_matrix_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        program_id INTEGER NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
        level_id INTEGER REFERENCES levels(level_id) ON DELETE SET NULL,
        part_number SMALLINT NOT NULL DEFAULT 1 CHECK (part_number IN (1, 2)),
        min_students INTEGER NOT NULL DEFAULT 1 CHECK (min_students >= 0),
        max_students INTEGER CHECK (max_students >= min_students),
        rate_per_student DECIMAL(10,2) NOT NULL CHECK (rate_per_student >= 0),
        rate_per_session DECIMAL(10,2) DEFAULT 0.00 CHECK (rate_per_session >= 0),
        notes VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 5. GROUPS, SCHEDULES, ATTENDANCE & CONDUCTED SESSIONS
# =====================================================================================
GROUP_SCHEDULE_SESSION_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS groups (
        group_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        level_id INTEGER NOT NULL REFERENCES levels(level_id) ON DELETE RESTRICT,
        academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
        group_name VARCHAR(100) NOT NULL,
        lead_teacher_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        secondary_teacher_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        max_capacity INTEGER NOT NULL DEFAULT 18 CHECK (max_capacity > 0),
        current_headcount INTEGER NOT NULL DEFAULT 0 CHECK (current_headcount >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PLANNED', 'COMPLETED', 'MERGED', 'CANCELLED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, academic_year_id, group_name)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS group_schedules (
        schedule_id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
        classroom_id INTEGER NOT NULL REFERENCES classrooms(classroom_id) ON DELETE RESTRICT,
        day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت')),
        time_slot_label VARCHAR(50),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_schedule_times CHECK (end_time > start_time)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS completed_sessions (
        session_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
        instructor_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
        classroom_id INTEGER REFERENCES classrooms(classroom_id) ON DELETE SET NULL,
        session_date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        duration_hours DECIMAL(4,2) NOT NULL DEFAULT 2.0 CHECK (duration_hours > 0),
        shift_slot VARCHAR(50),
        attended_student_count INTEGER NOT NULL DEFAULT 0 CHECK (attended_student_count >= 0),
        calculated_wage DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (calculated_wage >= 0),
        is_counted_for_payroll BOOLEAN NOT NULL DEFAULT FALSE,
        payroll_item_id INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS student_attendance (
        attendance_id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES completed_sessions(session_id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')),
        points_scored INTEGER DEFAULT 0,
        evaluation_notes TEXT,
        UNIQUE (session_id, student_id)
    );
    """
]

# =====================================================================================
# 6. ENROLLMENTS & MULTI-TIER INVOICES
# =====================================================================================
ENROLLMENT_INVOICE_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS student_enrollments (
        enrollment_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
        group_id INTEGER REFERENCES groups(group_id) ON DELETE SET NULL,
        pricing_plan_id INTEGER REFERENCES pricing_plans(pricing_plan_id) ON DELETE RESTRICT,
        academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
        enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        payment_mode VARCHAR(30) NOT NULL DEFAULT 'INSTALLMENT' CHECK (payment_mode IN ('CASH_UPFRONT', 'INSTALLMENT', 'ANNUAL_PACKAGE', 'MONTHLY')),
        base_tuition_fee DECIMAL(10,2) NOT NULL CHECK (base_tuition_fee >= 0),
        has_sibling_discount BOOLEAN NOT NULL DEFAULT FALSE,
        has_cash_discount BOOLEAN NOT NULL DEFAULT FALSE,
        has_annual_package BOOLEAN NOT NULL DEFAULT FALSE,
        total_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total_discount_amount >= 0),
        registration_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (registration_fee_amount >= 0),
        agreed_total_amount DECIMAL(10,2) NOT NULL CHECK (agreed_total_amount >= 0),
        enrollment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (enrollment_status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'DROPPED')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, group_id, academic_year_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS invoices (
        invoice_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        enrollment_id INTEGER NOT NULL REFERENCES student_enrollments(enrollment_id) ON DELETE CASCADE,
        installment_number SMALLINT NOT NULL CHECK (installment_number >= 1),
        period_label VARCHAR(50) NOT NULL,
        due_date DATE,
        amount_due DECIMAL(10,2) NOT NULL CHECK (amount_due >= 0),
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
        remaining_balance DECIMAL(10,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED,
        status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (enrollment_id, installment_number, period_label)
    );
    """
]

# =====================================================================================
# 7. TREASURY, CASH DRAWERS, RECEIPTS & REMITTANCES
# =====================================================================================
TREASURY_CASH_DRAWER_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS daily_cash_registers (
        register_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        register_date DATE NOT NULL,
        opening_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (opening_balance >= 0),
        total_revenues DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_revenues >= 0),
        total_expenses DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_expenses >= 0),
        total_remitted DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_remitted >= 0),
        closing_balance DECIMAL(12,2) GENERATED ALWAYS AS (opening_balance + total_revenues - total_expenses - total_remitted) STORED,
        actual_cash_counted DECIMAL(12,2),
        discrepancy DECIMAL(12,2) GENERATED ALWAYS AS (COALESCE(actual_cash_counted, opening_balance + total_revenues - total_expenses - total_remitted) - (opening_balance + total_revenues - total_expenses - total_remitted)) STORED,
        reconciled_by INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        is_closed BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, register_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS payments (
        payment_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        invoice_id INTEGER NOT NULL REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
        register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
        receipt_number VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CHECK', 'BANK_TRANSFER', 'CARD', 'OTHER')),
        collected_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        remarks TEXT,
        is_voided BOOLEAN NOT NULL DEFAULT FALSE,
        void_reason TEXT,
        voided_by_user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        voided_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, receipt_number)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS cash_handovers (
        handover_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
        handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
        receipt_voucher_no VARCHAR(50),
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        transferred_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        received_by_name VARCHAR(150) NOT NULL,
        handover_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 8. OPERATIONAL EXPENSES & BUDGET VARIANCES
# =====================================================================================
EXPENSE_BUDGET_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS expense_categories (
        category_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        code VARCHAR(50) NOT NULL,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        is_cafeteria_related BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, code)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS expenses (
        expense_id BIGSERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
        category_id INTEGER NOT NULL REFERENCES expense_categories(category_id) ON DELETE RESTRICT,
        expense_date DATE NOT NULL,
        month_code VARCHAR(7) NOT NULL,
        description VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
        payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CHECK', 'BANK_TRANSFER', 'CARD')),
        voucher_number VARCHAR(50),
        paid_to VARCHAR(150),
        authorized_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        receipt_attachment_url TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS budget_variances (
        budget_variance_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        category_id INTEGER NOT NULL REFERENCES expense_categories(category_id) ON DELETE RESTRICT,
        month_period VARCHAR(7) NOT NULL,
        variable_factor DECIMAL(10,2) DEFAULT 0.00,
        budgeted_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (budgeted_amount >= 0),
        actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (actual_amount >= 0),
        variance DECIMAL(10,2) GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, category_id, month_period)
    );
    """
]

# =====================================================================================
# 9. DAYCARE CAFETERIA PROCUREMENT & KITCHEN LOGS
# =====================================================================================
DAYCARE_KITCHEN_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS daily_bread_logs (
        bread_log_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        log_date DATE NOT NULL,
        day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت')),
        scheduled_meal VARCHAR(100) NOT NULL,
        loaf_count INTEGER NOT NULL CHECK (loaf_count >= 0),
        unit_price DECIMAL(6,2) NOT NULL DEFAULT 15.00 CHECK (unit_price >= 0),
        total_cost DECIMAL(10,2) GENERATED ALWAYS AS (loaf_count * unit_price) STORED,
        supplier_name VARCHAR(100),
        remarks TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, log_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS provisions_orders (
        order_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        order_date DATE NOT NULL,
        order_month VARCHAR(7) NOT NULL,
        week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 5),
        item_category VARCHAR(100) NOT NULL,
        quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0),
        unit_measure VARCHAR(20) NOT NULL DEFAULT 'Kg' CHECK (unit_measure IN ('Kg', 'Piece', 'Tray', 'Bottle', 'Pack', 'Box', 'Liter')),
        unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
        total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
        supplier_name VARCHAR(100),
        expense_id BIGINT REFERENCES expenses(expense_id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 10. COMPETITIONS & SPECIAL EVENTS
# =====================================================================================
COMPETITION_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS competitions (
        competition_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
        name VARCHAR(150) NOT NULL,
        scope VARCHAR(50) NOT NULL DEFAULT 'NATIONAL' CHECK (scope IN ('NATIONAL', 'REGIONAL', 'WILAYA', 'INTERNAL', 'INTERNATIONAL')),
        event_date DATE,
        location VARCHAR(200),
        registration_fee DECIMAL(10,2) NOT NULL CHECK (registration_fee >= 0),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS competition_registrations (
        registration_id SERIAL PRIMARY KEY,
        competition_id INTEGER NOT NULL REFERENCES competitions(competition_id) ON DELETE RESTRICT,
        student_id INTEGER REFERENCES students(student_id) ON DELETE SET NULL,
        competitor_name VARCHAR(150) NOT NULL,
        division_level VARCHAR(50),
        receipt_number VARCHAR(50),
        fee_amount DECIMAL(10,2) NOT NULL CHECK (fee_amount >= 0),
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
        payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'EXEMPT')),
        register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
        notes TEXT,
        registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (competition_id, student_id)
    );
    """
]

# =====================================================================================
# 11. HR MONTHLY PAYROLL RUNS & DISBURSEMENT LEDGER
# =====================================================================================
PAYROLL_DISBURSEMENT_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS payroll_runs (
        payroll_run_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
        month_period VARCHAR(7) NOT NULL,
        run_date DATE NOT NULL DEFAULT CURRENT_DATE,
        admin_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (admin_subtotal >= 0),
        teachers_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (teachers_subtotal >= 0),
        coaches_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (coaches_subtotal >= 0),
        total_disbursed DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_disbursed >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CALCULATED', 'APPROVED', 'DISBURSED', 'CANCELLED')),
        approved_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, month_period)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS payroll_items (
        payroll_item_id SERIAL PRIMARY KEY,
        payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(payroll_run_id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
        base_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (base_amount >= 0),
        headcount_count INTEGER NOT NULL DEFAULT 0 CHECK (headcount_count >= 0),
        headcount_bonus DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (headcount_bonus >= 0),
        session_count INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
        variable_session_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (variable_session_amount >= 0),
        overtime_or_allowance DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (overtime_or_allowance >= 0),
        deductions DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (deductions >= 0),
        net_payout DECIMAL(10,2) GENERATED ALWAYS AS (base_amount + headcount_bonus + variable_session_amount + overtime_or_allowance - deductions) STORED,
        payment_voucher_no VARCHAR(50),
        disbursement_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (payroll_run_id, employee_id)
    );
    """
]

# =====================================================================================
# 12. AUDIT LOGS & SYSTEM METADATA
# =====================================================================================
AUDIT_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS audit_logs (
        audit_id BIGSERIAL PRIMARY KEY,
        table_name VARCHAR(50) NOT NULL,
        record_id BIGINT NOT NULL,
        action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
        old_values JSONB,
        new_values JSONB,
        performed_by VARCHAR(100),
        performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS AppMetadata (
        meta_key VARCHAR(100) PRIMARY KEY,
        meta_value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 13. CORE PERSON, MEDICAL, GUARDIAN & PICKUP INFRASTRUCTURE (ACADEMY ARCHITECTURE)
# =====================================================================================
CORE_PERSON_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS core_person (
        person_id SERIAL PRIMARY KEY,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        full_name_ar VARCHAR(200) NOT NULL,
        full_name_fr VARCHAR(200),
        birth_date DATE,
        gender VARCHAR(10) CHECK (gender IN ('MALE', 'FEMALE', 'Male', 'Female')),
        national_id VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        person_type VARCHAR(50) NOT NULL DEFAULT 'STUDENT' CHECK (person_type IN ('STUDENT', 'GUARDIAN', 'STAFF', 'INSTRUCTOR', 'ADMIN', 'MIXED')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS core_student (
        student_id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL UNIQUE REFERENCES core_person(person_id) ON DELETE CASCADE,
        student_code VARCHAR(50) NOT NULL UNIQUE,
        school_grade VARCHAR(50),
        previous_schools TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS core_student_medical (
        medical_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL UNIQUE REFERENCES core_student(student_id) ON DELETE CASCADE,
        blood_group VARCHAR(10),
        allergies TEXT,
        special_needs TEXT,
        food_restrictions TEXT,
        emergency_contact_name VARCHAR(150),
        emergency_contact_phone VARCHAR(50),
        medical_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS core_guardian_link (
        link_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES core_student(student_id) ON DELETE CASCADE,
        guardian_person_id INTEGER NOT NULL REFERENCES core_person(person_id) ON DELETE CASCADE,
        relationship VARCHAR(50) NOT NULL DEFAULT 'Parent' CHECK (relationship IN ('Father', 'Mother', 'Guardian', 'Grandparent', 'Other')),
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        is_emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
        custody_flag BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, guardian_person_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS core_pickup_authorization (
        pickup_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES core_student(student_id) ON DELETE CASCADE,
        authorized_person_id INTEGER REFERENCES core_person(person_id) ON DELETE SET NULL,
        full_name VARCHAR(150) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        national_id VARCHAR(50),
        phone VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        authorized_by_person_id INTEGER REFERENCES core_person(person_id) ON DELETE SET NULL,
        start_date DATE,
        end_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS core_audit_log (
        audit_id BIGSERIAL PRIMARY KEY,
        actor_person_id INTEGER REFERENCES core_person(person_id) ON DELETE SET NULL,
        actor_username VARCHAR(100),
        action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('GRADE_CHANGE', 'PRICE_OVERRIDE', 'PAYMENT_VOID', 'MEDICAL_VIEW', 'EVALUATION_EDIT', 'STATUS_CHANGE', 'GENERAL_AUDIT')),
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(50) NOT NULL,
        branch_id VARCHAR(50),
        old_values TEXT,
        new_values TEXT,
        reason TEXT,
        ip_address VARCHAR(50),
        performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 14. IAM: ACCOUNTS, DYNAMIC PERMISSION CATALOG, ROLES & BRANCH ASSIGNMENTS
# =====================================================================================
IAM_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS iam_account (
        account_id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL UNIQUE REFERENCES core_person(person_id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
        is_under_14 BOOLEAN NOT NULL DEFAULT FALSE,
        registration_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
        first_level_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
        activated_at TIMESTAMPTZ,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS iam_permission (
        permission_id SERIAL PRIMARY KEY,
        code VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        module VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS iam_role (
        role_id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS iam_role_permission (
        role_id INTEGER NOT NULL REFERENCES iam_role(role_id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES iam_permission(permission_id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS iam_person_role (
        assignment_id SERIAL PRIMARY KEY,
        person_id INTEGER NOT NULL REFERENCES core_person(person_id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES iam_role(role_id) ON DELETE CASCADE,
        branch_id VARCHAR(50),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (person_id, role_id, branch_id)
    );
    """
]

# =====================================================================================
# 15. ORGANIZATION: 13 BRANCHES, FISCAL YEARS, ROOMS & EQUIPMENT
# =====================================================================================
ORGANIZATION_EXPANDED_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS org_branch (
        branch_id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        branch_type VARCHAR(50) NOT NULL CHECK (branch_type IN ('ACADEMY', 'KINDERGARTEN', 'HYBRID')),
        phone VARCHAR(50),
        email VARCHAR(100),
        address TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS org_academic_year (
        academic_year_id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        is_current BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_org_acad_year_dates CHECK (end_date > start_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS org_room (
        room_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL REFERENCES org_branch(branch_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 20 CHECK (capacity > 0),
        floor_number SMALLINT DEFAULT 0,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, name)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS org_room_equipment (
        equipment_id SERIAL PRIMARY KEY,
        room_id INTEGER NOT NULL REFERENCES org_room(room_id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
        condition VARCHAR(50) NOT NULL DEFAULT 'GOOD' CHECK (condition IN ('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_REPAIR')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 16. ACADEMY MODULE: WORKSHOPS, SEQUENTIAL COURSES, TIMETABLE, ATTENDANCE, MAKE-UPS,
#     DYNAMIC EVALUATIONS (DOUBLE-BLIND) & MATERIALS
# =====================================================================================
ACADEMY_MODULE_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS acad_workshop (
        workshop_id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        description TEXT,
        evaluation_type VARCHAR(50) NOT NULL CHECK (evaluation_type IN ('TIMED_OPERATIONS', 'ORAL_RIGHT_WRONG', 'PROJECT', 'CHALLENGE_MILESTONES', 'STANDARD_SCORE')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_course (
        course_id SERIAL PRIMARY KEY,
        workshop_id INTEGER NOT NULL REFERENCES acad_workshop(workshop_id) ON DELETE CASCADE,
        sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
        course_code VARCHAR(50) NOT NULL UNIQUE,
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150),
        book_title VARCHAR(200) NOT NULL,
        book_code VARCHAR(50) NOT NULL,
        description TEXT,
        min_age INTEGER,
        max_age INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (workshop_id, sequence_order)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_course_rule (
        rule_id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL UNIQUE REFERENCES acad_course(course_id) ON DELETE CASCADE,
        rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('SOROBAN_TESTS', 'ORAL_QUESTIONS', 'PROJECT_SCORE', 'CHALLENGE_MILESTONES', 'STANDARD_SCORE')),
        pass_mark DECIMAL(6,2) NOT NULL DEFAULT 80.00,
        max_mark DECIMAL(6,2) NOT NULL DEFAULT 100.00,
        required_tests_count INTEGER NOT NULL DEFAULT 3,
        min_score_per_test DECIMAL(6,2) NOT NULL DEFAULT 80.00,
        rule_config TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_group (
        group_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL REFERENCES org_branch(branch_id) ON DELETE RESTRICT,
        course_id INTEGER NOT NULL REFERENCES acad_course(course_id) ON DELETE RESTRICT,
        academic_year_id INTEGER NOT NULL REFERENCES org_academic_year(academic_year_id) ON DELETE RESTRICT,
        group_name VARCHAR(100) NOT NULL,
        trainer_person_id INTEGER REFERENCES core_person(person_id) ON DELETE SET NULL,
        room_id INTEGER REFERENCES org_room(room_id) ON DELETE SET NULL,
        max_capacity INTEGER NOT NULL DEFAULT 15 CHECK (max_capacity > 0),
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, academic_year_id, group_name)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_group_slot (
        slot_id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES acad_group(group_id) ON DELETE CASCADE,
        room_id INTEGER NOT NULL REFERENCES org_room(room_id) ON DELETE RESTRICT,
        trainer_person_id INTEGER NOT NULL REFERENCES core_person(person_id) ON DELETE RESTRICT,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
        start_time VARCHAR(8) NOT NULL,
        end_time VARCHAR(8) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_slot_times CHECK (end_time > start_time)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_enrollment (
        enrollment_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES core_student(student_id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES acad_course(course_id) ON DELETE RESTRICT,
        group_id INTEGER REFERENCES acad_group(group_id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'FAILED_REPEATING', 'DROPPED')),
        placement_note TEXT,
        enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_session (
        session_id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL REFERENCES acad_group(group_id) ON DELETE CASCADE,
        session_date DATE NOT NULL,
        start_time VARCHAR(8) NOT NULL,
        end_time VARCHAR(8) NOT NULL,
        room_id INTEGER REFERENCES org_room(room_id) ON DELETE SET NULL,
        trainer_person_id INTEGER REFERENCES core_person(person_id) ON DELETE SET NULL,
        is_makeup BOOLEAN NOT NULL DEFAULT FALSE,
        status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
        topic VARCHAR(200),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_attendance (
        attendance_id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES acad_session(session_id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES core_student(student_id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
        call_logged BOOLEAN NOT NULL DEFAULT FALSE,
        call_timestamp TIMESTAMPTZ,
        caller_person_id INTEGER REFERENCES core_person(person_id) ON DELETE SET NULL,
        call_answered BOOLEAN,
        absence_justification TEXT,
        parent_contacted_phone VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (session_id, student_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_eval_template (
        template_id SERIAL PRIMARY KEY,
        workshop_id INTEGER NOT NULL REFERENCES acad_workshop(workshop_id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        eval_type VARCHAR(50) NOT NULL CHECK (eval_type IN ('SOROBAN_TIMED', 'ORAL_RIGHT_WRONG', 'ROBOTICS_PROJECT', 'CHALLENGE_MILESTONES', 'STANDARD_TEST')),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_eval_field (
        field_id SERIAL PRIMARY KEY,
        template_id INTEGER NOT NULL REFERENCES acad_eval_template(template_id) ON DELETE CASCADE,
        field_name VARCHAR(150) NOT NULL,
        field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('INTEGER', 'DECIMAL', 'BOOLEAN', 'TEXT', 'SCORE')),
        field_order INTEGER NOT NULL DEFAULT 1,
        max_value DECIMAL(10,2),
        weight DECIMAL(5,2) DEFAULT 1.00,
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_eval_event (
        event_id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES acad_course(course_id) ON DELETE RESTRICT,
        template_id INTEGER NOT NULL REFERENCES acad_eval_template(template_id) ON DELETE RESTRICT,
        group_id INTEGER REFERENCES acad_group(group_id) ON DELETE SET NULL,
        event_name VARCHAR(150) NOT NULL,
        event_date DATE NOT NULL,
        pass_score DECIMAL(6,2) NOT NULL DEFAULT 80.00,
        max_score DECIMAL(6,2) NOT NULL DEFAULT 100.00,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_eval_result (
        result_id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES acad_eval_event(event_id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES core_student(student_id) ON DELETE CASCADE,
        total_score DECIMAL(6,2) NOT NULL,
        passed BOOLEAN NOT NULL DEFAULT FALSE,
        corrector_person_id INTEGER NOT NULL REFERENCES core_person(person_id) ON DELETE RESTRICT,
        corrected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        reviewer_person_id INTEGER REFERENCES core_person(person_id) ON DELETE RESTRICT,
        reviewed_at TIMESTAMPTZ,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CORRECTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED')),
        feedback_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (event_id, student_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_eval_result_value (
        value_id SERIAL PRIMARY KEY,
        result_id INTEGER NOT NULL REFERENCES acad_eval_result(result_id) ON DELETE CASCADE,
        field_id INTEGER NOT NULL REFERENCES acad_eval_field(field_id) ON DELETE CASCADE,
        value_text TEXT,
        value_numeric DECIMAL(10,2),
        value_boolean BOOLEAN,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (result_id, field_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_makeup (
        makeup_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES core_student(student_id) ON DELETE CASCADE,
        reason VARCHAR(50) NOT NULL CHECK (reason IN ('ABSENCE', 'FAILED_TEST', 'SPECIAL_REQUEST')),
        source_session_id INTEGER REFERENCES acad_session(session_id) ON DELETE SET NULL,
        source_eval_result_id INTEGER REFERENCES acad_eval_result(result_id) ON DELETE SET NULL,
        course_id INTEGER REFERENCES acad_course(course_id) ON DELETE SET NULL,
        assigned_session_id INTEGER REFERENCES acad_session(session_id) ON DELETE SET NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'OWED' CHECK (status IN ('OWED', 'SCHEDULED', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMPTZ
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS acad_material (
        material_id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES acad_course(course_id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('BOOK', 'HOMEWORK', 'WORKSHEET', 'AUDIO', 'VIDEO', 'SOLUTION')),
        file_path VARCHAR(500) NOT NULL,
        file_size_bytes BIGINT DEFAULT 0,
        mime_type VARCHAR(100) DEFAULT 'application/pdf',
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 17. KINDERGARTEN (RAWDA) DOMAIN TABLES
# =====================================================================================
KINDERGARTEN_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS kg_age_band (
        age_band_id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name_ar VARCHAR(100) NOT NULL,
        name_en VARCHAR(100) NOT NULL,
        min_age_months INTEGER NOT NULL CHECK (min_age_months >= 0),
        max_age_months INTEGER NOT NULL CHECK (max_age_months >= min_age_months),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_child_book (
        child_book_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        age_band_id INTEGER REFERENCES kg_age_band(age_band_id) ON DELETE SET NULL,
        book_number VARCHAR(50) NOT NULL,
        title VARCHAR(150) NOT NULL,
        book_type VARCHAR(20) NOT NULL DEFAULT 'PHYSICAL' CHECK (book_type IN ('PHYSICAL', 'DIGITAL')),
        level_label VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'RETURNED', 'DAMAGED', 'LOST')),
        assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
        return_date DATE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, book_number)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_attendance (
        kg_attendance_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
        arrival_time VARCHAR(20),
        departure_time VARCHAR(20),
        picked_up_by VARCHAR(150),
        justification TEXT,
        marked_by_user_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, attendance_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_daily_log (
        log_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        breakfast VARCHAR(1) NOT NULL CHECK (breakfast IN ('A', 'B', 'C')),
        lunch VARCHAR(1) NOT NULL CHECK (lunch IN ('A', 'B', 'C')),
        snack VARCHAR(1) NOT NULL CHECK (snack IN ('A', 'B', 'C')),
        sleep VARCHAR(1) NOT NULL CHECK (sleep IN ('A', 'B', 'C')),
        study VARCHAR(1) NOT NULL CHECK (study IN ('A', 'B', 'C')),
        interaction VARCHAR(1) NOT NULL CHECK (interaction IN ('A', 'B', 'C')),
        crying VARCHAR(1) NOT NULL CHECK (crying IN ('A', 'B', 'C')),
        clothes_change VARCHAR(1) NOT NULL CHECK (clothes_change IN ('A', 'B', 'C')),
        notes TEXT,
        recorded_by_staff_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, log_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_monthly_report (
        report_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        month_period VARCHAR(20) NOT NULL,
        breakfast VARCHAR(1) NOT NULL CHECK (breakfast IN ('A', 'B', 'C')),
        lunch VARCHAR(1) NOT NULL CHECK (lunch IN ('A', 'B', 'C')),
        snack VARCHAR(1) NOT NULL CHECK (snack IN ('A', 'B', 'C')),
        sleep VARCHAR(1) NOT NULL CHECK (sleep IN ('A', 'B', 'C')),
        study VARCHAR(1) NOT NULL CHECK (study IN ('A', 'B', 'C')),
        interaction VARCHAR(1) NOT NULL CHECK (interaction IN ('A', 'B', 'C')),
        crying VARCHAR(1) NOT NULL CHECK (crying IN ('A', 'B', 'C')),
        clothes_change VARCHAR(1) NOT NULL CHECK (clothes_change IN ('A', 'B', 'C')),
        teacher_notes TEXT,
        author_staff_id INTEGER NOT NULL,
        reviewer_admin_id INTEGER,
        status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
        admin_feedback TEXT,
        approved_at TIMESTAMPTZ,
        visible_to_parents BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, month_period)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_incident (
        incident_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
        category VARCHAR(50) NOT NULL CHECK (category IN ('BEHAVIOR', 'EATING', 'SLEEPING', 'LEARNING', 'HEALTH', 'OTHER')),
        description TEXT NOT NULL,
        action_taken TEXT,
        reported_by_staff_id INTEGER,
        parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
        parent_acknowledgment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_specialist_note (
        specialist_note_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        specialist_id INTEGER NOT NULL,
        session_date DATE NOT NULL DEFAULT CURRENT_DATE,
        observation_type VARCHAR(50) NOT NULL,
        clinical_observations TEXT NOT NULL,
        recommendations TEXT,
        visibility VARCHAR(30) NOT NULL DEFAULT 'STAFF_ONLY' CHECK (visibility IN ('STAFF_ONLY', 'STAFF_AND_PARENTS')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_child_habit_profile (
        profile_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL UNIQUE,
        food_preferences TEXT,
        eating_habits TEXT,
        sleep_habits TEXT,
        clothing_notes TEXT,
        allergies_medical TEXT,
        illness_history TEXT,
        temperament TEXT,
        soothing_methods TEXT,
        updated_by_user_id INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS kg_menu_entry (
        menu_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 4),
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
        meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACK')),
        menu_items TEXT NOT NULL,
        allergen_info TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, week_number, day_of_week, meal_type)
    );
    """
]

# =====================================================================================
# 18. HR, STAFF & RECRUITMENT DOMAIN TABLES
# =====================================================================================
HR_STAFF_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS hr_position (
        position_id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        title_ar VARCHAR(100) NOT NULL,
        title_en VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('TEACHING', 'ADMINISTRATIVE', 'NANNY', 'COOK', 'CLEANING', 'MAINTENANCE', 'ORTHOPHONIST', 'SPECIALIST', 'OTHER')),
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS hr_staff (
        staff_id SERIAL PRIMARY KEY,
        employee_id INTEGER UNIQUE REFERENCES employees(employee_id) ON DELETE CASCADE,
        position_id INTEGER REFERENCES hr_position(position_id) ON DELETE SET NULL,
        national_id VARCHAR(50),
        phone VARCHAR(50),
        email VARCHAR(100),
        qualifications TEXT,
        specialization VARCHAR(100),
        emergency_contact VARCHAR(150),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS hr_staff_assignment (
        assignment_id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
        branch_id VARCHAR(50) NOT NULL,
        position_id INTEGER REFERENCES hr_position(position_id) ON DELETE SET NULL,
        role_in_branch VARCHAR(100),
        allocation_percentage DECIMAL(5,2) NOT NULL DEFAULT 100.00,
        is_primary BOOLEAN NOT NULL DEFAULT TRUE,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS hr_staff_attendance (
        attendance_id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
        branch_id VARCHAR(50) NOT NULL,
        attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
        check_in_time VARCHAR(20),
        check_out_time VARCHAR(20),
        status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'ON_LEAVE', 'HALF_DAY')),
        source VARCHAR(30) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'BIOMETRIC', 'DEVICE_IMPORT', 'MOBILE')),
        marked_by_user_id INTEGER,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (employee_id, attendance_date)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS hr_staff_application (
        application_id SERIAL PRIMARY KEY,
        applicant_name VARCHAR(150) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        position_id INTEGER REFERENCES hr_position(position_id) ON DELETE SET NULL,
        applied_position VARCHAR(100) NOT NULL,
        branch_id VARCHAR(50),
        experience_years INTEGER DEFAULT 0,
        resume_url TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFERED', 'HIRED', 'REJECTED')),
        interview_date TIMESTAMPTZ,
        interviewer_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        interview_notes TEXT,
        interview_rating INTEGER CHECK (interview_rating BETWEEN 1 AND 5),
        decision_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 19. COMMUNICATION & OUTBOUND NOTIFICATIONS DOMAIN TABLES
# =====================================================================================
COMMUNICATION_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS comm_note_policy (
        policy_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL UNIQUE,
        is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        window_start_time VARCHAR(20) NOT NULL DEFAULT '08:00',
        window_end_time VARCHAR(20) NOT NULL DEFAULT '18:00',
        allowed_days VARCHAR(50) NOT NULL DEFAULT '1,2,3,4,5,6,7',
        updated_by_user_id INTEGER,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS comm_note (
        note_id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        parent_user_id INTEGER,
        branch_id VARCHAR(50) NOT NULL,
        recipient_role VARCHAR(50) NOT NULL DEFAULT 'TEACHER' CHECK (recipient_role IN ('TEACHER', 'ADMIN', 'DIRECTOR', 'SPECIALIST')),
        subject VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ANSWERED', 'CLOSED')),
        staff_response TEXT,
        answered_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
        answered_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS comm_notification (
        notification_id SERIAL PRIMARY KEY,
        channel VARCHAR(20) NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP', 'TELEGRAM', 'EMAIL')),
        notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('ABSENCE_ALERT', 'PAYMENT_RECEIPT', 'REPORT_APPROVAL', 'INTERVIEW_INVITATION', 'ANNOUNCEMENT', 'GENERAL')),
        recipient_name VARCHAR(150) NOT NULL,
        recipient_target VARCHAR(150) NOT NULL,
        student_id INTEGER,
        title VARCHAR(200) NOT NULL,
        body_text TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED')),
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        error_log TEXT,
        scheduled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 20. FINANCE EXTENSIONS & INVOICE INSTALLMENTS
# =====================================================================================
FINANCE_EXTENDED_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS fin_receipt_sequence (
        sequence_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        last_sequence_number INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, fiscal_year)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS fin_fee_plan (
        fee_plan_id SERIAL PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        program_id INTEGER REFERENCES programs(program_id) ON DELETE SET NULL,
        level_id INTEGER REFERENCES levels(level_id) ON DELETE SET NULL,
        academic_year_id INTEGER REFERENCES academic_years(academic_year_id) ON DELETE SET NULL,
        plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('ACADEMY_LEVEL_UPFRONT', 'ACADEMY_LEVEL_INSTALLMENTS', 'KINDERGARTEN_MONTHLY', 'KINDERGARTEN_ANNUAL', 'ANNUAL_REGISTRATION')),
        name_ar VARCHAR(150) NOT NULL,
        name_en VARCHAR(150) NOT NULL,
        base_amount DECIMAL(10,2) NOT NULL CHECK (base_amount >= 0),
        discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
        final_amount DECIMAL(10,2) NOT NULL CHECK (final_amount >= 0),
        installment_count INTEGER NOT NULL DEFAULT 1 CHECK (installment_count >= 1),
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (branch_id, plan_type)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS fin_price_override (
        override_id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(invoice_id) ON DELETE CASCADE,
        original_price DECIMAL(10,2) NOT NULL CHECK (original_price >= 0),
        overridden_price DECIMAL(10,2) NOT NULL CHECK (overridden_price >= 0),
        difference_amount DECIMAL(10,2) NOT NULL,
        reason TEXT NOT NULL,
        authorized_by_employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
        created_by_user_id INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS fin_installment (
        installment_id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
        installment_number INTEGER NOT NULL CHECK (installment_number >= 1),
        due_date DATE NOT NULL,
        amount_due DECIMAL(10,2) NOT NULL CHECK (amount_due >= 0),
        amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (invoice_id, installment_number)
    );
    """
]

# =====================================================================================
# 21. DATA MIGRATION STAGING & TRACEABILITY
# =====================================================================================
MIGRATION_TABLE_QUERIES = [
    """
    CREATE TABLE IF NOT EXISTS mig_import_batch (
        batch_id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        sheet_name VARCHAR(100),
        source_branch_id VARCHAR(50),
        academic_year_id INTEGER REFERENCES academic_years(academic_year_id) ON DELETE SET NULL,
        total_rows INTEGER NOT NULL DEFAULT 0,
        processed_rows INTEGER NOT NULL DEFAULT 0,
        ambiguous_rows INTEGER NOT NULL DEFAULT 0,
        converted_rows INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'UPLOADED' CHECK (status IN ('UPLOADED', 'PARSING', 'STAGED', 'COMPLETED', 'FAILED')),
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS mig_import_row (
        row_id SERIAL PRIMARY KEY,
        batch_id INTEGER NOT NULL REFERENCES mig_import_batch(batch_id) ON DELETE CASCADE,
        row_index INTEGER NOT NULL,
        raw_payload TEXT NOT NULL,
        parsed_payload TEXT,
        match_status VARCHAR(30) NOT NULL DEFAULT 'STAGED' CHECK (match_status IN ('EXACT_MATCH', 'AMBIGUOUS', 'UNMATCHED', 'CONVERTED', 'REJECTED', 'STAGED')),
        confidence_score DECIMAL(5,2) DEFAULT 0.00,
        review_notes TEXT,
        resolved_by_user_id INTEGER,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS mig_legacy_ref (
        ref_id SERIAL PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('STUDENT', 'ENROLLMENT', 'INVOICE', 'PAYMENT', 'GUARDIAN')),
        entity_id INTEGER NOT NULL,
        batch_id INTEGER REFERENCES mig_import_batch(batch_id) ON DELETE SET NULL,
        row_id INTEGER REFERENCES mig_import_row(row_id) ON DELETE SET NULL,
        source_file VARCHAR(255),
        source_sheet VARCHAR(100),
        source_row_index INTEGER,
        legacy_student_name VARCHAR(150),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 22. BOOTSTRAP SEED CATALOGS (EXPANDED FOR ACADEMY ERP)
# =====================================================================================
SEED_CATALOG_QUERIES = [
    """
    INSERT INTO branches (branch_id, name_ar, name_en, branch_type, phone, email, address) VALUES
    ('CENTER', 'أكاديمية الأطفال العباقرة - المركز', '3abaqira Academy - Center', 'ACADEMY', '+213-21-000001', 'center@3abaqira.dz', 'Algiers, Algeria'),
    ('RAWDA', 'روضة أكاديمية الأطفال العباقرة', '3abaqira Kindergarten & Daycare', 'DAYCARE', '+213-21-000002', 'rawda@3abaqira.dz', 'Algiers, Algeria')
    ON CONFLICT (branch_id) DO NOTHING;
    """,
    """
    INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES
    ('2024-2025', '2024-09-01', '2025-07-31', FALSE),
    ('2025-2026', '2025-09-01', '2026-07-31', TRUE)
    ON CONFLICT (name) DO NOTHING;
    """,
    """
    INSERT INTO programs (branch_id, code, name_ar, name_en, billing_type, description) VALUES
    ('CENTER', 'SOROBAN', 'الحساب الذهني (السوروبان)', 'Soroban Mental Arithmetic', 'INSTALLMENT_PLAN', 'Soroban course levels p1 through s6 with 4 tranches'),
    ('CENTER', 'QURAN', 'تحفيظ القرآن الكريم', 'Quran Memorization', 'MONTHLY_RECURRING', 'Quranic memorization weekend shifts and monthly fee'),
    ('CENTER', 'PREP_2025', 'تحضيري 2025', 'Academic Preparatory 2025', 'MONTHLY_RECURRING', 'Preschool academic curriculum with registration fee and monthly billing'),
    ('CENTER', 'ROBOTICS', 'الروبوتيك والذكاء الاصطناعي', 'Robotics & STEM', 'INSTALLMENT_PLAN', 'Hands-on robotics workshops with 4-part installment plan'),
    ('CENTER', 'LANG_LEVELS', 'اللغات - مستويات', 'Foreign Languages (Levels)', 'INSTALLMENT_PLAN', 'French and English proficiency levels with 4 installments'),
    ('CENTER', 'LANG_SUPPORT', 'اللغات - دعم مدرسي', 'Language School Support', 'INSTALLMENT_PLAN', 'School curriculum language tutoring with 4 installments'),
    ('CENTER', 'SUPPORT_LESSONS', 'دروس الدعم العلمي والأدبي', 'Academic Support Lessons', 'INSTALLMENT_PLAN', 'School academic support with 4 installments'),
    ('CENTER', 'SUMMER_CLUB', 'النادي الصيفي', 'Summer Club Camp', 'INSTALLMENT_PLAN', 'Seasonal summer camp activities with 2 installments'),
    ('RAWDA', 'DAYCARE', 'الروضة والحضانة اليومية', 'Daycare & Kindergarten', 'MONTHLY_RECURRING', 'Full-service daycare, nursery cohorts, and cafeteria')
    ON CONFLICT (branch_id, code) DO NOTHING;
    """,
    """
    INSERT INTO users (username, password_hash, full_name, email, role, is_active) VALUES
    ('admin', '$2b$12$/Csvd5vNnBFI2pt7JgWaeOfG6SenzjGvv4ssWtSAwo7bkl2yIt2Re', 'System Administrator', 'admin@3abaqira.dz', 'SUPER_ADMIN', TRUE)
    ON CONFLICT (username) DO NOTHING;
    """,
    # 13 Branches Specification Seed
    """
    INSERT INTO org_branch (branch_id, code, name_ar, name_en, branch_type, address, phone, email) VALUES
    ('BR-01', 'CENTER_ACAD', 'أكاديمية العباقرة - جيجل وسط', 'Genius Academy - Jijel Center', 'ACADEMY', 'Jijel Center', '+213-34-800001', 'center.acad@geniuskids.dz'),
    ('BR-02', 'CENTER_KG', 'روضة العباقرة - جيجل وسط', 'Genius Kindergarten - Jijel Center', 'KINDERGARTEN', 'Jijel Center', '+213-34-800002', 'center.kg@geniuskids.dz'),
    ('BR-03', 'TAHER_ACAD', 'أكاديمية العباقرة - الطاهير', 'Genius Academy - Taher', 'ACADEMY', 'Taher Center', '+213-34-800003', 'taher.acad@geniuskids.dz'),
    ('BR-04', 'TAHER_KG', 'روضة العباقرة - الطاهير', 'Genius Kindergarten - Taher', 'KINDERGARTEN', 'Taher Center', '+213-34-800004', 'taher.kg@geniuskids.dz'),
    ('BR-05', 'MILIA_ACAD', 'أكاديمية العباقرة - الميلية', 'Genius Academy - El Milia', 'ACADEMY', 'El Milia Center', '+213-34-800005', 'milia.acad@geniuskids.dz'),
    ('BR-06', 'MILIA_KG', 'روضة العباقرة - الميلية', 'Genius Kindergarten - El Milia', 'KINDERGARTEN', 'El Milia Center', '+213-34-800006', 'milia.kg@geniuskids.dz'),
    ('BR-07', 'CHEKFA_ACAD', 'أكاديمية العباقرة - الشقفة', 'Genius Academy - Chekfa', 'ACADEMY', 'Chekfa', '+213-34-800007', 'chekfa.acad@geniuskids.dz'),
    ('BR-08', 'KAOUS_ACAD', 'أكاديمية العباقرة - قاوس', 'Genius Academy - Kaous', 'ACADEMY', 'Kaous', '+213-34-800008', 'kaous.acad@geniuskids.dz'),
    ('BR-09', 'KAOUS_KG', 'روضة العباقرة - قاوس', 'Genius Kindergarten - Kaous', 'KINDERGARTEN', 'Kaous', '+213-34-800009', 'kaous.kg@geniuskids.dz'),
    ('BR-10', 'TEXENNA_ACAD', 'أكاديمية العباقرة - تاكسنة', 'Genius Academy - Texenna', 'ACADEMY', 'Texenna', '+213-34-800010', 'texenna.acad@geniuskids.dz'),
    ('BR-11', 'SIDI_ABDELAZIZ_ACAD', 'أكاديمية العباقرة - سيدي عبد العزيز', 'Genius Academy - Sidi Abdelaziz', 'ACADEMY', 'Sidi Abdelaziz', '+213-34-800011', 'sidiabdelaziz.acad@geniuskids.dz'),
    ('BR-12', 'JIJEL_EST_ACAD', 'أكاديمية العباقرة - جيجل الشرقية', 'Genius Academy - Jijel East', 'ACADEMY', 'Jijel East', '+213-34-800012', 'jijel.est.acad@geniuskids.dz'),
    ('BR-13', 'JIJEL_OUEST_KG', 'روضة العباقرة - جيجل الغربية', 'Genius Kindergarten - Jijel West', 'KINDERGARTEN', 'Jijel West', '+213-34-800013', 'jijel.ouest.kg@geniuskids.dz')
    ON CONFLICT (branch_id) DO NOTHING;
    """,
    # Academic Years Seed (org_academic_year)
    """
    INSERT INTO org_academic_year (name, start_date, end_date, is_current) VALUES
    ('2024-2025', '2024-09-01', '2025-07-31', FALSE),
    ('2025-2026', '2025-09-01', '2026-07-31', TRUE)
    ON CONFLICT (name) DO NOTHING;
    """,
    # Fixed Permission Catalog Seed
    """
    INSERT INTO iam_permission (code, name, module, description) VALUES
    ('core.person.create', 'Create Person Entity', 'core', 'Allows registering new individuals into core person registry'),
    ('core.person.read', 'Read Person Entity', 'core', 'Allows reading standard core person details'),
    ('core.person.update', 'Update Person Entity', 'core', 'Allows updating person profile details'),
    ('core.medical.view', 'View Sensitive Medical Data', 'core', 'Audit-logged access to sensitive student medical information'),
    ('core.medical.update', 'Update Medical Data', 'core', 'Allows modifying medical, dietary, and allergy records'),
    ('core.pickup.manage', 'Manage Authorized Pickups', 'core', 'Allows setting and editing authorized pickup individuals'),
    ('iam.account.manage', 'Manage User Accounts', 'iam', 'Allows activating, suspending, and resetting accounts'),
    ('iam.role.assign', 'Assign Roles per Branch', 'iam', 'Allows assigning roles to users globally or per branch'),
    ('org.branch.manage', 'Manage Branches and Infrastructure', 'org', 'Allows managing branch details, rooms, and equipment'),
    ('acad.workshop.manage', 'Manage Workshops and Levels', 'acad', 'Allows configuring workshops, courses, books, and pass rules'),
    ('acad.timetable.manage', 'Manage Timetable and Clash Resolution', 'acad', 'Allows scheduling group slots with clash detection'),
    ('acad.attendance.mark', 'Mark Session Attendance', 'acad', 'Allows taking and modifying session attendance records'),
    ('acad.attendance.call_log', 'Log Absence Follow-up Telephone Calls', 'acad', 'Allows logging telephone calls and justifications for absent students'),
    ('acad.evaluation.correct', 'Submit Evaluation Corrections', 'acad', 'Allows entering evaluation scores and field values as corrector'),
    ('acad.evaluation.review', 'Perform Double-Blind Evaluation Review', 'acad', 'Allows reviewing and approving evaluation results (corrector != reviewer)'),
    ('acad.evaluation.publish', 'Publish Evaluation Results', 'acad', 'Allows releasing finalized evaluation results to parents and students'),
    ('acad.makeup.manage', 'Manage Make-up Sessions Queue', 'acad', 'Allows assigning and resolving student make-up session credits'),
    ('acad.material.manage', 'Manage Course Materials', 'acad', 'Allows uploading and editing digital books and homework files'),
    ('acad.material.download', 'Download Course Materials', 'acad', 'Allows enrolled students to download course books and homework'),
    ('fin.price.override', 'Override Standard Tuition Price', 'fin', 'Sensitive action: Allows dynamic discount override with mandatory reason'),
    ('fin.payment.void', 'Void Payment Receipt', 'fin', 'Sensitive action: Allows voiding a payment receipt with mandatory reason'),
    ('audit.log.view', 'View Sensitive Action Audit Log', 'core', 'Allows viewing audit records of grade changes, price overrides, voids, and medical views')
    ON CONFLICT (code) DO NOTHING;
    """,
    # Standard Roles Seed
    """
    INSERT INTO iam_role (code, name, description, is_system) VALUES
    ('ADMIN', 'System Administrator', 'Full access to all system modules, configurations, and audit logs', TRUE),
    ('DIRECTOR', 'Branch Director', 'Branch-level operational and managerial oversight', TRUE),
    ('RECEPTIONIST', 'Receptionist / Registrar', 'Student admissions, attendance phone calls, pickup checks, fee entries', TRUE),
    ('TRAINER', 'Academy Instructor', 'Conducts sessions, marks attendance, submits evaluation corrections', TRUE),
    ('REVIEWER', 'Evaluation Reviewer', 'Double-blind quality reviewer verifying corrections before publication', TRUE),
    ('STUDENT', 'Enrolled Student', 'Learner access for timetable and course materials download', TRUE),
    ('PARENT', 'Parent / Guardian', 'Parent access to monitor attendance, evaluation reports, and pickup rights', TRUE)
    ON CONFLICT (code) DO NOTHING;
    """,
    # Standard Role-Permissions Mapping Seed
    """
    INSERT INTO iam_role_permission (role_id, permission_id)
    SELECT r.role_id, p.permission_id
    FROM iam_role r, iam_permission p
    WHERE (r.code = 'ADMIN')
       OR (r.code = 'TRAINER' AND p.code IN ('acad.attendance.mark', 'acad.attendance.call_log', 'acad.evaluation.correct', 'acad.material.manage', 'acad.material.download'))
       OR (r.code = 'REVIEWER' AND p.code IN ('acad.evaluation.review', 'acad.evaluation.publish'))
       OR (r.code = 'RECEPTIONIST' AND p.code IN ('core.person.create', 'core.person.read', 'core.person.update', 'acad.attendance.mark', 'acad.attendance.call_log', 'core.pickup.manage'))
       OR (r.code = 'STUDENT' AND p.code IN ('acad.material.download'))
    ON CONFLICT DO NOTHING;
    """,
    # Academy Workshops Seed
    """
    INSERT INTO acad_workshop (code, name_ar, name_en, description, evaluation_type) VALUES
    ('SOROBAN', 'الحساب الذهني (السوروبان)', 'Soroban Mental Arithmetic', 'Japanese abacus mental arithmetic: timed operations and 3-test 80/100 progression', 'TIMED_OPERATIONS'),
    ('ROBOTICS', 'الروبوتيك والذكاء الاصطناعي للأطفال', 'Robotics & STEM Kids', 'Hands-on robotics hardware, sensors, motor programming and project milestones', 'PROJECT'),
    ('FRENCH', 'اللغة الفرنسية التفاعلية', 'Interactive French Language', 'Oral and conversational French proficiency with oral evaluations', 'ORAL_RIGHT_WRONG'),
    ('ENGLISH', 'اللغة الإنجليزية للأطفال', 'Kids English Communication', 'Listening, speech phonetics, and dialogue progression', 'ORAL_RIGHT_WRONG'),
    ('AI', 'مقدمة في الذكاء الاصطناعي', 'AI Fundamentals for Youth', 'Visual AI logic, model training, and creative project development', 'PROJECT'),
    ('RUBIK', 'حل مكعب روبيك والسرعة', 'Rubiks Cube Speedcubing', '3x3 cube algorithms, CFOP methodology, and timed challenges', 'TIMED_OPERATIONS'),
    ('QURAN', 'تحفيظ القرآن الكريم وأحكام التجويد', 'Quran Memorization & Tajweed', 'Quranic memorization, recitation correction, and oral examinations', 'ORAL_RIGHT_WRONG'),
    ('HORSE_RIDING', 'الفروسية وركوب الخيل', 'Equestrian & Horse Riding', 'Horse riding mastery evaluated through practical challenge milestones', 'CHALLENGE_MILESTONES'),
    ('SWIMMING', 'السباحة الرياضية', 'Competitive & Basic Swimming', 'Swimming styles evaluated through practical milestone challenges', 'CHALLENGE_MILESTONES'),
    ('SUPPORT', 'دروس الدعم والتقوية المدرسية', 'Academic School Support', 'Tutoring and reinforcement across Algerian national school curriculum', 'STANDARD_SCORE'),
    ('SUMMER_CLUB', 'النادي الصيفي الترفيهي والعلمي', 'Genius Summer Club', 'Multi-activity summer camp workshops, arts, logic, and excursions', 'STANDARD_SCORE'),
    ('COMPETITION', 'المسابقات والبطولات الوطنية والدولية', 'Championships & Tournaments', 'Preparation and entry for national and international mental arithmetic tournaments', 'STANDARD_SCORE')
    ON CONFLICT (code) DO NOTHING;
    """,
    # Kindergarten Age Bands Seed
    """
    INSERT INTO kg_age_band (code, name_ar, name_en, min_age_months, max_age_months, description) VALUES
    ('BEBE', 'الرضع', 'Bébé', 3, 12, 'Infant nursery section for babies from 3 to 12 months'),
    ('PETITE', 'القسم الأصغر', 'Petite Section', 13, 35, 'Toddler section for toddlers from 13 to 35 months'),
    ('MOYENNE', 'القسم المتوسط', 'Moyenne Section', 36, 47, 'Mid-kindergarten group for children 3 to 4 years'),
    ('GRANDE', 'القسم الأكبر', 'Grande Section', 48, 71, 'Senior kindergarten group preparing for primary school')
    ON CONFLICT (code) DO NOTHING;
    """,
    # HR Staff Positions Seed
    """
    INSERT INTO hr_position (code, title_ar, title_en, category, description) VALUES
    ('TEACHER', 'أستاذ / مربي', 'Teacher / Educator', 'TEACHING', 'Academic course instructors and kindergarten head educators'),
    ('ADMIN', 'إداري / منسق', 'Administrative Coordinator', 'ADMINISTRATIVE', 'Branch administration, admissions and student affairs'),
    ('NANNY', 'مربية أطفال', 'Daycare Nanny', 'NANNY', 'Childcare providers and nursery caretakers'),
    ('COOK', 'طباخ المركز', 'Cafeteria Cook', 'COOK', 'Daycare cafeteria kitchen and meal preparation staff'),
    ('CLEANING', 'عامل نظافة', 'Hygiene & Cleaning Staff', 'CLEANING', 'Branch sanitation, deep cleaning, and daily disinfection'),
    ('MAINTENANCE', 'فني صيانة', 'Facility Maintenance', 'MAINTENANCE', 'Branch infrastructure, equipment repair and facility maintenance'),
    ('ORTHOPHONIST', 'أخصائي أرطوفوني', 'Speech Therapist / Orthophonist', 'ORTHOPHONIST', 'Specialist in speech, language development and pediatric communication')
    ON CONFLICT (code) DO NOTHING;
    """,
    # Comm Note Policy Seed
    """
    INSERT INTO comm_note_policy (branch_id, is_enabled, window_start_time, window_end_time, allowed_days) VALUES
    ('CENTER', TRUE, '08:00', '18:00', '1,2,3,4,5,6,7'),
    ('RAWDA', TRUE, '07:30', '17:30', '1,2,3,4,5,6,7'),
    ('BR-01', TRUE, '08:00', '18:00', '1,2,3,4,5,6,7'),
    ('BR-02', TRUE, '07:30', '17:30', '1,2,3,4,5,6,7')
    ON CONFLICT (branch_id) DO NOTHING;
    """,
    # Finance Standard Fee Plans Seed
    """
    INSERT INTO fin_fee_plan (branch_id, plan_type, name_ar, name_en, base_amount, discount_percentage, final_amount, installment_count, notes) VALUES
    ('RAWDA', 'KINDERGARTEN_MONTHLY', 'اشتراك الروضة الشهري', 'Kindergarten Monthly Plan', 12000.00, 0.00, 12000.00, 1, 'Standard monthly recurring daycare tuition'),
    ('RAWDA', 'KINDERGARTEN_ANNUAL', 'اشتراك الروضة السنوي مع تخفيض', 'Kindergarten Annual Discount Plan', 120000.00, 16.67, 100000.00, 1, 'Full-year upfront registration with 16.67% discount'),
    ('RAWDA', 'ANNUAL_REGISTRATION', 'حقوق التسجيل السنوية للروضة', 'Annual Kindergarten Registration Fee', 5000.00, 0.00, 5000.00, 1, 'Mandatory annual administration and insurance dossier fee'),
    ('CENTER', 'ANNUAL_REGISTRATION', 'حقوق التسجيل السنوية للأكاديمية', 'Annual Academy Registration Fee', 3500.00, 0.00, 3500.00, 1, 'Annual student file and access card registration fee')
    ON CONFLICT (branch_id, plan_type) DO NOTHING;
    """
]

# Consolidate all schema queries in proper relational order
ALL_SCHEMA_QUERIES = (
    CORE_INFRASTRUCTURE_TABLE_QUERIES
    + STUDENT_GUARDIAN_TABLE_QUERIES
    + PROGRAM_LEVEL_PRICING_TABLE_QUERIES
    + HR_FACULTY_TABLE_QUERIES
    + GROUP_SCHEDULE_SESSION_TABLE_QUERIES
    + ENROLLMENT_INVOICE_TABLE_QUERIES
    + TREASURY_CASH_DRAWER_TABLE_QUERIES
    + EXPENSE_BUDGET_TABLE_QUERIES
    + DAYCARE_KITCHEN_TABLE_QUERIES
    + COMPETITION_TABLE_QUERIES
    + PAYROLL_DISBURSEMENT_TABLE_QUERIES
    + AUDIT_TABLE_QUERIES
    + CORE_PERSON_TABLE_QUERIES
    + IAM_TABLE_QUERIES
    + ORGANIZATION_EXPANDED_TABLE_QUERIES
    + ACADEMY_MODULE_TABLE_QUERIES
    + KINDERGARTEN_TABLE_QUERIES
    + HR_STAFF_TABLE_QUERIES
    + COMMUNICATION_TABLE_QUERIES
    + FINANCE_EXTENDED_TABLE_QUERIES
    + MIGRATION_TABLE_QUERIES
    + SEED_CATALOG_QUERIES
)
