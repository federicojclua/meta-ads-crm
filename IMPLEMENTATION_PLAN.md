# Cotejo CRM — Implementation Plan

## Stage Overview

| Stage | Name                     | Status      | Dependencies |
|-------|--------------------------|-------------|--------------|
| 0     | Planning & Documentation | 🟢 Current  | None         |
| 1     | Foundation & Auth        | ⬜ Pending  | Stage 0      |
| 2     | Multi-tenant Core        | ⬜ Pending  | Stage 1      |
| 3     | Commercial Pipeline      | ⬜ Pending  | Stage 2      |
| 4     | Meta Ads Integration     | ⬜ Pending  | Stage 2      |
| 5     | Revenue Dashboard        | ⬜ Pending  | Stage 3 + 4  |
| 6     | Prospect Intelligence    | ⬜ Pending  | Stage 2      |
| 7     | Competitive Intelligence | ⬜ Pending  | Stage 2      |
| 8     | Content & AI             | ⬜ Pending  | Stage 5      |
| 9     | Hardening                | ⬜ Pending  | All          |

---

## Stage 0 — Planning & Documentation

**Goal:** Establish all design decisions, architecture, data model, and project structure before writing any functional code.

**Deliverables:**
- [x] README.md
- [x] PRODUCT_SPEC.md
- [x] ARCHITECTURE.md
- [x] DATA_MODEL.md
- [x] IMPLEMENTATION_PLAN.md (this file)
- [x] SECURITY.md
- [x] ENVIRONMENT_SETUP.md
- [x] META_AUTH_SETUP.md
- [x] GOOGLE_INTEGRATIONS.md
- [x] AI_ARCHITECTURE.md
- [x] TESTING_PLAN.md
- [x] DECISIONS.md
- [x] CHANGELOG.md
- [x] AGENTS.md
- [x] .env.example
- [x] .gitignore
- [ ] Git initialized with first commit

**Acceptance Criteria:**
- All documents created and reviewed
- No functional code written
- Git repository initialized
- Ready to begin Stage 1 on approval

---

## Stage 1 — Foundation & Auth

**Goal:** Working React app with Firebase Authentication, master access, protected routes, and useful empty states.

**Tasks:**
1. Initialize React + Vite project
2. Configure Tailwind CSS
3. Set up React Router with protected routes
4. Integrate Firebase Auth SDK (client-side)
5. Create login page (email + password)
6. Create `api-auth-me` Netlify Function with Firebase Admin SDK
7. Implement SUPER_ADMIN_EMAIL bootstrap logic
8. Create AuthContext with token refresh
9. Create main layout (sidebar + header)
10. Create empty state dashboard
11. Implement logout
12. Implement password recovery flow
13. Verify session persistence on page refresh
14. Configure netlify.toml for functions + SPA

**Acceptance Criteria for Stage 1:**
- [ ] Login with email/password works
- [ ] SUPER_ADMIN_EMAIL user gets `super_admin` role on first login
- [ ] Non-registered users get 401
- [ ] Session persists after page refresh
- [ ] Logout works and clears session
- [ ] Password recovery email sends and works
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Dashboard shows useful empty states
- [ ] No secrets in frontend bundle
- [ ] `npm run build` succeeds
- [ ] Deployed to Netlify (new site, not crmmet.netlify.app)

---

## Stage 2 — Multi-tenant Core

**Goal:** MongoDB connected. Clients and users manageable. Roles enforced. Multi-tenant isolation working.

**Tasks:**
1. Set up MongoDB Atlas connection in Netlify Functions
2. Create `_shared/db.js` with connection pooling
3. Create `_shared/auth.js` with token verification + user lookup
4. Create `_shared/permissions.js` with role checking helpers
5. Implement Client CRUD (super_admin only)
6. Implement User CRUD with invitation flow
7. Create Firebase user via Admin SDK when invite is accepted
8. Implement role assignment
9. Implement clientId isolation on all queries
10. Create Clients page (super_admin)
11. Create Users page (super_admin + authorized admin)
12. Implement "View As" mode for super_admin
13. Create user profile page
14. Write audit logs for all sensitive operations

**Acceptance Criteria for Stage 2:**
- [ ] Create client without campaigns
- [ ] Invite user via email
- [ ] Invited user receives email and can set password
- [ ] Invited user sees only their assigned client
- [ ] Salesperson sees only assigned leads
- [ ] Cross-client URL manipulation returns 403
- [ ] Suspend user → user can no longer access
- [ ] Resend invitation works
- [ ] "View As" shows client perspective with visible indicator
- [ ] Audit log records all operations

---

## Stage 3 — Commercial Pipeline

**Tasks:**
1. Lead model and CRUD endpoints
2. Manual lead creation form
3. CSV import with mapping
4. Kanban board view
5. Table view with filters
6. Lead assignment to salesperson
7. Pipeline stage tracking
8. Sale amount and won/lost tracking
9. Audit log for stage changes

---

## Stage 4 — Meta Ads Integration

**Tasks:**
1. Meta App setup documentation
2. System User token management
3. Ad account linking per client
4. Campaign sync function
5. Insights sync function (daily)
6. Checkpoint-based incremental sync
7. Retry logic and error handling
8. Sync status dashboard
9. Health check endpoint
10. Background function for scheduled sync

---

## Stage 5 — Revenue Dashboard

**Tasks:**
1. Investment aggregation by period
2. Lead count by source and status
3. Sales and revenue summaries
4. CPL, CPA, ROAS calculations
5. Conversion funnel visualization
6. Date range and filter controls
7. Client and campaign selectors
8. CSV/PDF export

---

## Stages 6-9

Detailed task breakdowns will be created when preceding stages are complete and approved.

---

## Risk Register

| Risk                                         | Impact | Mitigation                                    |
|----------------------------------------------|--------|-----------------------------------------------|
| Firebase Auth rate limits on free tier        | Medium | Monitor usage, upgrade if needed              |
| MongoDB Atlas free tier storage limits        | Low    | Start with M0 free, upgrade when needed       |
| Meta API access revocation                   | High   | Document appeal process, graceful degradation |
| Netlify Functions cold start latency         | Medium | Keep functions small, connection pooling      |
| Token expiration during long sessions        | Medium | Auto-refresh with onIdTokenChanged            |
| Cross-tenant data leak                       | Critical| Server-side enforcement, automated tests     |
| Firebase Admin SDK key exposure              | Critical| Never in VITE_ vars, git-ignored             |
