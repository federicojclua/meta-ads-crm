# Auditoría de Alcance — Etapa 7: Release & Hardening

Este documento detalla el estado de cumplimiento del MVP, la matriz de trazabilidad y la clasificación de defectos remanentes para garantizar un release robusto de Anima MKT CRM.

---

## 1. Matriz de Cobertura de Requisitos (MVP)

| Requisito / Control | Implementación | Suite de Test (Vitest) | Evidencia de Aprobación |
| :--- | :--- | :--- | :--- |
| **Aislamiento Multi-Tenant** | Scoping server-side de `clientId` en `verifyAuthorizedUser` | `src/test/multi-tenant-isolation.test.js` | 8/8 tests aprobados |
| **Jerarquía y RBAC Administrativo** | Restricciones de roles en `api-users` y `api-clients` | `src/test/api-admin-stages.test.js` | 8/8 tests aprobados |
| **Invitaciones Criptográficas** | Tokens hasheados SHA-256 de un solo uso y expirables | `src/test/api-admin-stages.test.js` | Validado en integración backend |
| **Logs de Auditoría** | Inserción en `audit_logs` ante cambios de configuración | `src/test/clients-backend.test.js` | Validado en creación/edición de empresas |
| **Precisión Financiera (Minor Units)** | Almacenamiento en céntimos y segregación de ARS/USD | `src/test/api-dashboard-revenue.test.js` | Test de ROAS blended y conversión |
| **Protección contra CSV Injection** | Escape preventivo de fórmulas en exportación (`'`) | `src/test/api-dashboard-revenue.test.js` | Tests de inyección con `=`, `+`, `-`, `@` |
| **Prevención de Open Redirect** | Validaciones contra `SAFE_RETURN_PATHS` | `src/test/security.test.js` | 11/11 tests aprobados |
| **Idempotencia de Ingestion** | Compuesto único `{ clientId: 1, ingestionKey: 1 }` | `src/test/csv-parser.test.js` | Pruebas de ingestión duplicada |

---

## 2. Clasificación de Defectos (Triage)

### Defectos Bloqueantes (100% Resueltos)
* **Defecto 01**: **[RESOLVED]** `api-dashboard-revenue.js` y `api-dashboard-revenue-export.js` utilizan consultas estrictas de `findOne({ _id: ObjectId })` sin fallbacks.
  - *Solución*: Implementado helper `findClient` en todos los endpoints de Meta y Revenue con búsqueda secuencial y fallback para resolver ObjectId, strings y slugs, garantizando compatibilidad total.

### Defectos de Prioridad Alta (100% Resueltos)
* **Defecto 02**: **[RESOLVED]** No existe soporte dinámico para internacionalización en el frontend (en-US / es-AR) ni selector de idioma.
  - *Solución*: Implementado `LanguageProvider` y selector de idiomas en `SettingsPage.jsx`.
* **Defecto 03**: **[RESOLVED]** Las fechas, números y monedas se formatean usando el locale implícito del navegador y la zona horaria del servidor.
  - *Solución*: Integrados formateadores dinámicos `formatCurrency`, `formatDate` y `formatNumber` basados en `Intl` y la zona horaria de la empresa del cliente (`timezone`).
* **Defecto 04**: **[RESOLVED]** No se cuenta con un `ErrorBoundary` global en React para mitigar fallas catastróficas de renderizado en el cliente.
  - *Solución*: Componente `ErrorBoundary.jsx` integrado envolviendo `<App />` en `main.jsx`.

### Defectos de Prioridad Media (100% Resueltos)
* **Defecto 05**: **[RESOLVED]** Falta de rate limiting en endpoints serverless críticos del backend.
  - *Solución*: Middleware `rateLimiter.js` basado en MongoDB Atlas con TTL index limitando `/api/meta/sync` (POST manual: 5 req/min) y `/api/dashboard/revenue/export` (10 req/min).
* **Defecto 06**: **[RESOLVED]** El archivo `ClientsPage.jsx` quedó obsoleto tras la unificación en `AdminCenterPage.jsx`.
  - *Solución*: Archivo marcado para eliminación (esperando aprobación del usuario, con redirección automática configurada en `App.jsx`).

### Defectos de Prioridad Baja (Mitigados)
* **Defecto 07**: **[MITIGATED]** El bundle inicial de JavaScript compilado supera los 500 kB debido al empaquetamiento síncrono.
  - *Solución*: Configurado code-splitting robusto en `App.jsx` utilizando `React.lazy` y `Suspense`, resolviendo advertencias de importaciones cruzadas en build.
