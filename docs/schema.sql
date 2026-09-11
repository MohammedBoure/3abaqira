-- =====================================================================================
-- 3ABAQIRA ENTERPRISE MANAGEMENT SYSTEM - DATABASE SCHEMA (PostgreSQL DDL)
-- Project: Unified Management Platform for Academy (CENTER) & Daycare (RAWDA)
-- Version: 1.0.0 (Production Release)
-- Target Database: PostgreSQL 12+ (Compatible with PostgreSQL 13, 14, 15, 16+)
-- Architecture: Multi-Tenant / Multi-Branch 3NF Relational Data Model
-- File: docs/schema.sql
-- =====================================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================================
-- SECTION 0: TEARDOWN & RE-INITIALIZATION (IDEMPOTENCY)
-- =====================================================================================

DROP VIEW IF EXISTS v_kitchen_provisions_monthly_summary CASCADE;
DROP VIEW IF EXISTS v_monthly_staff_payroll CASCADE;
DROP VIEW IF EXISTS v_daily_cash_reconciliation CASCADE;
DROP VIEW IF EXISTS v_daycare_monthly_roster CASCADE;
DROP VIEW IF EXISTS v_soroban_master_registry CASCADE;
DROP VIEW IF EXISTS v_active_student_roster CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payroll_items CASCADE;
DROP TABLE IF EXISTS payroll_runs CASCADE;
DROP TABLE IF EXISTS competition_registrations CASCADE;
DROP TABLE IF EXISTS competitions CASCADE;
DROP TABLE IF EXISTS provisions_orders CASCADE;
DROP TABLE IF EXISTS daily_bread_logs CASCADE;
DROP TABLE IF EXISTS budget_variances CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS cash_handovers CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS daily_cash_registers CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS student_enrollments CASCADE;
DROP TABLE IF EXISTS student_attendance CASCADE;
DROP TABLE IF EXISTS completed_sessions CASCADE;
DROP TABLE IF EXISTS group_schedules CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS coach_wage_matrices CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS pricing_plans CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS student_guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS guardians CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS classrooms CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- =====================================================================================
-- SECTION 1: CORE ORGANIZATIONAL INFRASTRUCTURE & MULTI-TENANCY
-- =====================================================================================

-- 1. Branches (Operating Entities: CENTER, RAWDA, and future branches)
CREATE TABLE branches (
    branch_id VARCHAR(20) PRIMARY KEY, -- 'CENTER', 'RAWDA', 'FUTURE_BRANCH_03'
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

-- 2. Academic & Fiscal Years
CREATE TABLE academic_years (
    academic_year_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- '2024-2025', '2025-2026'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_academic_year_dates CHECK (end_date > start_date)
);

-- 3. Classrooms & Operational Spaces (قاعات التدريس والحضانة)
CREATE TABLE classrooms (
    classroom_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL, -- e.g., 'قاعة 1', 'قاعة القران 1', 'قاعة المحاضرات', 'قاعة الرضع'
    capacity INTEGER NOT NULL DEFAULT 20 CHECK (capacity > 0),
    floor_number SMALLINT DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, name)
);

