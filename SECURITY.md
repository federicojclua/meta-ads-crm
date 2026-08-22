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

### Master Access Bootstrap
- `SUPER_ADMIN_EMAIL` se almacena **exclusivamente como variable de entorno server-side** en Netlify.
- **NUNCA almacenar contraseñas maestras en variables de entorno ni en código.** La autenticación por contraseña siempre es validada por Firebase.
- Cuando `api-auth-me` recibe un token válido cuyo correo verificado (`email_verified: true`) coincide exactamente con `SUPER_ADMIN_EMAIL`, crea o recupera el perfil en MongoDB asignándole `role: "super_admin"`, `status: "active"`, `clientIds: []`.
- Si un usuario se autentica en Firebase pero no existe en MongoDB, su email no está verificado, o no coincide con `SUPER_ADMIN_EMAIL`, la API responde inmediatamente `403 Forbidden`.

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
