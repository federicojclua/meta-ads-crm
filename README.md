# Anima MKT CRM — Revenue Intelligence Platform

Multi-tenant CRM platform connecting ad investment, commercial pipeline, sales, collections, and revenue intelligence for digital marketing agencies.

## Status

🟢 **MVP Released & Stable — Stages 0 to 7 Completed** (244/244 passing tests, 100% test pass rate across core auth, multi-tenant isolation, pipeline management, revenue aggregation, multimoneda, and administration).

---

## Core Capabilities

- **Strict Multi-Tenant Isolation**: Authoritative role-based access (`super_admin`, `admin`, `client`, `salesperson`) with automatic tenant scoping and cross-tenant leakage prevention.
- **Commercial Pipeline & Kanban**: 5-stage pipeline (*New, Contacted, Qualified, Won, Lost*) with drag/keyboard reassignments, value estimation, and bulk CSV ingestion.
- **Sales & Collections in Centavos**: Precise integer-based financial math preventing floating-point inaccuracies, multi-currency support (ARS / USD), and historical exchange rates engine.
- **Meta Ads Marketing API Integration**: Campaign, AdSet, and Dataset insights synchronization with attributed ROAS, CPL, and conflict isolation for mixed campaigns.
- **Revenue & Performance Analytics**: Blended ROAS, conversion funnel, time-series visualization, and server-side CSV/PDF exports protected against CSV formula injection.
- **Administrative Control Center**: Centralized tenant & user management, cryptographic single-use invitation tokens (SHA-256 with 7-day TTL), and audit logs.
- **AppSec Hardening & Rate Limiting**: MongoDB TTL-backed rate limiting on sensitive endpoints, strict Content Security Policy (CSP), and root React `ErrorBoundary`.
- **Global Internationalization (i18n)**: Seamless dynamic language switching between Spanish (`es-AR`) and English (`en-US`) across all views, menus, and metrics.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js 24 LTS                      |
| Frontend       | React 18, Vite 5, Tailwind CSS 3, JS|
| Routing        | React Router 6.30.6                 |
| Data Fetching  | TanStack Query 5                    |
| Auth           | Firebase Authentication 11          |
| Database       | MongoDB Atlas (`anima_mkt_crm`)     |
| Backend        | Netlify Functions (Firebase Admin 14)|
| Hosting        | Netlify (`anima-mkt-crm`)           |
| Testing        | Vitest 1.4, Testing Library, JSDOM  |
| i18n           | React Context + Dynamic Localization|

---

## Project Structure

```
anima-mkt-crm/
├── .nvmrc                   # Node 24 runtime pin
├── src/                     # React + Vite frontend
│   ├── components/          # Accessible UI components, modals, guards, layouts
│   │   ├── auth/            # Auth guard, role protected routes
│   │   ├── clients/         # Client modal & management components
│   │   ├── layout/          # Sidebar, Header, MainLayout
│   │   ├── leads/           # Kanban, lead modals, sale modals, CSV import
│   │   ├── meta/            # Conflict banner, asset management modal
│   │   ├── ui/              # Button, Input, Modal, Badge, Alert, EmptyState, ErrorBoundary
│   │   └── users/           # User authorization modal
│   ├── contexts/            # AuthContext, LanguageContext (i18n)
│   ├── hooks/               # useAuth, useLanguage
│   ├── lib/                 # Firebase SDK, API client, utils, constants
│   ├── pages/               # Dashboard, Revenue, Leads, Campaigns, Admin, Settings, Auth
│   ├── styles/              # Tailwind CSS directives and custom styling
│   └── test/                # 23 Vitest suites covering backend, frontend, security, isolation
├── netlify/
│   └── functions/           # Netlify Functions serverless backend
│       ├── _shared/         # MongoDB Atlas client, Firebase Admin, permissions, rateLimiter, auth
│       ├── api-auth-me.js   # GET /api/auth/me endpoint & bootstrap
│       ├── api-clients.js   # Multi-tenant CRUD for companies
│       ├── api-users.js     # User management & one-time cryptographic invites
│       ├── api-leads.js     # Commercial leads API & pipeline transitions
│       ├── api-sales.js     # Sales & collections in centavos API
│       ├── api-exchange-rates.js # Historical currency exchange rates API
│       ├── api-dashboard.js # Main performance dashboard aggregation
│       ├── api-dashboard-revenue.js # Financial ROI & ROAS aggregation engine
│       ├── api-dashboard-revenue-export.js # CSV/PDF export generator
│       ├── api-meta-assets.js   # Meta ad accounts & dataset scopes
│       ├── api-meta-insights.js # Meta Ads performance & insights
│       ├── api-meta-sync.js     # Manual & scheduled sync triggers
│       └── meta-sync-background.js # Long-running background sync worker
├── models/                  # MongoDB schemas and validation (User, Client, Lead, Sale, ExchangeRate, SyncLog, AuditLog)
├── public/                  # Static assets & SVG favicon
├── .env.example             # Clean environment template
├── .gitignore               # Strict exclusion rules
├── netlify.toml             # Netlify build, exact redirects, CSP security headers
├── package.json             # Node 24 engine, dependencies
├── vite.config.js           # Vite & Vitest configuration
└── README.md
```

---

## Documentation

All design and operational documents are in the project root:

- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) — Product specification & visual identity
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture, auth flow & routing
- [DATA_MODEL.md](./DATA_MODEL.md) — Database schema design & MongoDB indexes
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Stage-by-stage implementation plan
- [SECURITY.md](./SECURITY.md) — Security policies, identity mismatch rules & secret hygiene
- [RECOVERY.md](./RECOVERY.md) — Disaster recovery, backup & rollback runbooks
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) — Setup instructions & env vars
- [META_AUTH_SETUP.md](./META_AUTH_SETUP.md) — Meta API setup & permissions
- [GOOGLE_INTEGRATIONS.md](./GOOGLE_INTEGRATIONS.md) — Google APIs setup
- [DECISIONS.md](./DECISIONS.md) — Architecture decision records (ADR-001 through ADR-012)
- [CHANGELOG.md](./CHANGELOG.md) — Change log
- [AGENTS.md](./AGENTS.md) — Agent rules & mandatory constraints

---

## Getting Started

```bash
# Verify Node 24 LTS
node -v # v24.x.x

# Install dependencies deterministically
npm ci

# Run all 244 automated unit & integration tests
npm test

# Run production build
npm run build

# Start local dev server with Netlify Functions
npm run dev
```

---

## License

Private — All rights reserved. Anima MKT Digital.
