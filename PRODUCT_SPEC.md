# Anima MKT CRM — Product Specification

## 1. Vision

Anima MKT CRM is a **multi-tenant revenue intelligence platform** for digital marketing agencies. It connects the entire commercial cycle — from ad spend to closed revenue — providing visibility into CPL, CPA, ROAS, and campaign performance per client, campaign, and salesperson.

## 2. Visual Identity & Design Principles

Anima MKT CRM is designed as a **firm, operational, professional, and accessible commercial tool**, avoiding generic "AI product" aesthetics:

- **Color Palette & Functional Tokens:**
  - **General Background:** `#F7F6F2` (warm clean off-white).
  - **Surface & Cards:** `#FFFFFF` (pure white for content containment).
  - **Primary Brand & Active State:** `#B91C1C` (deep primary red) and `#7F1D1D` (dark red hover/accent). Used for brand identity, active navigation states, and primary critical actions.
  - **Success / Healthy:** `#15803D` (functional green). Strictly reserved for positive revenue metrics, healthy sync status, and completed conversions.
  - **Warning / Attention:** `#F4C430` (warm functional amber/yellow). Used for pending verifications, review flags, and required alerts (always paired with dark readable text).
  - **Typography & Neutral Contrast:** `#202020` (charcoal primary text) and `#666666` (muted secondary text).
  - **Borders & Dividers:** `#E5E0D8` (subtle crisp borders).
- **Design Constraints & Rules:**
  - **No generic AI / SaaS tropes:** No purple/cyan/fuchsia gradients, no iridescent glowing effects, no neon glows.
  - **No decorative color blending:** Red, green, and yellow possess strict functional meanings and are never mixed decoratively.
  - **No excessive glassmorphism or floating layers:** Clear borders, discrete shadows, moderate border radii (`rounded-md` / `rounded-lg`).
  - **High Accessibility:** Full WCAG AA color contrast compliance. Information is never conveyed by color alone (always paired with text/icons).
  - **Temporary Wordmark:** Textual "ANIMA MKT CRM" wordmark until a final emblem/logo is established.

## 3. Target Users

| Role         | Description                                                   |
|--------------|---------------------------------------------------------------|
| super_admin  | Platform owner. Full access, user/client management, configs  |
| admin        | Agency operator. Manages assigned clients, leads, reports     |
| client       | End client. Sees only their own data, metrics, campaigns      |
| salesperson  | Sales rep. Sees only their assigned leads and pipeline         |

## 4. Core Features (by Stage)

### Stage 1 — Foundation, Auth & Minimal User DB
- React + Vite + Tailwind CSS app shell
- Firebase Authentication (email/password + optional Google sign-in)
- Minimal MongoDB connection for the `users` collection (`anima_mkt_crm`)
- Master access bootstrap (`SUPER_ADMIN_EMAIL` server-side variable)
- Email verification requirement (`email_verified: true`), with frontend resend flow
- Protected routes by role and verified email status
- Responsive layout with sidebar, header, and useful empty states (no crashes on missing data)

### Stage 2 — Multi-tenant Core & Clients
- Expanded MongoDB Atlas collections (`clients`, `audit_logs`)
- Client CRUD (super_admin only)
- User CRUD with controlled invitation flow (Firebase Admin SDK)
- Role assignment and enforcement
- `clientId` isolation on all queries
- "View As" client mode for super_admin
- User profile and session management

### Stage 3 — Commercial Pipeline
- Lead management (manual entry, CSV import) with deduplication
- Pipeline: Kanban board + table view
- Sales tracking with distinction between sale agreement (`saleAmount`) and collected cash (`collectedAmount`)
- Salesperson assignment
- Audit log for pipeline changes

### Stage 4 — Meta Ads Integration
- Meta App + System User authentication (`ads_read` permission for read-only sync)
- Ad account linking per client (`clients.meta` storing IDs, connection status and verification date)
- Campaign sync with configurable `primaryResultActionType`
- Daily insights ingestion of additive metrics (`spend`, `impressions`, `clicks`, `actions`, etc.) and snapshot of `metaReported.costPerActionType`
- Checkpoint-based incremental sync (`sync_checkpoints`)
- Retry logic, error handling, health checks (`/api/meta/health`)
- Sync logs and status dashboard (using Background Functions for long tasks up to 15 mins)

### Stage 5 — Revenue Dashboard
- Investment by client/campaign/period
- Leads by source, campaign and status
- Sales and collected revenue tracking
- On-the-fly calculation of non-additive metrics and ratios (CPL, CPA, ROAS, CTR, CPC, CPM)
- Multicurrency conversion via `exchange_rates` collection
- Conversion funnel visualization
- Filters: date range, client, campaign, salesperson
- CSV/PDF export

### Stage 6 — Prospect Intelligence
- Prospect creation from Instagram/Facebook profiles
- WhatsApp presence check
- Digital diagnostic scoring with evidence
- 30-day strategy generation
- Prospect-to-client conversion flow

### Stage 7 — Competitive Intelligence
- Google Maps/Places integration (gated by feature flag)
- Nearby business discovery
- Competitor analysis (same city/niche)
- Website audit (PageSpeed, SEO basics)
- Google Search Console integration
- Review aggregation
- Meta Ad Library browsing reference
- Opportunity map

### Stage 8 — Content & AI
- Content metrics (posts, engagement)
- Publication library
- Hook analysis
- Idea and script generation
- Content calendar
- Internal AI chatbot for querying campaigns, leads, sales, content, sync status

### Stage 9 — Hardening
- End-to-end testing
- Security audit
- Monitoring and alerting
- Performance optimization
- Final documentation
- Staging preview
- Controlled migration to production domain

## 5. Non-Functional Requirements & Design Targets

| Requirement     | Product Target                                   | Notes |
|-----------------|--------------------------------------------------|-------|
| Response time   | < 2s for dashboard loads                         | Design target with indexed queries |
| Availability    | 99.5% uptime target                              | Product target across Netlify + MongoDB Atlas infrastructure |
| Security        | No secrets in frontend, RBAC enforced server-side| Mandatory |
| Multi-tenancy   | Complete `clientId` isolation on all data queries| Mandatory |
| Function limits | Max 60s sync / 30s scheduled / 15m background    | Enforced by Netlify platform |
| Data freshness  | Meta sync periodic, on-demand refresh available  | Configurable via sync checkpoints |

## 6. Out of Scope (current version)

- Public self-registration (all users created by super_admin/admin)
- Payment/billing checkout system
- Mobile native app (responsive web first)
- Real-time WebSocket subscriptions (polling & TanStack Query caching used)
- Custom ad-hoc report builder
- White-label domains per client
