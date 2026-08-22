# Anima MKT CRM — Revenue Intelligence Platform

Multi-tenant CRM platform connecting ad investment, leads, pipeline, sales, and revenue intelligence for digital marketing agencies.

## Status

🟡 **Stage 1 — Foundation, Auth & Minimal User DB** (implementada y validada con 20 tests, pendiente de aprobación final)

## Project Structure

```
anima-mkt-crm/
├── .nvmrc                   # Node 24 runtime pin
├── src/                     # React + Vite frontend (Stage 1)
│   ├── components/          # UI accessible components, auth guards, layout
│   ├── pages/               # Login, VerifyEmail, ForgotPassword, Unauthorized, App pages
│   ├── hooks/               # useAuth hook
│   ├── lib/                 # Firebase client SDK, API client, utils, constants
│   ├── contexts/            # AuthContext provider & state
│   ├── styles/              # Tailwind CSS directives and custom scrollbar
│   └── test/                # Automated Vitest test suite (backend, frontend, security, routes)
├── netlify/
│   └── functions/           # Netlify Functions backend (Stage 1)
│       ├── _shared/         # MongoDB Atlas client (anima_mkt_crm), Firebase Admin, auth, response
│       └── api-auth-me.js   # GET /api/auth/me endpoint with atomic super_admin bootstrap
├── models/                  # MongoDB schemas and validation (User.js)
├── public/                  # Static assets & SVG favicon
├── .env.example             # Clean environment template
├── .gitignore               # Strict exclusion rules
├── netlify.toml             # Netlify build, exact redirects, security headers
├── package.json             # Node 24 engine, React 18, Vite 5, Tailwind 3, Firebase 11, Firebase Admin 14
├── vite.config.js           # Vite & Vitest configuration
└── README.md
```

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
| Files          | Cloudinary (Stage 6)                |
| AI             | Gemini / Groq (abstracted, Stage 8) |
| Scheduling     | GitHub Actions, Background Fns      |

## Documentation

All design and operational documents are in the project root:

- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) — Product specification & visual identity
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture, auth flow & routing
- [DATA_MODEL.md](./DATA_MODEL.md) — Database schema design & MongoDB indexes
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Stage-by-stage implementation plan
- [SECURITY.md](./SECURITY.md) — Security policies, identity mismatch rules & secret hygiene
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) — Setup instructions & env vars
- [META_AUTH_SETUP.md](./META_AUTH_SETUP.md) — Meta API setup & permissions
- [GOOGLE_INTEGRATIONS.md](./GOOGLE_INTEGRATIONS.md) — Google APIs setup
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) — AI abstraction layer
- [TESTING_PLAN.md](./TESTING_PLAN.md) — Test strategy & automated test matrix
- [DECISIONS.md](./DECISIONS.md) — Architecture decision records (ADR-001 through ADR-012)
- [CHANGELOG.md](./CHANGELOG.md) — Change log
- [AGENTS.md](./AGENTS.md) — Agent rules & mandatory constraints
- [STAGE_1_INPUTS.md](./STAGE_1_INPUTS.md) — Stage 1 inputs, verification & outputs

## Getting Started

```bash
# Verify Node 24
node -v # v24.x.x

# Install dependencies deterministically
npm ci

# Run automated tests (20 passing tests)
npm test

# Run linter
npm run lint

# Run production build
npm run build

# Start local dev server with Netlify Functions
npm run dev
```

## License

Private — All rights reserved.
