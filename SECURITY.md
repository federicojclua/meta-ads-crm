# Anima MKT CRM — Security Policy

## 1. Authentication & Identity Management

### Provider: Firebase Authentication
- Email + password credentials & Google Sign-In (managed exclusively by Firebase Auth).
- **Sin pantallas públicas de autoregistro:** La interfaz de usuario no ofrece registro abierto.
- **Creación del primer Super Admin:** Se da de alta manualmente desde la consola de Firebase con el correo correspondiente a `SUPER_ADMIN_EMAIL`.
- **Verificación de correo obligatoria:** Se requiere `email_verified: true` para acceder a los recursos del CRM. Si un usuario no tiene su email verificado, el frontend ofrece reenvío del correo de verificación pero bloquea el acceso al dashboard.
- **Invitación de usuarios posteriores (Etapa 2):** Preautorización server-side en MongoDB (`status: 'invited'`) y vinculación atómica con Google Auth en su primer login.

### Token Management & Lifecycle
- Tokens de identidad de Firebase (JWT) con tiempo de vida corto (1 hora).
- El cliente frontend utiliza el listener `onIdTokenChanged` de Firebase SDK para refrescar automáticamente el token en segundo plano.
- Todas las peticiones al backend incluyen la cabecera `Authorization: Bearer <idToken>`.
- Las Netlify Functions verifican la validez, firma y estado de verificación del token en cada invocación mediante `admin.auth().verifyIdToken(token)`.

### Master Access Bootstrap, Persistence & Identity Mismatch Prevention
- `SUPER_ADMIN_EMAIL` se almacena **exclusivamente como variable de entorno server-side** en Netlify.
- **NUNCA almacenar contraseñas maestras en variables de entorno ni en código.** La autenticación por contraseña siempre es validada por Firebase.
- **Persistencia de sesión en el navegador:** Se configura explícitamente `browserSessionPersistence` en Firebase Auth. La sesión se mantiene activa mientras la pestaña/ventana del navegador permanece abierta, pero se elimina automáticamente al cerrarla, reduciendo el riesgo de sesiones huérfanas en dispositivos compartidos.
- **Búsquedas separadas de identidad:** `api-auth-me` realiza búsquedas separadas e independientes para `firebaseUid` y `normalizedEmail`. Si detecta un documento existente con un `firebaseUid` distinto o un correo distinto, responde `403 IDENTITY_MISMATCH` y **nunca** sobrescribe el identificador.
- **Bootstrap atómico:** Cuando un usuario verificado (`email_verified: true`) coincide con `SUPER_ADMIN_EMAIL` y no existe en la base, se crea atómicamente mediante `findOneAndUpdate` con `upsert: true` y `$setOnInsert`, con captura explícita de `E11000` en caso de concurrencia.
- **Roles en memoria:** El frontend mantiene los roles exclusivamente en el estado en memoria de React (`AuthContext`). **NUNCA se almacenan roles en `localStorage` o `sessionStorage`**.
- Si un usuario se autentica en Firebase pero no existe en MongoDB, su email no está verificado, o no coincide con `SUPER_ADMIN_EMAIL`, la API responde inmediatamente `403 Forbidden`.

---

### Vinculación de Contraseñas, Política de Seguridad & Revocación Operativa
- **Identidad Única Inmutable:** Los usuarios que inician sesión inicialmente mediante Google pueden vincular una credencial de contraseña directa mediante `linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email, password))`.
- **Preservación de UID:** La vinculación de contraseña no crea cuentas duplicadas, no altera el correo electrónico y conserva de forma estricta el mismo `firebaseUid`.
- **Eliminación Inmediata de Estado:** La contraseña se elimina inmediatamente del estado de React después del envío o cancelación y nunca se persiste ni registra en almacenamiento local, sesión ni logs.
- **Validación Dinámica de Políticas de Contraseña:** El frontend evalúa las contraseñas contra las políticas activas de Firebase mediante `validatePassword(auth, password)` antes de enviarlas, garantizando alineación con los requerimientos de longitud y complejidad configurados (recomendado: 10-12 caracteres con mayúsculas, minúsculas y números).
- **Prohibición de Fusión Automática:** Ante errores de tipo `auth/credential-already-in-use`, el sistema **no** implementa fusión automática de cuentas durante el MVP para prevenir traslados involuntarios de permisos o roles a un `firebaseUid` equivocado.
- **Consecuencia Operativa sobre Revocación:** Después de vincular una contraseña, el usuario podrá autenticarse aunque su cuenta Google Workspace haya sido deshabilitada en el proveedor externo. Por este motivo, la **baja efectiva o suspensión del acceso siempre debe realizarse de forma autoritativa estableciendo `status: "suspended"` en la base de datos MongoDB** y nunca depender únicamente del estado en Google.
- **Fijación de Firebase Admin (13.10.0):** Para prevenir vulnerabilidades e incompatibilidades upstream de resolución de módulos (`ERR_REQUIRE_ESM` entre `jwks-rsa@4` y `jose@6`), la dependencia `firebase-admin` se mantiene fijada exactamente en `13.10.0` hasta su resolución oficial upstream.

