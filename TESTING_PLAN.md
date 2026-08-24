# Anima MKT CRM — Testing Plan

## 1. Testing Strategy

| Level              | Tool / Method             | Stage  | Estado |
|--------------------|---------------------------|--------|--------|
| Unit & Backend Auth| Vitest (`auth-backend.test.js`) | 1+ | ✅ 16 tests pasados |
| Clients Backend    | Vitest (`clients-backend.test.js`) | 2+ | ✅ 8 tests pasados |
| Users Backend      | Vitest (`users-backend.test.js`) | 2+ | ✅ 10 tests pasados |
| Tenant Isolation   | Vitest (`multi-tenant-isolation.test.js`) | 2+ | ✅ 8 tests pasados |
| Leads Backend      | Vitest (`leads-backend.test.js`) | 3+ | ✅ 9 tests pasados |
| Sales Backend      | Vitest (`sales-backend.test.js`) | 3+ | ✅ 5 tests pasados |
| Sales Concurrency  | Vitest (`sales-concurrency.test.js`) | 3+ | ✅ 4 tests pasados |
| Stage 3 Audit      | Vitest (`stage3-audit-final.test.js`) | 3+ | ✅ 11 tests pasados |
| Meta Backend API   | Vitest (`meta-backend.test.js`) | 4+ | ✅ 21 tests pasados |
| Meta Frontend UI   | Vitest (`meta-frontend.test.jsx`) | 4+ | ✅ 4 tests pasados |
| Security & Secrets | Vitest (`security.test.js`)| 1+ | ✅ 11 tests pasados |
| Total Tests        | Vitest (`npm test`)        | 4  | ✅ **163 tests en 20 suites (100% pasando)** |

---

### Matriz de 63 Pruebas Automatizadas Implementadas (Stage 2)

1. **`clients-backend.test.js` (6 pruebas)**
   - `1. GET /api/clients lista todos los clientes para un super_admin`
   - `2. POST /api/clients crea un cliente exitosamente con slug único`
   - `3. POST /api/clients rechaza slug duplicado con código 409 (SLUG_ALREADY_EXISTS)`
   - `4. POST /api/clients rechaza tokens de acceso Meta en metaAdAccountIds`
   - `5. POST /api/clients/:id/deactivate desactiva el cliente lógicamente (status: inactive)`
   - `6. POST /api/clients/:id/reactivate reactiva un cliente inactivo`

2. **`users-backend.test.js` (6 pruebas)**
   - `1. POST /api/users/authorize preautoriza un usuario con firebaseUid null y status invited`
   - `2. POST /api/users/authorize rechaza correo duplicado con 409 (EMAIL_ALREADY_EXISTS)`
   - `3. POST /api/users/authorize ejecutado por admin no puede crear super_admin (403)`
   - `4. POST /api/users/:id/suspend suspende un usuario y rechaza auto-suspensión`
   - `5. POST /api/users/:id/suspend ejecutado por admin no puede suspender a super_admin (403)`
   - `6. PATCH /api/users/:id bloquea modificación del propio rol (403 CANNOT_MODIFY_OWN_ROLE)`

3. **`multi-tenant-isolation.test.js` (6 pruebas)**
   - `1. Usuario preautorizado vincula firebaseUid atómicamente en su primer login con Google en api-auth-me`
   - `2. api-auth-me rechaza usuario no preautorizado con 403 (USER_NOT_AUTHORIZED)`
   - `3. api-auth-me rechaza login si la empresa asignada está inactiva con 403 (CLIENT_INACTIVE)`
   - `4. GET /api/clients/:id rechaza acceso de usuario cliente a otra empresa con 403 (FORBIDDEN_CLIENT_ACCESS)`
   - `5. GET /api/clients fuerza filtro de tenant estricto para rol client independientemente de parámetros en query`
   - `6. GET /api/users restringe a rol salesperson a ver exclusivamente usuarios de su misma empresa`

4. **`clients-frontend.test.jsx` (3 pruebas)**
   - `1. ClientsPage renderiza empresas y badges correctamente`
   - `2. ClientModal valida que el nombre sea obligatorio antes de enviar`
   - `3. AuthorizeUserModal valida correo y muestra enlace tras autorizar`

5. **`auth-backend.test.js` (16 pruebas)**
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

