# Database Base Infrastructure (`backend/database/base/`)

This directory houses the core database connectivity, pooling, schema initialization, table definitions, backup/restore engine, and archive inspection mode.

## Directory Contents

| File | Purpose |
|------|---------|
| [__init__.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/__init__.py) | Package entrypoint exposing `Database`, `CustomJSONEncoder`, and core configuration constants. |
| [base.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/base.py) | Backward-compatibility shim allowing imports from `backend.database.base` or `backend.database.base.base`. |
| [config.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/config.py) | System logging (`WindowsSafeRotatingFileHandler`), UTF-8 console encoding, table import sequence order, and custom JSON serialization. |
| [connection.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/connection.py) | `ConnectionManager` handling PostgreSQL / MySQL connection pools, thread-safe context managers, transparent SQLite compatibility (`SQLiteCompatCursor`, `SQLiteCompatConnection`), automatic fallback to SQLite when external databases are unreachable, and SQLAlchemy engine creation. |
| [database.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/database.py) | Central `Database` Singleton orchestrating connection management, schema migrations, backups, and archive view modes. |
| [schema_initializer.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/schema_initializer.py) | Executes table definitions, views, and indexes with cross-dialect adaptation (SQLite view translations, parameter placeholders). Utilizes SHA256 checksum fingerprinting in `AppMetadata` to bypass redundant startup checks. |
| [tables.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/tables.py) | Modular SQL table definitions grouped by domain (Core, Students, Pricing, HR, Schedules, Billing, Treasury, Kitchen, Competitions, Audits). |
| [views_indexes.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/views_indexes.py) | Analytical SQL reporting views (emulating Excel sheets) and B-tree indexes for query performance acceleration. |
| [backup_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/backup_manager.py) | Full CSV/ZIP and Excel database backup and restore engine, table purging, and historical data archiving. |
| [archive_view_manager.py](file:///C:/Users/moham/Desktop/3abaqira/backend/database/base/archive_view_manager.py) | Non-destructive archive viewer loading historical ZIP backups into temporary `ARCHIVE_VIEW_*` tables for live inspection. |

