# Rawda (Kindergarten & Daycare) Components (`frontend/src/components/dashboard/rawda/`)

This directory contains the operational and financial interfaces dedicated exclusively to the **Rawda branch (روضة وحضانة الأطفال العباقرة)** in strict conformance with Section 2 of `docs/frontend.md`.

## Directory Contents

| File | Purpose |
| :--- | :--- |
| [RawdaStudentsRosterView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaStudentsRosterView.jsx) | Screen 1: "المداخيل و التسجيلات" (Revenues & Enrolments) master student roster with compact high-density layout, mouse right-click cell context menu (payment status toggle, receipt vouchers, student edit, TSV copy), direct inline cell editing, icon-only toolbar, progressive lazy loading (50/X counter), academic year selector, and guide info modal. |
| [RawdaCohortsKanbanView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaCohortsKanbanView.jsx) | Screen 2: "تقسيم الأفواج" (Cohort Grouping) interactive Kanban board with maximized prominent student name display, custom cohort creation, easy 1-click child transfer and removal, helper list modal with registered student autocomplete, and guide info modal. |
| [RawdaDailyExpensesView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaDailyExpensesView.jsx) | Screen 3: "سجل المصاريف اليومية" (Daily Expenses & Vouchers Ledger) with compact high-density layout, multi-year selector (2024-2025, 2025-2026, 2026-2027), 11-month filter buttons, right-click cell context menu (edit, print voucher, toggle payment method, copy TSV, delete), direct inline cell editing, printable expense voucher preview, and guide info modal. |
| [RawdaBudgetVarianceView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaBudgetVarianceView.jsx) | Screen 4: Variance analysis comparison grid covering the 7 approved expense items with real-time savings/deficit calculation. |
| [RawdaCashDrawerView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaCashDrawerView.jsx) | Screen 5: Daily cash register reconciliation ledger calculating closing drawer balance: `(Opening + Inflow - Outflow - Delivered)`. |
| [RawdaCashHandoverView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaCashHandoverView.jsx) | Screen 6: Cash custody delivery and safe remittance registry enforcing strict receipt number uniqueness. |
| [RawdaBreadTrackingView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaBreadTrackingView.jsx) | Screen 7: Daily bread consumption log mapped to planned meals across weeks 1 to 5 per month with automatic total cost formulas. |
| [RawdaMeatProvisionsView.jsx](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/components/dashboard/rawda/RawdaMeatProvisionsView.jsx) | Screen 8: Weekly protein and dietary provisions tracker covering 6 monitored commodities (beef, poultry, scallop, 5L mineral water, eggs, cheese). |
