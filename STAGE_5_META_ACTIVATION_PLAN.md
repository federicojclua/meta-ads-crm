# Plan de Activación y Validación Controlada de Meta Ads (Fase 5A)

Este documento detalla el procedimiento operativo, de configuración, seguridad y control de calidad para realizar la primera conexión y onboarding piloto de un activo publicitario real de Meta en el CRM de Anima MKT.

---

## 1. Estado de Git y Rama de Trabajo

* **Rama de origen:** `stage4-fixes` (todas las correcciones de la Etapa 4 se encuentran commiteadas y subidas a GitHub bajo el commit `8fa57d0`).
* **Rama de trabajo actual:** `stage5-meta-activation` (creada localmente a partir del estado limpio de `stage4-fixes`).
* **Compromiso de modificación:** No se realizarán commits, pushes, merges ni despliegues de código durante esta fase de planificación. Tampoco se modificará el código fuente del proyecto.

---

## 2. Alineación del Roadmap y ROADMAP Conflict Resolution

### Definición Anterior (Roadmap Original)
El plan de implementación inicial (`IMPLEMENTATION_PLAN.md` y `PRODUCT_SPEC.md`) definía la **Etapa 5** como el desarrollo y ensamble del **Revenue Dashboard** (agregación avanzada de inversión, funnel de conversión visual, soporte multidivisa con `exchange_rates` en la base de datos, filtros interactivos y exportación CSV/PDF).

### Nueva Definición Propuesta (Fase 5A)
Para esta ejecución, la **Fase 5A** se redefine exclusivamente como la **Activación controlada, onboarding del primer activo real y validación end-to-end** del sistema de lectura, sincronización y multiempresa de Meta Ads desarrollado en la Etapa 4, sin desarrollo de nuevas funciones en el frontend ni backend.

### Funcionalidades Postergadas
* Agregación visual y gráficos del embudo de conversión en el frontend.
* Integración activa de la colección de base de datos `exchange_rates` para conversiones multidivisa dinámicas en consultas agregadas.
* Exportación de informes estructurados en CSV y PDF.

