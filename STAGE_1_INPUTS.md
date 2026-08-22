# Anima MKT CRM — Estado de Insumos para Iniciar la Etapa 1

Estado y registro de variables e insumos requeridos para la **Etapa 1 (Foundation, Auth & Minimal User DB)**:

---

## 1. Base de Datos (MongoDB Atlas)

- **Estado:** ✅ Preparado.
- **Base de datos configurada:** `anima_mkt_crm` (`MONGODB_DB_NAME=anima_mkt_crm`).
- **Cadena de conexión (`MONGODB_URI`):** ✅ Cargada en Netlify como variable server-side.
- **Seguridad configurada:**
  - Usuario de base de datos con rol `readWrite` exclusivo únicamente sobre la base `anima_mkt_crm`.
  - Acceso de red (Network Access IP Whitelist) en MongoDB Atlas con `0.0.0.0/0` para permitir llamadas desde las Netlify Functions serverless.
  - IP de desarrollo autorizada.

---

## 2. Plataforma de Hosting (Netlify)

- **Estado:** ✅ Preparado.
- **Proyecto nuevo creado en Netlify:** `anima-mkt-crm` vinculado al repositorio GitHub (`federicojclua/meta-ads-crm`).
- **Sitio anterior:** El sitio legacy `crmmet.netlify.app` permanece intacto y **no debe tocarse**.
- **URL de Aplicación:** `APP_URL=https://anima-mkt-crm.netlify.app`.

---

## 3. Autenticación (Firebase Authentication)

- **Estado:** ✅ Configurado en Firebase Console.
- **Proyecto:** Anima MKT CRM.
- **Proveedores habilitados:** Email/Password + Google Sign-In.
- **Aplicación web registrada.**
- **Variables públicas (Frontend):**
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
- **Variables privadas (Netlify Functions):**
  - `SUPER_ADMIN_EMAIL`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
- **Acción Manual de Verificación:** Asegurar que `anima-mkt-crm.netlify.app` y `localhost` estén en la lista de dominios autorizados en Firebase Authentication.

---

## 4. Identidad Visual Funcional

- **Tokens definidos:**
  - Fondo general: `#F7F6F2`
  - Superficie: `#FFFFFF`
  - Rojo principal: `#B91C1C` / `#7F1D1D`
  - Texto principal: `#202020`
  - Texto secundario: `#666666`
  - Borde: `#E5E0D8`
  - Verde éxito: `#15803D`
  - Amarillo atención: `#F4C430` (con texto oscuro)
  - Wordmark: "ANIMA MKT CRM"
