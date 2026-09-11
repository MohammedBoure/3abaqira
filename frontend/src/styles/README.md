# Styling & Design Tokens (`frontend/src/styles/`)

This directory contains the core visual design tokens, sharp architectural palette definitions, Excel grid utility classes, and swappable typography architecture for the 3abaqira Enterprise Platform.

## Directory Contents

| File | Purpose |
| :--- | :--- |
| [fonts.css](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/styles/fonts.css) | Abstract typography token declarations (`--font-family-latin`, `--font-family-arabic`, `--font-family-display`) allowing 1-click global font replacement across the entire site without touching React components. |
| [globals.css](file:///C:/Users/moham/Desktop/3abaqira/frontend/src/styles/globals.css) | Master stylesheet importing Tailwind CSS layers, sharp architectural palette tokens, Excel grid primitives (`.excel-table`, `.excel-th`, `.excel-td`, `.excel-cell-active`, `.excel-status-bar`), sharp enterprise utilities (`.sharp-card`, `.sharp-btn-primary`, `.sharp-btn-secondary`, `.sharp-input`), and zero-radius scrollbar styling. |

