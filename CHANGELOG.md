# Anima MKT CRM — Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

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
  - `AuthorizeUserModal.jsx` para preautorizar usuarios y copiar enlaces de acceso.
  - Modales de confirmación con advertencias claras antes de desactivar empresas o suspender usuarios.
- **Suite de Pruebas Automatizadas:**
  - 33 nuevas pruebas unitarias y de integración (75 pruebas totales en Vitest pasando al 100%).

### Added — Stage 1: Foundation, Auth & Minimal User DB (2026-08-22)
- **Frontend SPA & Autenticación de Sesión:**
  - React 18, Vite 5, Tailwind CSS 3 y React Router 6.30.6.
  - Implementación explícita de `browserSessionPersistence` en Firebase Auth (la sesión persiste mientras la pestaña esté abierta y se limpia al cerrarla).
  - Sanitización estricta de rutas de redirección interna (`from`) previniendo open redirects.
  - Implementación de tokens de diseño sobrios (blanco cálido `#F7F6F2`, tarjetas blancas `#FFFFFF`, rojo principal `#B91C1C`, verde éxito `#15803D`, amarillo alerta `#F4C430`).
  - Wordmark "ANIMA MKT CRM · Revenue Intelligence".
  - Componentes accesibles (`Button`, `Input`, `Badge`, `Alert`, `EmptyState`, `Sidebar`, `Header`, `MainLayout`).
  - Páginas públicas: `/login` (Email/Password + Google), `/verify-email`, `/forgot-password`, `/unauthorized`.
  - Rutas privadas protegidas: `/app` (Dashboard inicial), `/app/clients`, `/app/leads`, `/app/campaigns`, `/app/settings`.
  - Guardia `ProtectedRoute` con verificación de sesión, estado de correo y perfil en MongoDB.
- **Backend Serverless & Autenticación Atómica:**
  - Netlify Function `api-auth-me.js` protegida por Firebase Admin SDK 14.3.0.
  - Redirect exacto `/api/auth/me` hacia `/.netlify/functions/api-auth-me` (`force = true`) en `netlify.toml`.
  - Smoke test real con `netlify dev` verificando resolución HTTP 401 JSON (`code: "AUTH_TOKEN_MISSING"`).
  - Headers de seguridad estáticos en `netlify.toml` (`nosniff`, `DENY`, `same-origin-allow-popups`).
  - Búsquedas separadas para `firebaseUid` y `normalizedEmail` con rechazo estricto `403 IDENTITY_MISMATCH` ante discrepancias (nunca sobrescribe UIDs).
  - Bootstrap atómico del primer `super_admin` con `findOneAndUpdate` (`upsert: true`, `$setOnInsert`) y recuperación explícita de colisión `E11000`.
  - Conexión a MongoDB Atlas (`anima_mkt_crm`) con índices automáticos (`uniq_normalizedEmail`, `uniq_partial_firebaseUid` con `$type: "string"`, `idx_role_status`).
  - Bloqueo 403 Forbidden para usuarios de Firebase no autorizados o suspendidos.
- **Runtime & Dependencias:**
  - Ejecución y validación local bajo Node.js 24 LTS (`v24.19.0`, npm `11.17.0`) y fijación en `.nvmrc`, `package.json` (`"engines": { "node": ">=24 <25" }`) y `netlify.toml` (`NODE_VERSION = "24"`).
  - Configuración de empaquetado de funciones en `netlify.toml` con `node_bundler = "esbuild"` y `external_node_modules = ["mongodb", "firebase-admin"]`.
  - Cero vulnerabilidades críticas y altas en producción (`npm audit --omit=dev`).
- **Diagnóstico Seguro & Robustecimiento de Autenticación (Hotfix):**
  - Migración completa de `firebaseAdmin.js` a la API modular oficial de Firebase Admin (`import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'` y `import { getAuth } from 'firebase-admin/auth'`), eliminando el import default y la lectura de `admin.apps.length` que generaba `TypeError: Cannot read properties of undefined (reading 'length')` bajo ESM/esbuild en Netlify Functions.
  - Inicialización idempotente y caching exclusivo de la instancia `getAuth(app)`.
  - Checkpoints de diagnóstico sin secretos (`FIREBASE_INIT_ENV_READY`, `FIREBASE_INIT_CREDENTIAL_READY`, `FIREBASE_INIT_APP_READY`, `FIREBASE_INIT_AUTH_READY`).
  - Validación estricta de estructura JWT (3 segmentos, longitud mínima, tipo string) con retorno `401 AUTH_TOKEN_MALFORMED` antes de procesar tokens mal formados.
  - Separación de fallos del servidor (`500 AUTH_SERVER_MISCONFIGURED` y `500 AUTH_VERIFICATION_FAILED`) de errores de credenciales cliente (`401`) y rechazos de acceso (`403`).
  - Manejo en frontend de estado dedicado para fallos de servidor (500) a través de `ServiceUnavailablePage` y `ProtectedRoute` sin redirigir erróneamente a `/unauthorized` ni mezclarlo con 403.
  - Normalización y saneamiento de formato de clave privada (`FIREBASE_PRIVATE_KEY`) eliminando comillas envolventes y resolviendo `\n` literales.
  - Distinción en frontend de proveedores asociados (`google.com`, `password`) y preparación de helper de vinculación `linkPasswordAccount` con `linkWithCredential`.
