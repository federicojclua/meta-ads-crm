# Anima MKT CRM — Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

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
  - Validación estricta de estructura JWT (3 segmentos, longitud mínima, tipo string) con retorno `401 AUTH_TOKEN_MALFORMED` antes de procesar tokens mal formados.
  - Separación de fallos del servidor (`500 AUTH_SERVER_MISCONFIGURED` y `500 AUTH_VERIFICATION_FAILED`) de errores de credenciales cliente (`401`) y rechazos de acceso (`403`).
  - Logs estructurados seguros en backend que registran únicamente metadatos de error, booleanos de presencia de variables y conteo de segmentos (nunca tokens, claves ni correos).
  - Manejo en frontend de reintento transparente ante `401` (`getIdToken(true)` una sola vez) y mensajes de servicio no disponible ante `500` sin redirigir erróneamente a `/unauthorized`.
  - Normalización y saneamiento de formato de clave privada (`FIREBASE_PRIVATE_KEY`) eliminando comillas envolventes y resolviendo `\n` literales.
  - Distinción en frontend de proveedores asociados (`google.com`, `password`) y preparación de helper de vinculación `linkPasswordAccount` con `linkWithCredential`.
- **Calidad & Pruebas:**
  - 33 pruebas automatizadas con Vitest y Testing Library (backend auth, manejo de errores 401/403/500, tokens malformados, separación de excepciones, bootstrap atómico, recuperación E11000, identity mismatch, persistencia de sesión, allowlist estricta de redirección, componentes UI, proveedores Google vs Password y seguridad de secretos).
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
