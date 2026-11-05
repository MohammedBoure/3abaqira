# Backend Service (`backend/`)

This directory contains the server-side architecture, API services, business logic, and database persistence layers for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة).

## Directory Architecture

```
backend/
├── app.py                         # Main FastAPI REST application entrypoint mounting apis
├── requirements.txt               # Python dependencies (FastAPI, Uvicorn, PyJWT, bcrypt, SQLAlchemy)
├── README.md                      # Backend service overview and architecture
├── apis/                          # Modular REST API routers and security infrastructure
│   ├── README.md                  # API documentation and endpoint catalog
│   ├── __init__.py                # Master api_router consolidating all domain endpoints
│   ├── security.py                # JWT token lifecycle, bcrypt hashing, RBAC guards
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
    ├── test_core_and_iam.py       # Core Person, IAM, role permissions & sensitive action audit tests
    ├── test_org_infrastructure.py # 13 physical branches, academic years & room equipment tests
    ├── test_academy_progression_and_clash.py # Workshops, 1-book-per-course, pass rules & timetable clash tests
    ├── test_academy_sessions_eval_materials.py # Attendance, absence calls, double-blind review & materials tests
    └── test_api_endpoints.py      # FastAPI HTTP integration tests via TestClient
```

## Architectural Highlights

### 1. Unified Core Person & Specialization
- Single identity master (`core_person`) for all personas (STUDENT, GUARDIAN, INSTRUCTOR, STAFF).
- Student specialization (`core_student`) with school grade and enrollment status.
- Confidential medical profiles (`core_student_medical`) with mandatory, automated audit logging (`MEDICAL_VIEW`) on every access.
- Flexible guardian relationships (`core_guardian_link`) with primary contact and legal custody flags.
- Authorized pickup registries (`core_pickup_authorization`) with relationship and verification notes.

### 2. IAM & Fee Payment Account Activation Lifecycle
- Credentials secured with bcrypt password hashing.
- Accounts start in `PENDING` status upon creation and transition to `ACTIVE` automatically upon first-level fee payment confirmation.
- Dynamic permission catalog (`iam_permission`) and dynamic role builder (`iam_role`, `iam_role_permission`).
- Branch-scoped and global role assignments (`iam_person_role`) with multi-branch effective permission aggregation.

### 3. Sensitive Action Audit Logging
- Immutable change logs in `core_audit_log`.
- Mandatory justification reason strings enforced for:
  - **Grade Changes**: Prior score, new score, and reviewer rationale.
  - **Price Overrides**: Discount justification on standard fees.
  - **Payment Voids**: Explanation for cancellation of financial transactions.
  - **Medical Views**: Confidential health record inspections.

### 4. Organization Infrastructure
- Pre-seeded with **13 physical branches across Algeria** (`BR-01` to `BR-13`) categorized by operational types (Main, Secondary, Franchise, Satellite).
- Strict non-overlapping date validation for academic cycles with enforcement of exactly one active fiscal year.
- Multi-classroom inventory with room capacities and tracked equipment.

### 5. Academy Workshops & Sequential Curriculum
- **12 Pre-Seeded Workshops**: Soroban, Robotics & IoT, English Language, French Language, Coding & AI, Speedcubing, Mental Arithmetic, Quranic Memorization, Little Scientist, Graphic Design, Chess & Strategy, and Gymnastics & Sports.
- Strict **one-book-per-course** mapping and **one open book per workshop** rule.
- Dynamic pass rules (e.g. Soroban requiring passing 3 tests at >= 80/100 threshold).
- Sequential level advancement: students advance only upon passing; failure marks enrollment as `FAILED_REPEATING`. Exceptions handled via administrative placement notes.

### 6. Timetable Clash Detection
- `AcadTimetableManager` prevents timetable collisions before writing to the database:
  - **Trainer Double-Booking**: A trainer cannot be scheduled in two locations at the same time.
  - **Room Double-Booking**: A classroom cannot host two groups during overlapping hours.
  - **Group Double-Booking**: A student cohort cannot have two sessions simultaneously.
  - **Branch Mismatch Isolation**: A group belonging to Branch A cannot be assigned a room in Branch B.

### 7. Attendance, Absence Telephone Calls & Make-ups
- Attendance tracking per session (`PRESENT`, `ABSENT`, `EXCUSED`, `LATE`).
- Absence automatically generates an owed make-up credit in `acad_makeup`.
- Mandatory **telephone call logging** (`acad_absence_call_log`) capturing verbal explanations from parents.
- Make-up scheduling, attendance tracking, and credit redemption lifecycle.

### 8. Dynamic Typed Evaluations & Double-Blind Review
- Dynamic evaluation templates (`acad_eval_template`) with custom typed fields (`NUMERIC`, `TEXT`, `BOOLEAN`, `SCALE_1_5`).
- Strict **double-blind review workflow**: the reviewing instructor must be distinct from the initial corrector (`reviewer_person_id != corrector_person_id`).
- Discrepancies and score overrides require mandatory audit reasons.

### 9. Digital Material Access Control
- Pedagogical materials (`acad_material`) access restricted to students actively enrolled in the corresponding course. Non-enrolled students are denied access with HTTP 403 Forbidden.

## Running Tests

All 28 automated integration tests can be executed via:

```bash
PYTHONPATH=. /home/pluto/Desktop/venv/ai/bin/pytest backend/tests -v
```

## Running the Development Server

```bash
/home/pluto/Desktop/venv/ai/bin/uvicorn backend.app:app --reload --port 8000
```

- **OpenAPI Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/health`
