# Cotejo CRM — Architecture Decision Records

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
- Better SDK documentation and community support
- More control over user creation (disable public registration)
- Firebase Admin SDK provides server-side token verification
- No dependency on Netlify-specific plan features
- Previous project had unresolvable issues with Netlify Identity invite tokens

**Alternatives Discarded:**
- Netlify Identity — Caused invite token processing bugs, limited SDK, poor documentation for v2
- Auth0 — More complex setup, higher cost for low volume
- Supabase Auth — Would require additional infrastructure

**Consequences:**
- Need Firebase project setup (free tier sufficient)
- Firebase Admin SDK required in Netlify Functions for token verification
- VITE_FIREBASE_* variables are public (safe, by design)
- Firebase private key must be stored as server-side env var

---

## ADR-002: MongoDB Atlas as Primary Database

**Date:** 2026-08-22

**Decision:** Use MongoDB Atlas as the primary and authoritative database for all application data including roles, permissions, clients, leads, and campaigns.

**Rationale:**
- Flexible schema suits evolving data model
- Powerful aggregation pipeline for dashboard metrics
- Free tier (M0) sufficient for development and early production
- Native support for multi-tenant patterns (compound indexes with clientId)
- Team familiarity from previous project

**Alternatives Discarded:**
- Firestore — Real-time not needed, pricing unpredictable at scale, limited query flexibility
- PostgreSQL (Supabase) — Requires additional hosting, schema migrations overhead
- PlanetScale — MySQL-based, less suitable for document-oriented data

**Consequences:**
- Need MongoDB Atlas cluster setup
- Connection pooling important for serverless functions
- Must ensure clientId isolation on every query
- No ORM — use native MongoDB driver

---

## ADR-003: Netlify Functions as Backend

**Date:** 2026-08-22

**Decision:** Use Netlify Functions (serverless) as the backend API layer.

**Rationale:**
- Zero infrastructure management
- Automatic scaling
- Co-located with frontend hosting
- Supports Background Functions for long-running tasks
- esbuild bundler for fast deploys
- Previous project already uses this pattern

**Alternatives Discarded:**
- Express on Render/Railway — Requires managing a server, scaling, SSL
- Firebase Functions — Would add another Google dependency, different deploy workflow
- Vercel Functions — Would require migrating hosting

**Consequences:**
- Cold start latency (~200-500ms) on first invocation
- 10-second timeout on regular functions (26s on paid plan)
- Background Functions for tasks > 10 seconds
- MongoDB connection pooling needed for performance

---

## ADR-004: GitHub Private Repository with Continuous Deploy

**Date:** 2026-08-22

**Decision:** Host code in a private GitHub repository with continuous deployment to Netlify.

**Rationale:**
- Industry standard for version control
- Netlify integrates natively with GitHub
- Private repo ensures source code is not publicly accessible
- Branch previews for staging

**Alternatives Discarded:**
- No version control — Unacceptable for any serious project
- GitLab — Less integration with Netlify
- Bitbucket — Less popular, no advantage

**Consequences:**
- Need GitHub account with private repo access
- Must configure deploy hooks in Netlify
- Must ensure no secrets in commits

---

## ADR-005: Staged Development Approach

**Date:** 2026-08-22

**Decision:** Develop in 10 sequential stages (0-9), each with defined deliverables and acceptance criteria. Do not proceed to the next stage without explicit approval.

**Rationale:**
- Prevents scope creep
- Each stage is independently testable
- Allows course correction between stages
- Previous project suffered from implementing too many features simultaneously

**Alternatives Discarded:**
- Big-bang development — High risk, hard to debug
- Feature-branch per feature — Too granular for a single developer

**Consequences:**
- Slower initial velocity but more reliable progress
- Clear documentation at each stage boundary
- Agent must stop at end of each stage

---

## ADR-006: No Write Automation Without Human Approval

**Date:** 2026-08-22

**Decision:** No automated system or agent may perform destructive or write operations (delete data, deploy to production, modify environment variables) without explicit human approval.

**Rationale:**
- Previous project had issues with agents making unintended changes
- Production data is sensitive (client information, leads)
- Irreversible actions need human oversight

**Alternatives Discarded:**
- Full automation — Too risky for a small team
- Approval only for deletes — Insufficient, deploys also need oversight

**Consequences:**
- Agents must pause and ask before destructive operations
- Deploy commands require explicit approval
- Slower but safer workflow

---

## ADR-007: No Critical Dependency on Web Scraping

**Date:** 2026-08-22

**Decision:** Do not build critical features that depend on scraping third-party websites.

**Rationale:**
- Scraping is fragile (sites change without notice)
- Legal concerns with scraping platforms like Google, Meta, Instagram
- Official APIs exist for most needed data
- Google Ads Transparency Center has no API; link to it instead of scraping

**Alternatives Discarded:**
- Scraping + fallback — Still fragile, maintenance burden
- Third-party scraping services — Cost, reliability, legal

**Consequences:**
- Some competitive intelligence features may be limited to manual input or official APIs
- Google Ads Transparency data requires manual review by user

---

## ADR-008: AI Provider Abstraction

**Date:** 2026-08-22

**Decision:** Abstract AI capabilities behind a provider-agnostic interface, supporting Gemini and Groq as initial providers.

**Rationale:**
- AI landscape changes rapidly; avoid vendor lock-in
- Different providers have different strengths (speed vs. capability)
- Easy to add new providers without refactoring
- Feature flag allows disabling AI entirely

**Alternatives Discarded:**
- Single provider (Gemini only) — Vendor lock-in risk
- OpenAI — Higher cost, less free tier availability

**Consequences:**
- Small abstraction overhead
- Must maintain adapters for each provider
- AI features are optional and feature-flagged

---

## ADR-009: Roles and Permissions Authoritative in MongoDB

**Date:** 2026-08-22

**Decision:** MongoDB is the single source of truth for user roles, permissions, client assignments, and status. Firebase stores only authentication credentials.

**Rationale:**
- Decouples identity (Firebase) from authorization (MongoDB)
- Allows changing roles without modifying Firebase
- All authorization logic stays in our codebase
- Firebase custom claims have size limits (1000 bytes)

**Alternatives Discarded:**
- Firebase Custom Claims — Size limited, requires Admin SDK to update, cached in tokens
- Dual source (roles in both) — Synchronization complexity

**Consequences:**
- Every API request requires a MongoDB lookup after token verification
- Can cache profile in memory for the duration of a function invocation
- Frontend never stores role from token — always from api-auth-me

---

## ADR-010: All Multi-tenant Data Isolated by clientId

**Date:** 2026-08-22

**Decision:** Every collection containing tenant-specific data must include a `clientId` field, and every query must filter by the user's authorized `clientId`(s).

**Rationale:**
- Fundamental security requirement for multi-tenant SaaS
- Prevents cross-client data leakage
- Simple, auditable pattern
- Compound indexes provide good performance

**Alternatives Discarded:**
- Separate databases per client — Operational complexity at scale
- Row-level security (PostgreSQL) — Not available in MongoDB
- Application-level filtering only — Error-prone without enforced pattern

**Consequences:**
- Every new collection must include clientId
- Every new query must include clientId filter
- Code reviews must check for clientId filtering
- Automated tests must verify isolation
