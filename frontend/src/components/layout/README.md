# Layout Components (`frontend/src/components/layout/`)

This directory contains the application shell and navigation ribbon components adapted to the Spatial Knowledge Workspace Blue theme.

## Files

- **`Navbar.jsx`**: High-density utility header featuring sidebar toggle, circular official emblem (`frontend/public/assets/branding/logo.webp`), view breadcrumb trail with dynamic module titles for all 20 spreadsheet sheets and backend API interfaces, real-time search input with `Ctrl+K` keyboard shortcut badge, active branch indicator, database sync status indicator, language toggle (`العربية` ⇄ `Français`), and quick-action buttons ("الصندوق اليومي", "تسجيل جديد").
- **`Sidebar.jsx`**: Collapsible two-state sidebar featuring the official brand emblem (`/assets/branding/logo.webp`), active workspace card (`3A`), structured ERP module navigation groupings (`OPERATIONS & SHEETS`, `FINANCE & BILLING`, `ACADEMIC & CURRICULUM`, `SYSTEM & APIS`), branch scope switcher (`ALL`, `CENTER`, `RAWDA`), and local database health card with user role badge.
