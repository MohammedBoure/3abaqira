# Frontend Source Layer (`frontend/src/`)

This directory contains the root React components, styling systems, mock datasets, and layout orchestration for the 3abaqira Enterprise visual prototype.

## Directory Contents

| File / Folder | Purpose |
| :--- | :--- |
| [App.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/App.jsx) | Main application component orchestrating the complete UI/UX specification defined in `docs/frontend.md`: mandatory 2-state context switcher (Rawda Kindergarten vs Academic Center), full suite of 8 Rawda interfaces, 15 Center interfaces, unified `StandardViewLayout` (Breadcrumb & Title, 4 KPI cards, Action Bar, interactive data tables, 11-month toggle, and dynamic modal generation), Super Admin comprehensive tools, and pinned system status footer. |

| [main.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/main.jsx) | DOM entrypoint mounting the application with `ReactDOM.createRoot` and loading global styles. |
| [components/](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components) | Reusable UI components categorized into 3D, branding, common sharp enterprise primitives, dashboard & spreadsheet modules, and navigation layouts. |
| [mock/](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/mock) | Static mock datasets matching all backend APIs for multi-column student rosters, invoices, payments, budgets, handovers, pricing plans, enrollments, groups, timetables, competitions, guardians, and system telemetry. |
| [styles/](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/styles) | Centralized CSS token layers for enterprise Arabic typography (IBM Plex Sans Arabic, Readex Pro, Cairo), explicit RTL line-height and tabular-nums rules, high-contrast navigation styling, and soft architectural spreadsheet separators. |
