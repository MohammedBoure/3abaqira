# Backend Service (`backend/`)

This directory contains the server-side architecture, API services, business logic, and database persistence layers for the **3abaqira Enterprise Management System**.

## Directory Architecture

```
backend/
├── app.py                    # Main FastAPI REST application and endpoint definitions
├── requirements.txt          # Python dependencies (FastAPI, Uvicorn, SQLAlchemy, etc.)
├── README.md                 # Backend service overview and architecture
└── database/                 # Unified database connectivity, pooling, migrations & managers
    ├── README.md             # Database layer overview and FastAPI usage
    ├── __init__.py           # Dynamic manager registry & FastAPI dependencies
    ├── branch_manager.py     # Data manager for multi-tenant branches
    ├── academic_year_manager.py # Data manager for academic fiscal cycles
    ├── classroom_manager.py  # Data manager for classrooms and capacities
    ├── infrastructure_manager.py # Consolidated facade for organizational infrastructure
    └── base/                 # Core database infrastructure (Connection, Schema, Backup, Archive)
```

## Directory Contents

| File / Folder | Purpose |
|---------------|---------|
| [app.py](file:///C:/Users/moham/Desktop/3abaqira/backend/app.py) | Main FastAPI web application entrypoint exposing REST endpoints for branches, academic years, classrooms, and system health. |
| [requirements.txt](file:///C:/Users/moham/Desktop/3abaqira/backend/requirements.txt) | Package requirements listing FastAPI, Uvicorn, Pydantic, SQLAlchemy, and database drivers. |
| [database/](file:///C:/Users/moham/Desktop/3abaqira/backend/database) | Central data layer providing pooled database connections, automated schema migrations, historical backup/archiving, and domain managers with FastAPI dependency injection. |

