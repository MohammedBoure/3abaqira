# Genius Kids Academy ERP — Frontend Integration & Verification Test Suite

> **Auditor & Author:** MohammedBoure (`agy100` - Principal Integration & Verification Architect)  
> **Status:** Passed (100% Verification Rate)  
> **Target Branch:** `frontend/agy100-system-integration-audit` off `develop`

---

## 1. Overarching Summary of Test Suite Scope

This test harness provides an automated, end-to-end audit of the Genius Kids Academy frontend integration according to `docs/genius_kids_academy_report.txt` and `.agent/agy100.md`. It verifies the integration of all 9 system modules, the 13 Jijel branch networks, dynamic two-state workspace context switching, RTL Cairo typography rendering, print stylesheets for sequential Arabic cash vouchers and kindergarten report cards, and the 6-stage Excel migration pipeline.

### Target Modules Tested
1. **Module 1: Identity & Access Management**: Account activations, role assignment per branch, audit trail of grade changes and price overrides.
2. **Module 2: Organization & Branch Network**: 13 Jijel branches (Academies and Kindergartens), classrooms, equipment lists, and academic year terms.
3. **Module 3: People & Family Registry**: Unified person registry, parents/guardians with custody flags, and authorized pickup lists with ID inspection.
4. **Module 4: Staff & HR Console**: Staff profiles across departments, branch assignment transfers, daily staff attendance (with manual / biometric sources), and online job applications pipeline.
5. **Module 5: Academy Workstation**: Workshops (Soroban, Robotics, Languages, Quran, Preparatory, Summer Club, Competitions), timetable matrix, clash prevention, attendance, and dynamic evaluation pass rules.
6. **Module 6: Kindergarten Console**: Age bands, numbered books, daily attendance, daily log sheets (A/B/C ratings across 8 dimensions), monthly reports with administrative approvals, incident logs, and weekly menus.
7. **Module 7: Communication & Central Notifications**: Parent notes channel with time-window controls and 1-reply constraint, plus the central multi-channel notification dispatch queue (SMS DZ, Email, WhatsApp Business API, Telegram bot).
8. **Module 8: Finance & Treasury**: Dynamic price plans per branch/customer, split installment billing, cash payments with gapless sequential receipt numbering (`REC-YYYY-XXXXX`), payment voids, branch cash drawers, and daily balance summary.
9. **Module 9: Data Migration Console**: 6-stage Excel import pipeline (`mig_import_row`), ambiguity review workbench, and historical cash sheets reconciliation with 0 DZD variance.

---

## 2. Itemized Breakdown of Test Files and Execution Scripts

| File / Artifact | Scope & Description | Execution Command |
| :--- | :--- | :--- |
| `tests/verify-integration.cjs` | Master automated verification harness testing 6 comprehensive test suites across routes, typography, print styles, and build chunks. | `npm test` or `node tests/verify-integration.cjs` |
| `src/components/dashboard/common/ArabicCashReceiptModal.jsx` | Sequential Arabic cash receipt printable modal with gapless numbering, Algerian Dinar currency formatting, dual signatures, and print media rules. | Triggered via Navbar action or Financial Ledgers |
| `src/components/dashboard/common/KindergartenMonthlyReportCardModal.jsx` | Kindergarten monthly report card printable modal with 8-dimension A/B/C evaluation matrix, administrative approval seal, and A4 print layout. | Triggered via Navbar action or Kindergarten Console |
| `src/styles/globals.css` | Print engine styles (`@media print`) and layout resets for solid black ink printing without web chrome. | Automatic during `window.print()` |
| `src/styles/fonts.css` | Typography architecture prioritizing Cairo font family for Arabic and Display rendering. | Global application stylesheet |

---

## 3. Step-by-Step Instructions for Running Tests Locally

### Prerequisites
- Node.js (v18+ or v20+)
- npm (v10+)
- Chromium-based browser (Chrome, Edge) or Firefox for visual print preview testing

### Running the Verification Audit Suite
From the `frontend/` directory, execute:
```bash
# 1. Run the automated integration audit suite
npm test

# Alternatively:
node tests/verify-integration.cjs
```

### Verifying the Production Build
```bash
# Compile the full Vite production bundle
npm run build
```

### Testing Printable Receipts & Monthly Report Cards Visually
```bash
# Start Vite development server
npm run dev
```
1. Open the application in your browser (default `http://localhost:5173/`).
2. Notice the top navigation bar with two persistent print shortcut buttons:
   - **سند قبض نقدي**: Opens the sequential Arabic cash receipt voucher modal. Click "طباعة السند" to trigger print preview (formatted for A5/A4 half sheet).
   - **بطاقة الروضة**: Opens the Kindergarten monthly report card modal. Click "طباعة بطاقة التقرير" to trigger print preview (formatted for A4 full portrait).
3. Test the context switcher:
   - Click "روضة العباقرة" to adapt the workspace to Kindergarten modules.
   - Click "المركز التعليمي" to adapt the workspace to Academy modules.
   - Select any branch from the dropdown (e.g., `أكاديمية العباقرة - فرع الميلية` or `روضة وحضانة البراعم`) to verify automatic context adaptation.

---

## 4. Critical Edge Cases, Validation Boundaries & Dependencies

1. **Gapless Sequential Receipt Numbering**:
   - Vouchers must strictly follow the format `REC-YYYY-BRN-XXXXX`.
   - Vouchers can be marked as `VOIDED` with an audit record, but never deleted from the database ledger.
2. **Kindergarten Report Card Approval Gate**:
   - Unapproved monthly reports are flagged as "قيد المراجعة الإدارية" and are strictly hidden from parent portals until approved by an administrator.
3. **One-Reply Rule on Parent Notes**:
   - Staff and teachers can answer parent notes only once to prevent unbounded messaging threads and respect administrative bandwidth.
4. **Data Migration Ambiguity Gate**:
   - Staged rows in `mig_import_row` marked as `AMBIGUOUS` or `PRICE_OVERRIDE_NEEDED` are blocked from automated conversion into live ERP records until manual review and sign-off.
5. **Zero Cash Variance Requirement**:
   - The migration financial reconciliation compares total dinars from historical Excel cash sheets against converted payment records, requiring 0 DZD variance.
