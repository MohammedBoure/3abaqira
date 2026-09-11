# Frontend Application (`frontend/`)

This directory contains the client-side user interface and interactive web experience for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة).

## Architecture: Visual Prototype & Design Model

In accordance with [docs/frontend_plan.md](file:///C:/Users/moham/Desktop/3abaqira/docs/frontend_plan.md), this implementation provides a **high-fidelity visual model and interactive prototype**:
- **Non-Practical Scope**: Focuses on modern UI/UX aesthetics, spatial composition, and motion physics without computational business logic.
- **Decoupled from Backend**: Operates independently with zero API bindings or live database queries during this visual evaluation phase.
- **Primary Color Identity**: Sophisticated deep blue palette (`#030712`, `#0A192F`, `#0F274A`, `#2563EB`, `#3B82F6`, `#06B6D4`).
- **Interactive 3D Background**: Real-time Three.js WebGL background with smooth exponential mouse damping (lerping), floating geometric polyhedron, and luminous starfield particles.
- **Swappable Typography & Logo**: Abstract CSS tokens (`--font-family-latin`, `--font-family-arabic`) and an isolated `<BrandLogo />` component for seamless 1-click updates.

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
