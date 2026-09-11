# Backend Service (`backend/`)

This directory contains the server-side architecture, API services, business logic, and database persistence layers for the **3abaqira Enterprise Management System**.

## Directory Architecture

```
backend/
├── README.md                 # Backend service overview and architecture
└── database/                 # Unified database connectivity, pooling, migrations & managers
    ├── README.md             # Database layer overview and FastAPI usage
    ├── __init__.py           # Dynamic manager registry & FastAPI dependencies
    └── base/                 # Core database infrastructure (Connection, Schema, Backup, Archive)
```

## Directory Contents

| Directory | Purpose |
|-----------|---------|
| [database/](file:///C:/Users/moham/Desktop/3abaqira/backend/database) | Central data layer providing pooled database connections, automated schema migrations, historical backup/archiving, and domain managers with FastAPI dependency injection. |
