# Backend APIs Layer (`backend/apis/`)

This directory houses the modular, decoupled REST API routers and JWT security infrastructure for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة).

---

## Architecture & Design

Endpoints are segregated into domain-specific modules, mounted together by the master `api_router` in [`__init__.py`](file:///home/pluto/projects/3abaqira/backend/apis/__init__.py) and served via FastAPI in [`app.py`](file:///home/pluto/projects/3abaqira/backend/app.py).

```
backend/apis/
├── __init__.py               # Master API router consolidating all sub-routers under /api
├── security.py               # JWT token lifecycle, bcrypt hashing & RBAC dependencies
├── auth.py                   # Authentication endpoints (/api/auth/login, /token, /me)
├── kindergarten.py           # Kindergarten age bands, books, daily logs, reports & menus (/api/kg)
├── hr.py                     # HR staff profiles, positions, multi-branch, attendance & hiring (/api/hr)
├── communication.py          # Parent two-way notes, time window policy & notification queue (/api/comm)
├── finance.py                # Fee plans, price overrides, invoices, gapless receipts, voiding, RTL (/api/fin)
├── migration.py              # Data migration staging batches, ambiguous queue & reconciliation (/api/mig)
├── core_persons.py           # Core Person master, student, medical, guardians & pickups (/api/core)
├── iam.py                    # IAM accounts, dynamic role builder, fee payment activation (/api/iam)
├── organizations.py          # 13 branches, non-overlapping academic years, rooms & inventory (/api/org)
├── acad_workshops.py         # 12 Academy workshop offerings & types (/api/acad/workshops)
├── acad_courses.py           # Sequential courses, pass rules, one open book & progress (/api/acad/courses)
├── acad_timetable.py         # Timetable clash detection, group scheduling & slots (/api/acad/timetable)
├── acad_sessions.py          # Session logs, attendance marking & absence calls (/api/acad/sessions)
├── acad_makeup.py            # Make-up credits, scheduling & redemption (/api/acad/makeup)
├── acad_evaluations.py       # Typed templates & double-blind review validation (/api/acad/evaluations)
├── acad_materials.py         # Enrolled student course material access & download (/api/acad/materials)
└── README.md                 # API documentation and endpoint catalog
```

---

## Domain REST API Endpoints

### 1. Kindergarten API Router ([`kindergarten.py`](file:///home/pluto/projects/3abaqira/backend/apis/kindergarten.py)) — `/api/kg`
- `GET /api/kg/age-bands`: List all kindergarten age bands (`BEBE`, `PETITE`, `MOYENNE`, `GRANDE`).
- `POST /api/kg/age-bands`: Provision new or custom cohort age band.
- `POST /api/kg/child-books/assign`: Assign numbered physical book to a child.
- `GET /api/kg/child-books/student/{student_id}`: Retrieve child's assigned curriculum books.
- `POST /api/kg/attendance`: Record child daily attendance (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
- `GET /api/kg/attendance/summary`: Aggregated daily attendance rates per branch and date.
- `POST /api/kg/daily-logs`: Submit daily developmental log with strict `A`/`B`/`C` ratings across 8 categories (`breakfast`, `lunch`, `snack`, `sleep`, `study`, `interaction`, `crying`, `clothes_change`) and teacher notes.
- `GET /api/kg/daily-logs/student/{student_id}`: Retrieve daily logs for child.
- `POST /api/kg/monthly-reports`: Draft educator monthly progress report.
- `POST /api/kg/monthly-reports/{report_id}/approve`: Double-blind approval by administrator (`approver_admin_id != author_teacher_id`); unlocks parent visibility.
- `GET /api/kg/monthly-reports/student/{student_id}`: Retrieve monthly reports (filters for approved reports if accessed by parents).
- `POST /api/kg/incidents`: Log student incident (`MINOR`, `BEHAVIORAL`, `MEDICAL`, `INJURY`) with parental notification flag.
- `POST /api/kg/specialist-notes`: Record speech therapist / orthophonist confidential note.
- `POST /api/kg/habit-profiles`: Upsert child habits, dietary preferences, pacifiers, soothing techniques.
- `GET /api/kg/habit-profiles/student/{student_id}`: Get child habit profile.
- `POST /api/kg/menus`: Create weekly rotating cafeteria menu entry.
- `GET /api/kg/menus/branch/{branch_id}`: Retrieve current rotating menu schedule.

### 2. HR & Staffing API Router ([`hr.py`](file:///home/pluto/projects/3abaqira/backend/apis/hr.py)) — `/api/hr`
- `GET /api/hr/positions`: List HR staff positions across teaching, administration, nannies, kitchen, sanitation, and orthophonists.
- `POST /api/hr/positions`: Create HR position.
- `POST /api/hr/staff`: Create staff member profile.
- `GET /api/hr/staff`: List staff members with position filters.
- `GET /api/hr/staff/{staff_id}`: Get detailed staff member profile.
- `POST /api/hr/assignments`: Assign staff member to branch (`PRIMARY`, `SECONDARY`, `TEMPORARY`, `SUBSTITUTE`).
- `GET /api/hr/assignments/staff/{staff_id}`: View staff member branch assignments.
- `POST /api/hr/attendance`: Mark staff daily attendance with biometric or manual verification source.
- `GET /api/hr/attendance/staff/{staff_id}`: Retrieve staff attendance records.
- `POST /api/hr/applications`: Submit recruitment job application.
- `POST /api/hr/applications/{application_id}/status`: Advance candidate across hiring pipeline stages (`APPLIED` -> `SCREENED` -> `INTERVIEW_SCHEDULED` -> `INTERVIEWED` -> `OFFERED` -> `HIRED` / `REJECTED`).
- `GET /api/hr/applications`: List candidate applications by status and position.

### 3. Communication API Router ([`communication.py`](file:///home/pluto/projects/3abaqira/backend/apis/communication.py)) — `/api/comm`
- `GET /api/comm/policies/{branch_id}`: Retrieve branch parent note window policy.
- `PUT /api/comm/policies/{branch_id}`: Update branch note policy (enable/disable, operating hours, active days).
- `POST /api/comm/notes`: Submit two-way parent/educator communication note (enforces time window policy for parent submissions).
- `POST /api/comm/notes/{note_id}/acknowledge`: Mark note read/acknowledged with response tracking.
- `GET /api/comm/notes/student/{student_id}`: Retrieve communication thread for child.
- `POST /api/comm/notifications/queue`: Enqueue outbound multi-channel notification (`SMS`, `WHATSAPP`, `TELEGRAM`, `EMAIL`).
- `GET /api/comm/notifications/pending`: Worker endpoint to pull pending messages for dispatch.
- `POST /api/comm/notifications/{notification_id}/sent`: Worker callback confirming delivery.
- `POST /api/comm/notifications/{notification_id}/failed`: Worker callback reporting delivery error and incrementing retry count.

### 4. Finance API Router ([`finance.py`](file:///home/pluto/projects/3abaqira/backend/apis/finance.py)) — `/api/fin`
- `GET /api/fin/fee-plans`: Query standard tuition, annual discount, and registration fee plans.
- `POST /api/fin/fee-plans`: Create branch fee plan.
- `POST /api/fin/price-overrides`: Authorize dynamic tuition discount with mandatory reason and author employee attribution.
- `GET /api/fin/price-overrides`: View audit trail of authorized price overrides.
- `POST /api/fin/invoices`: Create invoice with customized installment schedule (`fin_installment`).
- `GET /api/fin/invoices/{invoice_id}/installments`: Retrieve invoice installment breakdown.
- `GET /api/fin/receipt-sequence/next`: Generate next gapless sequential receipt number per branch and fiscal year (`REC-{BRANCH}-{YEAR}-{SEQ}`).
- `POST /api/fin/payments/cash`: Record cash collection against invoice with sequential receipt issuance.
- `POST /api/fin/payments/{payment_id}/void`: Void payment receipt non-destructively with mandatory justification reason.
- `POST /api/fin/cash-handovers`: Record cash box handover to head office or owner.
- `GET /api/fin/cash-handovers`: List branch cash remittances.
- `GET /api/fin/daily-summary`: Real-time aggregated financial positions (revenues, expenses, handovers, net cash).
- `GET /api/fin/invoices/{invoice_id}/html`: Generate printable Arabic RTL invoice document.
- `GET /api/fin/payments/{payment_id}/receipt-html`: Generate printable Arabic RTL payment receipt document.

### 5. Migration API Router ([`migration.py`](file:///home/pluto/projects/3abaqira/backend/apis/migration.py)) — `/api/mig`
- `POST /api/mig/batches`: Create new data migration staging batch.
- `GET /api/mig/batches/{batch_id}`: Check migration batch processing progress.
- `POST /api/mig/batches/{batch_id}/rows`: Stage legacy rows with automated Arabic normalization (character "٩" -> "ج", tashkeel stripping) and compound name splitting.
- `GET /api/mig/batches/{batch_id}/ambiguous`: Review queue of ambiguous compound names or unresolved cohorts requiring human operator verification.
- `POST /api/mig/rows/{row_id}/resolve`: Manually resolve ambiguous staging row.
- `POST /api/mig/batches/{batch_id}/convert`: Execute final conversion of validated staging rows into production `students`, recording legacy reference traceability.
- `GET /api/mig/batches/{batch_id}/reconcile`: Financial reconciliation between migration totals and ledger records.

### 6. Core Person, IAM & Academy REST Routers
- [`core_persons.py`](file:///home/pluto/projects/3abaqira/backend/apis/core_persons.py): `/api/core` — Person identity master, student profiles, medical history (with mandatory audit logging), guardians and authorized pickups.
- [`iam.py`](file:///home/pluto/projects/3abaqira/backend/apis/iam.py): `/api/iam` — User accounts, fee payment activation lifecycle, roles, and effective permission calculation.
- [`organizations.py`](file:///home/pluto/projects/3abaqira/backend/apis/organizations.py): `/api/org` — 13 physical branches, non-overlapping academic cycles, classrooms and equipment inventory.
- [`acad_workshops.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_workshops.py): `/api/acad/workshops` — 12 Academy workshop offerings.
- [`acad_courses.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_courses.py): `/api/acad` — Sequential courses, pass rules (Soroban 80/100), repeat rules, and one open book enforcement.
- [`acad_timetable.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_timetable.py): `/api/acad/timetable` — Timetable clash detection (trainer, room, group, branch mismatch).
- [`acad_sessions.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_sessions.py): `/api/acad` — Session execution, attendance marking, absence telephone logging.
- [`acad_makeup.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_makeup.py): `/api/acad/makeup` — Make-up credit allocation and redemption.
- [`acad_evaluations.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_evaluations.py): `/api/acad/evaluations` — Typed evaluation templates and double-blind review validation.
- [`acad_materials.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_materials.py): `/api/acad` — Enrolled student pedagogical download access control.
