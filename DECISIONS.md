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

---

## ADR-012: Node.js 24 LTS Runtime Standard

**Date:** 2026-08-22

**Decision:** Pin Node.js runtime to version 24 LTS across all environments (`package.json`, `netlify.toml`, `.nvmrc`).

**Rationale:**
- Node 20 reached End-of-Life (EOL) in March 2026.
- Node 24 is the active LTS release providing long-term security patches, native performance optimizations, and full compatibility with modern dependencies (`firebase-admin@14`, `mongodb@6`).

**Consequences:**
- `package.json` specifies `"engines": { "node": ">=24 <25" }`.
- `netlify.toml` sets `NODE_VERSION = "24"`.
- `.nvmrc` sets `24`.

---

## ADR-013: Atomic Super Admin Bootstrap, Identity Mismatch Rejection & Exact Netlify Routing

**Date:** 2026-08-22

**Decision:**
1. Configure explicit Netlify redirect `from = "/api/auth/me"` to `to = "/.netlify/functions/api-auth-me"` with `status = 200` and `force = true` before any wildcard rewrites.
2. Enforce strict, separate lookups for `firebaseUid` and `normalizedEmail`. Reject any divergent mapping with `403 IDENTITY_MISMATCH` and never overwrite existing UIDs.
3. Implement atomic `findOneAndUpdate` with `upsert: true` and explicit `E11000` recovery during the initial `super_admin` bootstrap to prevent race conditions.

**Rationale:**
- Eliminates 404 routing anomalies on Netlify serverless functions.
- Prevents account takeover and identity confusion across authentication providers.
- Guarantees zero duplicates and zero 500 error responses during simultaneous initial logins.

**Consequences:**
- Tested with 20 automated Vitest test cases covering concurrency, identity mismatch, routing, and security.

---

## ADR-014: Firebase Admin Modular API & Version 13.10.0 Pinning

**Date:** 2026-08-22

**Decision:**
1. Migrate serverless function authentication from the legacy default import (`import admin from 'firebase-admin'`) to the official modular API (`firebase-admin/app` and `firebase-admin/auth`).
2. Temporarily pin `firebase-admin` to exact version `13.10.0` in `package.json` and remove `external_node_modules = ["firebase-admin"]` from `netlify.toml`.

**Rationale:**
- In `firebase-admin@14.x`, the sub-dependency `jwks-rsa@4.x` attempts to `require('jose')`, but `jose@6.x` is strictly ESM-only, triggering an uncatchable `ERR_REQUIRE_ESM` error when Netlify Functions load the module in CommonJS/esbuild environments.
- `firebase-admin@13.10.0` uses `jwks-rsa@3.x` with `jose@4.x` (fully compatible with Node 24 and CJS/ESM bundling), preserving the modern modular imports (`cert`, `initializeApp`, `getApps`, `getApp`, `getAuth`) without runtime module resolution crashes.

**Alternatives Discarded:**
- Patching `node_modules` locally (fragile and non-reproducible in CI/CD).
- Forcing resolutions or overrides for `jose` in `package.json` (can break internal cryptographic interfaces).

**Consequences:**
- Zero `ERR_REQUIRE_ESM` runtime errors in Netlify Functions.
- Validated with automated dependency tree checks and 35/35 automated unit & security tests.

---

## ADR-015: Hybrid Auth Lifecycle, Dynamic Password Policy & Authoritative DB Suspension

**Date:** 2026-08-22

**Decision:**
1. Support hybrid authentication by allowing Google-authenticated users to link a direct password via `linkWithCredential` and `EmailAuthProvider.credential(user.email, password)` without altering the user's `firebaseUid` or MongoDB record.
2. Enforce dynamic password validation in the frontend via `validatePassword(auth, password)` aligning directly with the configured Firebase project policy (e.g., minimum 10-12 characters, uppercase, lowercase, numbers).
3. Explicitly reject automatic account merging on `auth/credential-already-in-use` during MVP to prevent unauthorized role escalation or credential hijacking across identities.
4. Establish that effective account suspension or offboarding must **always be performed authoritatively in MongoDB (`status: "suspended"`)**, as a linked password enables authentication independently of external Google Workspace account state.

