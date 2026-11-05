# Backend Database Layer (`backend/database/`)

This directory serves as the unified data access, persistence, and business logic engine for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة). It implements multi-branch operations, relational data managers, cross-dialect abstraction (PostgreSQL, SQLite, MySQL), audit tracking, and automated database migrations.

---

## Directory Architecture

```
backend/database/
├── __init__.py                      # Central registry, dynamic manager loader & FastAPI dependencies
├── README.md                        # Comprehensive database layer documentation
├── kindergarten_manager.py          # Kindergarten age bands, books, daily logs, monthly reviews, habits & menus
├── hr_manager.py                    # HR job titles, multi-branch staff profiles, biometric attendance, hiring pipeline
├── communication_manager.py         # Two-way parent notes, switchable time windows, multi-channel outbound queue
├── finance_manager.py               # Fee plans, price overrides, installment invoices, gapless receipts, voiding, RTL docs
├── migration_manager.py             # Staging batches/rows, Arabic normalization (٩->ج), compound splitting, cohort matching
├── core_audit_manager.py            # Sensitive action audit logging (grades, prices, voids, medical views)
├── core_person_manager.py           # Core person master, student profile, medical, guardians & pickups
├── iam_manager.py                   # IAM accounts, role builder, permission catalog & fee payment activation
├── org_manager.py                   # 13 branches, non-overlapping academic years, rooms & equipment
├── acad_workshop_manager.py         # 12 workshop catalog & evaluation types
├── acad_course_manager.py           # Sequential book progression, pass rules (Soroban 80/100), repeat logic
├── acad_timetable_manager.py        # Clash detection (trainer, room, group, branch mismatch)
├── acad_makeup_manager.py           # Make-up session ledger, scheduling & attendance fulfillment
├── acad_session_manager.py          # Session execution, attendance marking & absence telephone logs
├── acad_evaluation_manager.py       # Dynamic typed templates, double-blind review (corrector != reviewer)
├── acad_material_manager.py         # Digital course materials access control restricted to enrolled students
└── base/                            # Core engine infrastructure
    ├── __init__.py                  # Package entrypoint for base
    ├── base.py                      # Compatibility shim
    ├── config.py                    # Global logging, path helpers, constants & JSON serializers
    ├── connection.py                # Connection pooling, dialect wrapper & SQLite compatibility extensions
    ├── database.py                  # Central Database Singleton coordinator
    ├── schema_initializer.py        # Fingerprinted DDL execution, schema migration & seed catalogs
    ├── tables.py                    # DDL table schemas & initial seed catalog
    ├── views_indexes.py             # Performance indexes & analytical views
    ├── backup_manager.py            # CSV/ZIP backup, restore & historical purging
    ├── archive_view_manager.py      # Non-destructive archive view mode
    └── README.md                    # Detailed documentation of base infrastructure
```

---

## Domain Managers & Business Logic

### 1. Kindergarten Module ([`kindergarten_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/kindergarten_manager.py))
- **Relational Tables**: `kg_age_band`, `kg_child_book`, `kg_attendance`, `kg_daily_log`, `kg_monthly_report`, `kg_incident`, `kg_specialist_note`, `kg_child_habit_profile`, `kg_menu_entry`.
- **Age Bands**: Seeded cohorts (`BEBE` 3–12m, `PETITE` 13–35m, `MOYENNE` 36–47m, `GRANDE` 48–71m) with age-in-months validation.
- **Numbered Books**: Sequential physical curriculum book assignment per child (`kg_child_book`).
- **Daily Activity Logs**: Mandatory strict ratings (`A`, `B`, `C`) across 8 predefined developmental categories: `breakfast`, `lunch`, `snack`, `sleep`, `study`, `interaction`, `crying`, `clothes_change`, accompanied by teacher notes.
- **Monthly Reports & Double-Blind Review**: Draft creation by classroom educator and strict administrative approval workflow (`approved_by_admin_id != author_teacher_id`) before parental visibility is unlocked.
- **Incident Logs**: Detailed logs (`MINOR`, `BEHAVIORAL`, `MEDICAL`, `INJURY`) with parental notification and action tracking.
- **Orthophonist & Specialist Notes**: Role-based confidentiality flags (`is_confidential_to_parents`) for speech therapy and behavioral observations.
- **Child Habit Profiles**: Tracks dietary preferences, pacifier use, allergies, comforting techniques, and sleep routines.
- **Cafeteria Menus**: Weekly rotating nutritional schedules (Week 1–4, Sunday–Thursday) for morning snack, lunch, and afternoon snack.

### 2. HR & Staffing Module ([`hr_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/hr_manager.py))
- **Relational Tables**: `hr_position`, `hr_staff`, `hr_staff_assignment`, `hr_staff_attendance`, `hr_staff_application`.
- **Staff Positions**: Catalog of positions across teaching, administration, daycare nannies, cooks, cleaning, maintenance, and orthophonists.
- **Multi-Branch Staff Profiles & Assignments**: Primary and secondary branch allocations with primary branch exclusivity checks (`hr_staff_assignment`).
- **Daily Staff Attendance**: Records arrival and departure timestamps, status (`PRESENT`, `ABSENT`, `LATE`, `LEAVE`), and source verification (`BIOMETRIC`, `RFID_CARD`, `MANUAL`).
- **Recruitment Pipeline**: Job applicant lifecycle tracking stages: `APPLIED` -> `SCREENED` -> `INTERVIEW_SCHEDULED` -> `INTERVIEWED` -> `OFFERED` -> `HIRED` / `REJECTED`, capturing interview notes and ratings.

