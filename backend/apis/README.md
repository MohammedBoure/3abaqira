# Backend APIs Layer (`backend/apis/`)

This directory houses the modular, decoupled REST API routers and JWT security infrastructure for the **3abaqira Enterprise Management Platform**.

## Architecture & Design

Endpoints are segregated into domain-specific modules, mounted together by the master `api_router` in [`__init__.py`](file:///home/pluto/projects/3abaqira/backend/apis/__init__.py) and served via FastAPI in [`app.py`](file:///home/pluto/projects/3abaqira/backend/app.py).

```
backend/apis/
├── __init__.py               # Master API router consolidating all sub-routers under /api
├── security.py               # JWT token encoding/decoding, bcrypt password hashing & RBAC dependencies
├── auth.py                   # Authentication endpoints (/api/auth/login, /token, /me, /change-password)
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
└── README.md                 # This documentation file
```

---

## Core Person, IAM & Academy REST Endpoints

| Router File | Mount Prefix | Key Endpoints & Capabilities |
| :--- | :--- | :--- |
| [`core_persons.py`](file:///home/pluto/projects/3abaqira/backend/apis/core_persons.py) | `/api/core` | `POST /persons`, `GET /persons`, `POST /students`, `GET /students/{id}`, `PUT /students/{id}/medical`, `GET /students/{id}/medical` (triggers mandatory `MEDICAL_VIEW` audit log), `POST /students/{id}/guardians`, `POST /students/{id}/pickups`. |
| [`iam.py`](file:///home/pluto/projects/3abaqira/backend/apis/iam.py) | `/api/iam` | `POST /accounts` (initial `PENDING` status), `POST /accounts/fee-payment-activate` (auto-activates account upon tuition/registration payment), `GET /permissions`, `POST /roles`, `POST /accounts/assign-role` (branch-scoped or global assignment), `GET /accounts/{id}/effective-permissions`. |
| [`organizations.py`](file:///home/pluto/projects/3abaqira/backend/apis/organizations.py) | `/api/org` | `GET /branches` (returns 13 seeded branches with type classifications), `GET /branches/{id}`, `GET /academic-years`, `POST /academic-years` (enforces non-overlapping date spans), `GET /academic-years/current`, `POST /branches/{id}/rooms`, `POST /rooms/{id}/equipment`. |
| [`acad_workshops.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_workshops.py) | `/api/acad/workshops` | `GET /workshops` (lists 12 seeded workshops), `POST /workshops`, `GET /workshops/{id}`. |
| [`acad_courses.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_courses.py) | `/api/acad` | `POST /courses` (one book per course), `GET /courses/workshop/{id}`, `POST /courses/{id}/rules` (dynamic pass thresholds like Soroban 80/100), `POST /enrollments` (enforces one open book per workshop), `POST /enrollments/{id}/complete` (auto-repeat on fail, sequential advance on pass). |
| [`acad_timetable.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_timetable.py) | `/api/acad/timetable` | `POST /groups`, `POST /slots` (triggers multi-dimensional clash prevention for trainer, room, and group overlaps), `POST /clash-check` (pre-flight clash preview). |
| [`acad_sessions.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_sessions.py) | `/api/acad` | `POST /sessions` (executes classroom session), `POST /sessions/{id}/attendance` (marks attendance; unexcused absence automatically dispatches make-up credit), `POST /attendance/{id}/call-log` (records mandatory telephone call justification). |
| [`acad_makeup.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_makeup.py) | `/api/acad/makeup` | `GET /students/{id}/credits`, `POST /schedule` (books student into make-up session), `POST /{id}/attend` (marks make-up fulfilled and redeems credit). |
| [`acad_evaluations.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_evaluations.py) | `/api/acad/evaluations` | `POST /templates` (creates typed evaluation schemas), `POST /templates/{id}/fields`, `POST /events`, `POST /submit-result` (corrector submission), `POST /results/{id}/review` (enforces double-blind rule: `reviewer != corrector`), `POST /results/{id}/override-grade` (logs grade change audit). |
| [`acad_materials.py`](file:///home/pluto/projects/3abaqira/backend/apis/acad_materials.py) | `/api/acad` | `POST /materials`, `GET /courses/{id}/materials`, `GET /materials/{id}/download` (strictly enforces access control: HTTP 403 Forbidden if student is not actively enrolled). |

---

## Sensitive Audit Logging

Every critical administrative and financial action is tracked in `core_audit_log` with an immutable trail and mandatory justification notes:
- **Grade Overrides**: When updating evaluation scores (`POST /api/acad/evaluations/results/{id}/override-grade`).
- **Medical File Views**: Triggered on every read of student health profiles (`GET /api/core/students/{id}/medical`).
- **Price Overrides & Payment Voids**: Mandatory justification text recorded with actor persona, IP, and timestamp.
