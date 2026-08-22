# Anima MKT CRM — Implementation Plan

## Stage Overview

| Stage | Name                     | Status                                                  | Dependencies |
|-------|--------------------------|---------------------------------------------------------|--------------|
| 0     | Planning & Documentation | 🟡 Creada y en GitHub (pendiente de aprobación final)   | None         |
| 1     | Foundation, Auth & Minimal User DB | ⬜ Pending                                    | Stage 0      |
| 2     | Multi-tenant Core & Clients | ⬜ Pending                                           | Stage 1      |
| 3     | Commercial Pipeline      | ⬜ Pending                                              | Stage 2      |
| 4     | Meta Ads Integration     | ⬜ Pending                                              | Stage 2      |
| 5     | Revenue Dashboard        | ⬜ Pending                                              | Stage 3 + 4  |
| 6     | Prospect Intelligence    | ⬜ Pending                                              | Stage 2      |
| 7     | Competitive Intelligence | ⬜ Pending                                              | Stage 2      |
| 8     | Content & AI             | ⬜ Pending                                              | Stage 5      |
| 9     | Hardening                | ⬜ Pending                                              | All          |

---

## Stage 0 — Planning & Documentation

**Goal:** Establish all design decisions, architecture, data model, security rules, and project structure before writing any functional code.

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
- [x] STAGE_1_INPUTS.md
- [x] .env.example
- [x] .gitignore
- [x] Git initialized and pushed to private GitHub repository

**Acceptance Criteria:**
- All documents created, cross-referenced, and reviewed
- No functional code written
- Git repository pushed to remote `main`
- Documentación alineada con decisiones técnicas aprobadas
- Pendiente de aprobación final expresa del usuario antes de iniciar la Etapa 1

---

## Stage 1 — Foundation, Auth & Minimal User DB

**Goal:** Working React app with Firebase Authentication, minimal MongoDB connection for the `users` collection in `anima_mkt_crm`, master access bootstrap, protected routes, and useful empty states.

**Key Architecture Notes for Stage 1:**
- **MongoDB en Etapa 1:** MongoDB Atlas se conecta desde la Etapa 1 sobre la base `anima_mkt_crm` con la colección `users` mínima. Es obligatorio porque MongoDB es la fuente autoritativa de roles y `api-auth-me` debe consultar o aprovisionar el perfil del usuario.
- **Firebase Auth:** No existe pantalla de registro público. El primer `super_admin` se da de alta manualmente en Firebase Console con correo y contraseña.
- **Flujo de Verificación de Email y Bootstrap:**
  1. El usuario se crea en Firebase Console.
  2. Inicia sesión en la aplicación frontend.
  3. Si `emailVerified` es `false`, la interfaz muestra una pantalla de bloqueo con un botón interactivo para enviar/reenviar el correo de verificación de Firebase.
  4. Una vez verificado el correo mediante el enlace recibido y volviendo a autenticarse, `api-auth-me` verifica el token en Firebase Admin SDK (`email_verified: true`).
  5. Si el correo verificado coincide exactamente con `SUPER_ADMIN_EMAIL`, crea/recupera el perfil en MongoDB con `role: "super_admin"`, `status: "active"`, `clientIds: []`.
- **Usuarios no autorizados:** Cualquier usuario autenticado en Firebase que no tenga un perfil activo en MongoDB o cuyo correo no esté verificado recibirá `403 Forbidden`.
- **Seguridad de contraseñas:** Ninguna contraseña se almacena en MongoDB ni en variables de entorno de Netlify.