---

### Sanitización de Navegación & Mitigación de Open Redirects (GHSA-wrjc-x8rr-h8h6)
- **Advisory:** `GHSA-wrjc-x8rr-h8h6` / `CVE-2025-68470 bypass` (Open redirect via backslash en `<Link>` y `useNavigate` y SSR Hydration).
- **Riesgo Aceptado Temporalmente:** No se ejecuta `npm audit fix --force` ni se migra a React Router 7 en la Etapa 3 para preservar la estabilidad de la arquitectura y evitar breaking changes descontrolados.
- **Controles Compensatorios Activos:**
  1. **Allowlist Exacta:** Todo retorno de redirección post-login se valida estrictamente contra un `Set` cerrado de rutas constantes (`/app`, `/app/clients`, `/app/leads`, `/app/campaigns`, `/app/settings`).
  2. **Rechazo Universal de Cargas Maliciosas:** Cualquier intento de redirección con esquemas absolutos (`https://evil.example`), dobles barras (`//evil.example`), barras invertidas simples o dobles (`/\evil.example`, `\\evil.example`, `/app\evil.example`), o variantes codificadas en URL (`/%5Cevil.example`, `/%5c%5cevil.example`) es evaluado como inválido y redirigido forzosamente a `/app`.
  3. **Ausencia de Parámetros Dinámicos en Rutas:** Ninguna llamada a `navigate()`, `<Link>`, o redirección recibe valores derivados de queries, bodies, CSV, nombres de clientes, leads, notas o respuestas arbitrarias del backend.
  4. **SPA Pura:** La aplicación es un Single Page Application en Vite sin SSR (Server-Side Rendering), por lo que las vulnerabilidades asociadas a hidratación SSR son inaplicables.
- **Plan de Migración Futura:** Se planificará la migración controlada a React Router 7.18+ en una etapa posterior con su suite dedicada de pruebas de regresión.

---

### Evaluación del Riesgo Transitivo de `uuid` (GHSA-w5hq-g745-h8pq)
- **Advisory:** `GHSA-w5hq-g745-h8pq` (Missing buffer bounds check en `uuid` v3/v5/v6 cuando se provee un buffer externo).
- **Alcance en el Código Propio:**
  - El código de la aplicación **no utiliza la biblioteca `uuid`** directamente en ningún archivo (`src/`, `netlify/`, `models/`).
  - La dependencia ingresa exclusivamente de forma transitiva a través de `@google-cloud/firestore` y `google-gax` dentro de `firebase-admin@13.10.0`.
  - No se invocan las APIs `uuid.v3`, `uuid.v5` ni `uuid.v6`, ni se proveen buffers u offsets externos a `uuid`.
- **Decisión:** Mantener `firebase-admin@13.10.0`. Se rechaza expresamente el downgrade sugerido por `npm audit fix --force` hacia `firebase-admin@10.3.0` por incompatibilidades severas con el entorno serverless Node 20/24.

---

### Seguridad en la Integración con Meta Marketing API (v26.0)

1. **HMAC-SHA256 `appsecret_proof` Obligatorio:**
   - Cada consulta al Graph API calcula `appsecret_proof = HMAC-SHA256(META_APP_SECRET, META_SYSTEM_USER_TOKEN)` para prevenir ataques man-in-the-middle y secuestro de tokens.
2. **Rate Limiting Adaptativo Multi-Header:**
   - Se procesan los encabezados oficiales `x-business-use-case-usage`, `x-app-usage` y `Retry-After`.
   - Ante utilización $\ge 75\%$, se inserta throttling preventivo; ante $\ge 90\%$, se pausa la sincronización del ad account.
   - En caso de errores 1, 2, 17, 32, 613 (rate limits de Meta), se aplica backoff exponencial con jitter aleatorio ($\pm 20\%$) hasta 3 intentos antes de fallar de forma aislada sin afectar otras cuentas.