6. **`auth-frontend.test.jsx` (12 pruebas)**
   - `10. Rutas privadas -> redirige a /login cuando no hay usuario autenticado`
   - `10b. Usuario autenticado pero email no verificado -> redirige a /verify-email`
   - `10c. Usuario verificado sin perfil en MongoDB (403) -> redirige a /unauthorized`
   - `10d. Error de servidor 500 (serverUnavailable) en ProtectedRoute -> muestra pantalla Servicio No Disponible sin redirigir a /unauthorized`
   - `10e. Detección y distinción segura de proveedores (Google-only, Password, Ambos)`
   - `12. Componentes UI principales renderizan con diseño accesible`
   - `13a. SettingsPage: Cuenta Google-only renderiza estados y permite desplegar el formulario de crear contraseña`
   - `13b. SettingsPage: Formulario de contraseña valida largo mínimo y coincidencia de contraseñas`
   - `13c. SettingsPage: Vinculación exitosa conserva el mismo firebaseUid y actualiza el estado`
   - `13d. SettingsPage: Manejo de error cuando la credencial ya está en uso (credential-already-in-use)`
   - `13e. SettingsPage: Cuenta con contraseña configurada muestra estado y opción de restablecimiento`
   - `13f. SettingsPage: Rechazo dinámico cuando validatePassword de Firebase indica que la contraseña no cumple la política activa`

7. **`security.test.js` (12 pruebas)**
   - `11. Ausencia de variables privadas o secretos en el bundle generado en dist/`
   - `11b. Variables públicas autorizadas utilizan exclusivamente prefijo VITE_`
   - `11c. Firebase Client Auth está explícitamente configurado con browserSessionPersistence`
   - `11d. Roles y permisos nunca se persisten en almacenamiento local/sessionStorage`
   - `11e.1 Acepta rutas internas registradas en la allowlist exacta (/app, /app/clients, etc.)`
   - `11e.2 Rechaza rutas no registradas (/application, /app-malicious, /app/unknown) -> fallback /app`
   - `11e.3 Rechaza open redirects relativos/absolutos (//evil.example, https://evil.com)`
   - `11e.4 Rechaza caracteres de escape con barra invertida (/app\evil.example)`
   - `11e.5 Rechaza valores nulos, undefined, objetos y arrays -> fallback /app`
   - `11f. Importaciones modulares de Firebase Admin`
   - `11g. Fijación de versión 13.10.0 en package.json`
   - `11h. Ausencia de contraseñas en código fuente, logs y almacenamiento`

8. **`routes.test.js` (2 pruebas)**
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

---

## 5. Stage 3 — Leads, Commercial Pipeline, Sales & Minor Units Testing Protocols

### Test 16: Alta manual de prospectos y validaciones de contacto
1. Crear un lead completando solo Nombre. Verificar que el backend y frontend rechacen la solicitud indicando que requiere al menos un Email o un Teléfono válido.
2. Crear un lead con Nombre y Email válido. Verificar asignación a la etapa `new`, registro en `lead_activities` y guardado de `acquiredAt`.

### Test 17: Importación masiva CSV con detección de duplicados e idempotencia
1. Cargar un CSV con 10 registros, incluyendo un contacto duplicado y uno con vendedor asignado.
2. **Verificación esperada:**
   - Previsualización tabular interactiva sin colgar el hilo del navegador.
   - Idempotencia: el segundo intento con la misma clave `ingestionKey` es ignorado de forma segura sin duplicar registros.
   - Creación de actividades de ingesta para todos los prospectos importados.

### Test 18: Tablero Kanban interactivo & transiciones de ciclo de vida
1. Mover un lead de `new` a `contacted`, `qualified` y `won`.
2. **Verificación esperada:**
   - Registro de timestamps `firstContactedAt`, `qualifiedAt`, `wonAt`.
   - Generación de tarjetas con etiquetas de colores, contadores de columna y montos acumulados por etapa.
   - Posibilidad de mover etapas con botones accesibles (`<` y `>`) y desde la ficha de detalle.

### Test 19: Registro de ventas en centavos (minor units) y confirmación de cobros
1. Registrar una venta de $150.000,00 ARS (`amountMinor: 15000000`).
2. Verificar que el lead pase automáticamente a la etapa `won`.
3. Confirmar un cobro parcial de $50.000,00 ARS. Verificar que el estado pase a `partial`.
4. Intentar ingresar un cobro que supere el saldo restante ($110.000,00). Verificar que el sistema rechace con `400 COLLECTED_EXCEEDS_AMOUNT`.
5. Confirmar el saldo restante ($100.000,00). Verificar que el estado pase a `collected`.

