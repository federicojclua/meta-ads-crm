# Cotejo CRM — Product Specification

## 1. Vision

Cotejo CRM is a **multi-tenant revenue intelligence platform** for digital marketing agencies. It connects the entire commercial cycle — from ad spend to closed revenue — providing visibility into CPL, CPA, ROAS, and campaign performance per client, campaign, and salesperson.

## 2. Target Users

| Role         | Description                                                   |
|--------------|---------------------------------------------------------------|
| super_admin  | Platform owner. Full access, user/client management, configs  |
| admin        | Agency operator. Manages assigned clients, leads, reports     |
| client       | End client. Sees only their own data, metrics, campaigns      |
| salesperson  | Sales rep. Sees only their assigned leads and pipeline         |

## 3. Core Features (by Stage)

### Stage 1 — Foundation
- React + Vite + Tailwind CSS app shell
- Firebase Authentication (email/password, invite-only)
- Master access (SUPER_ADMIN_EMAIL bootstrap)
- Protected routes by role
- Useful empty states

### Stage 2 — Multi-tenant Core
- MongoDB Atlas connection
- Client CRUD (super_admin only)
- User CRUD with invitation flow
- Role assignment and enforcement
- clientId isolation on all queries
- User profile and session management

### Stage 3 — Commercial Pipeline
- Lead management (manual entry, CSV import)
- Pipeline: Kanban board + table view
- Sales tracking with revenue amounts
- Salesperson assignment
- Audit log for pipeline changes

### Stage 4 — Meta Ads Integration
- Meta App + System User authentication
- Ad account linking per client
- Campaign sync with checkpoints
- Insights ingestion (spend, impressions, clicks, leads)
- Retry logic, error handling, health checks
- Sync logs and status dashboard

### Stage 5 — Revenue Dashboard
- Investment by client/campaign/period
- Leads by source and status
- Sales and revenue tracking
- CPL, CPA, ROAS calculations
- Conversion funnel visualization
- Filters: date, client, campaign, salesperson
- CSV/PDF export

### Stage 6 — Prospect Intelligence
- Prospect creation from Instagram/Facebook profiles
- WhatsApp presence check
- Digital diagnostic scoring with evidence
- 30-day strategy generation
- Prospect-to-client conversion flow

### Stage 7 — Competitive Intelligence
- Google Maps/Places integration
- Nearby business discovery
- Competitor analysis (same city/niche)
- Website audit (PageSpeed, SEO basics)
- Google Search Console integration
- Review aggregation
- Meta Ad Library browsing
- Google Ads Transparency Center
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

## 4. Non-Functional Requirements

| Requirement     | Target                                           |
|-----------------|--------------------------------------------------|
| Response time   | < 2s for dashboard loads                         |
| Availability    | 99.5% uptime (Netlify + MongoDB Atlas)           |
| Security        | No secrets in frontend, RBAC enforced server-side|
| Multi-tenancy   | Complete clientId isolation on all data queries   |
| Scalability     | Support 50+ clients, 500+ leads/client           |
| Data freshness  | Meta sync every 6h, on-demand refresh available  |

## 5. Out of Scope (current version)

- Public self-registration
- Payment/billing system
- Mobile native app
- Real-time collaboration (WebSocket)
- Custom report builder
- White-label per client
