# Backend Test Suite (`backend/tests/`)

This directory contains automated integration and unit test suites for the 3abaqira Enterprise Management Platform, validating the database managers, business logic rules, timetable clash detection, dynamic evaluations, and REST API endpoints.

## Directory Structure & Test Modules

| File | Scope & Architectural Focus | Key Scenarios Covered |
| :--- | :--- | :--- |
| [`test_kg_comm_fin_mig.py`](file:///home/pluto/projects/3abaqira/backend/tests/test_kg_comm_fin_mig.py) | Kindergarten, HR, Communication, Finance & Migration | Comprehensive 21-test suite validating kindergarten age bands, numbered books, daily logs (A/B/C across 8 categories), monthly reports with double-blind admin review, incident logs, orthophonist notes, child habit profile, rotating weekly cafeteria menu; HR staff positions, multi-branch assignments, biometric attendance, hiring pipeline; Communication two-way parent notes, time window policy toggle, outbound notification queue; Finance fee plans, dynamic price overrides, installment invoices, gapless sequential cash receipts, non-destructive payment voiding, cash handovers, daily summary, Arabic RTL document generators; Migration staging batches/rows, Arabic normalization (character "٩" -> "ج", tashkeel stripping), compound name splitting, cohort label matching, ambiguous review queue, and batch financial reconciliation. |
| [`conftest.py`](file:///home/pluto/projects/3abaqira/backend/tests/conftest.py) | Shared Pytest fixtures & session setup | Database initialization and teardown fixture. |
| [`test_core_and_iam.py`](file:///home/pluto/projects/3abaqira/backend/tests/test_core_and_iam.py) | Unified Person & IAM Security | Person CRUD, student profiles, guardian links, pickup authorizations, medical records with automated `MEDICAL_VIEW` audit logging, sensitive action audit logging (grade changes, price overrides, payment voids), account pending-to-active payment activation, and branch-scoped IAM role/permission calculation. |
| [`test_org_infrastructure.py`](file:///home/pluto/projects/3abaqira/backend/tests/test_org_infrastructure.py) | Organization Infrastructure | Verification of 13 seeded physical branches across Algeria, non-overlapping academic cycle date validations, single active/current academic fiscal year constraint, classroom rooms, and room equipment inventories. |
| [`test_academy_progression_and_clash.py`](file:///home/pluto/projects/3abaqira/backend/tests/test_academy_progression_and_clash.py) | Academy Workshops, Progression & Timetable Clashes | 12 academy workshops catalog, strict 1-book-per-course mapping, sequential book advancement rules, one open book per workshop constraint, repeating books on failure, placement notes exception handling, dynamic pass rules (Soroban 3 tests 80/100 threshold), and multi-dimensional timetable clash prevention (trainer double-booking, room double-booking, group overlap, branch mismatch). |
| [`test_academy_sessions_eval_materials.py`](file:///home/pluto/projects/3abaqira/backend/tests/test_academy_sessions_eval_materials.py) | Sessions, Attendance, Make-ups & Dynamic Evaluations | Session execution, attendance tracking, absence telephone call logging, automatic make-up session generation (`acad_makeup`), dynamic typed evaluation templates (`acad_eval_template`), double-blind review validation (corrector != reviewer), grade change audit logging, and digital course material download access control restricted to actively enrolled students. |
| [`test_api_endpoints.py`](file:///home/pluto/projects/3abaqira/backend/tests/test_api_endpoints.py) | FastAPI REST API Integration | End-to-end HTTP integration testing via Starlette `TestClient` covering `/api/health`, `/api/core/persons`, `/api/core/students`, `/api/iam/accounts`, `/api/org/branches`, `/api/org/academic-years`, and `/api/acad/workshops` / timetable clash detection. |

## Running the Test Suite

Execute the full suite using the configured Python virtual environment:

```bash
# Run all tests with verbose output
PYTHONPATH=. /home/pluto/Desktop/venv/ai/bin/pytest backend/tests -v

# Run a specific test module
PYTHONPATH=. /home/pluto/Desktop/venv/ai/bin/pytest backend/tests/test_core_and_iam.py -v

# Run with test failure stopping on first error
PYTHONPATH=. /home/pluto/Desktop/venv/ai/bin/pytest backend/tests -v -x
```

## Test Guidelines & SQLite Dialect Notes

- **Boolean Values**: SQLite stores booleans as integer flags (`1` and `0`). Test assertions evaluate boolean attributes using `bool(row["is_active"]) is True` or `row["is_active"] == 1`.
- **Unique Constraints**: Test fixtures generate isolated unique identifiers using `uuid.uuid4().hex[:6]` to ensure idempotency across repetitive test runs.
- **Foreign Key Integrity**: SQLite enforces `PRAGMA foreign_keys = ON`. Foreign key references in audit logs or relational tables must point to pre-existing parent rows.
