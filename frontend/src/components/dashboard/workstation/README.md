# Kindergarten & Daycare Workstation (`frontend/src/components/dashboard/workstation/`)

## Overview
This directory contains the complete, high-density Enterprise Kindergarten & Daycare Workstation built strictly according to `docs/genius_kids_academy_report.txt` and `.agent/agy52.md`.
It provides high-performance data grids with RTL Cairo typography, zero cartoon/neon bloat, strict audit logging, and Algerian educational & financial regulatory standards.

## Component Breakdown & Responsibilities

| Component | Responsibility | Props & State Models | Contracts & Key Enforcements |
| :--- | :--- | :--- | :--- |
| `KindergartenWorkstationView.jsx` | Master workstation tabbed container allowing seamless switching between all 7 sub-modules. | `initialTab`: string (`bands-books`, `attendance`, `daily-log`, `monthly-reports`, `incidents`, `orthophonist`, `habits-menu`). | Provides instant top ribbon navigation and sub-view routing. |
| `AgeBandsNumberedBooksView.jsx` | Manages age band cohorts (Bébé, Petite, Moyenne, Grande) and numbered book assignments. | Filters: `selectedBandId`, `searchQuery`. State: `students`, `isAssignModalOpen`, `newAssignment`. | Strict book assignment uniqueness (`BK-[BAND]-YYYY-XXXX`), capacity tracking, and student demographics. |
| `DailyAttendanceRegisterView.jsx` | Fast daily attendance register with arrival/departure time, escorts, and temperature telemetry. | State: `selectedDate`, `selectedBand`, `attendanceRecords`, `toastMessage`. | Rapid 1-click status buttons (PRESENT, LATE, ABSENT, EXCUSED); automated alert trigger dispatched to outbound notification queue. |
| `DailyChildLogSheetView.jsx` | Daily Child Log Sheet with rapid A/B/C rating buttons for Meals, Sleep, Study, Interaction, Crying, Clothes change + notes. | State: `selectedDate`, `selectedBand`, `logs`, `toastMessage`. Inline button component `QuickRatingGroup`. | Instant A/B/C ratings: A (Good), B (Average), C (Weak / Alert). Dynamic counter of children requiring attention. |
| `MonthlyReportApprovalCenterView.jsx` | Monthly Report Approval Center with Draft preview, Admin sign-off, and Printable report card. | State: `activeTab` (ALL, PENDING_APPROVAL, APPROVED, PRINT_VIEW), `reports`, `selectedReportForPrint`. | Segregation of Duties: database/UI rule enforcing reviewer (`reviewedBy`) != author (`preparedBy`); official A4 printable card. |
| `IncidentTrackerLogView.jsx` | Logs incidents across Behavior, Sleep, Eating, and Learning. | State: `incidents`, `selectedCategory`, `searchQuery`, `isModalOpen`, `newIncident`. | Severity ratings (LOW, MEDIUM, CRITICAL), immediate containment actions, and parent notification status. |
| `OrthophonistObservationPanelView.jsx` | Specialist clinical observation panel for speech & motor therapy. | State: `notes`, `selectedNote`, `isModalOpen`, `newNote`. | Medical confidentiality toggle (`visibilityToParents`: true/false); treatment milestones and progress tracking. |
| `ChildHabitMenuPlannerView.jsx` | Child habit intake profile and weekly cafeteria rotating meal menu planner. | State: `activeTab` (HABITS / MENU), `students`, `selectedStudent`, `weeklyMenu`, `isEditingHabits`. | Strict allergy monitoring, sleep and comfort routines, 5-day school cafeteria nutrition planner (Sunday-Thursday). |

## Styling & Design Tokens
- **Typography:** RTL Cairo font (`font-arabic`), JetBrains Mono (`font-mono`) for sequential IDs and timestamps.
- **Color Palette:** Professional enterprise slate (`slate-50` to `slate-900`), blue accents (`blue-900`), emerald for compliant approvals, and rose for critical alerts.
- **Density:** Technical compact borders (`border-slate-200`, `border-collapse`), dense cell padding (`py-1.5 px-2.5`).