### Documentos a Corregir Posteriormente
* [`IMPLEMENTATION_PLAN.md`](file:///C:/Users/Federico/Downloads/meta-ads-crm-main/IMPLEMENTATION_PLAN.md): Reorganizar el orden para colocar la validación piloto como Etapa 5 y desplazar el desarrollo del Revenue Dashboard a la Etapa 5B.
* [`PRODUCT_SPEC.md`](file:///C:/Users/Federico/Downloads/meta-ads-crm-main/PRODUCT_SPEC.md): Ajustar el alcance de la etapa 5 para reflejar la activación controlada.

---

## 3. Inventario de Configuración de Entorno (Meta Ads)

A continuación, se detalla la matriz de variables de entorno configuradas en el backend serverless para dar soporte a la integración. Se separa la obligatoriedad técnica (para el funcionamiento del código) de la operativa (para la identificación de la App/Portfolio).

| Variable de Entorno | Consumidor en el Código | Obligatoriedad | Secreta / Pública | Scope (Netlify) | Contexto de Deploy | ¿GitHub Actions? | Efecto de Ausencia | Validación Segura (Sin imprimir valor) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `META_APP_ID` | `_shared/metaConfig.js` | **Técnica:** Opcional<br>**Operativa:** Obligatoria | Pública | Functions / Builds | Todos | No | Se reporta como `null` en el status API y se omite en consultas de diagnóstico de app. | Comprobar que en el endpoint `/api/meta/status` devuelva `configured: true` y no exponga el valor real. |
| `META_APP_SECRET` | `_shared/metaConfig.js`, `_shared/metaClient.js` | **Técnica:** Obligatoria | Secreta | **Functions** | Production / Deploy Branches | No | No se puede calcular el `appsecret_proof` de seguridad. Las llamadas de Graph API fallan inmediatamente. | Comprobar que en `/api/meta/status` devuelva `connectionStatus` con valor diferente de `'not_configured'`. |
| `META_SYSTEM_USER_TOKEN` | `_shared/metaConfig.js`, `_shared/metaClient.js` | **Técnica:** Obligatoria | Secreta | **Functions** | Production / Deploy Branches | No | La sincronización se aborta de forma temprana (`status: 'skipped'`) o falla por token ausente. | Comprobar que `/api/meta/status` devuelva `connectionStatus` con valor diferente de `'not_configured'`. |
| `META_BUSINESS_ID` | `_shared/metaConfig.js` | **Técnica:** Opcional<br>**Operativa:** Obligatoria | Pública | Functions | Todos | No | Se asume `null` en metadatos y se omiten comprobaciones del portafolio comercial. | Comprobar en el status endpoint que se evalúe `configured: true`. |
| `META_API_VERSION` | `_shared/metaConfig.js`, `_shared/metaClient.js` | **Técnica:** Opcional | Pública | Functions | Todos | No | El cliente API del backend toma por defecto el valor de la constante `'v26.0'`. | Comprobar en la respuesta que el campo `apiVersion` devuelva `'v26.0'`. |
| `CRON_SECRET` | `_shared/metaConfig.js`, `api-meta-sync.js`, `meta-sync-background.js` | **Técnica:** Obligatoria | Secreta | **Functions** | Todos | **Sí** (GitHub Secret: `CRON_SECRET`) | El trigger programado (cron) responde `401 Unauthorized` al no poder validar la cabecera `X-Cron-Auth`. | Verificar en `/api/meta/status` que no devuelva errores de cron y que la cabecera sea aceptada. |
| `URL` | `api-meta-sync.js` | **Técnica:** Obligatoria | Pública (Generada) | **Automática** | Todos | No | Variable generada y reservada por el entorno de Netlify. No se configura a mano. | Validada internamente en código usando `new URL(process.env.URL)`. |
| `APP_URL` | `.github/workflows/meta-sync-cron.yml` | **Técnica:** Obligatoria | Pública | N/A | N/A | **Sí** (Discrepancia temporal: actualmente usa `secrets.APP_URL` en el workflow) | El workflow programado de GitHub Actions no puede invocar al dispatcher. Falla con `exited 1`. | **Corrección técnica previa:** Reclasificar `APP_URL` como una *Variable de repositorio* ordinaria de GitHub Actions, no como Secret. |
| `META_SYNC_ENABLED` | `.github/workflows/meta-sync-cron.yml` | **Técnica:** Obligatoria | Pública | N/A | N/A | **Sí** (GitHub Variable: `META_SYNC_ENABLED`) | Si está ausente o no es `'true'`, el workflow programado aborta preventivamente con código de salida `0`. | Debe configurarse explícitamente como Variable de GitHub en `'false'` para el piloto. |
| `MONGODB_URI` | `_shared/db.js` | **Técnica:** Obligatoria | Secreta | **Functions** | Production / Deploy Branches | No | Las Netlify Functions no pueden conectarse a la base de datos. Retorna error 500. | Comprobar que la base de datos se conecte exitosamente y las colecciones estén disponibles. |

### Detección Real de Entorno (NODE_ENV)
Federico no debe configurar de forma manual la variable `NODE_ENV`. El código implementa detección automatizada:
* El entorno es productivo si `process.env.NODE_ENV === 'production'` o si `process.env.URL` existe y no incluye `'localhost'`. En este caso, se fuerza el protocolo seguro `https:` para la comunicación interna entre funciones.

---

## 4. Onboarding Administrativo y Registro de Activos

El alta de cuentas, datasets/píxeles y scopes para el cliente piloto **no debe realizarse bajo ningún concepto mediante comandos directos `insertOne` en MongoDB** como flujo normal. Debe utilizarse exclusivamente la API administrativa del CRM que implementa validación de esquemas, temporalidad, auditoría y prevención de conflictos:

1. **Catálogo y Alta Manual:** Utilizar `POST /api/meta/assets/manual` (consumido por la UI de `MetaAssetManagerModal` para el rol `super_admin`) para registrar la cuenta publicitaria (`adAccountId`) y el píxel/dataset (`metaDatasetId`).
2. **Asignación del Alcance:** Utilizar `POST /api/meta/assign` para crear la asociación en `client_meta_scopes`.
3. **Procedimiento Extraordinario de Recuperación:** El uso de comandos directos de inserción en base de datos queda relegado únicamente a tareas excepcionales de restauración ante fallos catastróficos, documentando la intervención en el log de auditoría.

---

## 5. Arquitectura Operativa y Flujo de Datos

El acoplamiento se realiza a nivel del modelo de datos de forma aislada:

```
[Empresa CRM (Cliente Piloto A)] 
       │
       └───► [ClientMetaScope (Colección: client_meta_scopes)]
                   │   ├── adAccountId: "act_piloto123" (Cuenta asignada)
                   │   ├── allowedDatasetIds: ["pixel_piloto456"] (Dataset autorizado)
                   │   ├── effectiveFrom: [Fecha primer día de la ventana del piloto]
                   │   └── effectiveTo: null (Activo)
                   │
                   └───► Sincronización Manual (POST /api/meta/sync)
                               │ (Llamada con lookback exacto de 7 días)
                               ▼
                    [Meta Marketing API]
                               │ (Filtra campañas y conjuntos de anuncios)
                               ▼
                   [AdSet en Cuenta act_piloto123] 
                               │ (Referencia a pixel_piloto456 en promoted_object.pixel_id)
                               ▼
                    [Resolución de Ingestion / Tenant]
                               │ (resolveAdSetTenant comprueba vigencia del scope por fecha)
                               ▼
                    [Daily Insights Guardados en DB]
                               └── clientId: ObjectId("cliente_piloto")
```

---

## 6. Permisos de la API de Meta y Propiedad de Activos

El CRM opera exclusivamente en lectura.

### Matriz de Permisos:
* **`ads_read`:**
  * *Motivo:* Requerido para leer campañas, anuncios, presupuestos, conjuntos de anuncios y métricas diarias (insights).
  * *Obligatorio:* **Sí**.
  * *Alternativa:* Ninguna.
  * *Riesgo:* Bajo (acceso de solo lectura de rendimiento).
* **`ads_management`:**
  * *Motivo:* Modificación de campañas, creación de anuncios o cambio de presupuestos.
  * *Obligatorio:* **No (PROHIBIDO)**.
  * *Alternativa:* N/A.
  * *Riesgo:* Crítico. Queda estrictamente excluido del sistema.
* **`business_management`:**
  * *Motivo:* Acceso administrativo global al Portafolio.
  * *Obligatorio:* **No**.
  * *Alternativa:* Ingreso y asignación manual de IDs mediante la UI de administración del CRM.
  * *Riesgo:* Alto. Excluido del piloto.

### Estado de los Paneles en Meta (Federico debe comprobar):
Para verificar el estado real de la App y de los activos, Federico debe inspeccionar las siguientes pantallas en los paneles oficiales de Meta:
1. **Meta Developers Panel > Configuración > App Review (o Revisión de Apps):** Comprobar si la app está en **Modo Desarrollo** (*Development Mode*) o **Modo En Vivo** (*Live Mode*). Si está en desarrollo, solo personas con rol de administrador/desarrollador en la app pueden sincronizar sus cuentas publicitarias asociadas. Si está en vivo, comprobar el nivel de acceso (*Access Level*) del permiso `ads_read` (Standard Access vs Advanced Access).
2. **Meta Business Suite > Configuración del Negocio > Usuarios del Sistema (System Users):** Confirmar que el usuario del sistema dedicado está creado, tiene asignada la cuenta publicitaria del piloto con acceso exclusivo a "Ver rendimiento" y que el token de acceso generado posea únicamente el alcance `ads_read`.
3. **Meta Business Suite > Configuración del Negocio > Información del Negocio:** Comprobar el estado visible de la **Verificación del Negocio** (*Business Verification*), obligatoria si la App de Meta requiere pasar a Live Mode con acceso avanzado.

---

## 7. Reglas Financieras y Atribución Estricta

Para evitar discrepancias e informes falsos al cliente:
* **ROAS Blended (o Global):** Se define formalmente como `Ingresos Cobrados Totales (CRM) / Inversión Publicitaria Total (Meta)`.
* **ROAS Atribuido:** Reservado de forma estricta y única para aquellas ventas del CRM que cuenten con un vínculo directo, explícito y comprobable con la campaña publicitaria (ej: campo `lead.campaignId` en base de datos coincidente).
* **Insuficiencia de `fbclid`:** Un parámetro `fbclid` o cookie aislada sin asociación documentada a un lead registrado de campaña no se considera suficiente para atribuir una venta.
* **Prohibición de heurísticas:** Queda prohibido inferir atribución por fecha de venta, vendedor asignado, nombre del cliente, proximidad temporal o cualquier regla heurística de cercanía.
* **Sin Atribución Verificable:** Si no hay evidencia fehaciente, el sistema presentará obligatoriamente la etiqueta **"Sin atribución verificable"**.

---

## 8. Fechas, Zonas Horarias y Conciliación Estricta

### Manejo de Fechas y Zona Horaria:
* No se deben usar fechas de ejemplo hardcodeadas en consultas ejecutables.
* El campo `effectiveFrom` de `client_meta_scopes` debe cubrir exactamente el primer día de la ventana del piloto.
* La ventana piloto será de exactamente 7 días cerrados del pasado (por ejemplo, del día D-7 al día D-1), basándose de forma estricta en la **zona horaria configurada en la cuenta publicitaria de Meta** (no en la zona horaria del servidor ni UTC ciego).
* No se deben convertir ciegamente las fechas de reporte de Meta a la medianoche UTC. La base de datos debe almacenar y conservar la zona horaria de la cuenta publicitaria utilizada para la conciliación.

### Procedimiento de Conciliación:
La comparación entre el CRM, la Graph API y Meta Ads Manager requiere verificar la coincidencia de los siguientes parámetros:
1. Misma Cuenta Publicitaria (`adAccountId`).
2. Mismo rango cerrado (7 días de análisis).
3. Misma zona horaria de la cuenta.
4. Mismo nivel de agregación (por día y AdSet/Campaña).
5. Mismos campos de rendimiento (Inversión, Impresiones, Clics).
6. Mismos filtros aplicados.
7. Misma ventana de atribución (ej: 7-day click, 1-day view).
8. Mismo ajuste de `action_report_time` (tiempo de interacción vs tiempo de conversión).
9. **Diferenciación de Clics:** No confundir el campo `clicks` (todos los clics, incluyendo interacciones) con `link_clicks` (clics específicos en el enlace de destino).
10. **Investigación de Diferencias:** Cualquier discrepancia en clics o impresiones debe investigarse y reportarse. No se debe asumir una discrepancia del 0% sin definir previamente la semántica exacta comparada. La inversión acumulada debe coincidir centavo a centavo respetando la ventana de actualización de datos de Meta (típicamente hasta 72 horas para atribución tardía).

---

## 9. Secuencia Completa de Gates (Detención Temprana)

El proceso de activación está dividido en 11 Gates secuenciales. Si se detecta un error o fallo en cualquier Gate, **se debe abortar el procedimiento y no permitir el avance automático**:

```
[Gate 0: Plan Corregido y Aprobado]
       ▼
[Gate 1: Etapa 4 Integrada y Desplegada] (Cron apagado)
       ▼
[Gate 2: Configuración No Secreta Verificada] (Status responde ok)
       ▼
[Gate 3: Carga de Secretos en Netlify] (Federico los ingresa a mano)
       ▼
[Gate 4: Alta Administrativa del Activo Piloto] (Assets/Manual + Assign)
       ▼
[Gate 5: Diagnóstico y Lectura Mínima] (Endpoint /status)
       ▼
[Gate 6: Primera Sincronización Manual] (POST /sync, lookback 7 días)
       ▼
[Gate 7: Validación de Idempotencia] (Repetición de sincronización)
       ▼
[Gate 8: Aislamiento Multiempresa] (Verificación de Empresa A / Empresa B)
       ▼
[Gate 9: Conciliación de Métricas] (Graph API vs DB vs Ads Manager)
       ▼
[Gate 10: Autorización Escrita para Activar Cron]
```

### Detalle de los Gates:
* **Gate 0 [APROBADO]:** Aprobación del plan de activación (alineación y roadmap consolidados).
* **Gate 1 [APROBADO]:** Endurecimiento técnico y tests unitarios locales completados en la rama `stage5-meta-activation` (cron en `false` por defecto, kill switch manual en `false`).
  * *Corrección sintáctica:* Se detectó y corrigió un error de sintaxis preexistente (falta de cierre `};` en el objeto de actualización de base de datos) en `netlify/functions/meta-sync-background.js` presente desde el commit base `8fa57d0`.
  * *Aclaración de la Etapa 4:* El reporte anterior indicando 174 pruebas aprobadas en la Etapa 4 no era válido porque la suite de pruebas fallaba al importar el background worker en Vitest debido a dicho error sintáctico preexistente. Con la corrección, todas las pruebas importan, compilan y ejecutan correctamente.
* **Gate 2 [BLOQUEADO]:** Verificación de las variables públicas de configuración en Netlify.
* **Gate 3 [BLOQUEADO]:** Federico ingresa manualmente `META_APP_SECRET` y `META_SYSTEM_USER_TOKEN` en las variables de entorno de Netlify.
* **Gate 4 [BLOQUEADO]:** Alta administrativa de la cuenta publicitaria y el píxel mediante `POST /api/meta/assets/manual` y asociación del alcance en `client_meta_scopes` mediante `POST /api/meta/assign`.
* **Gate 5 [BLOQUEADO]:** Ejecución del diagnóstico seguro `/api/meta/status` para comprobar que la conexión con Graph API responde `connectionStatus: 'connected'`.
  * **Endurecimiento de seguridad:** La API status debe retornar únicamente flags booleanos como `hasSystemUserToken: true`. En ningún caso se deben exponer fragmentos, prefijos, sufijos o caracteres del token real.
* **Gate 6 [BLOQUEADO]:** Ejecución manual del dispatcher de sincronización para una ventana de 7 días.
* **Gate 7 [BLOQUEADO]:** Repetición exacta del job manual para verificar que no se duplican registros en base de datos.
* **Gate 8 [BLOQUEADO]:** Confirmar que usuarios de otra empresa no piloto no pueden visualizar los datos.
* **Gate 9 [BLOQUEADO]:** Conciliación estricta de inversión, impresiones y clics contra Meta Ads Manager.
* **Gate 10 [BLOQUEADO]:** Firma y confirmación de Federico para habilitar los secretos de GitHub Actions y activar el cron automático estableciendo `META_SYNC_ENABLED: true`.

---

## 10. Procedimiento de Rollback de Emergencia

Ante cualquier comportamiento anómalo, fuga de datos o sospecha de brecha de seguridad:

1. **Desactivar Automatización:** Establecer inmediatamente `META_SYNC_ENABLED=false` en GitHub Variables para apagar la ejecución del cron.
2. **Impedir Triggers Manuales:** Desactivar temporalmente los triggers manuales utilizando el control operativo disponible (por ejemplo, quitando temporalmente la variable `META_SYSTEM_USER_TOKEN` de Netlify).
3. **Revocación en Meta:** Si hay riesgo de compromiso del token, acceder a Meta Suite, remover los activos asignados al System User `crm-sync-pilot` y revocar el token generado.
4. **Eliminar Secreto:** Eliminar la variable `META_SYSTEM_USER_TOKEN` de Netlify. **No sustituir el secreto por un valor ficticio o inválido** para evitar llamadas fallidas redundantes que ensucien logs.
5. **Conservar Base de Datos:** Mantener intactos los checkpoints, logs de sincronización y documentos de MongoDB para facilitar la auditoría posterior.
6. **Registro de Incidente:** Documentar detalladamente el incidente (causa, hora exacta del fallo, alcance de la afectación, último job ejecutado y última fecha de datos consistente).

---

## 11. Cuestionario Final No Secreto para Federico

Federico **no debe pegar secretos, tokens ni credenciales en el chat**. Tampoco debe escribir IDs en el prompt. La vinculación de IDs se realizará directamente desde la interfaz administrativa del CRM.

Por favor, Federico, compartime las siguientes respuestas no secretas:
1. **Empresa Candidata:** ¿Cuál es el nombre de la empresa candidata para este primer piloto controlado?
2. **Propiedad de la Cuenta:** ¿La cuenta publicitaria piloto es propiedad del Portfolio comercial de la agencia o es compartida por un cliente externo?
3. **Business Verification:** ¿Cuál es el estado de la verificación comercial visible en la sección de información del negocio de Meta Business Suite?
4. **Estado de la App y Permiso ads_read:** ¿La Meta App se encuentra en Modo Desarrollo o en Modo Live? ¿Cuál es el nivel de acceso concedido al permiso `ads_read` en el panel de Meta Developers?
5. **Monedas del Piloto:** ¿Qué moneda utiliza la cuenta publicitaria de Meta y qué moneda de cobro está configurada en el CRM para la empresa piloto?
6. **Actividad de Campañas:** ¿Confirmas que existe al menos una campaña publicitaria con actividad de inversión y métricas durante la ventana elegida de siete días cerrados?

---

## 12. Declaración de Cumplimiento sobre Meta y Andromeda

El CRM de Anima MKT:
* Utiliza exclusivamente la API oficial de Graph y Marketing de Meta v26.0.
* Opera bajo el principio estricto de solo lectura (`ads_read`).
* **No realiza modificaciones:** No crea, edita, pausa, activa ni optimiza presupuestos de campañas ni anuncios.
* **No realiza scraping:** No automatiza la navegación en Business Suite ni simula interacciones de usuario.
* **No descarga eventos individuales:** No extrae registros individuales del píxel ni datos de navegación web personales.
* **Independencia de Andromeda:** El sistema no interactúa, no manipula, no optimiza ni tiene relación con la infraestructura o comportamiento de Andromeda.
* **Mitigación de riesgos:** La aplicación reduce riesgos mediante la adhesión estricta a los términos de servicio de Meta, la aplicación del principio de mínimo privilegio y el uso de flujos oficiales autorizados. No garantiza de forma mágica la exención de penalizaciones por malas prácticas comerciales externas.
