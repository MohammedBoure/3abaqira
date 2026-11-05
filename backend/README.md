# Backend Service (`backend/`)

This directory contains the server-side architecture, API services, business logic, and database persistence layers for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة).

---

## Directory Architecture

```
backend/
├── app.py                         # Main FastAPI REST application entrypoint mounting all modular apis
├── requirements.txt               # Python dependencies (FastAPI, Uvicorn, PyJWT, bcrypt, SQLAlchemy, openpyxl, pandas)
├── README.md                      # Backend service overview and architecture
├── apis/                          # Modular REST API routers and security infrastructure
│   ├── README.md                  # API documentation and endpoint catalog
│   ├── __init__.py                # Master api_router consolidating all domain endpoints
│   ├── security.py                # JWT token lifecycle, bcrypt hashing, RBAC guards
│   ├── auth.py                    # Authentication endpoints (/api/auth)
│   ├── kindergarten.py            # Kindergarten age bands, books, daily logs, reports & menus (/api/kg)
│   ├── hr.py                      # HR staff profiles, positions, multi-branch, attendance & hiring (/api/hr)
│   ├── communication.py           # Parent two-way notes, time window policy & notification queue (/api/comm)
│   ├── finance.py                 # Fee plans, price overrides, invoices, gapless receipts, voiding, RTL (/api/fin)
│   ├── migration.py               # Data migration staging batches, ambiguous queue & reconciliation (/api/mig)
│   ├── core_persons.py            # Core Person, Student, Medical & Pickup authorizations (/api/core)
│   ├── iam.py                     # IAM accounts, dynamic role builder, payment activation (/api/iam)
│   ├── organizations.py           # 13 branches, academic years, rooms & equipment (/api/org)
│   ├── acad_workshops.py          # 12 Academy workshop offerings & types (/api/acad/workshops)
│   ├── acad_courses.py            # Sequential courses, pass rules, one open book (/api/acad/courses)
│   ├── acad_timetable.py          # Clash detection & group timetable scheduling (/api/acad/timetable)
│   ├── acad_sessions.py           # Session logs, attendance marking & absence calls (/api/acad/sessions)
│   ├── acad_makeup.py             # Make-up credits, scheduling & redemption (/api/acad/makeup)
│   ├── acad_evaluations.py        # Dynamic typed templates & double-blind review (/api/acad/evaluations)
│   └── acad_materials.py          # Enrolled student course material access & download (/api/acad/materials)
├── database/                      # Unified database connectivity, pooling, migrations & managers
│   ├── README.md                  # Database layer overview and FastAPI usage
│   ├── __init__.py                # Dynamic manager registry & FastAPI dependencies
│   ├── kindergarten_manager.py    # Kindergarten developmental logs (A/B/C), monthly review, habits & menus
│   ├── hr_manager.py              # HR staff positions, multi-branch assignments, biometric attendance, hiring pipeline
│   ├── communication_manager.py   # Two-way parent notes, window policy toggle, multi-channel notification queue
│   ├── finance_manager.py         # Fee plans, price overrides, installment invoices, gapless receipts, voiding, RTL docs
│   ├── migration_manager.py       # Staging batches/rows, Arabic normalization (٩->ج), compound splitting, cohort matching
│   ├── core_audit_manager.py      # Sensitive action audit logging (grades, prices, voids, medical)
│   ├── core_person_manager.py     # Unified person master, student profile, medical, guardians & pickups
│   ├── iam_manager.py             # IAM accounts, role builder, permission catalog & fee activation
│   ├── org_manager.py             # 13 branches, non-overlapping academic years, rooms & equipment
│   ├── acad_workshop_manager.py   # 12 workshop catalog & evaluation types
│   ├── acad_course_manager.py     # Sequential book progression, pass rules (Soroban 80/100), repeat logic
│   ├── acad_timetable_manager.py  # Clash detection (trainer, room, group, branch mismatch)
│   ├── acad_makeup_manager.py     # Make-up session ledger, scheduling & attendance fulfillment
│   ├── acad_session_manager.py    # Session execution, attendance marking & absence telephone logs
│   ├── acad_evaluation_manager.py # Dynamic typed templates, double-blind review (corrector != reviewer)
│   ├── acad_material_manager.py   # Course materials access control restricted to enrolled students
│   └── base/                      # Core database engine (Connection, Schema, Backup, Archive)
└── tests/                         # Pytest automated test suites
    ├── README.md                  # Test suite overview, runner instructions & guidelines
    ├── conftest.py                # Database test fixtures
    ├── test_kg_comm_fin_mig.py    # Complete test suite for Kindergarten, HR, Comm, Finance & Migration
    ├── test_core_and_iam.py       # Core Person, IAM, role permissions & sensitive action audit tests
    ├── test_org_infrastructure.py # 13 physical branches, academic years & room equipment tests
    ├── test_academy_progression_and_clash.py # Workshops, 1-book-per-course, pass rules & timetable clash tests
    ├── test_academy_sessions_eval_materials.py # Attendance, absence calls, double-blind review & materials tests
    └── test_api_endpoints.py      # FastAPI HTTP integration tests via TestClient
```

