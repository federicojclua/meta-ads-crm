# Plan de Recuperación ante Desastres — Anima MKT CRM

Este documento describe los procedimientos operativos de emergencia para Anima MKT CRM. Debe ser consultado únicamente por roles de administración de infraestructura o el `super_admin`.

---

## 1. Backups y Restauración de MongoDB Atlas

MongoDB Atlas realiza copias de seguridad automáticas de acuerdo con el tier de cluster configurado. En caso de fallas de integridad de datos o corrupción por software, siga estos pasos:

### A. Copias de Seguridad Manuales (Ad-hoc)
Para crear un backup instantáneo local antes de realizar migraciones o cambios estructurales críticos:
1. Asegúrese de tener instalado el conjunto de herramientas de base de datos de MongoDB (`mongodump` y `mongorestore`).
2. Obtenga la cadena de conexión de producción.
3. Ejecute el siguiente comando para exportar la base de datos completa:
   ```bash
   mongodump --uri="mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/meta-ads-crm" --out=./backups/backup-$(date +%F)
   ```

### B. Restauración de Datos
Para restaurar una copia de seguridad manual en el cluster:
1. **¡ATENCIÓN!** La restauración sobrescribirá o mezclará documentos existentes. Se recomienda realizar una copia de seguridad del estado actual antes de restaurar.
2. Ejecute el siguiente comando para inyectar el backup de retorno:
   ```bash
   mongorestore --uri="mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/meta-ads-crm" --drop ./backups/backup-<fecha>/meta-ads-crm
   ```
   *Nota: La bandera `--drop` elimina las colecciones existentes antes de recrearlas para evitar duplicados.*

### C. Restauración desde la consola de MongoDB Atlas
1. Inicie sesión en [MongoDB Atlas](https://cloud.mongodb.com).
2. Vaya a **Database** > **Clusters** > Seleccione su cluster.
3. Haga clic en la pestaña **Backup**.
4. Seleccione el snapshot deseado en la línea de tiempo y haga clic en **Restore**.
5. Elija restaurar en el mismo cluster (sobreescribiendo) o en un cluster temporal de pruebas.

---

## 2. Rollbacks (Retornos) en Netlify

Si un nuevo despliegue en producción introduce regresiones críticas o fallos de renderizado en el cliente:

### A. Revertir mediante Netlify UI (Recomendado)
1. Acceda al panel de control de [Netlify](https://app.netlify.com).
2. Seleccione el sitio `anima-mkt-crm`.
3. Vaya a la sección **Deploys**.
4. Busque el último despliegue exitoso anterior a la falla (marcado como "Published").
5. Haga clic sobre él para ver los detalles.
6. Haga clic en el botón **Lock to this deploy** (Bloquear en este despliegue). Esto congelará la producción en ese build específico y detendrá los auto-despliegues procedentes de la rama `main` hasta que se resuelva el problema.

### B. Revertir desde Git
Si prefiere forzar un rollback directo en el repositorio remoto:
1. Localice el hash del último commit estable (ej. `dbb9c76`).
2. Haga un reset local y force push a `main`:
   ```bash
   git reset --hard dbb9c76
   git push origin main --force
   ```
3. Vaya a Netlify y asegúrese de que el nuevo build gatillado por el force-push se compile y publique correctamente.

---

## 3. Desactivación de Emergencia del Módulo de Meta Ads

En caso de que la API de Meta Graph empiece a fallar, consuma cuotas de API de forma desmedida, o se deba suspender de urgencia la sincronización:

### A. Desactivar Sincronización Manual (Desde el CRM)
Si desea impedir que los administradores inicien sincronizaciones manuales desde la interfaz del panel de administración:
1. Ingrese a la configuración del sitio en Netlify.
2. Vaya a **Site configuration** > **Environment variables**.
3. Cambie la variable:
   ```env
   META_MANUAL_SYNC_ENABLED = "false"
   ```
4. Guarde el cambio. Esto bloqueará inmediatamente el endpoint `/api/meta/sync` (POST) devolviendo un código `503 Service Unavailable`.

### B. Desactivar la Sincronización Automática (Cron de Netlify)
El cron corre en Netlify programado bajo el estándar de cron triggers. Si requiere suspenderlo:
1. Ingrese al archivo [netlify.toml](file:///c:/Users/Federico/Downloads/meta-ads-crm-main/netlify.toml) o a la consola de Netlify de tareas programadas.
2. Si el cron está definido mediante un Netlify Background Function o un scheduler de Netlify Scheduled Functions:
   - Para apagar el cron temporalmente en producción sin modificar código, elimine o altere la variable de entorno `META_CRON_SECRET` de Netlify.
   - Las llamadas entrantes del cron externo fallarán con `403 Forbidden` al no coincidir la clave secreta de verificación.

---

## 4. Rotación de Credenciales de Seguridad

Si se sospecha que una clave o secreto ha sido expuesto:

### A. MongoDB Atlas URI
1. Ingrese a MongoDB Atlas y vaya a **Database Access**.
2. Modifique la contraseña del usuario afectado o cree un usuario nuevo y elimine el comprometido.
3. Actualice la variable de entorno `MONGODB_URI` en Netlify y guarde cambios.

### B. Firebase Auth Admin SDK
1. Ingrese a [Firebase Console](https://console.firebase.google.com).
2. Vaya a **Configuración del Proyecto** > **Cuentas de Servicio**.
3. Haga clic en **Generar nueva clave privada**.
4. Codifique el archivo JSON resultante en Base64.
5. Actualice la variable de entorno `FIREBASE_SERVICE_ACCOUNT_BASE64` en Netlify.

### C. Meta Graph Tokens
1. Ingrese a [Meta for Developers](https://developers.facebook.com).
2. Genere un nuevo Token de Acceso del Sistema o actualice las credenciales de la App.
3. Actualice las variables correspondientes en Netlify (`META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`).
