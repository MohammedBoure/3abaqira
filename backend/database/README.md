# Backend Database Layer (`backend/database/`)

This directory serves as the unified data access and persistence layer for the 3abaqira Enterprise Management Platform. It implements multi-branch operations, relational data managers, SQLite/PostgreSQL/MySQL dialect abstraction, and comprehensive audit tracking.

## Directory Architecture

```
backend/database/
├── __init__.py                      # Central registry, dynamic manager loader & FastAPI dependencies
├── README.md                        # Database layer overview and module documentation
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
    ├── connection.py                # Connection pooling & SQLite dialect adaptation
    ├── database.py                  # Central Database Singleton coordinator
    ├── schema_initializer.py        # Fingerprinted DDL execution & migrations
    ├── tables.py                    # DDL table schemas & initial seed catalog
    ├── views_indexes.py             # Performance indexes & analytical views
    ├── backup_manager.py            # CSV/ZIP backup, restore & historical purging
    ├── archive_view_manager.py      # Non-destructive archive view mode
    └── README.md                    # Detailed documentation of base infrastructure
```

## Core Person, IAM & Academy Managers

| Manager File | Relational Tables Handled | Purpose & Business Logic Enforced |
| :--- | :--- | :--- |
| [`core_audit_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/core_audit_manager.py) | `core_audit_log` | Central audit logger for sensitive actions. Mandatory reason strings enforced for `GRADE_CHANGE`, `PRICE_OVERRIDE`, `PAYMENT_VOID`, and `MEDICAL_VIEW`. Captures actor, IP, timestamp, old/new states. |
| [`core_person_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/core_person_manager.py) | `core_person`, `core_student`, `core_student_medical`, `core_guardian_link`, `core_pickup_authorization` | Master identity registry across all personas (STUDENT, GUARDIAN, INSTRUCTOR, STAFF). Manages student academic profiles, confidential medical data (access auto-logs `MEDICAL_VIEW`), guardian links with custody flags, and authorized pickup individuals with relation tags. |
| [`iam_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/iam_manager.py) | `iam_account`, `iam_permission`, `iam_role`, `iam_role_permission`, `iam_person_role` | Identity & Access Management. Handles user credentials with bcrypt hashing. Implements **fee payment account activation lifecycle** (`PENDING` -> `ACTIVE` on fee payment). Computes effective permissions dynamically across global and branch-scoped role assignments. |
| [`org_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/org_manager.py) | `org_branch`, `org_academic_year`, `org_room`, `org_room_equipment` | Organizational hierarchy covering 13 branches across Algeria (Main, Secondary, Franchise, Satellite). Enforces non-overlapping academic cycle date intervals and ensures strictly one current academic year. Manages physical rooms and equipment inventory tracking. |
| [`acad_workshop_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_workshop_manager.py) | `acad_workshop` | Academy workshops catalog (Soroban, Robotics, Languages, AI, Speedcubing, Quran, Sports, etc.). Manages evaluation methodologies (`EXAM`, `PROJECT`, `ORAL`, `HYBRID`) and active offerings. |
| [`acad_course_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_course_manager.py) | `acad_course`, `acad_course_rule`, `acad_student_progression` | Curriculum levels enforcing **strict one-book-per-course mapping**, **one open book per workshop** constraint, sequential advancement rules, administrative placement notes, and repeat-book on failure. Configures dynamic pass rules (e.g. Soroban 3 tests with 80/100 threshold). |
| [`acad_timetable_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_timetable_manager.py) | `acad_group`, `acad_group_slot` | Weekly timetable scheduling engine. Features **multi-dimensional clash detection** (`TimetableClashError`): prevents trainer double-booking, room double-booking, group overlap, and strictly enforces room-to-group branch matching. |
| [`acad_makeup_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_makeup_manager.py) | `acad_makeup` | Make-up session entitlement and fulfillment ledger. Tracks owed session credits generated automatically from absences or failed evaluations. Manages scheduling, attendance, and credit redemption. |
| [`acad_session_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_session_manager.py) | `acad_session`, `acad_attendance`, `acad_absence_call_log` | Classroom session delivery and attendance marking. Unexcused absence automatically triggers make-up session generation. Enforces mandatory **absence telephone call logging** capturing verbal parental justifications and follow-up flags. |
| [`acad_evaluation_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_evaluation_manager.py) | `acad_eval_template`, `acad_eval_field`, `acad_eval_event`, `acad_eval_result`, `acad_eval_result_value` | Dynamic typed evaluation engine. Supports customizable templates with typed fields (`NUMERIC`, `TEXT`, `BOOLEAN`, `SCALE_1_5`). Enforces a strict **double-blind review workflow** (`reviewer_person_id != corrector_person_id`). Automatically logs grade change audits with mandatory justification reasons. |
| [`acad_material_manager.py`](file:///home/pluto/projects/3abaqira/backend/database/acad_material_manager.py) | `acad_material` | Digital pedagogical resources and course materials. Enforces **strict access control**: file downloads are permitted only to students with active, non-completed enrollments in the specific course. |

## Organizational Infrastructure Seed Data

The database initializes with complete baseline seed records:
- **13 Branches**: `BR-01` to `BR-13` spanning Algiers Central, Oran, Constantine, Annaba, Setif, Batna, Blida, Tlemcen, Bejaia, Biskra, Djelfa, Tizi Ouzou, and Chlef.
- **Academic Years**: Validated non-overlapping date spans with `2025-2026` set as the active fiscal cycle.
- **Permissions & Roles**: Complete IAM permission catalog with standard pre-configured roles (`SUPER_ADMIN`, `BRANCH_DIRECTOR`, `INSTRUCTOR`, `ACCOUNTANT`, `STUDENT_GUARDIAN`).
- **12 Academy Workshops**: Soroban, Robotics & IoT, English Language, French Language, Coding & AI, Speedcubing, Mental Arithmetic, Quranic Memorization, Little Scientist, Graphic Design, Chess & Strategy, and Gymnastics & Sports.
