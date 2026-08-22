# Anima MKT CRM — Environment Setup

## Prerequisites

| Tool          | Version  | Purpose                              |
|---------------|----------|--------------------------------------|
| Node.js       | 24 LTS   | Runtime for Vite and Netlify Fns (.nvmrc: 24) |
| npm           | 10+      | Package manager                      |
| Git           | 2.40+    | Version control                      |
| Netlify CLI   | latest   | Local development with functions     |

## 1. Local Development Setup

```bash
# 1. Clone or navigate to the project
cd anima-mkt-crm

# 2. Install dependencies (when Stage 1 begins)
npm install

# 3. Create local environment file
cp .env.example .env.local

# 4. Fill in real values in .env.local
#    - Firebase client keys (VITE_FIREBASE_*)
#    - Firebase Admin credentials (FIREBASE_*)
#    - MongoDB connection string (MONGODB_URI)
#    - SUPER_ADMIN_EMAIL

# 5. Start development server with Netlify Functions
npx netlify dev
```

## 2. Firebase Setup

### 2.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (e.g., "anima-mkt-crm")
3. Disable Google Analytics (optional)

### 2.2 Enable Authentication
1. Go to Authentication → Sign-in method
2. Enable **Email/Password** provider
3. Configure authorized domains:
   - `localhost` (for local development)
   - Your Netlify production and preview site domains (e.g. `anima-mkt-crm.netlify.app`)

### 2.3 Creation of First Super Admin & Email Verification
- En Firebase Authentication estándar no existe un interruptor en la consola para deshabilitar altas vía API del cliente.
- **Estrategia del MVP:**
  1. No se construye ninguna pantalla ni formulario de registro público en la aplicación web.
  2. El primer usuario `super_admin` se da de alta manualmente desde la pestaña **Users** en Firebase Console (ingresando el correo exacto configurado en `SUPER_ADMIN_EMAIL` y una contraseña inicial segura).
  3. El usuario debe iniciar sesión y **verificar su correo electrónico**. Si aún no está verificado, el frontend ofrece un botón interactivo para enviar el correo de verificación de Firebase.
  4. Recién después de verificar el correo y volver a autenticarse, la función server-side `api-auth-me` constata `email_verified: true`, verifica que coincide exactamente con `SUPER_ADMIN_EMAIL`, y crea automáticamente el perfil con rol `super_admin` en la colección `users` de MongoDB (`anima_mkt_crm`).
  5. Cualquier usuario autenticado en Firebase que no tenga su correo verificado o que no cuente con un perfil activo en MongoDB recibirá inmediatamente `403 Forbidden`.
- **Opción Futura de Hardening:**
  - Para proyectos con requerimientos de seguridad avanzados, es posible migrar o activar **Google Cloud Identity Platform** en el mismo proyecto de Google Cloud para deshabilitar programáticamente el registro de usuarios (`client.permissions.disabledUserSignup`). No es obligatorio para el MVP inicial.

### 2.4 Get Client Configuration (Public)
1. Go to Project Settings → General → Your apps
2. Click "Add app" → Web
3. Copy the configuration values:
   ```
   VITE_FIREBASE_API_KEY=<set-in-netlify>
   VITE_FIREBASE_AUTH_DOMAIN=<set-in-netlify>
   VITE_FIREBASE_PROJECT_ID=<set-in-netlify>
   VITE_FIREBASE_APP_ID=<set-in-netlify>
   ```

### 2.5 Generate Service Account Key (Server-side Secret)
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values for server-side environment variables:
   ```
   FIREBASE_PROJECT_ID=<set-in-netlify>
   FIREBASE_CLIENT_EMAIL=<set-in-netlify>
   FIREBASE_PRIVATE_KEY=<set-in-netlify>  (the RSA private key, preserving \n formatting)
   ```
5. **NEVER** commit the JSON file — it is ignored by `.gitignore`.

### 2.6 User Invitations & Password Links (Stage 2)
- En la Etapa 2, cuando un super_admin invite usuarios, la función server-side creará el usuario mediante Firebase Admin SDK y generará un enlace con `admin.auth().generatePasswordResetLink(email)`.
- **Nota importante:** `generatePasswordResetLink` genera la URL pero **no envía el correo electrónico automáticamente**. Se definirá un servicio de correo transaccional (ej. Resend, SendGrid) o un flujo controlado antes de implementar las invitaciones.

## 3. MongoDB Atlas Setup

### 3.1 Create Cluster
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster (or dedicated cluster)
3. Choose a region close to your Netlify Functions region

### 3.2 Create Dedicated Database User
1. Go to Database Access
2. Create a user with exclusive `readWrite` role scoped **only** to the `anima_mkt_crm` database
3. Generate a strong, unique password (32+ random characters)