-- 4. System Users & RBAC Authentication (مستخدمو النظام والمصادقة)
CREATE TABLE users (
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

-- =====================================================================================
-- SECTION 2: GUARDIANS & STUDENTS MASTER DIRECTORY (BILINGUAL)
-- =====================================================================================

-- 4. Guardians / Parents Registry
CREATE TABLE guardians (
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

-- 5. Student Master Entity (Preserving Latin & Arabic spellings from Excel)
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    student_code VARCHAR(50) UNIQUE, -- e.g. 'STU-2025-001'
    legacy_seq_number INTEGER,        -- Preserves original sheet roll index ('الرقم')
    first_name VARCHAR(75),
    last_name VARCHAR(75),
    full_name_ar VARCHAR(150) NOT NULL, -- 'الإسم و اللقب'
    full_name_fr VARCHAR(150),          -- 'NOM FRANCAIS SOROBAN'
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

-- 6. Student Guardian Relational Link
CREATE TABLE student_guardians (
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    guardian_id INTEGER NOT NULL REFERENCES guardians(guardian_id) ON DELETE CASCADE,
    is_primary_guardian BOOLEAN NOT NULL DEFAULT TRUE,
    is_emergency_contact BOOLEAN NOT NULL DEFAULT TRUE,
    can_pickup BOOLEAN NOT NULL DEFAULT TRUE,
    relationship_type VARCHAR(50) DEFAULT 'Parent',
    PRIMARY KEY (student_id, guardian_id)
);

-- =====================================================================================
-- SECTION 3: EDUCATIONAL PROGRAMS, LEVELS & PRICING MATRIX
-- =====================================================================================

-- 7. Educational & Service Programs
CREATE TABLE programs (
    program_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL, -- 'SOROBAN', 'QURAN', 'PREP_2025', 'ROBOTICS', 'LANG_LEVELS', 'LANG_SUPPORT', 'SUPPORT_LESSONS', 'SUMMER_CLUB', 'DAYCARE'
    name_ar VARCHAR(150) NOT NULL,
    name_en VARCHAR(150),
    billing_type VARCHAR(30) NOT NULL CHECK (billing_type IN ('INSTALLMENT_PLAN', 'MONTHLY_RECURRING', 'PER_SESSION', 'ONE_TIME_EVENT', 'ANNUAL_PACKAGE')),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, code)
);

-- 8. Academic Levels, Belts & Age Cohorts (المستويات / الأحزمة / الفئات العمرية)
CREATE TABLE levels (
    level_id SERIAL PRIMARY KEY,
    program_id INTEGER NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    level_code VARCHAR(50) NOT NULL, -- 'p1', 'p2', 'j2', 's6', 'bebe', 'petit_1', 'moyen_1', 'grand_1', 'A1', '4AM'
    name_ar VARCHAR(150) NOT NULL,   -- 'المستوى الأول', 'فئة الرضع', etc.
    name_en VARCHAR(150),
    age_group_cohort VARCHAR(50),    -- 'Bébé', 'Petit Section', 'Moyen Section', 'Grand Section', 'Primary', 'Middle', 'Secondary'
    color_tag VARCHAR(50),           -- Belt/Cap color from Feuil9: 'أخضر', 'أحمر', 'أزرق', 'أصفر', 'برتقالي', 'بنفسجي', 'أبيض'
    sequence_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (program_id, level_code)
);

-- 9. Pricing Matrix & Discount Policies (Replacing Sheet 'الأسعار')
CREATE TABLE pricing_plans (
    pricing_plan_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    program_id INTEGER REFERENCES programs(program_id) ON DELETE SET NULL,
    level_id INTEGER REFERENCES levels(level_id) ON DELETE SET NULL,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
    plan_name VARCHAR(150) NOT NULL,
    standard_installment_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (standard_installment_price >= 0), -- Base installment fee e.g. 15,000 DZD
    cash_discount DECIMAL(10,2) NOT NULL DEFAULT 500.00 CHECK (cash_discount >= 0),                         -- Cash discount: -500 DZD
    sibling_discount DECIMAL(10,2) NOT NULL DEFAULT 500.00 CHECK (sibling_discount >= 0),                   -- Sibling discount: -500 DZD
    annual_prepaid_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (annual_prepaid_discount >= 0),       -- Daycare 'العرض 2025' offer (e.g., 121,500 DZD package)
    monthly_standard_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (monthly_standard_rate >= 0),           -- Daycare monthly standard fee: 14,500 DZD
    registration_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (registration_fee >= 0),                     -- Registration fee: 8,000 DZD
    installments_count SMALLINT NOT NULL DEFAULT 4 CHECK (installments_count BETWEEN 1 AND 12),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- SECTION 4: HUMAN RESOURCES, COACHING WAGE MODELS & STAFF
-- =====================================================================================

-- 10. Employees & Faculty Master (Teachers, Coaches, Nannies, Admins)
CREATE TABLE employees (
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

-- 11. Coach Wage Matrices & Multipliers (Replacing 'اجور السوروبان' & 'Feuil1 (2)')
CREATE TABLE coach_wage_matrices (
    wage_matrix_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    program_id INTEGER NOT NULL REFERENCES programs(program_id) ON DELETE RESTRICT,
    level_id INTEGER REFERENCES levels(level_id) ON DELETE SET NULL,
    part_number SMALLINT NOT NULL DEFAULT 1 CHECK (part_number IN (1, 2)), -- Part 1 vs Part 2 calculations
    min_students INTEGER NOT NULL DEFAULT 1 CHECK (min_students >= 0),
    max_students INTEGER CHECK (max_students >= min_students),
    rate_per_student DECIMAL(10,2) NOT NULL CHECK (rate_per_student >= 0), -- e.g. 700, 550, 405, 270, 135 DZD
    rate_per_session DECIMAL(10,2) DEFAULT 0.00 CHECK (rate_per_session >= 0),
    notes VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- SECTION 5: GROUPS, TIMETABLES & SESSION LOGS
-- =====================================================================================

-- 12. Class Cohorts & Groups (الأفواج وتقسيم الأفواج)
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    level_id INTEGER NOT NULL REFERENCES levels(level_id) ON DELETE RESTRICT,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
    group_name VARCHAR(100) NOT NULL, -- e.g. 'فوج السبت 1', 'bebe', 'petit section 1-1', 'moyen section -2'
    lead_teacher_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    secondary_teacher_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL, -- Assistant teacher or Nanny (المربية 2)
    max_capacity INTEGER NOT NULL DEFAULT 18 CHECK (max_capacity > 0),
    current_headcount INTEGER NOT NULL DEFAULT 0 CHECK (current_headcount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PLANNED', 'COMPLETED', 'MERGED', 'CANCELLED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, academic_year_id, group_name)
);

-- 13. Timetable Schedules (Room & Day Allocations - Sheet 'الأفواج')
CREATE TABLE group_schedules (
    schedule_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    classroom_id INTEGER NOT NULL REFERENCES classrooms(classroom_id) ON DELETE RESTRICT,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت')),
    time_slot_label VARCHAR(50), -- 'الجمعة صباحا', 'السبت مساءا', '1سا-3:30 سا', 'الاحد-الخميس'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_times CHECK (end_time > start_time)
);

-- 14. Completed Sessions & Actual Conducted Classes (Quran shifts, support session counters)
CREATE TABLE completed_sessions (
    session_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    instructor_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
    classroom_id INTEGER REFERENCES classrooms(classroom_id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_hours DECIMAL(4,2) NOT NULL DEFAULT 2.0 CHECK (duration_hours > 0),
    shift_slot VARCHAR(50), -- 'FRIDAY_AM', 'FRIDAY_PM', 'SATURDAY_AM', 'SATURDAY_PM', 'WEEKDAY_REGULAR'
    attended_student_count INTEGER NOT NULL DEFAULT 0 CHECK (attended_student_count >= 0),
    calculated_wage DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (calculated_wage >= 0),
    is_counted_for_payroll BOOLEAN NOT NULL DEFAULT FALSE,
    payroll_item_id INTEGER, -- FK added later via ALTER TABLE
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Student Attendance & Scoring (Replacing 'Feuil3' Points and Attendance Index)
CREATE TABLE student_attendance (
    attendance_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES completed_sessions(session_id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'EXCUSED', 'LATE')),
    points_scored INTEGER DEFAULT 0, -- Student point scoring
    evaluation_notes TEXT,
    UNIQUE (session_id, student_id)
);

-- =====================================================================================
-- SECTION 6: STUDENT ENROLLMENTS & INVOICE SCHEDULES
-- =====================================================================================

-- 16. Student Course & Daycare Enrollments
CREATE TABLE student_enrollments (
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
    has_annual_package BOOLEAN NOT NULL DEFAULT FALSE, -- Daycare 'العرض 2025' offer
    total_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (total_discount_amount >= 0),
    registration_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (registration_fee_amount >= 0),
    agreed_total_amount DECIMAL(10,2) NOT NULL CHECK (agreed_total_amount >= 0), -- Final agreed fee ('الوضعية')
    enrollment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (enrollment_status IN ('ACTIVE', 'COMPLETED', 'SUSPENDED', 'DROPPED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, group_id, academic_year_id)
);

-- 17. Invoices & Installment Tranches (Replacing 4 installments & 11 monthly tuition columns)
CREATE TABLE invoices (
    invoice_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    enrollment_id INTEGER NOT NULL REFERENCES student_enrollments(enrollment_id) ON DELETE CASCADE,
    installment_number SMALLINT NOT NULL CHECK (installment_number >= 1), -- 1..4 (Tranches) or 1..11 (Months)
    period_label VARCHAR(50) NOT NULL, -- 'الدفعة 1', 'الدفعة 2', 'سبتمبر', 'أكتوبر', 'رسوم التسجيل'
    due_date DATE,                     -- 'التاريخ المقترح'
    amount_due DECIMAL(10,2) NOT NULL CHECK (amount_due >= 0),
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    remaining_balance DECIMAL(10,2) GENERATED ALWAYS AS (amount_due - amount_paid) STORED, -- 'الباقي'
    status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'WAIVED')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (enrollment_id, installment_number, period_label)
);

-- =====================================================================================
-- SECTION 7: TREASURY, CASH DRAWERS, RECEIPTS & REMITTANCES
-- =====================================================================================

-- 18. Daily Cash Registers (Replacing Sheet 'الملخص اليومي')
CREATE TABLE daily_cash_registers (
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

-- 19. Payments & Cash Receipts (Replacing 'الوصل')
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    invoice_id INTEGER NOT NULL REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
    register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
    receipt_number VARCHAR(50) NOT NULL, -- 'الوصل' / 'رقم الوصل'
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CHECK', 'BANK_TRANSFER', 'CARD', 'OTHER')),
    collected_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, receipt_number)
);

-- 20. Cash Remittances / Safe Handovers (Replacing Sheet 'التسليم')
CREATE TABLE cash_handovers (
    handover_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
    handover_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_voucher_no VARCHAR(50), -- Physical drop voucher number
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    transferred_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    received_by_name VARCHAR(150) NOT NULL, -- 'المستلم' / 'المستلم(ة)'
    handover_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- SECTION 8: OPERATIONAL EXPENSES & BUDGET VARIANCES
-- =====================================================================================

-- 21. Expense Categories (Replacing Expense Heads in 'ملخص المصاريف')
CREATE TABLE expense_categories (
    category_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(150) NOT NULL, -- 'حفاظات و مواد التنظيف', 'مواد جافة', 'الخبز', 'خضر وفواكه', 'ياوغورت', 'اللحم و الدجاج', 'المصروف اليومي'
    name_en VARCHAR(150),
    is_cafeteria_related BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, code)
);

-- 22. Daily Operational Expenses (Replacing 'المصاريف' and 'المصروف اليومي')
CREATE TABLE expenses (
    expense_id BIGSERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
    category_id INTEGER NOT NULL REFERENCES expense_categories(category_id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL,
    month_code VARCHAR(7) NOT NULL, -- '2025-09', '2025-10', etc.
    description VARCHAR(255) NOT NULL, -- 'التعيين'
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH' CHECK (payment_method IN ('CASH', 'CHECK', 'BANK_TRANSFER', 'CARD')),
    voucher_number VARCHAR(50),
    paid_to VARCHAR(150),
    authorized_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    receipt_attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 23. Monthly Expense Budget & Variance Analysis (Replacing Sheet 'ملخص المصاريف')
CREATE TABLE budget_variances (
    budget_variance_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    category_id INTEGER NOT NULL REFERENCES expense_categories(category_id) ON DELETE RESTRICT,
    month_period VARCHAR(7) NOT NULL, -- '2025-09'
    variable_factor DECIMAL(10,2) DEFAULT 0.00, -- 'المتغير' (units / headcount / loaf count)
    budgeted_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (budgeted_amount >= 0), -- 'المبلغ المستحق'
    actual_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (actual_amount >= 0),     -- 'المبلغ الحقيقي'
    variance DECIMAL(10,2) GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED, -- 'الباقي'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, category_id, month_period)
);

-- =====================================================================================
-- SECTION 9: DAYCARE CAFETERIA PROCUREMENT & KITCHEN LOGS
-- =====================================================================================

-- 24. Daily Bread Consumption Tracking (Replacing Sheet 'الخبز')
CREATE TABLE daily_bread_logs (
    bread_log_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    log_date DATE NOT NULL,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت')),
    scheduled_meal VARCHAR(100) NOT NULL, -- Menu items: 'كسكس', 'سباقيتي', 'عدس', 'بيري', 'معكرونة'
    loaf_count INTEGER NOT NULL CHECK (loaf_count >= 0), -- 'عدد الخبز'
    unit_price DECIMAL(6,2) NOT NULL DEFAULT 15.00 CHECK (unit_price >= 0), -- 'السعر'
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (loaf_count * unit_price) STORED, -- 'المجموع'
    supplier_name VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, log_date)
);

-- 25. Provisions Orders (Butcher, Poultry, Eggs, Dairy & Water - Replacing Sheet 'اللحم و الدجاج')
CREATE TABLE provisions_orders (
    order_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    order_date DATE NOT NULL,
    order_month VARCHAR(7) NOT NULL, -- '2025-09'
    week_number SMALLINT NOT NULL CHECK (week_number BETWEEN 1 AND 5), -- 'الأسبوع'
    item_category VARCHAR(100) NOT NULL, -- 'اللحم', 'الدجاج', 'سكالوب مرحي', 'الماء - 5ل', 'البيض', 'الجبن'
    quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0), -- 'الكمية'
    unit_measure VARCHAR(20) NOT NULL DEFAULT 'Kg' CHECK (unit_measure IN ('Kg', 'Piece', 'Tray', 'Bottle', 'Pack', 'Box', 'Liter')),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0), -- 'السعر - كغ'
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED, -- 'المبلغ'
    supplier_name VARCHAR(100),
    expense_id BIGINT REFERENCES expenses(expense_id) ON DELETE SET NULL, -- Links to ledger expense entry
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- SECTION 10: COMPETITIONS & SPECIAL EVENTS
-- =====================================================================================

-- 26. Competitions & Championships (البطولة الوطنية / البطولة الولائية)
CREATE TABLE competitions (
    competition_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    academic_year_id INTEGER NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL, -- 'البطولة الوطنية', 'البطولة الولائية'
    scope VARCHAR(50) NOT NULL DEFAULT 'NATIONAL' CHECK (scope IN ('NATIONAL', 'REGIONAL', 'WILAYA', 'INTERNAL', 'INTERNATIONAL')),
    event_date DATE,
    location VARCHAR(200),
    registration_fee DECIMAL(10,2) NOT NULL CHECK (registration_fee >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 27. Competitor Registrations & Fee Receipts
CREATE TABLE competition_registrations (
    registration_id SERIAL PRIMARY KEY,
    competition_id INTEGER NOT NULL REFERENCES competitions(competition_id) ON DELETE RESTRICT,
    student_id INTEGER REFERENCES students(student_id) ON DELETE SET NULL,
    competitor_name VARCHAR(150) NOT NULL, -- Competitor full name (allows outside competitors)
    division_level VARCHAR(50),
    receipt_number VARCHAR(50), -- 'رقم الوصل'
    fee_amount DECIMAL(10,2) NOT NULL CHECK (fee_amount >= 0),
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'EXEMPT')),
    register_id INTEGER REFERENCES daily_cash_registers(register_id) ON DELETE SET NULL,
    notes TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (competition_id, student_id)
);

-- =====================================================================================
-- SECTION 11: HR MONTHLY PAYROLL RUNS & DISBURSEMENT LEDGER
-- =====================================================================================

-- 28. Monthly Payroll Runs (Replacing 'الرواتب الشهرية')
CREATE TABLE payroll_runs (
    payroll_run_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(20) NOT NULL REFERENCES branches(branch_id) ON DELETE RESTRICT,
    month_period VARCHAR(7) NOT NULL, -- '2025-09'
    run_date DATE NOT NULL DEFAULT CURRENT_DATE,
    admin_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (admin_subtotal >= 0),    -- 'المجموع أجور الإدارة'
    teachers_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (teachers_subtotal >= 0),-- 'أجور أساتذة التحضيري'
    coaches_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (coaches_subtotal >= 0),  -- 'أجور المدربين'
    total_disbursed DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (total_disbursed >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CALCULATED', 'APPROVED', 'DISBURSED', 'CANCELLED')),
    approved_by_employee_id INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (branch_id, month_period)
);

-- 29. Employee Payroll Line Items
CREATE TABLE payroll_items (
    payroll_item_id SERIAL PRIMARY KEY,
    payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(payroll_run_id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES employees(employee_id) ON DELETE RESTRICT,
    base_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (base_amount >= 0),
    headcount_count INTEGER NOT NULL DEFAULT 0 CHECK (headcount_count >= 0),       -- 'عدد الاطفال'
    headcount_bonus DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (headcount_bonus >= 0), -- Headcount payout
    session_count INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),           -- 'عدد الحصص'
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

-- Add deferred foreign key from completed_sessions to payroll_items
ALTER TABLE completed_sessions
ADD CONSTRAINT fk_completed_sessions_payroll_item
FOREIGN KEY (payroll_item_id) REFERENCES payroll_items(payroll_item_id) ON DELETE SET NULL;

-- =====================================================================================
-- SECTION 12: SYSTEM AUDIT LOGGING
-- =====================================================================================

-- 30. Comprehensive System Audit Trail
CREATE TABLE audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id BIGINT NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    performed_by VARCHAR(100),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================================
-- SECTION 13: AUTOMATED BUSINESS INTEGRITY TRIGGERS & FUNCTIONS
-- =====================================================================================

-- 1. Automated Timestamp Synchronizer
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_enrollments_updated_at BEFORE UPDATE ON student_enrollments FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_registers_updated_at BEFORE UPDATE ON daily_cash_registers FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_budget_variances_updated_at BEFORE UPDATE ON budget_variances FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

-- 2. Invoice Payment Synchronization Trigger (Syncs amount_paid and status on payments modification)
CREATE OR REPLACE FUNCTION fn_sync_invoice_payments()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id INTEGER;
    v_total_paid DECIMAL(10,2);
    v_amount_due DECIMAL(10,2);
    v_due_date DATE;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Aggregate total payments confirmed for this invoice
    SELECT COALESCE(SUM(amount), 0.00)
    INTO v_total_paid
    FROM payments
    WHERE invoice_id = v_invoice_id;

    -- Retrieve current invoice due amount and date
    SELECT amount_due, due_date
    INTO v_amount_due, v_due_date
    FROM invoices
    WHERE invoice_id = v_invoice_id;

    -- Update invoice status and paid amount atomically
    UPDATE invoices
    SET amount_paid = v_total_paid,
        status = CASE
            WHEN v_total_paid >= v_amount_due THEN 'PAID'
            WHEN v_total_paid > 0.00 THEN 'PARTIALLY_PAID'
            WHEN v_due_date IS NOT NULL AND v_due_date < CURRENT_DATE THEN 'OVERDUE'
            ELSE 'UNPAID'
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE invoice_id = v_invoice_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_sync_invoice
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_sync_invoice_payments();

-- 3. Daily Cash Drawer Dynamic Aggregates Trigger
-- Keeps daily_cash_registers totals in exact mathematical alignment with transaction tables
CREATE OR REPLACE FUNCTION fn_sync_daily_register_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    v_register_id INTEGER;
    v_rev DECIMAL(12,2);
    v_exp DECIMAL(12,2);
    v_rem DECIMAL(12,2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_register_id := OLD.register_id;
    ELSE
        v_register_id := NEW.register_id;
    END IF;

    IF v_register_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Aggregate revenues from confirmed payments
    SELECT COALESCE(SUM(amount), 0.00) INTO v_rev
    FROM payments
    WHERE register_id = v_register_id;

    -- Aggregate expenses from daily ledger
    SELECT COALESCE(SUM(amount), 0.00) INTO v_exp
    FROM expenses
    WHERE register_id = v_register_id;

    -- Aggregate cash remittances handed over to safe
    SELECT COALESCE(SUM(amount), 0.00) INTO v_rem
    FROM cash_handovers
    WHERE register_id = v_register_id;

    -- Update register aggregates (closing_balance updates automatically via STORED GENERATED formula)
    UPDATE daily_cash_registers
    SET total_revenues = v_rev,
        total_expenses = v_exp,
        total_remitted = v_rem,
        updated_at = CURRENT_TIMESTAMP
    WHERE register_id = v_register_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_sync_drawer
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_sync_daily_register_aggregates();

CREATE TRIGGER trg_expenses_sync_drawer
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION fn_sync_daily_register_aggregates();

CREATE TRIGGER trg_handovers_sync_drawer
AFTER INSERT OR UPDATE OR DELETE ON cash_handovers
FOR EACH ROW EXECUTE FUNCTION fn_sync_daily_register_aggregates();

-- 4. Group Headcount & Classroom Capacity Guard
CREATE OR REPLACE FUNCTION fn_sync_group_headcount()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id INTEGER;
    v_count INTEGER;
    v_max INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_group_id := OLD.group_id;
    ELSE
        v_group_id := NEW.group_id;
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM student_enrollments
    WHERE group_id = v_group_id AND enrollment_status = 'ACTIVE';

    SELECT max_capacity INTO v_max
    FROM groups
    WHERE group_id = v_group_id;

    IF v_count > v_max THEN
        RAISE WARNING 'Group % has exceeded its maximum capacity (%/%)', v_group_id, v_count, v_max;
    END IF;

    UPDATE groups
    SET current_headcount = v_count
    WHERE group_id = v_group_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enrollment_sync_headcount
AFTER INSERT OR UPDATE OR DELETE ON student_enrollments
FOR EACH ROW EXECUTE FUNCTION fn_sync_group_headcount();

-- 5. Budget Variance Realized Spending Synchronizer
CREATE OR REPLACE FUNCTION fn_sync_budget_variance()
RETURNS TRIGGER AS $$
DECLARE
    v_branch_id VARCHAR(20);
    v_category_id INTEGER;
    v_month_code VARCHAR(7);
    v_actual DECIMAL(10,2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_branch_id := OLD.branch_id;
        v_category_id := OLD.category_id;
        v_month_code := OLD.month_code;
    ELSE
        v_branch_id := NEW.branch_id;
        v_category_id := NEW.category_id;
        v_month_code := NEW.month_code;
    END IF;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_actual
    FROM expenses
    WHERE branch_id = v_branch_id
      AND category_id = v_category_id
      AND month_code = v_month_code;

    UPDATE budget_variances
    SET actual_amount = v_actual,
        updated_at = CURRENT_TIMESTAMP
    WHERE branch_id = v_branch_id
      AND category_id = v_category_id
      AND month_period = v_month_code;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_sync_budget
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION fn_sync_budget_variance();

-- =====================================================================================
-- SECTION 14: PERFORMANCE INDEXES
-- =====================================================================================

-- Foreign Key & Join Optimization Indexes
CREATE INDEX idx_classrooms_branch ON classrooms(branch_id);
CREATE INDEX idx_programs_branch ON programs(branch_id);
CREATE INDEX idx_levels_program ON levels(program_id);
CREATE INDEX idx_pricing_lookup ON pricing_plans(branch_id, level_id, academic_year_id);
CREATE INDEX idx_employees_branch_role ON employees(branch_id, role);
CREATE INDEX idx_coach_wage_lookup ON coach_wage_matrices(program_id, level_id, part_number);
CREATE INDEX idx_groups_level_year ON groups(level_id, academic_year_id);
CREATE INDEX idx_groups_teacher ON groups(lead_teacher_id);
CREATE INDEX idx_schedules_group ON group_schedules(group_id);
CREATE INDEX idx_sessions_group_date ON completed_sessions(group_id, session_date);
CREATE INDEX idx_sessions_instructor ON completed_sessions(instructor_id);
CREATE INDEX idx_attendance_session ON student_attendance(session_id);
CREATE INDEX idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX idx_enrollments_group ON student_enrollments(group_id);
CREATE INDEX idx_invoices_enrollment ON invoices(enrollment_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_register ON payments(register_id);
CREATE INDEX idx_handovers_register ON cash_handovers(register_id);
CREATE INDEX idx_expenses_register ON expenses(register_id);
CREATE INDEX idx_expenses_category_month ON expenses(branch_id, category_id, month_code);
CREATE INDEX idx_budget_lookup ON budget_variances(branch_id, category_id, month_period);
CREATE INDEX idx_bread_branch_date ON daily_bread_logs(branch_id, log_date);
CREATE INDEX idx_provisions_branch_month ON provisions_orders(branch_id, order_month, week_number);
CREATE INDEX idx_competitions_year ON competitions(branch_id, academic_year_id);
CREATE INDEX idx_comp_reg_competition ON competition_registrations(competition_id);
CREATE INDEX idx_payroll_items_run ON payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_emp ON payroll_items(employee_id);

-- Bilingual Search & Filtering Indexes
CREATE INDEX idx_students_name_ar ON students(full_name_ar);
CREATE INDEX idx_students_name_fr ON students(full_name_fr);
CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_guardians_phone ON guardians(phone_primary);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);
CREATE INDEX idx_registers_branch_date ON daily_cash_registers(branch_id, register_date);
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);

-- =====================================================================================
-- SECTION 15: SPECIALIZED OPERATIONAL & FINANCIAL REPORTING VIEWS
-- =====================================================================================

-- 1. Active Student Roster with Complete Program Details
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

-- 2. Master Soroban Registry View (Direct 1:1 replacement for Sheet 'FEILLE')
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

-- 3. Daycare Monthly Tuition Registry View (Direct 1:1 replacement for Sheet 'المداخيل')
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

-- 4. Daily Cash Drawer Audit & Reconciliation View (Direct replacement for Sheet 'الملخص اليومي')
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

-- 5. Monthly Staff Payroll Summary View (Direct replacement for Sheet 'الرواتب الشهرية')
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

-- 6. Kitchen & Provisions Monthly Procurement Summary View (Replacement for 'ملخص المصاريف' Kitchen heads)
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

-- =====================================================================================
-- SECTION 16: PRODUCTION SEED DATA (BOOTSTRAP CATALOGS)
-- =====================================================================================

-- 1. Branches Seed
INSERT INTO branches (branch_id, name_ar, name_en, branch_type, phone, email, address) VALUES
('CENTER', 'أكاديمية الأطفال العباقرة - المركز', '3abaqira Academy - Center', 'ACADEMY', '+213-21-000001', 'center@3abaqira.dz', 'Algiers, Algeria'),
('RAWDA', 'روضة أكاديمية الأطفال العباقرة', '3abaqira Kindergarten & Daycare', 'DAYCARE', '+213-21-000002', 'rawda@3abaqira.dz', 'Algiers, Algeria');

-- 2. Academic Fiscal Years Seed
INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES
('2024-2025', '2024-09-01', '2025-07-31', FALSE),
('2025-2026', '2025-09-01', '2026-07-31', TRUE);

-- 3. Classrooms Seed
INSERT INTO classrooms (branch_id, name, capacity, floor_number) VALUES
('CENTER', 'قاعة 1', 18, 1),
('CENTER', 'قاعة 2', 18, 1),
('CENTER', 'قاعة 3', 18, 1),
('CENTER', 'قاعة 4', 18, 1),
('CENTER', 'قاعة 5', 18, 1),
('CENTER', 'قاعة 6', 18, 1),
('CENTER', 'قاعة 7', 18, 1),
('CENTER', 'قاعة 8', 18, 1),
('CENTER', 'قاعة 9', 18, 1),
('CENTER', 'قاعة 10', 18, 1),
('CENTER', 'قاعة 11', 18, 1),
('CENTER', 'قاعة المحاضرات', 40, 0),
('CENTER', 'قاعة القران 1', 25, 2),
('CENTER', 'قاعة القران 2', 25, 2),
('RAWDA', 'قاعة الرضع (Bébé)', 12, 1),
('RAWDA', 'قاعة الحضانة الصغرى 1', 15, 1),
('RAWDA', 'قاعة الحضانة الصغرى 2', 15, 1),
('RAWDA', 'قاعة الحضانة الوسطى 1', 18, 1),
('RAWDA', 'قاعة الحضانة الوسطى 2', 18, 1),
('RAWDA', 'قاعة الحضانة الكبرى 1', 20, 2),
('RAWDA', 'قاعة الحضانة الكبرى 2', 20, 2);

-- 4. Programs Seed
INSERT INTO programs (branch_id, code, name_ar, name_en, billing_type, description) VALUES
('CENTER', 'SOROBAN', 'الحساب الذهني (السوروبان)', 'Soroban Mental Arithmetic', 'INSTALLMENT_PLAN', 'Soroban course levels p1 through s6 with 4 tranches'),
('CENTER', 'QURAN', 'تحفيظ القرآن الكريم', 'Quran Memorization', 'MONTHLY_RECURRING', 'Quranic memorization weekend shifts and monthly fee'),
('CENTER', 'PREP_2025', 'تحضيري 2025', 'Academic Preparatory 2025', 'MONTHLY_RECURRING', 'Preschool academic curriculum with registration fee and monthly billing'),
('CENTER', 'ROBOTICS', 'الروبوتيك والذكاء الاصطناعي', 'Robotics & STEM', 'INSTALLMENT_PLAN', 'Hands-on robotics workshops with 4-part installment plan'),
('CENTER', 'LANG_LEVELS', 'اللغات - مستويات', 'Foreign Languages (Levels)', 'INSTALLMENT_PLAN', 'French and English proficiency levels with 4 installments'),
('CENTER', 'LANG_SUPPORT', 'اللغات - دعم مدرسي', 'Language School Support', 'INSTALLMENT_PLAN', 'School curriculum language tutoring with 4 installments'),
('CENTER', 'SUPPORT_LESSONS', 'دروس الدعم العلمي والأدبي', 'Academic Support Lessons', 'INSTALLMENT_PLAN', 'School academic support with 4 installments'),
('CENTER', 'SUMMER_CLUB', 'النادي الصيفي', 'Summer Club Camp', 'INSTALLMENT_PLAN', 'Seasonal summer camp activities with 2 installments'),
('RAWDA', 'DAYCARE', 'الروضة والحضانة اليومية', 'Daycare & Kindergarten', 'MONTHLY_RECURRING', 'Full-service daycare, nursery cohorts, and cafeteria');

-- 5. Levels Seed (Soroban Belts & Daycare Cohorts)
INSERT INTO levels (program_id, level_code, name_ar, name_en, age_group_cohort, color_tag, sequence_order) VALUES
-- Soroban levels (Program 1)
(1, 'p1', 'المستوى الأول (تحضيري)', 'Primary Level 1', 'Primary', 'أخضر (Green)', 1),
(1, 'p2', 'المستوى الثاني (تحضيري)', 'Primary Level 2', 'Primary', 'أحمر (Red)', 2),
(1, 'p3', 'المستوى الثالث (تحضيري)', 'Primary Level 3', 'Primary', 'أزرق (Blue)', 3),
(1, 'p4', 'المستوى الرابع (تحضيري)', 'Primary Level 4', 'Primary', 'أصفر (Yellow)', 4),
(1, 'p5', 'المستوى الخامس (تحضيري)', 'Primary Level 5', 'Primary', 'برتقالي (Orange)', 5),
(1, 'j1', 'المستوى الأول (ناشئين)', 'Junior Level 1', 'Junior', 'بنفسجي (Purple)', 6),
(1, 'j2', 'المستوى الثاني (ناشئين)', 'Junior Level 2', 'Junior', 'أبيض (White)', 7),
(1, 'j3', 'المستوى الثالث (ناشئين)', 'Junior Level 3', 'Junior', 'بني (Brown)', 8),
(1, 'j4', 'المستوى الرابع (ناشئين)', 'Junior Level 4', 'Junior', 'رمادي (Grey)', 9),
(1, 's6', 'المستوى السادس (متقدم)', 'Senior Level 6', 'Senior', 'أسود (Black)', 10),
-- Daycare Cohorts (Program 9)
(9, 'bebe', 'فئة الرضع', 'Infant Nursery (Bébé)', 'Bébé', 'وردي (Pink)', 1),
(9, 'petit_1', 'القسم الصغير 1', 'Toddler 1 (Petit Section)', 'Petit Section', 'أزرق فاتح (Light Blue)', 2),
(9, 'petit_1_1', 'القسم الصغير 1-1', 'Toddler 1-1', 'Petit Section', 'أزرق فاتح (Light Blue)', 3),
(9, 'petit_1_2', 'القسم الصغير 1-2', 'Toddler 1-2', 'Petit Section', 'أزرق فاتح (Light Blue)', 4),
(9, 'moyen_1', 'القسم المتوسط 1', 'Middle Preschool 1', 'Moyen Section', 'أخضر تفاحي (Lime)', 5),
(9, 'moyen_2', 'القسم المتوسط 2', 'Middle Preschool 2', 'Moyen Section', 'أخضر تفاحي (Lime)', 6),
(9, 'moyen_3', 'القسم المتوسط 3', 'Middle Preschool 3', 'Moyen Section', 'أخضر تفاحي (Lime)', 7),
(9, 'grand_1', 'القسم الكبير 1', 'Upper Kindergarten 1', 'Grand Section', 'أصفر ذهبي (Gold)', 8),
(9, 'grand_2', 'القسم الكبير 2', 'Upper Kindergarten 2', 'Grand Section', 'أصفر ذهبي (Gold)', 9),
(9, 'grand_3', 'القسم الكبير 3 (تحضيري)', 'Upper Kindergarten 3 (Prep)', 'Grand Section', 'أصفر ذهبي (Gold)', 10);

-- 6. Expense Categories Seed
INSERT INTO expense_categories (branch_id, code, name_ar, name_en, is_cafeteria_related) VALUES
-- Daycare Categories (Sheet 'ملخص المصاريف')
('RAWDA', 'DIAPERS_CLEANING', 'حفاظات و مواد التنظيف', 'Diapers & Sanitary Supplies', FALSE),
('RAWDA', 'PETTY_CASH', 'المصروف اليومي', 'Daily Petty Cash Operations', FALSE),
('RAWDA', 'DRY_GOODS', 'مواد جافة', 'Dry Groceries & Non-perishables', TRUE),
('RAWDA', 'BREAD', 'الخبز', 'Daily Bakery & Bread', TRUE),
('RAWDA', 'PRODUCE', 'خضر وفواكه', 'Fresh Produce & Fruit', TRUE),
('RAWDA', 'DAIRY_YOGURT', 'ياوغورت وأجبان', 'Yogurt, Dairy & Eggs', TRUE),
('RAWDA', 'MEAT_POULTRY', 'اللحم و الدجاج', 'Fresh Meat & Poultry', TRUE),
('RAWDA', 'FACILITY_MAINTENANCE', 'صيانة وتجهيزات', 'Facility Repairs & Equipment', FALSE),
-- Academy Categories (Sheet 'المصاريف')
('CENTER', 'OFFICE_SUPPLIES', 'أدوات ومستلزمات مكتبية', 'Office & Stationery Supplies', FALSE),
('CENTER', 'PRINTING_BOOKS', 'مطبوعات وكتب تعليمية', 'Educational Books & Printing', FALSE),
('CENTER', 'HOSPITALITY', 'ضيافة واستقبال', 'Hospitality & Refreshments', FALSE),
('CENTER', 'UTILITIES', 'فواتير الماء والكهرباء والإنترنت', 'Utilities & Telecom', FALSE),
('CENTER', 'TOURNAMENT_EXPENSES', 'مصاريف البطولات والمسابقات', 'Tournament & Event Expenses', FALSE),
('CENTER', 'CENTER_MAINTENANCE', 'صيانة المركز', 'Center Maintenance', FALSE),
('CENTER', 'MISC_EXPENSES', 'مصاريف مختلفة', 'Miscellaneous Operations', FALSE);

-- 7. Standard Pricing Plans Seed (Sheet 'الأسعار' & 'المداخيل')
INSERT INTO pricing_plans (
    branch_id, program_id, academic_year_id, plan_name,
    standard_installment_price, cash_discount, sibling_discount,
    annual_prepaid_discount, monthly_standard_rate, registration_fee, installments_count
) VALUES
-- Academy Soroban standard pricing (15,000 DZD base, 500 DZD cash discount, 500 DZD sibling discount)
('CENTER', 1, 2, 'خطة السوروبان القياسية 2025-2026', 15000.00, 500.00, 500.00, 0.00, 0.00, 0.00, 4),
-- Daycare standard monthly & annual offer (14,500 DZD monthly, 8,000 DZD registration, 121,500 DZD prepaid annual offer)
('RAWDA', 9, 2, 'خطة الروضة السنوية والشهرية 2025-2026', 0.00, 0.00, 0.00, 121500.00, 14500.00, 8000.00, 11);

-- 8. Coach Wage Matrix Seed (Coefficients: 700, 550, 405, 270, 135 DZD)
INSERT INTO coach_wage_matrices (branch_id, program_id, part_number, min_students, max_students, rate_per_student, notes) VALUES
('CENTER', 1, 1, 1, 8, 700.00, 'Part 1: Tier 1 small group coefficient'),
('CENTER', 1, 1, 9, 14, 550.00, 'Part 1: Tier 2 medium group coefficient'),
('CENTER', 1, 1, 15, 20, 405.00, 'Part 1: Tier 3 standard group coefficient'),
('CENTER', 1, 2, 1, 10, 270.00, 'Part 2: Primary tranche coefficient'),
('CENTER', 1, 2, 11, 25, 135.00, 'Part 2: Advanced tranche coefficient');

-- =====================================================================================
-- END OF DDL SCRIPT
-- =====================================================================================
