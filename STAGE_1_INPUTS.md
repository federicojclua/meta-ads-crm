# Anima MKT CRM — Estado de Insumos para Iniciar la Etapa 1

Estado y registro de variables requeridas antes de comenzar la **Etapa 1 (Foundation, Auth & Minimal User DB)**:

---

## 1. Base de Datos (MongoDB Atlas)

- **Estado:** ✅ Preparado.
- **Base de datos configurada:** `anima_mkt_crm` (`MONGODB_DB_NAME=anima_mkt_crm`).
- **Cadena de conexión (`MONGODB_URI`):** ✅ Cargada en Netlify como variable server-side.
- **Confirmación de seguridad pendiente:**
  - [ ] Verificar que el usuario de base de datos cuente con rol `readWrite` exclusivo únicamente sobre la base `anima_mkt_crm`.
  - [ ] Verificar que la lista de acceso de red (Network Access IP Whitelist) en MongoDB Atlas incluya `0.0.0.0/0` para permitir llamadas desde las Netlify Functions serverless.

---

## 2. Plataforma de Hosting (Netlify)

- **Estado:** ✅ Preparado.
- **Proyecto nuevo creado en Netlify:** `anima-mkt-crm` vinculado al repositorio GitHub (`federicojclua/meta-ads-crm`).
- **Sitio anterior:** El sitio legacy `crmmet.netlify.app` permanece intacto y **no debe tocarse**.

---

## 3. Autenticación (Firebase Authentication)

- **Estado:** 🟡 Pendiente de creación y configuración.
- **Acciones pendientes en Firebase Console:**
  1. [ ] Crear proyecto en [Firebase Console](https://console.firebase.google.com) (ej. `anima-mkt-crm`).
  2. [ ] Habilitar proveedor **Email/Password** en *Authentication → Sign-in method*.
  3. [ ] Agregar dominios autorizados (`localhost`, `anima-mkt-crm.netlify.app`).
  4. [ ] Crear manualmente el primer usuario para el `super_admin` con el correo exacto que se configurará en `SUPER_ADMIN_EMAIL`.
  5. [ ] Obtener configuración pública del cliente y configurar en `.env.local` y Netlify:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_APP_ID`
  6. [ ] Generar clave privada de Service Account (*Project Settings → Service Accounts*) y configurar como variables server-side en Netlify y `.env.local`:
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
  7. [ ] Configurar variable server-side `SUPER_ADMIN_EMAIL=<tu-correo-super-admin>`.

---

> ⚠️ **Resumen de Bloqueo:** La Etapa 1 podrá iniciarse en cuanto se disponga de la configuración de Firebase Authentication y se realice la verificación del email del super_admin.
