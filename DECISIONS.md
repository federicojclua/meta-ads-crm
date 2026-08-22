# Anima MKT CRM — Architecture Decision Records

## Format

Each decision records:
- **Date** — When the decision was made
- **Decision** — What was decided
- **Rationale** — Why this option was chosen
- **Alternatives Discarded** — What else was considered
- **Consequences** — Impact, trade-offs, and follow-up actions

---

## ADR-001: Firebase Authentication over Netlify Identity

**Date:** 2026-08-22

**Decision:** Use Firebase Authentication as the identity provider instead of Netlify Identity.

**Rationale:**
- Stable client SDK with robust token refresh lifecycle (`onIdTokenChanged`)
- Server-side token verification via Firebase Admin SDK
- Clean separation between identity credentials (Firebase) and authorization/roles (MongoDB)
- Eliminates fragile invite token fragment processing issues observed with Netlify Identity

**Alternatives Discarded:**
- Netlify Identity — (Historical alternative discarded) Invite token issues in SPAs, tightly coupled to Netlify plan limitations
- Auth0 — High configuration overhead, pricing unpredictable
- Supabase Auth — Unnecessary PostgreSQL infrastructure overhead

**Consequences:**
- First super_admin created directly in Firebase Console with email verification requirement
- `SUPER_ADMIN_EMAIL` configured as server-side environment variable
- `VITE_FIREBASE_*` variables are public browser configuration
- Private service account key stored securely server-side in Netlify Functions

---

## ADR-002: MongoDB Atlas as Primary Database

**Date:** 2026-08-22

**Decision:** Use MongoDB Atlas (database `anima_mkt_crm`) as the primary authoritative database for user roles, client entities, leads, campaigns, metrics, exchange rates, and audit logs. Connection begins in Stage 1 for the `users` collection.

**Rationale:**
- Flexible document model suits marketing campaign schemas and dynamic lead forms
- Powerful aggregation pipeline for calculated metrics (CPL, CPA, ROAS, conversion rates)
- Easy compound indexing on `clientId` for multi-tenant isolation
- Direct driver integration with connection pooling in serverless functions

**Alternatives Discarded:**
- Firestore — High write costs at scale, limited aggregation pipelines
- PostgreSQL / Supabase — Schema migration overhead for rapidly evolving marketing metadata

**Consequences:**
- Minimal connection pool helper (`_shared/db.js`) required starting from Stage 1
- Network access configured with 0.0.0.0/0 on Atlas, compensated by dedicated user, strong passwords, minimal privileges (`anima_mkt_crm` only), and TLS

---

## ADR-003: Netlify Functions as Backend

**Date:** 2026-08-22

**Decision:** Use Netlify Functions (Node.js 20) with synchronous functions, scheduled functions, and background functions as the serverless API layer.

**Rationale:**
- Co-located with frontend hosting, avoiding separate server management
- Built-in support for Background Functions (up to 15 minutes) for heavy Meta API sync jobs
- Synchronous functions (up to 60 seconds) provide ample execution time for standard CRUD and auth verification

**Alternatives Discarded:**
- Express on dedicated VM / container — Maintenance and server scaling burden
- Vercel Functions — Background tasks limited without external queues

**Consequences:**
- Function timeouts must be respected (60s sync, 30s scheduled, 15m background)
- Heavy operations must be designed as idempotent background functions with checkpoint tracking

---

## ADR-004: GitHub Private Repository with Continuous Deploy

**Date:** 2026-08-22

**Decision:** Host code in a private GitHub repository with continuous deployment to the new Netlify project (`anima-mkt-crm`).

**Rationale:**
- Industry standard version control
- Native Git-based CI/CD deployment pipelines on Netlify
- Staging previews for branch verification
- The legacy site `crmmet.netlify.app` is preserved untouched

**Alternatives Discarded:**
- Manual FTP / ZIP deploys — High error rate, no deployment auditability

**Consequences:**
- Secret scanning active on GitHub (placeholders in `.env.example` must be generic)
- Never commit credentials or `.env` files

---

## ADR-005: Staged Development Approach

**Date:** 2026-08-22

**Decision:** Develop in 10 sequential stages (0-9). Do not start the next stage without explicit human approval.

