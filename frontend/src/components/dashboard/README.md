# Dashboard & Module Components (`frontend/src/components/dashboard/`)

This directory contains the operational dashboard views, spreadsheet grids, and template interfaces for the 3abaqira Enterprise Platform.

## Files

- **`ExcelDataGrid.jsx`**: High-density Excel-like data grid engine featuring 26 columns, frozen/sticky panes (Index, Code, Name), column chooser with preset configurations, workbook sheet tabs, active cell outline with keyboard arrow navigation, real-time formula aggregation status ribbon, CSV export, and clipboard TSV copy.
- **`AnalyticsDashboard.jsx`**: Professional executive business intelligence and statistics dashboard designed without AI spectrum tropes (no purple glowing orbs/neon), featuring monthly cash flow velocity curves, program capacity meters, aging arrears distribution, direct branch comparison (Center vs. Rawda), and a comprehensive program financial pivot table.
- **`HeroBanner.jsx`**: High-density enterprise welcome banner with sharp architectural borders, active academic year badges, database engine status, and primary action triggers.
- **`MetricGrid.jsx`**: High-density KPI grid container housing operational counters for enrolled students, live drawer liquidity, collection rate/active programs, and cafeteria logistics with defensive optional chaining (`labelAr`) and fallback defaults.
- **`CashDrawerOverview.jsx`**: Daily cash drawer and register ledger view with transaction tracking, voucher codes, and administrative deposit voucher triggers.
- **`ProgramsOverview.jsx`**: Academic catalog and cohort capacity meters across Soroban, Daycare, Robotics, Quran, and Foreign Languages.
- **`PayrollOverview.jsx`**: Ready template interface for HR, staff, and coach payroll calculations (base pay, session rates, gross wages, deductions, and net payout signoff).
- **`ProvisionsOverview.jsx`**: Ready template interface for Daycare kitchen procurement, daily bread logs, meat and protein orders, and supplier receipts.
- **`AcademicYearsView.jsx`**: Formal management interface for `backend/apis/academic_years.py` featuring active cycle spotlights, academic cycle date-range grids, atomic cycle activation (`/set-current`), cycle creation modal, and enrollment continuity metrics.
- **`BranchesView.jsx`**: Formal multi-tenant campus interface for `backend/apis/branches.py` featuring branch profiles (Center vs. Rawda), operational status toggle (`/status`), classroom allocations grid (`/classrooms`), room capacity/occupancy bars, and branch/room creation dialogs.
- **`AuditLogsView.jsx`**: Formal compliance interface for `backend/apis/audit.py` featuring system audit trail grids, event telemetry counters (INSERT/UPDATE/DELETE), filter ribbon (by table, action, actor, date), interactive before-and-after diff inspection modal, and manual audit recording form.
- **`AuthSecurityView.jsx`**: Formal security interface for `backend/apis/auth.py` featuring current authenticated profile (`/me`), active JWT bearer token telemetry and expiry countdown, password change form (`/change-password`), staff user accounts directory, and RBAC role permissions matrix.
- **`PreviewModals.jsx`**: Sharp modal dialogs for new student enrollment and daily cash register reconciliation audits.
- **`MockDataGrid.jsx`**: Standard table preview component.