3. **Sanitización de Logs y Checkpoints (`sanitizeMetaLog`):**
   - Se redactan automáticamente tokens `EAAB...`, secrets y firmas en todas las salidas a consola, logs de sincronización y checkpoints de la base de datos.
4. **Aislamiento Multi-Tenant Estricto:**
   - La clave única `{ clientId, adAccountId, adsetId, date, attributionSettingKey, actionReportTime }` garantiza que los datos de un cliente nunca se sobrescriban ni se mezclen con los de otro.
   - Si se detecta una campaña con AdSets asignados a múltiples empresas, el sistema marca `MIXED_TENANT_CAMPAIGN` y restringe la visualización agregada total a los roles `client`.
   - Las reasignaciones retroactivas son exclusivas de `super_admin` con previsualización obligatoria `dryRun: true`.

---

### Static Security Headers (`netlify.toml`)
Para mitigar ataques de clickjacking, MIME sniffing y garantizar aislamiento seguro de popups para Google Sign-In, se configuran las siguientes cabeceras en `netlify.toml`:
- `X-Content-Type-Options: "nosniff"`
- `X-Frame-Options: "DENY"`
- `Referrer-Policy: "strict-origin-when-cross-origin"`
- `Permissions-Policy: "camera=(), microphone=(), geolocation=()"`
- `Cross-Origin-Opener-Policy: "same-origin-allow-popups"` (requerido para compatibilidad con popup de Google Auth)

---

## 2. Authorization & Multi-Tenant Isolation

### Role Enforcement (MongoDB Authoritative)
- Los roles (`super_admin`, `admin`, `client`, `salesperson`) residen únicamente en la base de datos `anima_mkt_crm` en MongoDB Atlas.
- La autorización se verifica server-side en **cada** endpoint protegido mediante el helper `_shared/permissions.js` (`verifyAuthorizedUser`).
- El frontend solo utiliza el rol devuelto por `api-auth-me` para adaptar la navegación visual; nunca para tomar decisiones de seguridad.

### Jerarquía Estricta de Roles & Protección de Super Admin
- **Inviolabilidad de Roles Propios:** Ningún usuario autenticado puede modificar su propio rol (`403 CANNOT_MODIFY_OWN_ROLE`).
- **Límites de Administrador:** Un usuario con rol `admin` **no** puede crear, modificar ni suspender a un usuario con rol `super_admin` (`403 CANNOT_SUSPEND_SUPER_ADMIN` / `403 CANNOT_MODIFY_SUPER_ADMIN`).
- **Restricción de Auto-Suspensión:** Ningún usuario puede suspender su propia cuenta (`400 CANNOT_SUSPEND_SELF`).

### Multi-Tenant Data Isolation (Tenant Scoping)
- **Aislamiento forzado en Backend:** Para usuarios con rol `client` o `salesperson`, el backend fuerza automáticamente el `clientId` almacenado en su documento de MongoDB. Cualquier parámetro `clientId` recibido por query string, body o headers es completamente ignorado.
- **Verificación de Estado del Tenant:** Si la empresa asociada tiene `status === 'inactive'`, el acceso a cualquier endpoint de API y al endpoint `api-auth-me` es bloqueado inmediatamente con código `403 CLIENT_INACTIVE`.
- **Aislamiento Horizontal:** Cualquier intento de consultar o modificar recursos de otra empresa mediante alteración de URLs o identificadores responde inmediatamente con `403 FORBIDDEN_CLIENT_ACCESS`.

```
❌ VULNERABLE: db.clients.findOne({ _id: req.params.id })
✅ SEGURO:     verifyAuthorizedUser(event) -> forces user.clientId filter if not global admin
```

### Seguridad de Identificadores de Meta Ads
- Los campos `metaBusinessId` y `metaAdAccountIds` solo almacenan identificadores de texto (`act_XXX` o números de cuenta).
- **Prohibición estricta de tokens:** Los endpoints rechazan cualquier payload que contenga cadenas tipo token de acceso Meta (`EAAB...`). Los tokens de sistema se gestionan exclusivamente mediante variables de entorno en Netlify.

---

## 3. Database & Network Security (MongoDB Atlas)

