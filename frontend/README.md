# Frontend Application (`frontend/`)

This directory contains the client-side user interface and interactive web experience for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة).

## Architecture: High-Density Enterprise & Excel-Compatible Model

In accordance with user design directives and enterprise management requirements:
- **Full-Width Screen Exploitation**: Edge-to-edge responsive layout eliminating unnecessary side margins, maximizing data visible per square inch.
- **Sharp Architectural Theme**: Complete departure from bubbly, rounded cartoon aesthetics; uses crisp `rounded-none`, technical borders (`border-slate-300`), and tabular figures.
- **Anti-AI-Spectrum Design**: Strict avoidance of neon gradients, glowing purple/cyan badges, or fake AI sparkles in favor of classy, comfortable executive blues, slates, and forest greens.
- **Excel-Compatible Data Grid**: 26-column spreadsheet interface with sticky/frozen panes, column chooser with presets, active cell outline with keyboard arrow navigation, real-time formula aggregation status ribbon, CSV export, and clipboard TSV copy.
- **Modular Interface Templates**: Ready workspace switcher for Excel Grid, Executive Analytics & Statistics, Treasury & Daily Drawer, Academic Cohorts, HR/Payroll, and Cafeteria Provisions.
- **Interactive 3D Background**: Ambient, understated Three.js WebGL architectural wireframe with subtle mouse parallax.
- **Swappable Typography & Logo**: Abstract CSS tokens and isolated `<BrandLogo />` component.

## Directory Contents

| File / Folder | Purpose |
| :--- | :--- |
| [index.html](file:///C:/Users/moham/Desktop/3abaqira/frontend/index.html) | HTML5 entrypoint with Google Fonts links (Cairo, Inter, Outfit) and RTL default directionality. |
| [package.json](file:///C:/Users/moham/Desktop/3abaqira/frontend/package.json) | Node package dependencies (React 18, Vite, Three.js, Tailwind CSS, Lucide icons). |
| [vite.config.js](file:///C:/Users/moham/Desktop/3abaqira/frontend/vite.config.js) | Vite development server and bundling configuration. |
| [tailwind.config.js](file:///C:/Users/moham/Desktop/3abaqira/frontend/tailwind.config.js) | Tailwind CSS tokens extending the primary blue palette and glassmorphism shadows. |
| [postcss.config.js](file:///C:/Users/moham/Desktop/3abaqira/frontend/postcss.config.js) | PostCSS plugins configuring Tailwind CSS and Autoprefixer. |
| [src/](file:///C:/Users/moham/Desktop/3abaqira/frontend/src) | Application source code containing components, mock data, styles, and root App container. |
| [public/](file:///C:/Users/moham/Desktop/3abaqira/frontend/public) | Static assets including branding placeholder SVGs (`logo-icon-placeholder.svg`, `logo-full-placeholder.svg`). |


## Running the Frontend

To start the Vite development server with hot-module replacement (HMR):

```bash
cd frontend
npm run dev
```

The application will be accessible at `http://localhost:3000` (or the next available port).

To compile a production-ready optimized build:

```bash
cd frontend
npm run build
```
