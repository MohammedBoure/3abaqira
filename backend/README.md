# Backend Service (`backend/`)

This directory contains the server-side architecture, API services, business logic, and database persistence layers for the **3abaqira Enterprise Management System**.

## Directory Architecture

```
backend/
├── app.py                    # Main FastAPI REST application entrypoint mounting apis
├── requirements.txt          # Python dependencies (FastAPI, Uvicorn, PyJWT, bcrypt, etc.)
├── README.md                 # Backend service overview and architecture
├── apis/                     # Modular REST API routers and JWT security infrastructure
│   ├── README.md             # API documentation and JWT auth flow
│   ├── __init__.py           # Master api_router consolidating all endpoints
│   ├── security.py           # JWT token lifecycle, bcrypt hashing, RBAC guards
│   ├── auth.py               # Authentication & token endpoints
│   ├── users.py              # User administration & role management
│   ├── branches.py           # Multi-tenant branch operations
│   ├── academic_years.py     # Academic cycle management
│   ├── classrooms.py         # Classroom capacity & floor assignment
│   ├── guardians.py          # Guardians & parents master directory
│   ├── students.py           # Bilingual student directory & guardian linkages
│   ├── programs.py           # Educational programs & catalog
│   ├── levels.py             # Curriculum stages & sequence ordering
│   ├── pricing_plans.py      # Multi-tier pricing matrices & fee computation
│   ├── groups.py             # Student groups, cohorts & class rosters
│   ├── schedules.py          # Weekly timetable slots & clash detection
│   ├── sessions.py           # Conducted session logs & student attendance
│   ├── enrollments.py        # Student course enrollments & multi-tier tuition pricing
│   ├── invoices.py           # Multi-tier invoices, installment tranches & payment credits
│   ├── registers.py          # Daily cash drawers, balances & reconciliation
│   ├── payments.py           # Student fee payments & receipt voucher generation
│   ├── handovers.py          # Cash safe remittances & drawer drop vouchers
│   ├── expenses.py           # Operational expenses & categories taxonomy
│   ├── budgets.py            # Budget targets & variance reporting
│   ├── kitchen.py            # Daycare cafeteria procurement & bread logs
│   ├── competitions.py       # Competition events, registrations & receipts
│   └── system.py             # System telemetry & infrastructure overview
└── database/                 # Unified database connectivity, pooling, migrations & managers
    ├── README.md             # Database layer overview and FastAPI usage
    ├── __init__.py           # Dynamic manager registry & FastAPI dependencies
    ├── branch_manager.py     # Data manager for multi-tenant branches
    ├── academic_year_manager.py # Data manager for academic fiscal cycles
    ├── classroom_manager.py  # Data manager for classrooms and capacities
    ├── infrastructure_manager.py # Consolidated facade for organizational infrastructure
    ├── user_manager.py       # Data manager for user authentication & credentials
    ├── guardian_manager.py   # Data manager for guardians and parent contacts
    ├── student_manager.py    # Data manager for bilingual students & guardian linkages
    ├── program_manager.py    # Data manager for educational programs & billing models
    ├── level_manager.py      # Data manager for curriculum levels & stage ordering
    ├── pricing_manager.py    # Data manager for multi-tier pricing matrices & discounts
    ├── group_manager.py      # Data manager for student groups and active headcounts
    ├── schedule_manager.py   # Data manager for weekly group timetables & clash checks
    ├── attendance_manager.py # Data manager for conducted sessions & student attendance
    ├── enrollment_manager.py # Data manager for student enrollments & invoice scheduling
    ├── invoice_manager.py    # Data manager for multi-tier invoices & payment crediting
    ├── cash_register_manager.py # Data manager for daily cash registers & drawer audits
    ├── payment_manager.py    # Data manager for payments, receipts & drawer synchronization
    ├── cash_handover_manager.py # Data manager for cash safe remittances & safe drops
    ├── expense_manager.py    # Data manager for expense categories & operational expenses
    ├── budget_variance_manager.py # Data manager for budget variances & live actuals
    ├── kitchen_procurement_manager.py # Data manager for kitchen provisions & bread logs
    ├── competition_manager.py # Data manager for competitions & candidate registrations
    └── base/                 # Core database infrastructure (Connection, Schema, Backup, Archive)
```

## Directory Contents

| File / Folder | Purpose |
|---------------|---------|
| [app.py](file:///C:/Users/moham/Desktop/3abaqira/backend/app.py) | Main FastAPI web application entrypoint mounting modular REST API routers from `backend/apis/`. |
| [apis/](file:///C:/Users/moham/Desktop/3abaqira/backend/apis) | Modular REST API layer featuring domain routers and JWT-based authentication & RBAC protection. |
| [requirements.txt](file:///C:/Users/moham/Desktop/3abaqira/backend/requirements.txt) | Package requirements listing FastAPI, Uvicorn, Pydantic, PyJWT, bcrypt, SQLAlchemy, and drivers. |
| [database/](file:///C:/Users/moham/Desktop/3abaqira/backend/database) | Central data layer providing pooled database connections, automated schema migrations, historical backup/archiving, and domain managers with FastAPI dependency injection. |

