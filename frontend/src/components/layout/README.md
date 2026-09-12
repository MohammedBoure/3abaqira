# Layout Components (`frontend/src/components/layout/`)

This directory contains the application shell and navigation ribbon components adapted to the Spatial Knowledge Workspace Blue theme.

## Files

- **`Navbar.jsx`**: High-density enterprise utility header featuring sidebar toggle, circular official emblem (`frontend/public/assets/branding/logo.webp`), view breadcrumb trail with dynamic business module titles, real-time search input with `Ctrl+K` keyboard shortcut badge, active branch scope indicator, system synchronization badge (`النظام: نشط ومتزامن`), interactive user session badge displaying avatar initials, staff name, role, and branch scope (clicking opens the `AuthLoginModal`), language toggle (`العربية` ⇄ `Français`), and quick-action buttons ("الصندوق اليومي", "تسجيل جديد").
- **`Sidebar.jsx`**: Collapsible two-state navigation ribbon featuring the official brand emblem (`/assets/branding/logo.webp`), active workspace card (`3A`), structured enterprise module groupings (`OPERATIONS & SHEETS`, `FINANCE & BILLING`, `ACADEMIC & CURRICULUM`, `SYSTEM & GOVERNANCE`) with clean Arabic business status tags, branch authority switcher (`ALL`, `CENTER`, `RAWDA`) enforcing role-based boundaries (locks unauthorized branches for single-branch accounts while granting full traversal to Super Admin), and user account session footer with an account switch button (`تبديل الحساب`).
