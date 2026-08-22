# Anima MKT CRM — Testing Plan

## 1. Testing Strategy

| Level              | Tool / Method             | Stage  | Estado |
|--------------------|---------------------------|--------|--------|
| Unit & Backend Auth| Vitest (`auth-backend.test.js`) | 1+ | ✅ 16 tests pasados |
| Component & Guards | Vitest + Testing Library (`auth-frontend.test.jsx`) | 1+ | ✅ 6 tests pasados |
| Security & Secrets | Vitest (`security.test.js`)| 1+ | ✅ 11 tests pasados |
| Netlify & Routing  | Vitest (`routes.test.js`)  | 1+     | ✅ 2 tests pasados |
| Netlify Dev Smoke  | Netlify CLI (HTTP real)    | 1+     | ✅ Validado (HTTP 401 JSON) |
| Integration tests  | Multi-tenant manual        | 2+     | Pendiente Stage 2 |
| Security audits    | `npm audit --omit=dev`     | 1+, 9  | ✅ 0 críticas, 0 altas |

---

### Matriz de 35 Pruebas Automatizadas Implementadas (Stage 1 + Hotfix Modular & Version Pinning)

1. **`auth-backend.test.js` (16 pruebas)**
   - `1. Sin token -> responde 401 (AUTH_TOKEN_MISSING)`
   - `2. Token malformado (sin 3 segmentos) -> responde 401 (AUTH_TOKEN_MALFORMED)`
   - `3. Token malformado (longitud muy corta) -> responde 401 (AUTH_TOKEN_MALFORMED)`
   - `4. Error de configuración de Firebase Admin -> responde 500 (AUTH_SERVER_MISCONFIGURED)`
   - `5. Error de verificación de Firebase (token expirado) -> responde 401 (AUTH_TOKEN_EXPIRED)`
   - `6. TypeError / fallo interno durante verificación -> responde 500 (AUTH_VERIFICATION_FAILED)`
   - `7. Email no verificado -> responde 403 (AUTH_EMAIL_NOT_VERIFIED)`
   - `8. Firebase válido sin usuario en MongoDB y no es super_admin -> responde 403 (USER_NOT_AUTHORIZED)`
   - `9. Correo distinto a SUPER_ADMIN_EMAIL no obtiene super_admin`
   - `10. Super_admin correcto -> bootstrap atómico con findOneAndUpdate y upsert`
   - `11. Recuperación explícita de colisión E11000 en bootstrap simultáneo`
   - `12. Rechazo de Identity Mismatch: mismo correo con UID diferente -> 403 (IDENTITY_MISMATCH)`
   - `13. Rechazo de Identity Mismatch: mismo UID con correo diferente -> 403 (IDENTITY_MISMATCH)`
   - `14. Segundo login de super_admin -> idempotente y no sobrescribe datos`
   - `15. Usuario suspendido en MongoDB -> responde 403 (USER_SUSPENDED)`
   - `16. Rol enviado desde frontend o parámetros es ignorado (solo GET /auth/me usa MongoDB)`

2. **`auth-frontend.test.jsx` (6 pruebas)**
   - `10. Rutas privadas -> redirige a /login cuando no hay usuario autenticado`
   - `10b. Usuario autenticado pero email no verificado -> redirige a /verify-email`
   - `10c. Usuario verificado sin perfil en MongoDB (403) -> redirige a /unauthorized`
   - `10d. Error de servidor 500 (serverUnavailable) en ProtectedRoute -> muestra pantalla Servicio No Disponible sin redirigir a /unauthorized`
   - `10e. Detección y distinción segura de proveedores (Google-only, Password, Ambos)`
   - `12. Componentes UI principales renderizan con diseño accesible`

