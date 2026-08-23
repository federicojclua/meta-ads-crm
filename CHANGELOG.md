# Anima MKT CRM — Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Fixed — Hotfix: Unify HTTP POST Contract for Lead Transitions & Actions (2026-08-23)
- **Unificación de Método HTTP a POST en Acciones y Transiciones de Leads:**
  - Se corrigió el error HTTP `405 Method Not Allowed` (`"Utilice POST."`) en `/api/leads/:id/stage`: se unificó la invocación a `apiClient.post(`/api/leads/${leadId}/stage`, { stage, ...(stage === 'lost' ? { lostReason } : {}) })`.
  - Se corrigieron los métodos en `LeadsPage.jsx` para `/api/leads/:id/assign`, `/api/leads/:id/archive`, `/api/leads/:id/reactivate` utilizando `apiClient.post`.
  - Se agregaron helpers HTTP directos en `apiClient` (`apiClient.get`, `apiClient.post`, `apiClient.patch`, `apiClient.put`, `apiClient.delete`).
  - Se aseguró la resolución consistente de vendedores utilizando `sp.id || sp._id` en `LeadDetailModal.jsx` y `LeadsPage.jsx`.
  - Se agregaron pruebas de integración cubriendo transiciones de etapas desde el modal de detalle y desde las flechas rápidas del Kanban.

### Fixed — Hotfix: Controlled Company Selector & State Synchronization in Leads Creation (2026-08-23)
- **Selector Controlado de Empresa para Leads (`LeadModal.jsx`, `CsvImportModal.jsx`):**
  - Se corrigió la desincronización de estado en la creación de prospectos para `super_admin`/`admin`: el formulario ahora utiliza un selector completamente controlado con opción inicial explícita `<option value="">Seleccionar empresa</option>`.
  - Para `client` y `salesperson`, el selector de empresa permanece oculto y el backend asigna automáticamente el `clientId` autorizado de su sesión.
  - Se envía siempre el `_id` interno de MongoDB y se valida en frontend y backend con el mensaje en español: `"Debe seleccionar la empresa a la que pertenece el prospecto."`.
  - Se agregaron pruebas unitarias y de integración en frontend y backend validando la obligatoriedad y el envío correcto del `clientId`.