**Rationale:**
- Prevents scope creep and uncontrolled regressions
- Ensures authentication and tenant isolation are fully tested before adding business logic
- Independent verification and acceptance criteria per stage

**Alternatives Discarded:**
- Monolithic all-in-one development — High bug density, hard to isolate issues

**Consequences:**
- Stage 0 is completed and documented; waiting for explicit approval before writing code in Stage 1
- Clear acceptance criteria required at each stage boundary

---

## ADR-006: No Write Automation Without Human Approval

**Date:** 2026-08-22

**Decision:** No automated script or agent may execute destructive actions, deploy to production, or modify production databases without explicit user consent.

**Rationale:**
- Protects multi-tenant client data and secrets
- Maintains strict human oversight on infrastructure modifications

**Consequences:**
- All Git push and production deploy actions require explicit user approval

---

## ADR-007: No Critical Dependency on Web Scraping

**Date:** 2026-08-22

**Decision:** Do not build critical features dependent on scraping third-party websites. Use official APIs (Meta Marketing API, Google Places, PageSpeed Insights) and manual link references where APIs do not exist.

**Rationale:**
- Scraping is fragile, prone to IP blocking and legal/terms of service violations
- Official APIs provide reliable, structured data

**Consequences:**
- Features like Google Ads Transparency Center will link directly rather than attempt scraping

---

## ADR-008: AI Provider Abstraction

**Date:** 2026-08-22

**Decision:** Abstract AI capabilities behind a provider-agnostic interface (`AI_PROVIDER`), supporting Gemini and Groq server-side only.

**Rationale:**
- Prevents lock-in to a single LLM vendor
- Allows choosing models based on latency, cost, and context size
- Gated behind `ENABLE_AI=false` feature flag

**Consequences:**
- Unified wrapper interface implemented in serverless functions
- Zero AI API keys in frontend client bundle

---

## ADR-009: Roles and Permissions Authoritative in MongoDB

**Date:** 2026-08-22

**Decision:** MongoDB (`anima_mkt_crm`) is the sole authoritative source of truth for user roles, tenant assignments, permissions, and active status. Firebase is used exclusively for credential verification.

**Rationale:**
- Decouples identity verification from business authorization logic
- Role modifications and tenant reassignments do not require token re-issuance
- Prevents token claim size bloat

**Consequences:**
- `api-auth-me` queries MongoDB after verifying Firebase token and email verification status
- Users in Firebase without an active MongoDB profile receive 403 Forbidden

---

## ADR-010: All Multi-tenant Data Isolated by clientId

**Date:** 2026-08-22

**Decision:** Every collection containing tenant data must include a `clientId` field, and all backend queries must enforce this filter based on verified server-side user context.

**Rationale:**
- Fundamental multi-tenant security standard
- Prevents cross-client data leakage through URL manipulation or request parameter forgery

**Consequences:**
- Compound indexes with `clientId` as primary key on all tenant collections
- Strict verification in Netlify Functions before database query execution

---

## ADR-011: Operational Commercial Visual Identity (No Generic AI Aesthetics)

**Date:** 2026-08-22

**Decision:** Adopt a firm, high-density, professional visual design system based on a warm off-white canvas (`#F7F6F2`), pure white surfaces (`#FFFFFF`), primary brand red (`#B91C1C` / `#7F1D1D`), charcoal typography (`#202020`), discrete borders (`#E5E0D8`), and strict functional green (`#15803D`) and yellow/amber (`#F4C430`).

**Rationale:**
- Positions Anima MKT CRM as an authoritative commercial and financial tool rather than a toy AI wrapper.
- Eliminates visual fatigue from generic purple/cyan glowing gradients, exaggerated floating cards, and glassmorphism.
- Guarantees strict WCAG AA contrast compliance and semantic functional color usage.

**Alternatives Discarded:**
- Generic AI SaaS templates (dark theme with cyan/fuchsia neon gradients).
- Heavy glassmorphism and pastel aesthetic.

**Consequences:**
- Color tokens centralized in Tailwind config (`tailwind.config.js`).
- Colors never mixed decoratively; always paired with textual/iconographic status indicators.
