# Anima MKT CRM — Revenue Intelligence Platform

Multi-tenant CRM platform connecting ad investment, leads, pipeline, sales, and revenue intelligence for digital marketing agencies.

## Status

🟡 **Stage 0 — Planning & Documentation** (creada y subida a GitHub, pendiente de aprobación final)

## Project Structure

```
anima-mkt-crm/
├── docs/                    # All project documentation
├── src/                     # React + Vite frontend (Stage 1)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   ├── contexts/
│   └── styles/
├── netlify/
│   └── functions/           # Netlify Functions backend (Stage 1-2)
├── models/                  # MongoDB schemas (Stage 1-2)
├── public/
├── .env.example
├── .gitignore
├── netlify.toml
├── package.json
├── vite.config.js
└── README.md
```

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React, Vite, Tailwind CSS, JS      |
| Routing        | React Router                        |
| Data Fetching  | TanStack Query                      |
| Auth           | Firebase Authentication             |
| Database       | MongoDB Atlas                       |
| Backend        | Netlify Functions                   |
| Hosting        | Netlify (continuous deploy: anima-mkt-crm) |
| Files          | Cloudinary                          |
| AI             | Gemini / Groq (abstracted)          |
| Scheduling     | GitHub Actions, Background Fns      |

## Documentation

All design documents are in the project root:

- [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) — Product specification
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture
- [DATA_MODEL.md](./DATA_MODEL.md) — Database schema design
- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — Stage-by-stage plan
- [SECURITY.md](./SECURITY.md) — Security policies
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) — Setup instructions
- [META_AUTH_SETUP.md](./META_AUTH_SETUP.md) — Meta API setup
- [GOOGLE_INTEGRATIONS.md](./GOOGLE_INTEGRATIONS.md) — Google APIs setup
- [AI_ARCHITECTURE.md](./AI_ARCHITECTURE.md) — AI abstraction layer
- [TESTING_PLAN.md](./TESTING_PLAN.md) — Test strategy
- [DECISIONS.md](./DECISIONS.md) — Architecture decision records
- [CHANGELOG.md](./CHANGELOG.md) — Change log
- [AGENTS.md](./AGENTS.md) — Agent rules & constraints
- [STAGE_1_INPUTS.md](./STAGE_1_INPUTS.md) — Stage 1 input status & prerequisites

## Getting Started

> ⚠️ Not ready for development yet. Stage 0 (planning) in progress.

```bash
# When Stage 1 begins:
npm install
cp .env.example .env.local
# Fill in real values in .env.local
npm run dev
```

## License

Private — All rights reserved.