### Fixed — Hotfix: React #130 Prevention, Centralized API Auth & ErrorBoundary (2026-08-23)
- **Corrección de Pantalla Blanca (React #130):**
  - Identificada la causa raíz: `LeadsPage` utilizaba `variant="danger"` en `<Alert>` tras fallos en la consulta; `Alert.jsx` no mapeaba `danger` y producía `undefined` como componente de ícono.
  - Se agregó mapeo explícito de variante `danger` (hacia `AlertCircle`) y fallback seguro universal `IconComponent = CustomIcon || icons[variant] || AlertCircle` en `Alert.jsx`.
  - Se aseguró fallback universal `IconComponent = Icon || FolderOpen` en `EmptyState.jsx`.
  - Se agregaron fallbacks seguros y verificación de que todos los componentes e íconos configurados para etapas existan.
- **Autenticación Centralizada en Consultas API (`src/lib/api.js`):**
  - Se corrigió la causa de los errores 401 en `/api/dashboard/stats`, `/api/leads`, `/api/clients`, `/api/users` y `/api/sales`: se eliminó el uso de `fetch` directo con `localStorage.getItem('token')`.
  - Se migraron todas las llamadas de `DashboardPage`, `LeadsPage`, `LeadDetailModal` y `CsvImportModal` a `apiClient`.
  - `apiClient` obtiene el token fresco de Firebase con `await auth.currentUser.getIdToken()`.
  - Ante un primer 401, renueva el token automáticamente con `await auth.currentUser.getIdToken(true)` y reintenta una sola vez.
  - Ante un 401 persistente, cierra la sesión de forma segura con `signOut(auth)`.
  - Las páginas no inician consultas hasta que la autenticación esté completamente resuelta (`loading: false && Boolean(firebaseUser)`).
- **Manejo de Errores Sin Métricas Cero Falsas:**
  - `DashboardPage` y `LeadsPage` muestran estados claros para 403, 500 y errores de red con botón de reintento, evitando mostrar métricas `0` ante errores HTTP.
- **Error Boundary:**
  - Se creó `src/components/ui/ErrorBoundary.jsx` conteniendo fallos de renderizado en módulos hijos, mostrando mensaje claro, `incidentId` seguro, botón de Reintento y botón de regreso al Dashboard, preservando el `MainLayout`.
- **Suite de Pruebas Automatizadas:**
  - Se agregaron 12 tests en `src/test/hotfix-react130-auth.test.jsx` cubriendo los 11 escenarios de verificación obligatorios (120 tests totales pasando al 100%).

### Added — Stage 3: Leads, Pipeline Comercial, Ventas e Ingresos Cobrados (2026-08-23)
- **Modelos de Datos & Estructuras en Centavos (`minor units`):**
  - Modelo `Lead`: Ciclo de vida estricto (`new`, `contacted`, `qualified`, `won`, `lost`), `source` limitado a `['manual', 'csv']` (sin Meta en esta etapa), `assignedToUserId`, `valueEstimateMinor`, timestamps de etapas (`acquiredAt`, `firstContactedAt`, `qualifiedAt`, `wonAt`, `lostAt`, `lostReason`), `status: 'active' | 'archived'`, normalizadores de email y teléfono, y clave de ingesta `ingestionKey`.
  - Motivo de pérdida obligatorio: `lostReason` requerido al marcar un prospecto como `lost` (máx 500 caracteres), y limpieza de `lostReason`/`lostAt` al salir de `lost`.
  - Timestamp inmutable de primer contacto: `firstContactedAt` inmutable una vez establecido el primer contacto.
  - Modelo `LeadActivity`: Colección `lead_activities` para registro de historial y notas comerciales (máx 2000 caracteres) vinculadas a prospectos y vendedores, con actor forzado en backend desde token autenticado.
  - Modelo `Sale`: Registro de ventas en centavos enteros (`amountMinor`), seguimiento de pagos parciales/totales (`collectedAmountMinor`, `collectedAmountDefaultMinor`), array `payments` inmutable con tipos de cambio históricos por cobro individual (`exchangeRateToDefault`), derivación automática de estado (`pending`, `partial`, `collected`, `cancelled`) y soporte multidivisa (`ARS`, `USD`).
- **Indexación y Migración Idempotente en MongoDB:**
  - Migración segura del índice de ingesta: detección y eliminación del índice simple `{ ingestionKey: 1 }`, y creación del índice compuesto canónico `{ clientId: 1, ingestionKey: 1 }` (`uniq_lead_client_ingestionKey`, único parcial con `{ ingestionKey: { $type: 'string' } }`).
  - Índices compuestos para `leads`: `{ clientId: 1, stage: 1 }`, `{ clientId: 1, assignedToUserId: 1 }`, `{ clientId: 1, normalizedEmail: 1 }`, `{ clientId: 1, normalizedPhone: 1 }`, `{ clientId: 1, acquiredAt: -1 }`, `{ clientId: 1, status: 1 }`.
  - Índices para `lead_activities`: `{ clientId: 1, leadId: 1, createdAt: -1 }`.
  - Índices para `sales`: `{ clientId: 1, leadId: 1 }`, `{ clientId: 1, status: 1 }`, `{ clientId: 1, soldAt: -1 }`.
- **Parser CSV Robusto RFC 4180 Unificado:**
  - `src/lib/csvParser.js`: Parser compartido para frontend y backend con soporte de UTF-8 BOM (`\uFEFF`), comas dentro de comillas, saltos de línea multilínea en notas, CRLF (`\r\n`), delimitadores automáticos (`,`, `;`), comillas escapadas (`""`), tolerancia a columnas extra y límites estrictos (máx 1 MB y 500 filas).
- **Endpoints de Backend Serverless:**
  - `api-leads.js`: CRUD completo de prospectos, sub-rutas `/stage`, `/assign`, `/archive`, `/reactivate`, `/activities`, e ingesta masiva `/import` con idempotencia multiempresa, detección de duplicados sin bloqueo y registro de actividad seguro sin PII en logs.
  - `api-sales.js`: Registro de ventas con scoping de vendedor (solo sobre leads asignados), cobros atómicos con `findOneAndUpdate` y condición `$lte` para evitar exceder el importe total (`409 COLLECTED_EXCEEDS_AMOUNT`), bloqueo para `salesperson` en cobros (`403 CANNOT_CONFIRM_COLLECTIONS`) y cancelaciones (`403 CANNOT_CANCEL_SALES`), y bloqueo de modificaciones sobre ventas canceladas (`400 SALE_CANCELLED`).
  - `api-dashboard.js`: Agregación de KPIs en tiempo real con `$match` de inquilino prioritario, filtros de fecha, cálculo seguro de tasa de conversión con división protegida (0.0), segregación estricta de divisas (sin sumar ARS y USD directamente), ranking de vendedores y placeholders explícitos de Meta Ads sin falsos ceros (`hasMetaIntegration: false`, `adSpend: null`, etc.).
  - Redirecciones en `netlify.toml` para `/api/leads`, `/api/leads/*`, `/api/sales`, `/api/sales/*`, y `/api/dashboard/*`.
- **Interfaz Visual & Experiencia de Usuario:**
  - Banner de etapa actualizado: `ETAPA 3 · ACTIVA` en el Header.
  - `LeadsPage.jsx`: Vista dual con Tablero Kanban interactivo y Vista Tabla con filtros avanzados en tiempo real.
  - `LeadModal.jsx`: Alta y edición accesible de prospectos.
  - `LeadDetailModal.jsx`: Ficha 360° con timeline de actividades, prompt interactivo para motivo de pérdida obligatorio, notas comerciales, avance de etapas y registro de ventas.
  - `SaleModal.jsx`: Modal accesible para registrar ventas, pagos parciales y cobros totales en centavos con validación de importes.
  - `CsvImportModal.jsx`: Importación masiva integrada con `parseCsvString`, previsualización tabular e informes de duplicados y errores.
  - `DashboardPage.jsx`: Panel de control conectado a estadísticas reales con visualización de ingresos por moneda y ranking comercial.
- **Suite de Pruebas Automatizadas:**
  - 15 suites de pruebas con 108 tests automatizados pasando al 100% en Vitest (pruebas de parser CSV RFC 4180, concurrencia en cobros, índices compuestos, validación de pipeline y scoping multiempresa).

### Added — Stage 2: Clientes, Aislamiento Multiempresa y Autorización de Usuarios (2026-08-22)
- **Modelo Client & Gestión Multi-Tenant:**
  - Esquema `Client` con nombre, `normalizedName`, `slug` único, `status` (`active | inactive`), `legalName`, `country`, `timezone`, `defaultCurrency` (`ARS | USD`), `enabledCurrencies`, `metaBusinessId` y `metaAdAccountIds` (solo identificadores de texto, sin tokens ni secretos).
  - Exclusividad estricta de cuentas publicitarias Meta: validación en `POST` y `PATCH` que rechaza identificadores ya asignados a otra empresa (`409 META_AD_ACCOUNT_ALREADY_ASSIGNED`).
  - Índices automáticos en MongoDB: `{ slug: 1 }` (único `uniq_client_slug`), `{ normalizedName: 1 }`, `{ status: 1 }`, `{ metaAdAccountIds: 1 }`.
  - Desactivación lógica de empresas (`status: 'inactive'` y `deactivatedAt`) en lugar de eliminación física.
- **Autorización de Usuarios & Migración de Índice Idempotente:**
  - Migración idempotente en `_shared/db.js` que detecta y elimina de forma segura índices únicos no parciales heredados sobre `firebaseUid`.
  - Creación del índice canónico `{ firebaseUid: 1 }` con `name: 'uniq_firebaseUid_when_bound'`, `unique: true` y `partialFilterExpression: { firebaseUid: { $type: 'string' } }`, tolerando ejecuciones concurrentes y permitiendo múltiples usuarios en estado `invited` con `firebaseUid: null`.
  - Preautorización de usuarios mediante `POST /api/users/authorize` con `firebaseUid: null` y `status: 'invited'`.
  - Vinculación atómica del `firebaseUid` durante el primer login con Google en `api-auth-me.js`, activando la cuenta (`status: 'active'`) y registrando `activatedAt`.
  - Jerarquía estricta: `super_admin` gestiona todos los roles; `admin` solo puede crear y modificar `client` y `salesperson`. Se bloquea la creación, modificación, cambio de rol, suspensión y reactivación entre administradores (`CANNOT_CREATE_ADMIN`, `CANNOT_MODIFY_ADMIN`, `CANNOT_GRANT_ADMIN`, `CANNOT_SUSPEND_ADMIN`, `CANNOT_REACTIVATE_ADMIN`).
  - Inviolabilidad de roles: ningún usuario puede modificar su propio rol (`CANNOT_MODIFY_OWN_ROLE`) ni auto-suspenderse (`CANNOT_SUSPEND_SELF`).
  - Suspensión y revocación con tolerancia a fallos: suspensión autoritativa en MongoDB con revocación en Firebase Admin en segundo plano; si Firebase no responde, devuelve HTTP 200 con advertencia `SESSION_REVOCATION_DEFERRED` y auditoría segura sin tokens.
- **Aislamiento Estricto en Backend (Tenant Scoping):**
  - Helper reusable `_shared/permissions.js` (`verifyAuthorizedUser`) que fuerza `clientId` en base de datos para roles `client` y `salesperson`.
  - Bloqueo automático `403 CLIENT_INACTIVE` ante intentos de acceso con empresas inactivas o deshabilitadas.
  - Rechazo `403 FORBIDDEN_CLIENT_ACCESS` ante intentos de manipulación de URLs o consultas a otros clientes.
- **Endpoints de API en Netlify Functions:**
  - `GET /api/clients`, `POST /api/clients`, `GET /api/clients/:id`, `PATCH /api/clients/:id`, `POST /api/clients/:id/deactivate`, `POST /api/clients/:id/reactivate`.
  - `GET /api/users`, `POST /api/users/authorize`, `PATCH /api/users/:id`, `POST /api/users/:id/suspend`, `POST /api/users/:id/reactivate`.
  - Redirects explícitos en `netlify.toml` para `/api/clients`, `/api/clients/*`, `/api/users`, `/api/users/*`.
- **Interfaz Visual en React:**
  - `ClientsPage.jsx` renovada con pestañas para "Empresas" y "Usuarios", buscador en tiempo real, filtros y badges de estado.
  - `Modal.jsx` accesible con cierre por Escape y backdrop.
  - `ClientModal.jsx` para creación y edición de empresas con identificadores de Meta Ads.
  - `UserModal.jsx` para preautorización y edición de usuarios con asignación de empresa.
  - `ConfirmDialog.jsx` accesible para desactivaciones y suspensiones.
- **Suite de Pruebas Automatizadas:**
  - 32 nuevas pruebas para backend y frontend de Clientes, Usuarios, Aislamiento Multiempresa y Migración de Índices.

### Added — Stage 1: Base Architecture & Authentication Setup (2026-08-21)
- **Base Architecture Setup:**
  - Project initialized with Vite + React SPA architecture.
  - Integration with Netlify Serverless Functions (CommonJS modular backend).
  - MongoDB database client integration with connection pooling and caching.
  - Firebase Authentication with Google Sign-In and Password providers.
  - Pinning of `firebase-admin@13.10.0` for rock-solid serverless stability.
- **Authentication & Authorization System:**
  - Google Sign-In with OAuth pop-up flow.
  - Atomic auto-bootstrap of the initial `super_admin` from `SUPER_ADMIN_EMAIL` environment variable.
  - Strict server-side token verification using Firebase Admin SDK.
  - Identity verification and session persistence in MongoDB `users` collection.
  - Diagnostic error reporting without secret leakage (`AUTH_DIAGNOSTIC`).
  - Account Linking section in Settings ("Seguridad de acceso") supporting Google and Password credential linking.
- **Design System & Visual Quality:**
  - Custom UI palette based on Tailwind CSS with warm backgrounds (`#F7F6F2`, `#FAF9F5`), Deep Emerald primary accents (`#0A4D3C`), and precise typography.
  - Fully accessible components: Buttons, Inputs, Alerts, Header, Navigation Sidebar, Modal.
  - Dedicated authentication pages: `LoginPage`, `ForgotPasswordPage`, `RegisterPage`, `BootstrapPage`.
- **Test Infrastructure:**
  - Vitest + Testing Library suite configured with 43 initial unit and integration tests.