- **Cierre Final de Etapa 1 & Vinculación Híbrida de Credenciales:**
  - Sección "Seguridad de Acceso & Proveedores Vinculados" en `SettingsPage.jsx`.
  - Visualización del estado de proveedores conectados (Google Workspace / Gmail y Contraseña Directa).
  - Formulario interactivo para vincular contraseña a cuentas Google-only mediante `linkWithCredential` y `EmailAuthProvider.credential(user.email, newPassword)` sin crear cuentas duplicadas ni alterar el `firebaseUid`.
  - Validación reactiva de contraseña (mínimo 6 caracteres, coincidencia en tiempo real, limpieza inmediata de inputs sensibles en memoria y sin persistencia en logs o almacenamiento local).
  - Manejo de restablecimiento de contraseña vía email (`sendPasswordReset`).
  - Normalización estricta de la visualización de roles en la interfaz a `"SUPER ADMINISTRADOR"`, `"ADMINISTRADOR"`, `"MEDIA BUYER"`, `"CLIENTE"` mediante la función utilitaria `formatRole`.
  - Fijación estricta de `firebase-admin: "13.10.0"` en `package.json` para prevenir el conflicto upstream `ERR_REQUIRE_ESM` entre `jwks-rsa@4` y `jose@6`.
- **Calidad & Pruebas:**
  - 41 pruebas automatizadas con Vitest y Testing Library (backend auth, manejo de errores 401/403/500, tokens malformados, separación de excepciones, prevención estática de regresión a imports default de `firebase-admin`, bootstrap atómico, recuperación E11000, identity mismatch, persistencia de sesión, allowlist estricta de redirección, componentes UI, proveedores Google vs Password, formulario y validaciones de vinculación de contraseña en Settings, preservación de UID y seguridad de secretos).
  - ESLint limpio con 0 errores y 0 warnings.
  - Build de producción (`npm run build`) validado exitosamente bajo Node 24.

### Added — Stage 0: Planning & Documentation (2026-08-22)
- **Documentación de arquitectura, diseño e identidad visual para Anima MKT CRM:**
  - `README.md` — Visión general, estructura y stack tecnológico.
  - `PRODUCT_SPEC.md` — Especificación de producto, roles, roadmap e identidad visual funcional (blanco cálido, rojo principal, gris carbón, verde/amarillo funcionales).
  - `ARCHITECTURE.md` — Arquitectura de capas, flujo de autenticación con verificación de email, tokens de diseño y límites de ejecución de Netlify Functions.
  - `DATA_MODEL.md` — Esquema de base de datos MongoDB (`anima_mkt_crm`) con métricas aditivas, snapshot de `metaReported.costPerActionType`, soporte multidivisa y distinción de ingresos cobrados.
  - `IMPLEMENTATION_PLAN.md` — Plan de 10 etapas ajustado: Etapa 1 integra conexión mínima a MongoDB para la colección `users`, verificación de correo y bootstrap del `super_admin`.
  - `SECURITY.md` — Políticas de autenticación y autorización, reglas de aislamiento `clientId`, protección de secretos y sanitización de audit logs.
  - `ENVIRONMENT_SETUP.md` — Guía de aprovisionamiento de Firebase, MongoDB Atlas (`anima_mkt_crm`) y nuevo proyecto en Netlify (`anima-mkt-crm`).
  - `META_AUTH_SETUP.md` — Guía de integración de Meta Marketing API con permisos de solo lectura (`ads_read` para MVP), health checks de tokens y almacenamiento exclusivo server-side.
  - `GOOGLE_INTEGRATIONS.md` — Especificación de integraciones de Google para Etapa 7.
  - `AI_ARCHITECTURE.md` — Capa de abstracción de proveedores de IA para Etapa 8.
  - `TESTING_PLAN.md` — Protocolo de 15 pruebas de aceptación manuales y de seguridad.
  - `DECISIONS.md` — 11 registros de decisiones de arquitectura (ADRs), incluyendo ADR-011 sobre Identidad Visual Operativa.
  - `AGENTS.md` — 12 reglas obligatorias para desarrollo y mantenimiento por agentes.
  - `STAGE_1_INPUTS.md` — Registro de estado de variables e insumos para la Etapa 1.
- **Configuración:**
  - `.env.example` — Plantilla con placeholders limpios `<set-in-netlify>` y versión Meta v26.0.
  - `.gitignore` — Exclusiones estrictas para dependencias, builds, secretos y archivos de cuentas de servicio.
- **Control de versiones:**
  - Repositorio Git inicializado y sincronizado con repositorio privado en GitHub.
