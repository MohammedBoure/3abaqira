# Treasury & Finance Desk (`frontend/src/components/dashboard/finance/`)

## Overview
This directory implements the Treasury & Finance Hub for Genius Kids Academy according to `docs/genius_kids_academy_report.txt` and `.agent/agy52.md`.
The module handles all financial lifecycle interactions in Algerian Dinar (DZD / DA) under a cash-only operation model, strict gapless sequential receipt numbering, price override reason enforcement, and dynamic derived ledger calculations.

## Component Breakdown & Responsibilities

| Component | Responsibility | Props & State Models | Contracts & Key Enforcements |
| :--- | :--- | :--- | :--- |
| `TreasuryFinanceDeskView.jsx` | Master financial desk container hosting quick sub-tab switching between all 4 finance desks. | `initialTab`: string (`pricing`, `invoices`, `receipts`, `drawer`). | Provides quick context switching across pricing, invoicing, cash collection, and vault balancing. |
| `PricingPlanManagerView.jsx` | Pricing catalog and dynamic price override management. | State: `plans`, `overrides`, `activeTab` (PLANS, OVERRIDES), `isOverrideModalOpen`, `overrideForm`. | Dynamic Price Override Modal: enforces mandatory justification reason (`mandatoryReason`) and authorized staff name (`staffAuthor`). |
| `InvoicesInstallmentsView.jsx` | Invoice generator with line items, upfront vs installment scheduler, and overdue tracking. | State: `invoices`, `selectedInvoice`, `statusFilter`, `isPreviewModalOpen`. | Invoicing with installment due dates, payments, and remaining balance calculations; official printable tax invoice voucher. |
| `CashReceiptCounterView.jsx` | Cash payment terminal with sequential receipt numbering and payment void management. | State: `receipts`, `isCollectModalOpen`, `isVoidModalOpen`, `selectedReceiptForVoid`, `voidReason`. | Sequential numbering gapless per branch and year (`REC-YYYY-BRANCH-XXXXX`); Payment Void Modal: payments cannot be deleted, only voided with audited reason. |
| `DailyCashDrawerView.jsx` | Daily cash drawer, categorized expense logging, safe handovers to headquarters, and live statement. | State: `expenses`, `handovers`, `activeTab` (STATEMENT, EXPENSES, HANDOVERS), `isExpenseModalOpen`, `isHandoverModalOpen`. | Derived, never stored: cash balances, daily income, expenses, and running balance are dynamically calculated to prevent out-of-sync drift. |

## Audit & Compliance Rules Enforced
1. **Cash-Only Policy:** Cash is the sole payment method accepted across branches.
2. **Gapless Sequential Receipts:** Receipt numbers increment monotonically per branch/year without gaps.
3. **Immutability of Payments:** Payments can be voided with a mandatory reason, but never deleted from the database.
4. **Price Override Accountability:** Any price deviating from the list tariff requires an explicit, audited reason and author identity.
5. **Dynamic Reconciliation:** Drawer closing balances are computed on-the-fly (`openingBalance + receipts - expenses - handovers`).
