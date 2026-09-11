# Frontend Application (`frontend/`)

This directory houses the client-side user interface and interactive web experience for the **3abaqira Enterprise Management Platform** (أكاديمية وروضة الأطفال العباقرة).

## Architectural Phase: Visual & Interactive Prototype

In accordance with the project specification in [docs/frontend_plan.md](file:///C:/Users/moham/Desktop/3abaqira/docs/frontend_plan.md), the initial implementation focuses exclusively on delivering a **high-fidelity visual model and interactive design prototype**.

### Key Architectural Characteristics:
1. **Visual Model Scope (Non-Practical):** Focuses on UI aesthetics, spatial layouts, and motion design. It does not contain computational business logic.
2. **Decoupled from Backend (Phase 1):** Zero API endpoints or live database connections are integrated during this visual prototype phase. All metrics, rosters, and tables are populated by modular visual mock datasets.
3. **Primary Blue Palette:** Deep luxury blues (`#0A192F`, `#0F274A`), primary sapphire (`#2563EB`), and electric cyan accents (`#06B6D4`).
4. **Interactive 3D WebGL Canvas:** Smooth mouse-tracking 3D celestial particle/mesh background engine with fluid lerp damping.
5. **Swappable Typography & Branding:** Global CSS design tokens allowing 1-click replacement of Arabic and Latin fonts and the central `<BrandLogo />` component.

## Directory Structure Plan

```
frontend/
├── public/
│   ├── assets/
│   │   └── branding/              # Swappable logo SVGs, emblems & wordmarks
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── 3d/                    # Interactive 3D WebGL Background
│   │   │   ├── InteractiveBackground.jsx
│   │   │   └── ParticleField.jsx
│   │   ├── branding/              # Swappable Brand & Logo components
│   │   │   └── BrandLogo.jsx
│   │   ├── common/                # Glassmorphic UI building blocks
│   │   │   ├── GlassCard.jsx
│   │   │   ├── GlassButton.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── layout/                # App shell, frosted navbar, collapsible sidebar
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   └── dashboard/             # Visual showcase modules
│   │       ├── HeroBanner.jsx
│   │       └── MetricGrid.jsx
│   ├── mock/                      # Static dummy data for visual demonstration
│   ├── styles/                    # Global tokens, primary blue variables & typography
│   │   ├── globals.css
│   │   └── fonts.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md                      # This documentation file
```

For complete technical specifications, design tokens, and implementation phases, refer to [docs/frontend_plan.md](file:///C:/Users/moham/Desktop/3abaqira/docs/frontend_plan.md).