**Tasks:**
1. Initialize React + Vite project
2. Configure Tailwind CSS
3. Set up React Router with protected routes
4. Integrate Firebase Auth SDK (client-side, email/password login)
5. Create login page (email + password, sin enlaces ni formularios de autoregistro)
6. Create email verification screen with resend link capability
7. Implement minimal MongoDB Atlas connection in Netlify Functions (`_shared/db.js` pointing to `anima_mkt_crm`)
8. Create `api-auth-me` Netlify Function with Firebase Admin SDK token verification
9. Implement `SUPER_ADMIN_EMAIL` bootstrap logic contra la colección `users` de MongoDB
10. Create AuthContext with automatic token refresh (`onIdTokenChanged`)
11. Create main layout (sidebar + header con indicador de rol)
12. Create empty state dashboard (sin bloquear interfaz por falta de clientes o campañas)
13. Implement logout
14. Implement password recovery flow (usando Firebase Auth)
15. Verify session persistence on page refresh
16. Configure netlify.toml for functions + SPA rewrites

**Acceptance Criteria for Stage 1:**
- [ ] Login con email/password funciona contra Firebase
- [ ] Usuario con email no verificado es bloqueado y puede solicitar reenvío del correo de verificación
- [ ] Primer login con email verificado coincidente con `SUPER_ADMIN_EMAIL` crea perfil en MongoDB con `role: "super_admin"` y `status: "active"`
- [ ] Usuario autenticado en Firebase sin perfil en MongoDB recibe `403 Forbidden`
- [ ] Sesión persiste al recargar la página (F5)
- [ ] Logout funciona y limpia el estado en cliente
- [ ] Recuperación de contraseña envía email mediante Firebase y permite restablecer
- [ ] Rutas protegidas redirigen a `/login` si no hay sesión válida
- [ ] Dashboard muestra estados vacíos útiles sin errores
- [ ] Ningún secreto expuesto en el bundle frontend
- [ ] `npm run build` compila exitosamente
- [ ] Desplegado en el nuevo proyecto de Netlify (`anima-mkt-crm`)

---

## Stage 2 — Multi-tenant Core & Clients

**Goal:** Expand MongoDB with clients, role assignments, user invitation flow, and strict multi-tenant isolation.

**Key Architecture Notes for Stage 2:**
- **Invitaciones de Usuarios:** El super_admin/admin crea el registro en MongoDB (`status: "pending_invite"`). Server-side (Firebase Admin SDK), se crea la cuenta de Firebase y se invoca `generatePasswordResetLink`.
- **Envío de Correo:** `generatePasswordResetLink` genera el enlace pero **no envía el correo automáticamente**. Antes de implementar esta etapa, se definirá el proveedor de correo transaccional (ej. Resend, SendGrid) o el flujo controlado de entrega de invitaciones.
- **Opción Futura de Seguridad:** Para blindar totalmente altas públicas en Firebase a nivel API, se documenta la opción de activar Google Cloud Identity Platform para bloquear `signUpWithPassword` públicamente.

**Tasks:**
1. Complete MongoDB schemas: `clients`, expanded `users`, `audit_logs`
2. Create `_shared/auth.js` (validación de token + extracción de perfil de MongoDB)
3. Create `_shared/permissions.js` (validación de roles y pertenencia de `clientId`)
4. Implement Client CRUD (exclusivo para `super_admin`)
5. Implement User CRUD con flujo de invitación vía Firebase Admin
6. Implement role assignment (`super_admin`, `admin`, `client`, `salesperson`)
7. Implement strict `clientId` isolation on all database queries
8. Create Clients page (super_admin)
9. Create Users page (super_admin + authorized admin)
10. Implement "View As" client mode for super_admin (auditado y con banner visual)
11. Create user profile page
12. Write audit logs for all sensitive operations (sin almacenar PII completa ni secretos)

**Acceptance Criteria for Stage 2:**
- [ ] Crear cliente sin campañas asociadas
- [ ] Invitar usuario indicando email, nombre, rol y `clientIds`
- [ ] Usuario invitado recibe link, define contraseña, verifica email y activa su perfil (`status: "active"`)
- [ ] Usuario con rol `client` ve únicamente sus `clientIds`
- [ ] Usuario con rol `salesperson` ve únicamente su cliente y sus leads asignados
- [ ] Manipulación manual de URL o parámetros con otro `clientId` retorna `403 Forbidden`
- [ ] Suspender usuario (`status: "suspended"`) bloquea el acceso en la siguiente petición
- [ ] Reenvío de invitación funciona
- [ ] Modo "Ver como cliente" permite al super_admin previsualizar sin alterar su identidad
- [ ] Audit logs registran operaciones críticas

