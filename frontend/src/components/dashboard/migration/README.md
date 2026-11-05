# Data Migration Console (`frontend/src/components/dashboard/migration/`)

## Overview
This directory implements the Data Migration Console for importing, inspecting, resolving, and staging legacy Excel workbooks across all 13 branches of Genius Kids Academy according to `docs/genius_kids_academy_report.txt` and `.agent/agy52.md`.
It interfaces directly with the database migration tables: `mig_import_batch`, `mig_import_row`, and `mig_legacy_ref`.

## Component Breakdown & Responsibilities

| Component | Responsibility | Props & State Models | Contracts & Key Enforcements |
| :--- | :--- | :--- | :--- |
| `DataMigrationConsoleView.jsx` | Master migration console for managing Excel batch imports, staging row inspection, and legacy reference ledger browsing. | State: `batches`, `selectedBatch`, `stagingRows`, `legacyRefs`, `activeTab` (STAGING, LEGACY_REFS), `statusFilter`, `resolvingRow`. | Staging review pipeline: enables staff to audit unparsed or ambiguous rows before converting them to production records; links every production record back to its origin sheet and row. |
| `AmbiguousRowResolverModal.jsx` | Interactive conflict resolution modal for fuzzy student names, duplicate prevention across branches, and missing metadata. | Props: `row` (current ambiguous staging row), `onClose`, `onResolve`. State: `resolutionType` (LINK_EXISTING, CREATE_NEW), `selectedStudentId`, `resolutionNotes`. | Cross-Branch De-duplication: prevents duplicate student records when names match existing students from other branches; logs resolution notes into audit ledger. |

## Database Contract Alignment
- **`mig_import_batch`:** Tracks source file metadata, upload timestamp, operator, and batch status.
- **`mig_import_row`:** Stores parsed spreadsheet rows in staging with confidence score and conflict flags.
- **`mig_legacy_ref`:** Immutable pointer mapping `(legacy_file, legacy_sheet, legacy_row)` to `(target_table, target_uuid)`.
