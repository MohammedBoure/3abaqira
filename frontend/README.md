# Frontend Application (`frontend/`)

This directory contains the client-side user interface and interactive enterprise workspace for the **Genius Kids Academy & Kindergarten ERP Platform** (منظومة أكاديمية وروضة الأطفال العباقرة).

> **Architectural Standard:** Principal System Integration & Audit (`agy100` / `MohammedBoure`)  
> **Source Specification:** `docs/genius_kids_academy_report.txt`  
> **Target Branch:** `frontend/agy100-system-integration-audit`

---

## 1. Master Navigation & Full 9-Module Scope

The frontend integrates all **9 functional modules** specified in the system specification report, seamlessly orchestrated through a unified workspace:

| # | System Module | Scope & Capabilities | Primary Components |
| :--- | :--- | :--- | :--- |
| **1** | **Identity & Access** | Pending/active accounts, under-14 self logins, parent logins, dynamic roles from permission catalogues, branch assignments, audit log of grade changes, price overrides, payment voids, and medical data views. | [`AuthSecurityView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/AuthSecurityView.jsx), [`AuditLogsView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/AuditLogsView.jsx) |
| **2** | **Organization** | Federation of 13 physical branches across Jijel Province (annotating `ACADEMY` vs `KINDERGARTEN`), classrooms, room capacity, equipment catalogs, and non-overlapping academic years. | [`BranchesView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/BranchesView.jsx), [`AcademicYearsView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/AcademicYearsView.jsx) |
| **3** | **People & Family** | Master person registry (Arabic & Latin names, birth dates, medical alerts, special needs), guardians linkage (father, mother, legal custody), authorized pickup list with desk verification check (no persistent pickup log). | [`GuardiansView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/GuardiansView.jsx), [`CorePersonFamilyHub.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/CorePersonFamilyHub.jsx) |
| **4** | **Staff & HR** | Staff directory across departments, multi-branch assignment transfers, daily staff attendance register (manual admin logging vs biometric fingerprint API ready), online applicant tracking, and interview dispatching. | [`StaffHrView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/StaffHrView.jsx), [`StaffHrCenter.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/StaffHrCenter.jsx), [`PayrollOverview.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/PayrollOverview.jsx) |
| **5** | **Academy Workstation** | Workshops (Soroban mental arithmetic, Robotics/AI, Languages, Quran, Preparatory, Summer Club, Competitions), strict linear progression, typed pass rules (Soroban 80/100 threshold across 3 tests), timetable matrix with clash detection, telephone absence logging, make-up sessions queue, and double-blind grading. | [`AcademyManagementWorkstation.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/AcademyManagementWorkstation.jsx), [`CenterInstallmentProgramsView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/center/CenterInstallmentProgramsView.jsx), [`CenterSorobanView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/center/CenterSorobanView.jsx), [`CenterTimetableView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/center/CenterTimetableView.jsx) |
| **6** | **Kindergarten Console** | Age bands, numbered books, daily attendance, daily logs (rated A/B/C across 8 dimensions: breakfast, lunch, snack, sleep, study, interaction, crying, clothes change + notes), monthly report approval workflow before parent portal publication, incident logs, orthophonist observations, and weekly rotating menus. | [`KindergartenConsoleView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/rawda/KindergartenConsoleView.jsx), [`KindergartenWorkstationView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/KindergartenWorkstationView.jsx), [`AgeBandsNumberedBooksView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/AgeBandsNumberedBooksView.jsx), [`DailyAttendanceRegisterView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/DailyAttendanceRegisterView.jsx), [`DailyChildLogSheetView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/DailyChildLogSheetView.jsx), [`MonthlyReportApprovalCenterView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/MonthlyReportApprovalCenterView.jsx), [`IncidentTrackerLogView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/IncidentTrackerLogView.jsx), [`OrthophonistObservationPanelView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/OrthophonistObservationPanelView.jsx), [`ChildHabitMenuPlannerView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/workstation/ChildHabitMenuPlannerView.jsx) |
| **7** | **Communication Console** | Parent notes channel with administrative on/off toggle, configurable daily time windows (e.g., 08:00 - 17:00), strict 1-reply constraint per message, and central multi-channel notification dispatch queue (Email, SMS DZ gateway, WhatsApp Business API, Telegram bot). | [`CommunicationView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/CommunicationView.jsx), [`CommunicationCenterView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/communication/CommunicationCenterView.jsx), [`ParentNotesThreadView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/communication/ParentNotesThreadView.jsx), [`NotificationQueueMonitorView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/communication/NotificationQueueMonitorView.jsx) |
| **8** | **Finance & Treasury** | Dynamic price plans per branch/customer, installment schedules (upfront vs split installments), cash payments with gapless sequential receipt numbering (`REC-YYYY-BRN-XXXXX`), payment voids (never deleted), branch cash drawers, categorized expenses, and cash handovers. | [`InvoicesPaymentsView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/InvoicesPaymentsView.jsx), [`CashDrawerOverview.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/CashDrawerOverview.jsx), [`PricingPlansView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/PricingPlansView.jsx), [`TreasuryFinanceDeskView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/finance/TreasuryFinanceDeskView.jsx), [`PricingPlanManagerView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/finance/PricingPlanManagerView.jsx), [`InvoicesInstallmentsView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/finance/InvoicesInstallmentsView.jsx), [`CashReceiptCounterView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/finance/CashReceiptCounterView.jsx), [`DailyCashDrawerView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/finance/DailyCashDrawerView.jsx) |
| **9** | **Data Migration Console** | 6-stage Excel historical data migration pipeline (Collect, Stage into `mig_import_row`, Clean & Match, Review Ambiguities, Convert, and Reconcile against historical cash sheets with 0 DZD variance) plus Staging Row Inspector, Ambiguous Resolver Modal, and Legacy Ref Ledger. | [`DataMigrationView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/DataMigrationView.jsx), [`DataMigrationConsoleView.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/migration/DataMigrationConsoleView.jsx), [`AmbiguousRowResolverModal.jsx`](file:///home/pluto/projects/3abaqira/frontend/src/components/dashboard/migration/AmbiguousRowResolverModal.jsx) |

---

## 2. 13 Jijel Branches & Branch Context Switching

The application federates 13 physical branches across Jijel Province. The **Workspace Context Switcher** located in the sidebar and top navigation dynamically adapts the UI according to the operating branch type:

1. **Academy Workstation Mode (`ACADEMY`)**:
   - Focuses navigation on courses, Soroban tournaments, robotics labs, Quran cohorts, session timetables, and per-session trainer remuneration.
   - Associated branches: `CENTER`, `MILIA_ACADEMY`, `TAHER_ACADEMY`, `KAOUS_ACADEMY`, `AOUANA_ACADEMY`, `JIJEL_OUEST_ACADEMY`, `CHEKFA_ACADEMY`, `ZIAMA_ACADEMY`.
2. **Kindergarten Workstation Mode (`KINDERGARTEN`)**:
   - Focuses navigation on age bands, cohorts, numbered books, daily log evaluation sheets, monthly report cards, kitchen provisioning, and weekly dietary menus.
   - Associated branches: `RAWDA`, `MILIA_RAWDA`, `TAHER_RAWDA`, `JIJEL_EST_RAWDA`, `SIDI_ABDELAZIZ_RAWDA`.
3. **Multi-Branch Super Admin Mode (`ALL`)**:
   - Grants aggregated visibility, consolidated financial drawers, cross-branch audit trail tracking, and data migration consoles.

---

## 3. Localization, RTL Layout & Cairo Typography Architecture

- **RTL Directionality**: Enforced at the root HTML level (`<html dir="rtl" lang="ar">`) with dynamic LTR flipping when toggling French.
- **Cairo Typography**: Defined in [`fonts.css`](file:///home/pluto/projects/3abaqira/frontend/src/styles/fonts.css) as the primary font family for all Arabic textual elements and headings:
  ```css
  --font-family-arabic: 'Cairo', 'IBM Plex Sans Arabic', 'Readex Pro', sans-serif;
  --font-family-display: 'Cairo', 'IBM Plex Sans Arabic', 'Outfit', sans-serif;
  ```
- **High-Density Technical Layout**: Sharp 1px borders (`border-slate-300`), tabular monospace digits for currency and telephone numbers, and complete elimination of cartoonish graphics in favor of professional ERP density.

---

## 4. Specialized Print Engine & Stylesheets

Specialized `@media print` rules are embedded directly in [`globals.css`](file:///home/pluto/projects/3abaqira/frontend/src/styles/globals.css) to support high-contrast, black-ink physical document generation without browser chrome:

### 1. Sequential Arabic Cash Receipts (`ArabicCashReceiptModal.jsx`)
- **Format**: High-contrast receipt voucher slip formatted for A5 / half A4 printing.
- **Sequential Gapless Numbering**: Follows standard institutional series (e.g. `REC-2026-JIJ-00482`).
- **Currency & Breakdown**: Amounts in figures and written Arabic words with DZD currency formatting.
- **Signatures & Seal**: Cashier signature, payer acknowledgment, and institutional treasury seal.
- **Void Status**: Displays prominent void watermark banner for cancelled transactions without deletion.

### 2. Kindergarten Monthly Report Cards (`KindergartenMonthlyReportCardModal.jsx`)
- **Format**: Standard A4 portrait report card (بطاقة المتابعة الشهرية).
- **8-Dimension Evaluation Matrix**: Systematic A/B/C indicators covering:
  1. وجبة الإفطار الصباحي (Breakfast)
  2. وجبة الغداء والتغذية (Lunch)
  3. اللمجة المسائية (Afternoon Snack)
  4. النوم والقيلولة (Nap & Sleep)
  5. الأنشطة التعليمية (Study & Cognitive Play)
  6. التفاعل الاجتماعي (Social Interaction)
  7. البكاء والتكيف الوجداني (Crying & Adaptation)
  8. النظافة وتبديل الملابس (Hygiene & Clothes)
- **Specialist Section**: Dedicated orthophonist observations section with parental visibility flag.
- **Administrative Approval Seal**: Official approval badge ("معتمد إدارياً - مصرح لولي الأمر") required before parent visibility.

---

## 5. Verification & Testing

The frontend features an automated integration audit script that validates routing, typography, branch context switching, print stylesheets, and production build chunks:

```bash
# Run automated integration verification audit
npm test

# Run production build compilation
npm run build

# Start local development server
npm run dev
```

For full test harness documentation, edge cases, and validation rules, see [`tests/README.md`](file:///home/pluto/projects/3abaqira/frontend/tests/README.md).

---

## 6. High-Density Enterprise Modules Implemented

### 1. Kindergarten & Daycare Workstation (`frontend/src/components/dashboard/workstation/`)
- **Age Bands & Numbered Books (`AgeBandsNumberedBooksView.jsx`):** Bébé (3m-18m), Petite (1.5y-3y), Moyenne (3y-4y), Grande (4y-5y) cohorts with strict unique serialized book assignment (`BK-[BAND]-YYYY-XXXX`).
- **Daily Attendance Register (`DailyAttendanceRegisterView.jsx`):** 1-click status buttons (PRESENT, LATE, ABSENT, EXCUSED), arrival/departure time, escort name, and instant absence SMS/WhatsApp alert dispatch.
- **Daily Child Log Sheet (`DailyChildLogSheetView.jsx`):** Rapid A/B/C ratings for Meals (Breakfast, Lunch, Snack), Sleep, Study, Interaction, Crying, Clothes change + staff notes.
- **Monthly Report Approval Center (`MonthlyReportApprovalCenterView.jsx`):** 3-mode workflow (Draft preview, Admin sign-off enforcing reviewer != author, Printable A4 report card).
- **Incident Tracker Log (`IncidentTrackerLogView.jsx`):** Behavior, Sleep, Eating, and Learning incidents with severity badges (LOW, MEDIUM, CRITICAL) and parent notification status.
- **Orthophonist Observation Panel (`OrthophonistObservationPanelView.jsx`):** Speech and cognitive milestones, clinical observations, treatment plans, and parent visibility privacy toggle.
- **Child Habit Profile & Weekly Cafeteria Planner (`ChildHabitMenuPlannerView.jsx`):** Food allergies, sleep routines, clothing comfort, temperament triggers, and 5-day rotating cafeteria meal planner (Sunday-Thursday).

### 2. Treasury & Finance Hub (`frontend/src/components/dashboard/finance/`)
- **Pricing Plan Manager (`PricingPlanManagerView.jsx`):** Branch/workshop/level plans with Dynamic Price Override modal enforcing mandatory justification reasons and staff author logging.
- **Invoices & Installment Scheduler (`InvoicesInstallmentsView.jsx`):** Invoices with line items, upfront vs split installment schedules with due dates, payment status, remaining balance, and printable tax invoice voucher.
- **Cash Receipt Counter (`CashReceiptCounterView.jsx`):** Gapless sequential receipt numbering (`REC-YYYY-BRN-XXXXX`), strictly cash-only payments, and Payment Void modal (payments cannot be deleted, only voided with audited reason).
- **Daily Cash Drawer (`DailyCashDrawerView.jsx`):** Daily cash box (`fin_cash_box`), categorized expenses, safe handovers to headquarters, and dynamically derived live running balance.

### 3. Parent Notes & Communication Center (`frontend/src/components/dashboard/communication/`)
- **Parent Notes Thread (`ParentNotesThreadView.jsx`):** Two-way parent notes channel with administrative on/off toggle, active daily time windows (08:00-17:00), and strict single-reply constraint per note.
- **Notification Queue Monitor (`NotificationQueueMonitorView.jsx`):** Central outbound queue monitor for SMS, WhatsApp Business API, Telegram Bot, and SMTP relay with live delivery telemetry and retry triggers.

### 4. Data Migration Console (`frontend/src/components/dashboard/migration/`)
- **Staging Row Inspector & Ambiguous Resolver (`DataMigrationConsoleView.jsx`, `AmbiguousRowResolverModal.jsx`):** Excel batch upload, staged row inspection (`mig_import_row`), conflict resolution modal (fuzzy matching, cross-branch student de-duplication), and legacy reference ledger (`mig_legacy_ref`) linking production UUIDs to origin Excel sheets and rows.
