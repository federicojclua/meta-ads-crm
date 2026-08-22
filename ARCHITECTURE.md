# Anima MKT CRM — Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  React + Vite + Tailwind CSS (Anima Design System Tokens)       │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Firebase │  │ React Router │  │ TanStack Query            │  │
│  │ Auth SDK │  │ (protected)  │  │ (data fetching + cache)   │  │
│  └─────┬────┘  └──────┬───────┘  └─────────────┬─────────────┘  │
│        │              │                         │                │
│  VITE_ env vars only (public configuration)     │                │
└────────┼──────────────┼─────────────────────────┼────────────────┘
         │              │                         │
         │    ┌─────────▼─────────────────────────▼──────────┐
         │    │          Netlify Edge / CDN                   │
         │    │                                               │
         │    │  /api/auth/me → /.netlify/functions/api-auth-me
         │    │  /api/* → rewrite to /.netlify/functions/:splat│
         │    │  /* → SPA fallback to index.html              │
         │    │  Headers: X-Content-Type-Options, DENY...     │
         │    │  ⚠ Netlify Identity NOT used (Firebase Auth)  │
         │    └───────────────────┬───────────────────────────┘
         │                       │
         │    ┌──────────────────▼──────────────────────────┐
         │    │         Netlify Functions (Node.js 24 LTS)   │
         │    │                                              │
         │    │  ┌─────────────┐  ┌───────────────────────┐  │
         │    │  │ Firebase    │  │ MongoDB Driver         │  │
         │    │  │ Admin SDK   │  │ (Connection Pooling)  │  │
         │    │  │ (verify     │  │                       │  │
         │    │  │  tokens)    │  │ users (Stage 1),      │  │
         │    │  │             │  │ clients, leads, etc.  │  │
         │    │  └──────┬──────┘  └───────────┬────────────┘  │
         │    │         │                     │               │
         │    │  Server-side env vars:        │               │
         │    │  SUPER_ADMIN_EMAIL            │               │
         │    │  FIREBASE_PRIVATE_KEY         │               │
         │    │  MONGODB_URI (anima_mkt_crm)  │               │
         │    │  META_SYSTEM_USER_TOKEN       │               │
         │    │  CRON_SECRET, AI keys...      │               │
         │    └─────────┬─────────────────────┼───────────────┘
         │              │                     │
    ┌────▼────┐   ┌─────▼─────┐        ┌─────▼──────┐
    │Firebase │   │ Firebase  │        │ MongoDB    │
    │Auth     │   │ Admin     │        │ Atlas      │
    │(Google) │   │(token     │        │            │
    │         │   │ verify)   │        │ anima_     │
    │ email   │   │           │        │ mkt_crm    │
    │ password│   │ NO public │        │ isolated   │
    │ session │   │ signup in │        │ by         │
    │ tokens  │   │ frontend  │        │ clientId   │
    └─────────┘   └───────────┘        └────────────┘
```

## 2. Authentication & Bootstrap Flow

```
┌──────────┐      ┌────────────┐      ┌──────────────────┐      ┌──────────┐
│  Browser │      │  Firebase   │      │ Netlify Function  │      │ MongoDB  │
│          │      │  Auth       │      │ (api-auth-me)     │      │ (users)  │
└────┬─────┘      └──────┬─────┘      └────────┬──────────┘      └────┬─────┘
     │                   │                      │                      │
     │ 1. Login (email/  │                      │                      │
     │    pw or Google)  │                      │                      │
     ├──────────────────►│                      │                      │
     │                   │                      │                      │
     │ 2. ID Token       │                      │                      │
     │◄──────────────────┤                      │                      │
     │                   │                      │                      │
     │ 3. Check emailVerified?                  │                      │
     │    If false → UI shows verify screen     │                      │
     │    + button to resend verification       │                      │
     │    (blocked until verified)              │                      │
     │                   │                      │                      │
     │ 4. GET /api/auth/me                      │                      │
     │   Authorization: Bearer <idToken>        │                      │
     ├─────────────────────────────────────────►│                      │
     │                   │                      │                      │
     │                   │  5. Verify ID token  │                      │
     │                   │◄─────────────────────┤                      │
     │                   │  UID, email, verified│                      │
     │                   │─────────────────────►│                      │
     │                   │                      │                      │
     │                   │                      │ 6. If email_verified │
     │                   │                      │    is false → 403    │
     │                   │                      │                      │
     │                   │                      │ 7. Parallel Lookups: │
     │                   │                      │    findOne(byUid)    │
     │                   │                      │    findOne(byEmail)  │
     │                   │                      ├─────────────────────►│
     │                   │                      │                      │
     │                   │                      │ 8. Identity Check:   │
     │                   │                      │    If mismatched UID │
     │                   │                      │    or Email → 403    │
     │                   │                      │    IDENTITY_MISMATCH │
     │                   │                      │                      │
     │                   │                      │ 9. If new user:      │
     │                   │                      │    If strictly ==    │
     │                   │                      │    SUPER_ADMIN_EMAIL │
     │                   │                      │    → upsert with     │
     │                   │                      │    role: super_admin │
     │                   │                      │    status: active    │
     │                   │                      │                      │
     │                   │                      │ 9. If user not in DB │
     │                   │                      │    or suspended      │
     │                   │                      │    → return 403      │
     │                   │                      │                      │
     │ 10. { role, clientIds, permissions }     │◄─────────────────────┤
     │    (or 403 Forbidden)                    │                      │
     │◄─────────────────────────────────────────┤                      │
```

## 3. Frontend Design System & UI Architecture

Anima MKT CRM defines central design tokens in `tailwind.config.js` and `index.css`:

```javascript
// Design System Token Mapping
colors: {
  brand: {
    bg: '#F7F6F2',          // Clean warm off-white background
    surface: '#FFFFFF',     // Pure white content surface
    primary: '#B91C1C',     // Deep functional red
    dark: '#7F1D1D',        // Dark red hover/accent
    border: '#E5E0D8',      // Crisp subtle border
    text: {
      primary: '#202020',   // Charcoal dark primary text
      secondary: '#666666', // Muted secondary text
    }
  },
  status: {
    success: '#15803D',     // Functional green (healthy sync, positive metrics)
    warning: '#F4C430',     // Functional yellow/amber (requires attention)
  }
}
```

**Architectural UI Guidelines:**
- Crisp borders, light elevation shadows, moderate border radii (`rounded-md` / `rounded-lg`).
- High-density, data-focused layout suitable for operational CRM workflows.
- Accessible WCAG AA contrast ratio throughout all screens.

## 4. Multi-Tenant Data Isolation

Every data query in Netlify Functions MUST include `clientId` filtering:

```
Request Flow:
1. Frontend sends request with Bearer token
2. Function verifies token with Firebase Admin → gets verified identity
3. Function verifies that email_verified === true; otherwise returns 403
4. Function looks up user in MongoDB → gets active role + clientIds
5. If user not found or suspended → returns 403 Forbidden
6. Function enforces clientId filter on ALL database operations
7. If a non-super_admin user requests data for an unassigned clientId → 403 Forbidden
```

## 5. Execution Limits & Serverless Architecture

| Function Type | Netlify Max Timeout | Usage Pattern |
|---------------|---------------------|---------------|
| Synchronous Functions | 60 seconds | API endpoints: `api/auth/me`, CRUD, queries |
| Scheduled Functions | 30 seconds | Cron tasks: trigger daily sync checkpoints |
| Background Functions (`*-background.js`) | Hasta 15 minutos | Sincronizaciones extensas de Meta Marketing API |

## 6. Directory Structure (Planned)

```
anima-mkt-crm/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.jsx                     # Router + providers
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── VerifyEmailBanner.jsx
│   │   │   ├── ForgotPasswordForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── clients/
│   │   │   ├── ClientList.jsx
│   │   │   ├── ClientForm.jsx
│   │   │   └── ClientCard.jsx
│   │   ├── users/
│   │   │   ├── UserList.jsx
│   │   │   ├── InviteUserForm.jsx
│   │   │   └── UserCard.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── EmptyState.jsx
│   │       └── Badge.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── VerifyEmailPage.jsx
│   │   ├── ForgotPasswordPage.jsx
│   │   ├── UnauthorizedPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ClientsPage.jsx
│   │   ├── UsersPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProfile.js
│   │   └── useClients.js
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ViewAsContext.jsx
│   ├── lib/
│   │   ├── firebase.js             # Firebase client SDK initialization
│   │   ├── api.js                  # Fetch wrapper with Bearer token
│   │   └── constants.js
│   └── styles/
│       └── index.css               # Tailwind CSS directives & tokens
├── netlify/
│   └── functions/
│       ├── api-auth-me.js          # Session / user profile bootstrap (mapped to /api/auth/me)
│       ├── api-clients.js          # Client CRUD (Stage 2)
│       ├── api-users.js            # User CRUD + invites (Stage 2)
│       ├── api-leads.js            # Lead management (Stage 3)
│       ├── api-campaigns.js        # Campaign data (Stage 4)
│       ├── api-meta-sync-background.js # Background sync (Stage 4)
│       ├── api-dashboard.js        # Aggregated metrics (Stage 5)
│       └── _shared/
│           ├── db.js               # MongoDB client + connection pool (anima_mkt_crm)
│           ├── auth.js             # Token verification with Firebase Admin
│           ├── permissions.js      # Role & tenant check helpers
│           └── errors.js           # Standard error responses
├── models/
│   ├── User.js                     # User model schema
│   ├── Client.js                   # Client model schema
│   ├── Lead.js                     # Lead model schema
│   ├── Campaign.js                 # Campaign schema
│   ├── CampaignInsight.js          # Daily insights schema
│   ├── ExchangeRate.js             # Currency exchange rate schema
│   └── AuditLog.js                 # Immutable audit trail schema
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── netlify.toml
├── .env.example
├── .gitignore
└── [documentation files]
```

## 7. Key Technical Decisions

| Decision                        | Rationale                                                |
|---------------------------------|----------------------------------------------------------|
| Firebase Auth (not Netlify ID)  | Mature SDK, reliable token lifecycle, decouples from hosting provider |
| MongoDB Atlas (`anima_mkt_crm`) | Authoritative source for RBAC, multi-tenant schemas and aggregation |
| Netlify Functions               | Zero infrastructure management, automatic scaling, background functions support |
| TanStack Query                  | Automatic client caching, background refetching and optimistic state updates |
| Tailwind CSS                    | Consistent design tokens, rapid layout development       |
| Server-side role enforcement    | Authorization is strictly verified in functions, never trusted from client |
| Distinct Visual Identity        | Operational commercial aesthetic (white/warm-neutral/red/charcoal), no generic AI glow |
| Firebase Admin 13.10.0 Pinning  | Modular API pinned to 13.10.0 to prevent upstream jwks-rsa 4 / jose 6 ESM conflicts |
| Hybrid Auth & Password Linking  | In-app password linking for Google-only users without duplicate accounts or UID change |
| Multi-Tenant Scoping & Preauth  | Server-side forced `clientId` scoping and atomic Google UID linking for invited users |