3. **`security.test.js` (11 pruebas)**
   - `11. Ausencia de variables privadas o secretos en el bundle generado en dist/`
   - `11b. Variables públicas autorizadas utilizan exclusivamente prefijo VITE_`
   - `11c. Firebase Client Auth está explícitamente configurado con browserSessionPersistence`
   - `11d. Roles y permisos nunca se persisten en almacenamiento local/sessionStorage`
   - `11e.1 Acepta rutas internas registradas en la allowlist exacta (/app, /app/clients, etc.)`
   - `11e.2 Rechaza rutas no registradas (/application, /app-malicious, /app/unknown) -> fallback /app`
   - `11e.3 Rechaza open redirects relativos/absolutos (//evil.example, https://evil.com)`
   - `11e.4 Rechaza caracteres de escape con barra invertida (/app\evil.example)`
   - `11e.5 Rechaza valores nulos, undefined, objetos y arrays -> fallback /app`
   - `11f. firebaseAdmin.js utiliza exclusivamente imports modulares y no usa import default ni admin.apps`
   - `11g. Control de dependencias: firebase-admin permanece fijado en 13.10.0 evitando jwks-rsa 4 y jose 6 ESM-only`

4. **`routes.test.js` (2 pruebas)**
   - `1. netlify.toml define el redirect exacto de /api/auth/me hacia /.netlify/functions/api-auth-me con force = true`
   - `2. Smoke test: /api/auth/me alcanza directamente el handler real y responde JSON 401 sin token`

---

## 2. Stage 1 — Auth & Master Access Acceptance Tests

### Test 1: Super Admin First Login & Bootstrap
1. Configurar `SUPER_ADMIN_EMAIL` en las variables de entorno de Netlify / local.
2. Crear manualmente el usuario en Firebase Console con ese correo exacto y marcarlo como verificado.
3. Abrir la aplicación en ventana de incógnito.
4. Iniciar sesión con email y contraseña.
5. **Verificaciones esperadas:**
   - `api-auth-me` responde 200 con `role: "super_admin"`, `status: "active"`, `clientIds: []`.
   - Se crea el documento correspondiente en la colección `users` de MongoDB (`anima_mkt_crm`).
   - El dashboard carga con estados vacíos amigables (sin errores por ausencia de clientes).
   - La barra de navegación muestra opciones completas para super_admin.

### Test 2: Usuario autenticado en Firebase pero inexistente en MongoDB → 403
1. Crear un usuario de prueba en Firebase Console con un correo cualquiera (distinto a `SUPER_ADMIN_EMAIL`).
2. Iniciar sesión en la app con este usuario.
3. `api-auth-me` valida el token pero busca en MongoDB y no encuentra perfil registrado.
4. **Verificación esperada:**
   - `api-auth-me` responde `403 Forbidden`.
   - La interfaz muestra un mensaje claro de "Usuario no autorizado o sin perfil asignado" y no permite acceder al dashboard.

### Test 3: Correo distinto de SUPER_ADMIN_EMAIL no obtiene super_admin
1. Crear un usuario en MongoDB con rol `client` y correo `cliente@ejemplo.com`.
2. Crear el usuario en Firebase e iniciar sesión.
3. **Verificación esperada:**
   - `api-auth-me` retorna `role: "client"`.
   - Bajo ninguna circunstancia el usuario es promovido a `super_admin`.

### Test 4: Email no verificado → Acceso bloqueado con opción de reenvío
1. Crear un usuario en Firebase con `emailVerified: false`.
2. Iniciar sesión en la app.
3. **Verificación esperada:**
   - La aplicación detecta que el email no está verificado y muestra una pantalla bloqueante que impide acceder al dashboard.
   - La pantalla incluye un botón interactivo para enviar/reenviar el correo de verificación.
   - Cualquier llamada backend a `api-auth-me` responde `403 Forbidden` si `email_verified` es `false`.

### Test 5: Usuario suspendido → 403 aun con token válido
1. En MongoDB, cambiar el estado del usuario a `status: "suspended"`.
2. Con el usuario autenticado (token de Firebase válido), realizar cualquier petición a la API.
3. **Verificación esperada:**
   - La función responde `403 Forbidden`.
   - El frontend desautentica la sesión y redirige a la pantalla de bloqueo/login.

