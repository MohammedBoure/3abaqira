# Backend Database Layer (`backend/database/`)

This directory serves as the unified data access and persistence layer for the 3abaqira Enterprise Management Platform. It is patterned after the proven modular architecture from `GoldShop2.0/database`, extended for multi-branch operations and integrated with FastAPI.

## Directory Architecture

```
backend/database/
├── __init__.py               # Central registry, dynamic lazy manager loader & FastAPI dependencies (get_db)
├── README.md                 # Directory documentation
└── base/                     # Core engine infrastructure
    ├── __init__.py           # Package entrypoint for base
    ├── base.py               # Backward-compatibility shim
    ├── config.py             # Global logging, path helpers, constants & JSON serializers
    ├── connection.py         # Connection pooling (PostgreSQL/MySQL) & SQLAlchemy engine
    ├── database.py           # Central Database Singleton coordinator
    ├── schema_initializer.py # Automated fingerprinted DDL execution & migrations
    ├── tables.py             # Modular DDL table definition queries
    ├── views_indexes.py      # Analytical reporting views & B-tree performance indexes
    ├── backup_manager.py     # CSV/ZIP/Excel backup, restore & historical purging
    ├── archive_view_manager.py # Non-destructive archive view mode
    └── README.md             # Detailed documentation of the base infrastructure
```

## Directory Contents

| File / Folder | Purpose |
|---------------|---------|
| [base/](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base) | Core infrastructure containing connection pooling, schema migrations, backup/restore managers, and archive viewing. |
| [__init__.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/__init__.py) | Package entry point re-exporting `Database`, dynamic domain manager loader (`_MANAGER_EXPORTS`), and FastAPI dependencies (`get_db`, `get_database`). |
| [branch_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/branch_manager.py) | Data Access Manager for the `branches` table, supporting multi-tenant branch CRUD and status toggles. |
| [academic_year_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/academic_year_manager.py) | Data Access Manager for the `academic_years` table, supporting fiscal year setup and atomic active cycle switching. |
| [classroom_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/classroom_manager.py) | Data Access Manager for the `classrooms` table, managing room capacities, floor allocations, and branch room rosters. |
| [infrastructure_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/infrastructure_manager.py) | Facade manager consolidating multi-branch infrastructure overview and room capacity analytics. |
| [user_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/user_manager.py) | Data Access Manager for the `users` authentication table, supporting secure credential verification, role-based retrieval, and password management. |
| [guardian_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/guardian_manager.py) | Data Access Manager for the `guardians` parent directory, contact search, and student linkage queries. |
| [student_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/student_manager.py) | Data Access Manager for the bilingual `students` directory, code generation, and `student_guardians` junction table. |
| [program_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/program_manager.py) | Data Access Manager for the `programs` table, managing educational offerings and billing models. |
| [level_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/level_manager.py) | Data Access Manager for curriculum `levels`, sequence ordering, age cohorts, and visual color tags. |
| [pricing_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/pricing_manager.py) | Data Access Manager for `pricing_plans` matrices, installment structures, and discount simulations. |
| [group_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/group_manager.py) | Data Access Manager for `groups` cohorts, capacities, and active student enrollment headcounts. |
| [schedule_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/schedule_manager.py) | Data Access Manager for `group_schedules` weekly timetable slots, room occupancy, and collision/clash checks. |
| [attendance_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/attendance_manager.py) | Data Access Manager for `completed_sessions` and `student_attendance` per-session marking, points scoring, and logs. |


## FastAPI Integration Pattern

FastAPI route handlers can consume database connections and singleton services effortlessly:

```python
from fastapi import APIRouter, Depends
from backend.database import get_db, get_database, Database

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/")
def get_students(conn = Depends(get_db)):
    cursor = conn.cursor()
    cursor.execute("SELECT student_id, full_name_ar, full_name_fr FROM students WHERE is_active = TRUE;")
    return cursor.fetchall()

@router.get("/system/status")
def system_status(db: Database = Depends(get_database)):
    return db.get_archive_view_status()
```