---

## Stage 3 — Commercial Pipeline

**Tasks:**
1. Lead model and CRUD endpoints con aislamiento estricto por `clientId`
2. Deduplicación por `clientId + externalSourceId + externalLeadId` y partial index en `metaLeadId`
3. Manual lead creation form
4. CSV import with mapping and validation
5. Kanban board view por etapas del pipeline
6. Table view with filters and search
7. Lead assignment to salesperson
8. Distinción entre venta concretada (`saleAmount`, `saleCurrency`) e ingreso efectivamente cobrado (`collectedAmount`, `collectedCurrency`, `collectedAt`)
9. Audit log for pipeline and financial changes

---

## Stage 4 — Meta Ads Integration

**Tasks:**
1. Meta App setup (usando `ads_read` para MVP de lectura)
2. System User token management (exclusivo en variables server-side)
3. Ad account linking per client (`clients.meta` almacena solo IDs y estado de verificación)
4. Campaign sync function con `primaryResultActionType` configurable
5. Insights sync function (almacenando métricas aditivas: `spend`, `impressions`, `clicks`, `linkClicks`, `landingPageViews`, `actions`, `action_values` y snapshot diario de `metaReported.costPerActionType`)
6. Checkpoint-based incremental sync (`sync_checkpoints`)
7. Retry logic, error handling and rate limit backoff
8. Sync status dashboard y health check endpoint (`/api/meta/health`)
9. Background Function para sincronizaciones prolongadas (hasta 15 minutos)

---

## Stage 5 — Revenue Dashboard

**Tasks:**
1. Investment aggregation by client and period
2. Lead count by source, status and campaign
3. Sales and collected revenue summaries
4. Cálculos en tiempo de consulta de métricas derivadas no aditivas (CPL, CPA, ROAS, CTR, CPC, CPM)
5. Soporte para conversión multidivisa mediante colección `exchange_rates`
6. Conversion funnel visualization
7. Date range and multi-filter controls
8. Client and campaign selectors
9. CSV/PDF export

---

## Stages 6-9

Detailed task breakdowns will be created when preceding stages are complete and approved.

---

## Technical Constraints & Timeouts (Netlify & Serverless)

| Component | Limit / Timeout | Notes |
|-----------|-----------------|-------|
| Netlify Function (Síncrona) | 60 segundos | Para APIs estándar (`api-auth-me`, CRUD) |
| Netlify Scheduled Function | 30 segundos | Para triggers cron periódicos |
| Netlify Background Function | Hasta 15 minutos | Para sincronizaciones pesadas de Meta / IA |
| MongoDB Connection | Connection pooling | Reutilización de cliente en serverless (`anima_mkt_crm`) |

---

## Risk Register

| Risk                                         | Impact | Mitigation                                    |
|----------------------------------------------|--------|-----------------------------------------------|
| Token de System User de Meta revocado o inválido | Alto | Health check periódico y alertas de rotación |
| Latencia en cold starts de funciones serverless | Medio | Reutilización de conexión a MongoDB y bundles ligeros |
| Expiración de tokens en sesiones largas        | Medio | Auto-refresh continuo con `onIdTokenChanged` en cliente |
| Fuga de datos entre tenants                  | Crítico| Validación forzosa de `clientId` en backend + tests |
| Exposición de claves privadas / secretos     | Crítico| Variables server-side sin prefijo `VITE_`, `.gitignore` |
| Registro no autorizado en Firebase           | Medio | Aislamiento en MongoDB: sin perfil autorizado y verificado se responde 403 |