### 3.3 Configure Network Access & Security Considerations
1. Go to Network Access
2. Add `0.0.0.0/0` (Allow Access from Anywhere)
   - *Nota de seguridad:* Debido a que las funciones serverless de Netlify utilizan rangos de IP dinámicos que cambian constantemente, Atlas requiere habilitar `0.0.0.0/0` para permitir la conexión desde el runtime de Netlify.
   - **Esta apertura de red no es 100% segura por sí sola**, por lo que debe compensarse obligatoriamente con:
     - Usuario de base de datos con privilegios mínimos exclusivos para `anima_mkt_crm`.
     - Contraseña de alta entropía.
     - Conexiones con cifrado TLS obligatorio en tránsito.
     - Rotación periódica de credenciales.
     - Conexión basada en SRV URI protegida.

### 3.4 Get Connection String
1. Go to Database → Connect → Drivers (Node.js)
2. Copy the connection string
3. Format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/anima_mkt_crm?retryWrites=true&w=majority`
4. Set as `MONGODB_URI` in server-side environment variables.

## 4. Netlify Setup

### 4.1 Project Configuration
1. Proyecto nuevo en Netlify: `anima-mkt-crm`
2. Vinculado al repositorio de GitHub (`federicojclua/meta-ads-crm`)
3. *Nota importante:* El sitio anterior `crmmet.netlify.app` no debe tocarse.
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

### 4.2 Set Server-side Environment Variables
In Netlify Dashboard → Site settings → Environment variables:

```
SUPER_ADMIN_EMAIL=<tu-correo-super-admin>
MONGODB_URI=<mongodb-connection-string>
MONGODB_DB_NAME=anima_mkt_crm
FIREBASE_PROJECT_ID=<firebase-project-id>
FIREBASE_CLIENT_EMAIL=<firebase-service-account-email>
FIREBASE_PRIVATE_KEY=<firebase-rsa-private-key>
```

> ⚠️ Estos secretos NO deben llevar el prefijo `VITE_`. Son leídos exclusivamente por las Netlify Functions.

### 4.3 Netlify Functions Limits & Timeouts

| Function Type | Execution Limit | Intended Usage |
|---------------|-----------------|----------------|
| Synchronous API Functions | 60 seconds | `api-auth-me`, CRUD de clientes, usuarios, leads |
| Scheduled Functions (Cron) | 30 seconds | Disparadores periódicos de sincronización |
| Background Functions (`*-background.js`) | Hasta 15 minutos | Sincronizaciones extensas de Meta Marketing API |

## 5. Development Workflow

```bash
# Iniciar entorno local (Vite + Netlify Functions)
npx netlify dev

# Compilar para producción
npm run build

# Desplegar preview
npx netlify deploy

# Desplegar a producción
npx netlify deploy --prod
```

## 6. Environment Variable Summary

| Variable                    | Where to Set         | Security Classification      |
|-----------------------------|---------------------|------------------------------|
| `VITE_FIREBASE_API_KEY`     | .env.local + Netlify | Public config (browser bundle)|
| `VITE_FIREBASE_AUTH_DOMAIN` | .env.local + Netlify | Public config (browser bundle)|
| `VITE_FIREBASE_PROJECT_ID`  | .env.local + Netlify | Public config (browser bundle)|
| `VITE_FIREBASE_APP_ID`      | .env.local + Netlify | Public config (browser bundle)|
| `SUPER_ADMIN_EMAIL`         | Netlify / .env.local| Server-side only (Bootstrap) |
| `MONGODB_URI`               | Netlify / .env.local| Server-side SECRET           |
| `MONGODB_DB_NAME`           | Netlify / .env.local| Server-side config (`anima_mkt_crm`) |
| `FIREBASE_PROJECT_ID`       | Netlify / .env.local| Server-side config           |
| `FIREBASE_CLIENT_EMAIL`     | Netlify / .env.local| Server-side config           |
| `FIREBASE_PRIVATE_KEY`      | Netlify / .env.local| Server-side SECRET           |
| `META_APP_ID`               | Netlify / .env.local| Server-side config           |
| `META_APP_SECRET`           | Netlify / .env.local| Server-side SECRET           |
| `META_SYSTEM_USER_TOKEN`    | Netlify / .env.local| Server-side SECRET           |
| `META_API_VERSION`          | Netlify / .env.local| Server-side config (v26.0)   |
| `ENABLE_META_LEAD_ADS`      | Netlify / .env.local| Server-side feature flag     |
| `CRON_SECRET`               | Netlify / .env.local| Server-side SECRET           |
