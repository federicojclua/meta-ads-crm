# Cotejo CRM — Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                         │
│                                                                 │
│  React + Vite + Tailwind CSS                                    │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────┐  │
│  │ Firebase  │  │ React Router │  │ TanStack Query            │  │
│  │ Auth SDK  │  │ (protected)  │  │ (data fetching + cache)   │  │
│  └─────┬────┘  └──────┬───────┘  └─────────────┬─────────────┘  │
│        │              │                         │                │
│  VITE_ env vars only (public, non-secret)       │                │
└────────┼──────────────┼─────────────────────────┼────────────────┘
         │              │                         │
         │    ┌─────────▼─────────────────────────▼──────────┐
         │    │          Netlify Edge / CDN                   │
         │    │                                               │
         │    │  /.netlify/functions/* → Netlify Functions    │
         │    │  /api/* → rewrite to functions                │
         │    │  /* → SPA fallback to index.html              │
         │    │                                               │
         │    │  ⚠ /.netlify/identity NOT used (Firebase)     │
         │    └───────────────────┬───────────────────────────┘
         │                       │
         │    ┌──────────────────▼──────────────────────────┐
         │    │         Netlify Functions (Node.js 20)       │
         │    │                                              │
         │    │  ┌─────────────┐  ┌───────────────────────┐  │
         │    │  │ Firebase    │  │ MongoDB Driver         │  │
         │    │  │ Admin SDK   │  │                        │  │
         │    │  │ (verify     │  │ Roles, clients, leads, │  │
         │    │  │  tokens)    │  │ users, campaigns...    │  │
         │    │  └──────┬──────┘  └───────────┬────────────┘  │
         │    │         │                     │               │
         │    │  Server-side env vars:        │               │
         │    │  SUPER_ADMIN_EMAIL            │               │
         │    │  FIREBASE_PRIVATE_KEY         │               │
         │    │  MONGODB_URI                  │               │
         │    │  META_APP_SECRET              │               │
         │    │  AI keys, CRON_SECRET...      │               │
         │    └─────────┬─────────────────────┼───────────────┘
         │              │                     │
    ┌────▼────┐   ┌─────▼─────┐        ┌─────▼──────┐
    │Firebase │   │ Firebase  │        │ MongoDB    │
    │Auth     │   │ Admin     │        │ Atlas      │
    │(Google  │   │(token     │        │            │
    │ Cloud)  │   │ verify)   │        │ Shared DB  │
    │         │   │           │        │ isolated   │
    │ email   │   │ NO user   │        │ by         │
    │ password│   │ creation  │        │ clientId   │
    │ session │   │ from      │        │            │
    │ tokens  │   │ frontend  │        │            │
    └─────────┘   └───────────┘        └────────────┘
```

## 2. Authentication Flow

```
┌──────────┐      ┌────────────┐      ┌──────────────────┐      ┌──────────┐
│  Browser │      │  Firebase   │      │ Netlify Function  │      │ MongoDB  │
│          │      │  Auth       │      │ (api-auth-me)     │      │          │
└────┬─────┘      └──────┬─────┘      └────────┬──────────┘      └────┬─────┘
     │                   │                      │                      │
     │ 1. Login (email,  │                      │                      │
     │    password)       │                      │                      │
     ├──────────────────►│                      │                      │
     │                   │                      │                      │
     │ 2. ID Token       │                      │                      │
     │◄──────────────────┤                      │                      │
     │                   │                      │                      │
     │ 3. GET /api/auth-me                      │                      │
     │   Authorization: Bearer <idToken>        │                      │
     ├─────────────────────────────────────────►│                      │
     │                   │                      │                      │
     │                   │  4. Verify ID token  │                      │
     │                   │◄─────────────────────┤                      │
     │                   │  UID + email         │                      │
     │                   │─────────────────────►│                      │
     │                   │                      │                      │
     │                   │                      │ 5. Find user by      │
     │                   │                      │    firebaseUid       │
     │                   │                      ├─────────────────────►│
     │                   │                      │                      │
     │                   │                      │ 6. If email matches  │
     │                   │                      │    SUPER_ADMIN_EMAIL │
     │                   │                      │    → upsert as       │
     │                   │                      │    super_admin       │
     │                   │                      │                      │
     │                   │                      │ 7. Return profile    │
     │ 8. { role, clientIds, permissions }      │◄─────────────────────┤
     │◄─────────────────────────────────────────┤                      │
     │                   │                      │                      │
```

## 3. Multi-Tenant Data Isolation

Every data query in Netlify Functions MUST include `clientId` filtering:

```
Request Flow:
1. Frontend sends request with Bearer token
2. Function verifies token → gets firebaseUid
3. Function looks up user in MongoDB → gets role + clientIds
4. Function adds clientId filter to ALL database queries
5. If user has no access to requested clientId → 403
```

**Rules:**
- `clientId` is NEVER trusted from frontend request parameters
- `clientId` is ALWAYS derived from the authenticated user's MongoDB profile
- `super_admin` can explicitly select a clientId for "view as" mode
- All other roles are restricted to their assigned `clientIds[]`

## 4. Directory Structure (planned)

```
cotejo-crm/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                    # App entry point
│   ├── App.jsx                     # Router + providers
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SetPasswordForm.jsx
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
│   │   ├── firebase.js             # Firebase client init
│   │   ├── api.js                  # Fetch wrapper with auth
│   │   └── constants.js
│   └── styles/
│       └── index.css               # Tailwind directives
├── netlify/
│   └── functions/
│       ├── api-auth-me.js          # Session / profile
│       ├── api-clients.js          # Client CRUD
│       ├── api-users.js            # User CRUD + invite
│       ├── api-leads.js            # Lead management
│       ├── api-campaigns.js        # Campaign data
│       ├── api-dashboard.js        # Aggregated metrics
│       └── _shared/
│           ├── db.js               # MongoDB connection
│           ├── auth.js             # Token verification
│           ├── permissions.js      # Role checking
│           └── errors.js           # Standard error responses
├── models/
│   ├── User.js
│   ├── Client.js
│   ├── Lead.js
│   ├── Campaign.js
│   └── AuditLog.js
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

## 5. Key Technical Decisions

| Decision                        | Rationale                                                |
|---------------------------------|----------------------------------------------------------|
| Firebase Auth (not Netlify ID)  | Better SDK, more control, no dependency on Netlify plan  |
| MongoDB (not Firestore)         | Relational-like queries, aggregation pipeline, flexibility|
| Netlify Functions (not Express) | Zero infra management, scales with Netlify hosting       |
| TanStack Query                  | Automatic caching, refetching, optimistic updates        |
| Tailwind CSS                    | Rapid UI development, consistent design tokens           |
| Server-side role enforcement    | Never trust frontend for authorization decisions         |

## 6. API Design

All API endpoints follow the pattern: `GET/POST/PUT/DELETE /api/{resource}`

| Endpoint              | Method | Auth  | Description                    |
|-----------------------|--------|-------|--------------------------------|
| /api/auth-me          | GET    | Token | Get current user profile       |
| /api/clients          | GET    | SA/A  | List clients                   |
| /api/clients          | POST   | SA    | Create client                  |
| /api/clients/:id      | PUT    | SA    | Update client                  |
| /api/users            | GET    | SA/A  | List users                     |
| /api/users            | POST   | SA/A  | Create user + send invite      |
| /api/users/:id        | PUT    | SA/A  | Update user role/status        |
| /api/users/:id/resend | POST   | SA/A  | Resend invitation email        |
| /api/leads            | GET    | All   | List leads (filtered)          |
| /api/leads            | POST   | A/S   | Create lead                    |
| /api/dashboard        | GET    | All   | Aggregated metrics (filtered)  |

*SA = super_admin, A = admin, S = salesperson*

## 7. External Services

| Service              | Purpose                      | Stage |
|----------------------|------------------------------|-------|
| Firebase Auth        | Authentication & tokens      | 1     |
| MongoDB Atlas        | Primary database             | 2     |
| Meta Marketing API   | Campaign data & insights     | 4     |
| Meta Lead Ads        | Webhook lead ingestion       | 4     |
| Cloudinary           | File/image storage           | 3+    |
| Google Places API    | Business discovery           | 7     |
| PageSpeed Insights   | Website performance audit    | 7     |
| Search Console       | SEO data                     | 7     |
| Gemini / Groq        | AI capabilities              | 8     |
