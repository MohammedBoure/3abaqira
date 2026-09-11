# Backend APIs Layer (`backend/apis/`)

This directory houses the modular, decoupled REST API routers and JWT security infrastructure for the **3abaqira Enterprise Management Platform**.

## Architecture & Design

Endpoints are segregated into domain-specific modules, mounted together by the master `api_router` in [__init__.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/__init__.py) and served via FastAPI in [app.py](file:///C:/Users/moham/Desktop/3abaqira/backend/app.py).

All mutating, administrative, and sensitive operations are protected using JSON Web Tokens (JWT) using the `HS256` signature algorithm, verified through FastAPI dependency injection.

```
backend/apis/
├── __init__.py         # Master API router consolidating all sub-routers under /api
├── security.py         # JWT token encoding/decoding, bcrypt password hashing & RBAC dependencies
├── auth.py             # Authentication endpoints (/api/auth/login, /token, /me, /change-password)
├── users.py            # User administration & role management (/api/users)
├── branches.py         # Multi-tenant branch operations (/api/branches)
├── academic_years.py   # Academic cycle management (/api/academic-years)
├── classrooms.py       # Classroom capacities and floor allocations (/api/classrooms)
├── guardians.py        # Guardians & parents master directory (/api/guardians)
├── students.py         # Bilingual student directory & guardian linkages (/api/students)
├── programs.py         # Educational programs & catalog (/api/programs)
├── levels.py           # Curriculum stages & sequence ordering (/api/levels)
├── pricing_plans.py    # Multi-tier pricing matrices & fee computation (/api/pricing-plans)
├── groups.py           # Student groups, cohorts & class rosters (/api/groups)
├── schedules.py        # Weekly timetable slots & clash detection (/api/schedules)
├── sessions.py         # Conducted session logs & student attendance (/api/sessions)
├── system.py           # System telemetry, infrastructure overview & archive status (/api/system)
└── README.md           # This documentation file
```

---

## Directory Contents

| File | Purpose |
|------|---------|
| [__init__.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/__init__.py) | Master API routing registry exporting `api_router` and mounting all domain routers under `/api`. |
| [security.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/security.py) | Cryptographic security layer handling bcrypt password hashing, JWT token lifecycle, and RBAC guards (`get_current_user`, `require_role`). |
| [auth.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/auth.py) | Authentication router providing JSON login, OAuth2 password form for Swagger UI, user profile retrieval, and password change endpoints. |
| [users.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/users.py) | User management router supporting account provisioning, role updates (`SUPER_ADMIN`, `ADMIN`, `DIRECTOR`, `TEACHER`, `STAFF`, `ACCOUNTANT`), and status toggling. |
| [branches.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/branches.py) | REST router for managing multi-tenant branch locations (`CENTER`, `RAWDA`, etc.) and associated branch classrooms. |
| [academic_years.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/academic_years.py) | REST router for academic cycle management, date bound validations, and atomic active cycle switching. |
| [classrooms.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/classrooms.py) | REST router for classroom records, student capacities, and floor allocation. |
| [guardians.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/guardians.py) | REST router for guardian / parent profiles, contact details, and student ward associations. |
| [students.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/students.py) | REST router for bilingual student profiles, auto-generated student codes, medical registry, and guardian pickup permissions. |
| [programs.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/programs.py) | REST router for educational programs, billing classification, and branch-scoped curriculums. |
| [levels.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/levels.py) | REST router for curriculum progression stages, color tags, age cohorts, and sequence reordering. |
| [pricing_plans.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/pricing_plans.py) | REST router for tuition matrices, sibling/cash discounts, installment schedules, and fee calculation simulations. |
| [groups.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/groups.py) | REST router for study groups, cohorts, capacity monitoring, and teacher assignments. |
| [schedules.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/schedules.py) | REST router for weekly group timetable slots, recurrence rules, and classroom conflict / clash prevention. |
| [sessions.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/sessions.py) | REST router for conducted session logs, batch student attendance, performance points scoring, and attendance tracking. |
| [system.py](file:///C:/Users/moham/Desktop/3abaqira/backend/apis/system.py) | REST router providing health telemetry, multi-branch summary overview, and historical archive view mode status. |

---

## JWT Authentication Flow

### 1. Acquiring a Token
Clients submit credentials to `POST /api/auth/login`:
```json
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123456"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in_seconds": 86400,
  "user": {
    "user_id": 1,
    "username": "admin",
    "full_name": "System Administrator",
    "email": "admin@3abaqira.dz",
    "role": "SUPER_ADMIN",
    "is_active": true
  }
}
```

### 2. Authenticating Requests
Include the token in the HTTP `Authorization` header on protected endpoints:
```http
GET /api/system/overview HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Role-Based Access Control (RBAC)
Protected endpoints enforce role permissions via the `require_role` dependency:
- `SUPER_ADMIN`: Full unrestricted access to all endpoints including user deletion.
- `ADMIN` / `DIRECTOR`: Configuration of branches, academic cycles, classrooms, and staff users.
- `TEACHER` / `STAFF`: Scoped access for attendance, session logs, and student records.
