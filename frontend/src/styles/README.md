# Styling & Design Tokens (`frontend/src/styles/`)

This directory contains the core visual design tokens, sharp architectural palette definitions, Excel grid utility classes, and swappable typography architecture for the 3abaqira Enterprise Platform.

## Directory Contents

| File | Purpose |
| :--- | :--- |
| [fonts.css](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/styles/fonts.css) | Abstract typography token declarations (`--font-family-latin`, `--font-family-arabic`, `--font-family-display`) allowing 1-click global font replacement across the entire site without touching React components. |
| [globals.css](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/styles/globals.css) | Master stylesheet importing Tailwind CSS layers and the complete **Spatial Knowledge Workspace Blue theme**: tokens (`--accent: #1e3a8a`, `--accent-hover: #1d4ed8`, `--accent-soft: #eff6ff`, `--paper: #ffffff`, `--bg: #f8fafc`, `--ink: #0f172a`), radial-dot blueprint canvas background, geometric radial emblem (`.brand-symbol`), sharp buttons (`.button`, `.button-primary`, `.icon-button`), segmented view controls (`.view-switch`), Excel grid primitives (`.excel-table`, `.excel-th`, `.excel-td`, `.excel-cell-active`, `.excel-status-bar`), and bottom workspace telemetry ribbon (`.workspace-status`). |