### 3. Communication Module ([`communication_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/communication_manager.py))
- **Relational Tables**: `comm_note_policy`, `comm_note`, `comm_notification`.
- **Two-Way Parent Notes**: Directional notes (`PARENT_TO_TEACHER`, `TEACHER_TO_PARENT`) with urgent flags, response requirements, and acknowledgment tracking.
- **Time Window Policy Toggle**: Branch-level configuration (`comm_note_policy`) enabling or restricting parent note submission outside operational hours (`window_start_time`, `window_end_time`, `allowed_days`).
- **Multi-Channel Outbound Queue**: Central notification dispatch queue supporting `SMS`, `WHATSAPP`, `TELEGRAM`, and `EMAIL`. Worker pull interface (`get_pending_notifications`, `mark_notification_sent`, `mark_notification_failed`) with automatic retry count management.

### 4. Finance Module ([`finance_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/finance_manager.py))
- **Relational Tables**: `fin_fee_plan`, `fin_price_override`, `invoices`, `fin_installment`, `fin_receipt_sequence`, `payments`, `cash_handovers`, `daily_cash_registers`.
- **Multi-Tier Fee Plans**: Standard tuition, annual discount packages, and administrative registration plans.
- **Dynamic Price Overrides**: Discount authorization with mandatory reason string and author employee attribution; audited automatically.
- **Installment Invoices**: Single upfront and multi-tranche installment schedules (`fin_installment`) with automated balance updates.
- **Gapless Sequential Receipts**: Thread-safe, non-skipping receipt numbering per branch and fiscal year (`REC-{BRANCH}-{YEAR}-{SEQ:06d}`).
- **Non-Destructive Payment Voiding**: Payments are never physically deleted; marked `is_voided = TRUE` with mandatory justification reason, voided timestamp, and author user attribution. Automatically rolls back invoice amounts and registers.
- **Cash Drawer & Remittances**: Daily cash box management, categorized expense tracking, and cash handovers to head office or owners (`cash_handovers`).
- **Daily Financial Summary**: Real-time aggregated view of opening balance, cash collected, operational expenses, remittances, and net remaining cash.
- **Arabic RTL Document Generation**: Generates official print-ready HTML documents in Arabic with RTL styling, currency formatting in Algerian Dinars (`د.ج`), and official Academy branding.

### 5. Data Migration Module ([`migration_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/migration_manager.py))
- **Relational Tables**: `mig_import_batch`, `mig_import_row`, `mig_legacy_ref`.
- **Staging Batches & Rows**: Secure staging area for ingesting legacy Excel (`.xlsx`), CSV, and JSON data.
- **Arabic Text Normalization**:
  - Global user rule compliance: maps Arabic character "٩" (U+0669) strictly to "ج".
  - Strips diacritics / tashkeel (`Fatha`, `Damma`, `Kasra`, `Sukun`, `Shadda`, `Tanween`).
  - Unifies Alef variants (`أ`, `إ`, `آ` -> `ا`) and Teh Marbuta / Ha (`ة` -> `ه`).
- **Smart Arabic Compound Name Splitting**:
  - Accurately splits compound given names (e.g. `عبد الرحمن`, `محمد أمين`, `فاطمة الزهراء`) and compound surnames (e.g. `بن علي`, `أولاد أحمد`).
  - Flags ambiguous names (e.g. mononyms, unresolved patronymics) for human operator review in `mig_import_row` (`is_ambiguous = TRUE`).
- **Cohort Label Matching**: Matches informal or legacy French/Arabic labels (e.g. `p.section 2`, `m.section`, `القسم التحضيري`) to official kindergarten age bands.
- **Conversion & Traceability**: Converts validated staging rows into production `students`, recording legacy reference mappings in `mig_legacy_ref`.
- **Financial Reconciliation**: Calculates batch-level financial totals against ledger records to detect reconciliation variances.

### 6. Core Person, IAM & Academy Infrastructure
- [`core_person_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/core_person_manager.py): Unified person registry, confidential medical tracking, guardian relationships, and authorized pickup lists.
- [`core_audit_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/core_audit_manager.py): Immutable security audit logging for grades, discounts, payment voids, and medical record views.
- [`iam_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/iam_manager.py): User authentication, dynamic role builder, fee payment activation lifecycle (`PENDING` -> `ACTIVE`).
- [`org_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/org_manager.py): 13 physical branches, non-overlapping academic cycles, room and equipment management.
- [`acad_workshop_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_workshop_manager.py): 12 Academy workshop offerings.
- [`acad_course_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_course_manager.py): Sequential courses, one-book-per-course mapping, pass thresholds (Soroban 80/100).
- [`acad_timetable_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_timetable_manager.py): Multi-dimensional timetable clash prevention (trainer, room, group, branch mismatch).
- [`acad_session_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_session_manager.py): Session execution, attendance marking, absence telephone logging.
- [`acad_makeup_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_makeup_manager.py): Automatic make-up credit generation and redemption.
- [`acad_evaluation_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_evaluation_manager.py): Typed evaluation schemas and double-blind review validation.
- [`acad_material_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_material_manager.py): Course digital assets restricted to enrolled students.

---

## Analytical Views & Performance Indexes

Defined in [`backend/database/base/views_indexes.py`](file:///home/pluto/projects/3abaqira/backend/database/base/views_indexes.py):
- `v_daily_cash_summary`: Real-time aggregated financial positions per branch and date.
- `v_kg_daily_attendance_summary`: Daily child headcount, absences, and attendance rates per age band.
- `v_kg_approved_monthly_reports`: Finalized kindergarten developmental reports authorized for parent portal viewing.
- `v_hr_active_assignments`: Active staff assignments across all branches with position classifications.
- `v_mig_staging_progress`: Migration batch staging metrics (total, pending, converted, ambiguous rows).
- Performance indexes on frequently queried foreign keys, timestamps, receipt numbers, and composite unique keys.
