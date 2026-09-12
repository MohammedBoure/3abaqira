# Layout Components (`frontend/src/components/layout/`)

This directory contains the application shell and navigation ribbon components adapted to the Spatial Knowledge Workspace Blue theme.

## Files

- **`Navbar.jsx`**: High-density enterprise utility header featuring sidebar toggle, circular official emblem (`frontend/public/assets/branding/logo.webp`), view breadcrumb trail with dynamic business module titles, real-time search input with `Ctrl+K` keyboard shortcut badge, active branch scope indicator, system synchronization badge (`النظام: نشط ومتزامن`), interactive user session badge displaying avatar initials, staff name, role, and branch scope (clicking opens the `AuthLoginModal`), language toggle (`العربية` ⇄ `Français`), and quick-action buttons ("الصندوق اليومي", "تسجيل جديد").
- **`Sidebar.jsx`**: Collapsible two-state navigation ribbon featuring the official brand emblem (`/assets/branding/logo.webp`), active workspace card (`3A`), high-contrast dark slate navigation typography (`text-slate-700/800`), bold category headers (`text-xs uppercase font-bold tracking-wider text-slate-500`), crisp active state styling (`bg-blue-50/80 text-blue-700 border-r-4 border-blue-600`), branch authority switcher (`ALL`, `CENTER`, `RAWDA`) enforcing role-based boundaries, and user account session footer with an account switch button (`تبديل الحساب`).