### Test 20: Restricciones de vendedor (scoping estricto)
1. Iniciar sesión como `salesperson`.
2. Intentar reasignar un lead a otro vendedor. Verificar rechazo `403 SALESPERSON_CANNOT_REASSIGN`.
3. Intentar confirmar un cobro o cancelar una venta. Verificar rechazo `403 CANNOT_CONFIRM_COLLECTIONS` / `403 CANNOT_CANCEL_SALES`.
4. Verificar que solo visualiza leads y ventas asignadas a su propio `userId`.

### Test 21: Dashboard KPIs con segregación de divisas
1. Registrar ventas cobradas en ARS y ventas cobradas en USD.
2. Consultar el Dashboard.
3. **Verificación esperada:**
   - Los ingresos cobrados se muestran desglosados por moneda sin sumas no convertidas.
   - Los KPIs de Meta Ads muestran *"Sin datos de Meta (Etapa 4)"* de manera explícita.
   - El ranking de vendedores muestra leads asignados, ganados, tasa de conversión e ingresos cobrados.

### Test 22: Parser CSV RFC 4180 y soporte de archivos de Excel (BOM)
1. Cargar archivo CSV con UTF-8 BOM (`\uFEFF`), comas dentro de comillas (`"Gómez, Juan"`), saltos de línea multilínea y separadores punto y coma.
2. Verificar que `parseCsvString` parsee todas las filas y columnas correctamente sin desalineaciones.
3. Verificar que archivos que superen 1 MB o 500 filas sean rechazados con mensajes claros.

### Test 23: Concurrencia en cobros y prevención de sobrecobro
1. Simular dos solicitudes de cobro concurrentes de $60.000 sobre una venta de $100.000.
2. Verificar que la primera sea procesada atómicamente y la segunda sea rechazada con `409 COLLECTED_EXCEEDS_AMOUNT`.
3. Verificar que el array `payments` guarde el histórico inmutable con su propio tipo de cambio individual.

---

## 6. Phase 5A — Gate 1: Endurecimiento Técnico, Kill Switch y Alta Manual

### Test 24: Endpoint de Diagnóstico /status Endurecido
1. Realizar un GET a `/api/meta/status` con credenciales configuradas.
2. Verificar que la respuesta JSON no contenga valores de tokens, prefijos, sufijos ni fragmentos enmascarados del token (`META_SYSTEM_USER_TOKEN` o `META_APP_SECRET`).
3. Verificar que retorne flags booleanos: `hasAppId`, `hasAppSecret`, `hasSystemUserToken`, `hasBusinessId`, `hasCronSecret`, y `manualSyncEnabled`.

### Test 25: Kill Switch de Sincronización Manual (`META_MANUAL_SYNC_ENABLED`)
1. Intentar disparar una sincronización manual mediante POST a `/api/meta/sync` cuando `META_MANUAL_SYNC_ENABLED` es `false` o no está definido.
2. Verificar que la API responda con HTTP `503 Service Unavailable` y código `META_MANUAL_SYNC_DISABLED`.
3. Establecer `META_MANUAL_SYNC_ENABLED=true`. Intentar disparar de nuevo como `super_admin`. Verificar que la petición sea aceptada (HTTP `202 Accepted`).
4. Intentar disparar con `META_MANUAL_SYNC_ENABLED=true` utilizando un rol sin privilegios (`salesperson` o `client`). Verificar rechazo con HTTP `403 Forbidden`.

### Test 26: Independencia del Cron con Kill Switch Activo
1. Con `META_MANUAL_SYNC_ENABLED=false`, enviar una petición POST a `/api/meta/sync` incluyendo la cabecera `X-Cron-Auth` con el `CRON_SECRET` correcto.
2. Verificar que la petición de cron sea procesada exitosamente, evadiendo el bloqueo de sincronización manual.

### Test 27: Alta Administrativa y Detección de Conflictos
1. Registrar una cuenta o píxel mediante `POST /api/meta/assets/manual`. Verificar normalización de IDs.
2. Asignar el píxel a la Empresa A mediante `POST /api/meta/assign`.
3. Intentar asignar el mismo píxel a la Empresa B. Verificar que la API bloquee la operación con HTTP `409 Conflict` e identifique el conflicto del activo asignado.