**Rationale:**
- Prevents UI/backend validation divergence when Firebase enforces custom security policies.
- Protects multi-tenant isolation by avoiding silent account merges.
- Guarantees immediate revocation of all CRM API access across all authentication providers upon setting `status: "suspended"` in MongoDB.

**Consequences:**
- The password is removed immediately from React state after submission or cancellation and is never persisted or logged.
- Revocation of access is 100% authoritative in MongoDB Atlas.
- Full test coverage for Google-only, password linking, validation errors, and provider collision handling.

---

## ADR-016: Multi-Tenant Isolation, Client Lifecycle & User Preauthorization

**Date:** 2026-08-22

**Decision:**
1. Implement the `Client` entity in MongoDB with URL-safe unique `slug`, `normalizedName`, and logical deactivation (`status: 'active' | 'inactive'`).
2. Establish strict tenant scoping in `_shared/permissions.js` (`verifyAuthorizedUser`): for `client` and `salesperson` roles, `clientId` is forced exclusively from the user's MongoDB record and verified against active client status. Any query or body parameter attempting to override `clientId` is discarded.
3. Preauthorize users by creating MongoDB profiles with `firebaseUid: null` and `status: 'invited'`.
4. Link `firebaseUid` atomically upon first successful Google Sign-In in `api-auth-me.js`, transitioning `status` to `'active'` and recording `activatedAt`.
5. Enforce strict administrative hierarchy: `super_admin` can manage all roles; `admin` can only manage `client` and `salesperson`. `admin` cannot create, edit, change role of, suspend, or reactivate another `admin` or `super_admin`.
6. Enforce that no user can modify their own role (`CANNOT_MODIFY_OWN_ROLE`) nor self-suspend (`CANNOT_SUSPEND_SELF`).
7. Enforce exclusivity of Meta Ad Account IDs across clients (`META_AD_ACCOUNT_ALREADY_ASSIGNED` with HTTP 409).
8. Enforce that Meta Ads identifiers (`metaAdAccountIds`, `metaBusinessId`) store only text identifiers without tokens or secrets.

**Rationale:**
- Prevents cross-tenant data leakage by enforcing tenant isolation in backend serverless functions rather than client-side filters.
- Streamlines team onboarding without requiring SMTP or external invite microservices.
- Protects administrative boundaries and administrative accounts from unauthorized privilege elevation.

**Consequences:**
- Zero data leakage between tenants verified with automated tests.
- Comprehensive UI for client creation, editing, user preauthorization, and access link sharing.

---

## ADR-017: Idempotent Partial Index Migration for Invited Users & Fault-Tolerant Session Revocation

**Date:** 2026-08-22

**Decision:**
1. Implement idempotent index verification and migration in `_shared/db.js` (`ensureIndexes`):
   - Inspect existing indexes on `users` collection.
   - Safely drop legacy non-partial or incompatible unique indexes on `{ firebaseUid: 1 }` (tolerating `IndexNotFound` and `NamespaceNotFound`).
   - Create canonical index `{ firebaseUid: 1 }` with `name: 'uniq_firebaseUid_when_bound'`, `unique: true` and `partialFilterExpression: { firebaseUid: { $type: 'string' } }`.
2. On user suspension in `api-users.js`:
   - Set `status: 'suspended'` authoritatively in MongoDB Atlas.
   - Attempt background token revocation via Firebase Admin `revokeRefreshTokens(firebaseUid)` only if `firebaseUid` is present.
   - If Firebase Admin is unreachable or fails, do **not** return HTTP 500; MongoDB suspension succeeds and the endpoint returns HTTP 200 with `{ user: ..., warning: 'SESSION_REVOCATION_DEFERRED' }`.
   - Audit logging records only UID and error codes, never tokens or credentials.

**Rationale:**
- MongoDB unique indexes reject multiple documents with `null` values unless configured with a partial filter expression.
- Guarantees seamless onboarding of multiple invited team members before their first Google login.
- Guarantees high availability: CRM user management and suspensions continue functioning even if external auth provider endpoints experience latency or outages.

**Consequences:**
- 75/75 automated unit and security tests passing.
- Full tolerance to concurrent index creation and partial index validation.