### Test 6: Intento de alta directa / no autorizada en Firebase
1. Si un atacante utiliza las credenciales públicas de Firebase para crear un usuario mediante la API de cliente de Firebase (`createUserWithEmailAndPassword`).
2. Intenta llamar a `api-auth-me` con el token emitido.
3. **Verificación esperada:**
   - Al no existir en MongoDB ni coincidir con `SUPER_ADMIN_EMAIL`, la API responde `403 Forbidden`.
   - El atacante no tiene acceso a ningún dato del CRM ni a pantallas internas.

### Test 7: Persistencia de sesión tras recargar
1. Iniciar sesión como super_admin.
2. Recargar la página (F5) o cerrar y reabrir la pestaña.
3. **Verificación esperada:**
   - La sesión se restaura automáticamente mediante `onIdTokenChanged`.
   - No hay parpadeos ni redirecciones erróneas a `/login`.

### Test 8: Logout completo
1. Estando autenticado, hacer clic en "Cerrar sesión".
2. **Verificación esperada:**
   - Firebase cierra la sesión.
   - El estado local en React se limpia.
   - Acceder directamente a `/dashboard` redirige de inmediato a `/login`.

### Test 9: Recuperación de contraseña
1. En la pantalla de login, hacer clic en "¿Olvidaste tu contraseña?".
2. Ingresar el correo del super_admin y enviar.
3. **Verificación esperada:**
   - Se recibe el correo de restablecimiento de Firebase.
   - El enlace permite definir una nueva contraseña y loguearse con ella.

---

## 3. Stage 2 — Multi-tenant & Isolation Acceptance Tests

### Test 10: Creación de cliente y aislamiento por rol
1. Como super_admin, crear los clientes "Empresa A" y "Empresa B".
2. Crear un usuario con rol `client` asignado únicamente a "Empresa A".
3. Iniciar sesión con dicho usuario.
4. **Verificación esperada:**
   - Solo visualiza los datos pertenecientes a "Empresa A".
   - Si intenta forzar la URL `/dashboard?clientId=<ID_Empresa_B>` o llamar directamente a la API con ese ID, recibe `403 Forbidden`.

### Test 11: Aislamiento para rol Salesperson
1. Crear un usuario con rol `salesperson` para "Empresa A".
2. Enviar 5 leads a "Empresa A", asignando 2 a este vendedor.
3. Iniciar sesión como vendedor.
4. **Verificación esperada:**
   - Visualiza únicamente los 2 leads asignados a su `userId`.
   - No tiene acceso a configuración, métricas globales ni leads de otros vendedores.

### Test 12: Modo "Ver como cliente" (Impersonación visual auditada)
1. Como super_admin, activar el modo "Ver como Empresa A".
2. **Verificación esperada:**
   - Aparece un banner persistente indicando que está en modo visualización de cliente.
   - El dashboard muestra el contexto de Empresa A.
   - Los permisos y la identidad real en el backend siguen siendo del super_admin.
   - El audit log registra la activación y salida del modo.

---

## 4. Security & Leak Acceptance Tests

### Test 13: Verificación de ausencia de secretos en el bundle (`dist/`)
1. Ejecutar `npm run build`.
2. Inspeccionar todos los archivos generados en `dist/` buscando cadenas o referencias a:
   - `MONGODB_URI`
   - `FIREBASE_PRIVATE_KEY`
   - `META_SYSTEM_USER_TOKEN`
   - `META_APP_SECRET`
   - `SUPER_ADMIN_EMAIL`
   - `CRON_SECRET`
3. **Verificación esperada:**
   - Cero ocurrencias de secretos o variables privadas en el bundle.

### Test 14: Verificación de consola y respuestas de red en el navegador
1. Abrir DevTools (Console y Network).
2. Navegar e interactuar con la aplicación.
3. **Verificación esperada:**
   - Ningún log imprime tokens privados, payloads con contraseñas o URIs de base de datos.
   - Las respuestas de error contienen mensajes genéricos y códigos HTTP estándar sin stack traces en producción.

### Test 15: Sanitización de Audit Logs
1. Ejecutar operaciones sensibles (cambio de rol, invitación de usuario).
2. Consultar directamente la colección `audit_logs` en MongoDB.
3. **Verificación esperada:**
   - Los registros no contienen campos de contraseñas, tokens de reseteo ni secretos.