---

## Architectural Highlights

### 1. Kindergarten Module (`kg`)
- **Age Bands & Cohorts**: Seeded age bands (`BEBE`, `PETITE`, `MOYENNE`, `GRANDE`) with age-in-months boundary validation.
- **Numbered Books**: Sequential assignment and return tracking of physical curriculum books (`kg_child_book`).
- **Strict Daily Logs**: Mandatory strict ratings (`A`, `B`, `C`) across 8 predefined developmental categories: `breakfast`, `lunch`, `snack`, `sleep`, `study`, `interaction`, `crying`, `clothes_change`, plus teacher observations.
- **Monthly Progress Reports**: Draft creation by classroom educator and strict administrative approval workflow (`approved_by_admin_id != author_teacher_id`) before parental visibility is unlocked.
- **Incident Logs**: Detailed logs (`MINOR`, `BEHAVIORAL`, `MEDICAL`, `INJURY`) with parental notification and action tracking.
- **Specialist Observations**: Role-based confidentiality flags for speech therapists (orthophonists) and developmental specialists.
- **Habit Profiles & Menus**: Child dietary preferences, pacifier habits, calming methods, and 4-week rotating cafeteria menus.

### 2. HR & Staffing Module (`hr`)
- **Staff Positions**: Structured catalog across teaching, administration, daycare nannies, cooks, cleaning, maintenance, and orthophonists.
- **Multi-Branch Profiles & Assignments**: Primary and secondary branch allocations with primary branch exclusivity checks (`hr_staff_assignment`).
- **Staff Attendance Tracking**: Records clock-in and clock-out with source verification (`BIOMETRIC`, `RFID_CARD`, `MANUAL`).
- **Recruitment Pipeline**: Full candidate journey tracking: `APPLIED` -> `SCREENED` -> `INTERVIEW_SCHEDULED` -> `INTERVIEWED` -> `OFFERED` -> `HIRED` / `REJECTED`.

### 3. Communication Module (`comm`)
- **Two-Way Parent Notes**: Bidirectional notes with urgent flags, response requirements, and acknowledgment tracking.
- **Admin Time Window Policy Toggle**: Branch-level configuration enabling or restricting parent note submissions outside operational hours (`window_start_time`, `window_end_time`, `allowed_days`).
- **Multi-Channel Outbound Queue**: Central notification dispatch queue supporting `SMS`, `WHATSAPP`, `TELEGRAM`, and `EMAIL` with background worker pull/status callback API.

### 4. Finance Module (`fin`)
- **Multi-Tier Fee Plans**: Standard tuition, annual discount packages, and administrative registration plans.
- **Dynamic Price Overrides**: Discount authorization with mandatory reason string and author employee attribution; audited automatically.
- **Installment Invoices**: Single upfront and multi-tranche installment schedules (`fin_installment`) with automated balance updates.
- **Gapless Sequential Receipts**: Thread-safe, non-skipping receipt numbering per branch and fiscal year (`REC-{BRANCH}-{YEAR}-{SEQ:06d}`).
- **Non-Destructive Payment Voiding**: Payments are never physically deleted; marked `is_voided = TRUE` with mandatory justification reason, voided timestamp, and author user attribution. Automatically rolls back invoice amounts and registers.
- **Cash Drawer & Remittances**: Daily cash box management, categorized expense tracking, and cash handovers to head office or owners (`cash_handovers`).
- **Daily Financial Summary**: Real-time aggregated view of opening balance, cash collected, operational expenses, remittances, and net remaining cash.
- **Arabic RTL Document Generation**: Generates official print-ready HTML documents in Arabic with RTL styling, currency formatting in Algerian Dinars (`د.ج`), and official Academy branding.

### 5. Data Migration Module (`mig`)
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
- Unified identity master (`core_person`) and student profile with confidential medical data and audit logging.
- IAM accounts with fee payment activation lifecycle (`PENDING` -> `ACTIVE`).
- 13 pre-seeded physical branches across Algeria.
- 12 pre-seeded Academy workshops with strict one-book-per-course mapping and one open book rule.
- Multi-dimensional timetable clash detection.
- Absence tracking with automatic make-up session credits and telephone call logging.
- Typed evaluation schemas and double-blind review validation (`reviewer != corrector`).
- Pedagogical material access control restricted to enrolled students.

---

## Running Automated Tests

All 49 unit and integration tests across the complete platform can be executed via:

```bash
python3 -m pytest backend/tests/ -v
```

To run only the Kindergarten, HR, Communication, Finance, and Migration test suite:

```bash
python3 -m pytest backend/tests/test_kg_comm_fin_mig.py -v
```

## Running the Development Server

```bash
python3 -m uvicorn backend.app:app --reload --port 8000
```

- **OpenAPI Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/health`
