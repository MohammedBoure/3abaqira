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
│   └── system.py             # System telemetry & infrastructure overview
└── database/                 # Unified database connectivity, pooling, migrations & managers
    ├── README.md             # Database layer overview and FastAPI usage
    ├── __init__.py           # Dynamic manager registry & FastAPI dependencies
    ├── branch_manager.py     # Data manager for multi-tenant branches
    ├── academic_year_manager.py # Data manager for academic fiscal cycles
    ├── classroom_manager.py  # Data manager for classrooms and capacities
    ├── infrastructure_manager.py # Consolidated facade for organizational infrastructure
    ├── user_manager.py       # Data manager for user authentication & credentials
    └── base/                 # Core database infrastructure (Connection, Schema, Backup, Archive)
```

## Directory Contents

| File / Folder | Purpose |
|---------------|---------|
| [app.py](file:///C:/Users/moham/Desktop/3abaqira/backend/app.py) | Main FastAPI web application entrypoint mounting modular REST API routers from `backend/apis/`. |
| [apis/](file:///C:/Users/moham/Desktop/3abaqira/backend/apis) | Modular REST API layer featuring domain routers and JWT-based authentication & RBAC protection. |
| [requirements.txt](file:///C:/Users/moham/Desktop/3abaqira/backend/requirements.txt) | Package requirements listing FastAPI, Uvicorn, Pydantic, PyJWT, bcrypt, SQLAlchemy, and drivers. |
| [database/](file:///C:/Users/moham/Desktop/3abaqira/backend/database) | Central data layer providing pooled database connections, automated schema migrations, historical backup/archiving, and domain managers with FastAPI dependency injection. |

