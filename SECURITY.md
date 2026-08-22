# Anima MKT CRM — Security Policy

## 1. Authentication & Identity Management

### Provider: Firebase Authentication
- Email + password credentials only (managed exclusively by Firebase Auth).
- **Sin pantallas públicas de autoregistro:** La interfaz de usuario no ofrece registro abierto.
- **Creación del primer Super Admin:** Se da de alta manualmente desde la consola de Firebase con el correo correspondiente a `SUPER_ADMIN_EMAIL`.
- **Verificación de correo obligatoria:** Se requiere `email_verified: true` para acceder a los recursos del CRM. Si un usuario no tiene su email verificado, el frontend ofrece reenvío del correo de verificación pero bloquea el acceso al dashboard.
- **Invitación de usuarios posteriores (Etapa 2):** Se crean server-side mediante Firebase Admin SDK generando un enlace seguro de asignación de contraseña (`generatePasswordResetLink`).

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

### Sanitización de Navegación & Mitigación de Open Redirects
- **Control estricto de redirecciones:** Cualquier llamada a `navigate()` o componente `<Navigate>` utiliza exclusivamente rutas constantes internas o destinos validados contra un prefijo permitido (`/app`).
- **Bloqueo de caracteres de escape:** Se rechazan explícitamente caracteres de redirección relativa maliciosa (`\\` y `//`).
- **Evaluación de dependencias transitivas:** Las vulnerabilidades moderadas reportadas en `react-router` (GHSA-wrjc-x8rr-h8h6 y GHSA-337j-9hxr-rhxg) se clasifican formalmente como **no alcanzables bajo el diseño actual** debido a que:
  1. Anima MKT CRM es una Single Page Application pura en Vite sin Server-Side Rendering (SSR hydration).
  2. Ningún parámetro de consulta (`searchParams`), `returnUrl` de URL o entrada de usuario es interpretado directamente como destino de navegación.
- **Compromiso de revisión:** Esta política de redirección será reauditada obligatoriamente antes de introducir parámetros `returnUrl`, enlaces de invitación por token o redirecciones dinámicas en la Etapa 2.

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
- La autorización se verifica server-side en **cada** llamada a la API.
- El frontend solo utiliza el rol devuelto por `api-auth-me` para adaptar la navegación visual; nunca para tomar decisiones de seguridad.

### Multi-Tenant Data Isolation
- **Regla crítica:** Toda consulta a colecciones multi-empresa debe incluir el filtro `clientId` derivado del perfil autenticado del usuario.
- Si un usuario intenta consultar o modificar un `clientId` que no tiene asignado en su array `clientIds`, la función responde `403 Forbidden`.
- `super_admin` tiene acceso global y puede aplicar filtros de cliente explícitos.

```
❌ VULNERABLE: db.leads.findOne({ _id: req.body.leadId })
✅ SEGURO:     db.leads.findOne({ _id: req.body.leadId, clientId: { $in: user.clientIds } })
```

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