### Configuración de Red Atlas (0.0.0.0/0)
- Debido a la naturaleza serverless de Netlify Functions (direcciones IP de salida dinámicas y compartidas), MongoDB Atlas requiere habilitar el acceso desde cualquier IP (`0.0.0.0/0`).
- **Esta configuración de red NO es suficiente por sí sola** y se compensa con controles estrictos en múltiples capas:
  1. **Usuario de Base de Datos Exclusivo:** Scoped únicamente a la base `anima_mkt_crm` con rol `readWrite` (sin permisos administrativos en el cluster).
  2. **Contraseña de Alta Entropía:** Clave generada aleatoriamente de más de 32 caracteres.
  3. **Cifrado en Tránsito:** Conexiones TLS obligatorias con verificación de certificados.
  4. **Rotación de Credenciales:** Política de rotación periódica de credenciales de conexión.
  5. **Cifrado en Reposo:** Activado por defecto en MongoDB Atlas.

---

## 4. Secrets Management & Classification

| Variable | Ubicación | Visible en Navegador | Clasificación |
|----------|-----------|----------------------|---------------|
| `SUPER_ADMIN_EMAIL` | Netlify env / .env.local | ❌ No | Server-side config |
| `MONGODB_URI` | Netlify env / .env.local | ❌ No | **CRITICAL SECRET** |
| `MONGODB_DB_NAME` | Netlify env / .env.local | ❌ No | Server-side config (`anima_mkt_crm`) |
| `FIREBASE_PRIVATE_KEY` | Netlify env / .env.local | ❌ No | **CRITICAL SECRET** |
| `META_SYSTEM_USER_TOKEN`| Netlify env / .env.local | ❌ No | **CRITICAL SECRET** |
| `META_APP_SECRET` | Netlify env / .env.local | ❌ No | **CRITICAL SECRET** |
| `CRON_SECRET` | Netlify env / .env.local | ❌ No | **CRITICAL SECRET** |
| `GEMINI_API_KEY` | Netlify env / .env.local | ❌ No | **CRITICAL SECRET** |
| `VITE_FIREBASE_*` | Frontend bundle | ✅ Sí | Public Client Config |

### Reglas Estrictas sobre Secretos:
1. **NUNCA** usar el prefijo `VITE_` para secretos de backend o claves privadas.
2. **NUNCA** imprimir secretos en `console.log`, respuestas de error hacia el cliente o logs de auditoría.
3. **NUNCA** commitear archivos `.env`, `.env.local` o archivos JSON de cuentas de servicio (`serviceAccountKey.json`).
4. Solo se versiona `.env.example` con placeholders ficticios (`<set-in-netlify>`).
5. GitHub Push Protection activo para prevenir fugas accidentales.

---

## 5. Audit Trail & Data Sanitization

- Se registran eventos críticos en la colección `audit_logs` (creación de usuarios, cambios de rol, modificación de estados, reasignaciones de clientes).
- **Sanitización Obligatoria:**
  - **PROHIBIDO** almacenar contraseñas, tokens de autenticación, claves de API o payloads sensibles en los audit logs.
  - **PROHIBIDO** almacenar copias completas de datos de contacto PII no requeridos en los logs.
  - Almacenar únicamente identificadores, tipo de acción, cambios diferenciales (`before` / `after`) y metadatos operativos.

---

## 6. "View As" Mode (Impersonación Segura)

- Exclusivo para usuarios con rol `super_admin`.
- **No modifica la identidad ni los privilegios reales** del super_admin en el backend.
- Aplica un filtro de contexto de cliente en el dashboard frontend con un banner visual permanente y botón visible para salir.
- Todas las operaciones realizadas en este modo quedan registradas bajo la identidad real del super_admin en los audit logs.

---

## 7. Security Audit Checklist (Stage 9)

- [ ] Sin secretos en el bundle de producción (`dist/`).
- [ ] Sin secretos en la consola del navegador ni en respuestas de red.
- [ ] Verificación de token y de email verificado en cada endpoint de Netlify Functions.
- [ ] Verificación de `clientId` en cada consulta a la base de datos.
- [ ] Usuarios sin perfil activo en MongoDB reciben 403 Forbidden.
- [ ] Usuarios suspendidos no pueden ejecutar ninguna acción.
- [ ] Peticiones a otros `clientId` mediante alteración de URL devuelven 403.
- [ ] Headers seguros configurados (`X-Content-Type-Options`, `X-Frame-Options`).
- [ ] Audit logs libres de PII sensible y secretos.
