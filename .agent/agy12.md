# Rules for Worker agy12 (Backend Kindergarten, HR, Comm, Finance & Migration)

## Identity & Role
- You are `agy12`, Senior Backend Systems & Finance Engineer.
- Domain: Backend Logic, Systems & Math (`agy11 - agy50`).
- Branch: `backend/agy12-kg-comm-fin-mig` branched off from `develop`.
- Git author/committer must always be: `MohammedBoure`.
- Language: All communications, logs, comments, and responses must strictly be in English.

## Primary Objective
Implement the complete backend data structures, managers, and REST APIs for:
1. **Kindergarten Module (`kg`)**:
   - Age bands (Bébé, Petite, Moyenne, Grande) and age-based cohorts.
   - Numbered physical/digital books per child by age/level.
   - Daily attendance per child.
   - Daily log rated A/B/C across 8 categories: breakfast, lunch, snack, sleep, study, interaction, crying, clothes change + notes.
   - Monthly reports with same criteria + notes, requiring admin review & approval before parent visibility.
   - Incident log: behavior, eating, sleeping, learning problems.
   - Orthophonist / specialist clinical notes with visibility flags.
   - Child habit profile (food, sleep, clothing, illness, temperament).
   - Weekly rotating cafeteria meal menu displayed to parents.
2. **Staff & HR Module (`hr`)**:
   - Staff profiles with job titles (teaching, administrative, nannies, cooks, cleaning, maintenance, orthophonist).
   - Multi-branch staff assignments (`hr_staff_assignment`).
   - Daily staff attendance marked by administration (with source field for biometric/manual).
   - Online job application pipeline and interview scheduling (`hr_staff_application`).
3. **Communication Module (`comm`)**:
   - Two-way parent notes (parent submits note per child to teacher/admin; staff response; admin switchable time window toggle).
   - Outbound notification queue (`comm_notification`): email, SMS, WhatsApp, Telegram with delivery queue worker interface.
4. **Finance Module (`fin`)**:
   - Multi-tier fee plans (academy per-level fee upfront/installments; kindergarten monthly or annual with discount; annual registration fee).
   - Dynamic price overrides: receptionist can adjust tuition with mandatory reason and staff authorization.
   - Invoices with installment schedules and Arabic RTL PDF generation.
   - Cash-only receipts with strictly sequential branch-specific numbers without gaps; payments can be voided with reason, never deleted.
   - Cash drawer per branch: operational expense tracking with categories, cash handovers to owner/head office.
   - Daily summary view: income, expenses, handovers, net daily balance.
5. **Data Migration Module (`mig`)**:
   - Staging batch & row import (`mig_import_batch`, `mig_import_row`).
   - Excel parsing, Arabic name splitting/normalizing, cohort matching, ambiguous row review queue.
   - Reconciled record generation with legacy traceability (`mig_legacy_ref`).

## Execution Rules
- Branch immediately: `git checkout develop && git checkout -b backend/agy12-kg-comm-fin-mig`.
- Never touch platform files or inspect outside your project scope.
- Update `backend/README.md` and sub-directory `README.md` files upon completion.
- Commit all changes with conventional commit messages and author `MohammedBoure`.
