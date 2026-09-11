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
        group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE RESTRICT,
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
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """
]

# =====================================================================================
# 13. BOOTSTRAP SEED CATALOGS
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
    + SEED_CATALOG_QUERIES
)
