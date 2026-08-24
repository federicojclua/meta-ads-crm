# ETAPA 4 — PLAN DETALLADO DE IMPLEMENTACIÓN (REVISIÓN CORRECTIVA)
## Integración Oficial con Meta Ads, Campañas, Píxeles/Datasets y Métricas Multiempresa

---

## 1. Resumen Ejecutivo

La **Etapa 4** implementa la integración oficial, auditada y de **solo lectura** entre **Anima MKT CRM** y la **Meta Marketing API**, configurada de manera determinista mediante la variable de entorno `META_API_VERSION=v26.0`.

Su propósito central es conectar el CRM con los activos publicitarios de Meta (Cuentas Publicitarias, Campañas, Conjuntos de Anuncios, Datasets/Píxeles) gestionados en el Business Portfolio de la agencia, asociar de forma explícita y temporalmente auditada estos activos a cada empresa cliente (`clientId`), descargar de forma idempotente las métricas diarias de rendimiento e inversión publicitaria, y correlacionarlas con los leads, ventas e ingresos realmente cobrados del CRM.

### Principios Rectores
1. **Solo Lectura y Mínimo Privilegio:** Uso de `ads_read` como permiso base asignado a un **System User** del Business Portfolio de Meta. Los activos pueden descubrirse mediante API (si se cuenta con `business_management`) o configurarse manualmente mediante identificadores ingresados por el `super_admin`. Cero automatizaciones de escritura, cero modificación de presupuestos o anuncios.
2. **Topología Canónica Desacoplada vs. Agrupación Visual:** 
   - Estructura canónica: Cuentas y Datasets/Píxeles son activos paralelos del Portafolio. Los AdSets referencian a los Datasets/Píxeles mediante campos de configuración oficial (`promoted_object`).
   - Agrupación visual: Presentación para el usuario en jerarquía `Empresa → Dataset/Píxel → Campañas → AdSets` sin alterar la persistencia real.
3. **Aislamiento Multi-Tenant e Idempotencia con Clave Tenant-Scoped:** Toda métrica diaria se almacena con clave única compuesta:
   $$\{ \text{clientId}, \text{adAccountId}, \text{adsetId}, \text{date}, \text{attributionSettingKey}, \text{actionReportTime} \}$$
   impidiendo colisiones y duplicaciones entre empresas en cuentas compartidas.
4. **Reasignación Auditada con Snapshots Históricos:** Las reasignaciones de activos entre empresas registran `effectiveFrom`, `effectiveTo`, `assignedBy` y `assignmentReason`. Los datos históricos anteriores conservan el `clientId` bajo el cual fueron sincronizados; cualquier reclasificación retroactiva requiere previsualización y confirmación explícita del `super_admin`.
5. **Integridad Financiera:** Inversión publicitaria almacenada en centavos enteros (`spendMinor`). Las monedas (ARS y USD) se mantienen estrictamente segregadas. El ROAS se calcula exclusivamente sobre **ingresos realmente cobrados** ($\text{ROAS cobrado} = \text{ingresos cobrados atribuibles} / \text{inversión atribuible}$).
6. **Resiliencia Serverless:** Arquitectura asíncrona mediante Netlify Background Functions (hasta 15 minutos) con checkpoints e idempotencia, disparadas cada 6 horas vía GitHub Actions con payload liviano sin secretos.

---

## 2. Estado Real Encontrado en el Repositorio

El repositorio se encuentra con la **Etapa 3** completamente cerrada, probada y desplegada (18 suites de prueba y 138 tests pasando al 100%):

* **Autenticación e Identidad:** Firebase Authentication en cliente; verificación de ID Tokens en backend con `firebase-admin@13.10.0` (ADR-001, ADR-014).
* **Autorización y Multi-Tenant:** Roles (`super_admin`, `admin`, `client`, `salesperson`) y estados (`active`, `invited`, `suspended`) gestionados autoritativamente en MongoDB Atlas (`anima_mkt_crm`). Scoping estricto por `clientId` en `_shared/permissions.js` (ADR-009, ADR-010, ADR-016).
* **Modelos Monetarios:** Centavos enteros (`amountMinor`, `collectedAmountMinor`) con segregación de ARS y USD en ventas y cobros parciales/totales (ADR-018, ADR-019).
* **Runtime Node y Netlify:** Ya estandarizado en Node.js 24 LTS (`package.json`, `netlify.toml`, `.nvmrc` y ADR-012) con soporte nativo para `crypto` y `fetch` sin dependencias externas.
* **Colección `clients`:** Posee campos preparatorios de texto `metaAdAccountIds` (array de strings) y `metaBusinessId`, sin secretos ni tokens.
* **Página de Campañas (`CampaignsPage.jsx`):** Componente placeholder con `EmptyState` que indica *"Programado para Etapa 4"*.
* **Dashboard (`DashboardPage.jsx`):** Muestra métricas de leads, ventas e ingresos comerciales, con placeholders explícitos *"Sin datos de Meta (Etapa 4)"* para Inversión, CPL, CPA y ROAS.

---

## 3. Diferencias Entre el Estado Actual y el Objetivo

| Dimensión | Estado Actual (Etapa 3) | Estado Objetivo (Etapa 4) |
|---|---|---|
| **Conexión Meta** | No existe comunicación HTTP con Graph API. | Cliente HTTP oficial (`MetaApiClient`) con System User Token, `appsecret_proof`, control multi-header de rate limits y tipificación de errores. |
| **Versión de API** | No configurada. | Configuración fija `META_API_VERSION=v26.0` sin fallbacks automáticos silenciosos. |
| **Catálogo de Activos** | Array plano de IDs en `clients.metaAdAccountIds`. | Catálogo normalizado en MongoDB: `MetaAdAccount`, `MetaDataSource` (Datasets/Píxeles), `MetaCampaign`, `MetaAdSet`, y asignaciones explícitas temporizadas en `ClientMetaScope`. |
| **Sincronización** | Inexistente. | Motor serverless con Netlify Background Functions (`meta-sync-background`), checkpoints (`MetaSyncCheckpoint`), logs de auditoría (`MetaSyncLog`) y cron en GitHub Actions. |
| **Métricas Publicitarias** | KPIs de Meta muestran "Sin datos". | Colección `MetaInsightDaily` con clave tenant-scoped e importes en centavos (`spendMinor`). |
| **Dashboard y Campañas** | UI estática/placeholder. | `CampaignsPage.jsx` con jerarquías visuales (Empresa, Dataset/Píxel, Campañas, AdSets), filtros por fecha/moneda/estado y métricas combinadas Meta+CRM. |
| **Conflictos Multi-Tenant** | No detectados. | Detección y bloqueo automático de campañas mixtas (`MIXED_TENANT_CAMPAIGN`) y píxeles multi-empresa (`META_DATA_SOURCE_TENANT_CONFLICT`). |

---

## 4. Diagrama de Arquitectura

```
+-----------------------------------------------------------------------------------+
|                                  CLIENTE (BROWSER)                                |
|  [DashboardPage]  [CampaignsPage]  [MetaAssetManagerModal]  [ConflictAlertBanner] |
|                              | (Axios / apiClient)                                |
+------------------------------|----------------------------------------------------+
                               | Bearer <Firebase_ID_Token>
                               v
+-----------------------------------------------------------------------------------+
|                        NETLIFY FUNCTIONS (API REST LAYER)                         |
|  - api-meta-assets.js       (Descubrimiento y asignación de activos)              |
|  - api-meta-insights.js     (Consulta de métricas filtradas por tenant)           |
|  - api-meta-sync.js         (Trigger manual / webhook de sync)                    |
|  - api-dashboard.js         (KPIs unificados Meta Ads + Ventas CRM)               |
|                                                                                   |
|  [_shared/permissions.js] -> Verifica Firebase Token + Role + ClientScope         |
|  [_shared/metaClient.js]  -> Llamadas Graph API v26.0 con System User Token       |
+------------------------------|----------------------------------------------------+
                               | Invoca (Payload liviano sin secretos)
                               v
+-----------------------------------------------------------------------------------+
|                   BACKGROUND WORKERS & AUTOMATIZACIÓN PROGRAMADA                  |
|  - meta-sync-background.js  (Netlify Background Function: hasta 15 min por job)   |
|  - GitHub Actions Workflow   (Cron job cada 6h llamando a endpoint seguro)        |
|  - Checkpoints & Backoff    (Reanudación por cursor/fecha y respeto de headers)   |
+------------------------------|----------------------------------------------------+
                               | 
        +----------------------+----------------------+
        |                                             |
        v Graph API v26.0 (HTTPS)                     v Driver MongoDB v6
+-------------------------------+             +-------------------------------------+
|        META GRAPH API         |             |            MONGODB ATLAS            |
|  - /act_<id>/insights         |             |  - meta_connections                 |
|  - /act_<id>/campaigns        |             |  - meta_ad_accounts                 |
|  - /act_<id>/adsets           |             |  - meta_data_sources (datasets)     |
|  - /<portfolio_id>/datasets   |             |  - client_meta_scopes               |
|  - Multi-headers usage limits |             |  - meta_insights_daily              |
+-------------------------------+             |  - meta_sync_checkpoints / logs     |
                                              |  - meta_asset_conflicts             |
                                              +-------------------------------------+
```

---

## 5. Modelo Canónico de Activos de Meta vs. Agrupación Visual

### 5.1. Topología Canónica Real (Graph API)

Meta no anida los Datasets/Píxeles dentro de los AdSets ni de las Cuentas; son activos paralelos del Portafolio vinculados mediante referencias:

```text
Business Portfolio
├── Ad Accounts (act_<ID>)
│   └── Campaigns
│       └── AdSets ── [promoted_object.pixel_id / custom_event_type] ──┐
└── Datasets / Pixels (<ID>) <──────────────────────────────────────────┘
```

* **Ad Account:** Entidad contable y publicitaria con divisa y zona horaria fija.
* **Campaign:** Entidad de objetivo publicitario (`OUTCOME_LEADS`, `OUTCOME_SALES`, etc.).
* **AdSet:** Configuración de entrega, segmentación y presupuesto. Contiene una **referencia** opcional a un Dataset/Píxel en su `promoted_object`.
* **Dataset / Meta Pixel:** Fuente de datos del Portafolio que puede estar conectada a múltiples cuentas publicitarias.

### 5.2. Agrupación Visual Requerida en Frontend

El usuario de negocio necesita visualizar la información agrupada por activo de negocio:

$$\text{Empresa} \longrightarrow \text{Dataset / Píxel} \longrightarrow \text{Campañas} \longrightarrow \text{Conjuntos de Anuncios}$$

* **Construcción en Consulta:** La vista agrupada se construye en tiempo de ejecución mediante agregaciones (`$lookup` y `$group`) sobre la base canónica.
* Si un AdSet no referencia ningún Dataset/Píxel, se agrupa bajo *"Sin píxel/dataset identificado"*.
* Si una campaña contiene AdSets que referencian distintos Datasets/Píxeles, la campaña se visualiza bajo cada Dataset correspondiente a sus AdSets (sin duplicar gasto, ya que cada fila se agrega a nivel de AdSet).

---

## 6. Estrategia de Autenticación y Matriz de Errores de Meta

### 6.1. Componentes de Autenticación
1. **Meta App Propia:** Tipo *Business*, en modo producción tras completar Business Verification.
2. **Business Portfolio:** Portafolio corporativo de la agencia Anima MKT.
3. **System User:** Usuario del Sistema del Business Portfolio con rol de solo lectura (`ads_read`) asignado a las Cuentas Publicitarias y Datasets de los clientes.
4. **System User Access Token:** Token permanente generado en Business Manager.
5. **App Secret Proof:** `appsecret_proof = HMAC-SHA256(token, META_APP_SECRET)` enviado en cada solicitud conforme a las directivas oficiales de seguridad.

### 6.2. Matriz Exhaustiva de Detección de Errores de Meta

El cliente `MetaApiClient` clasifica todas las respuestas de error oficiales:

| Código Meta | Subcódigo | Tipo de Error | Diagnóstico CRM | Acción en el CRM |
|---|---|---|---|---|
| `190` | `463` | `OAuthException` | Token Expirado | Notificar al super_admin; pausar sync; mantener sesión Firebase intacta. |
| `190` | `467` | `OAuthException` | Token Revocado | Notificar al super_admin; pausar sync; no alterar sesión Firebase. |
| `190` | `490` | `OAuthException` | Usuario del Sistema Inactivo | Alertar al super_admin sobre estado del System User en Business Manager. |
| `200` - `299` | - | `PermissionException` | Permiso Insuficiente / Activo no asignado | Marcar cuenta/dataset como `unauthorized_asset`; alertar asignación faltante. |
| `100` | `33` | `InvalidParameter` | Activo No Encontrado / Retirado | Marcar activo como `not_found_in_meta`; registrar en log. |
| `17`, `32` | - | `RateLimitException` | User/App Rate Limit Alcanzado | Activar Exponential Backoff con jitter y respetar headers de uso. |
| `613` | - | `RateLimitException` | Custom/API Call Rate Limit | Pausar cuenta por $N$ segundos según header `Retry-After`. |
| `2` | - | `ServiceException` | Error Temporal de Meta | Reintentar hasta 3 veces con backoff progresivo (1s, 2s, 4s). |
| `1` | `102` | `APIException` | Versión de API Retirada / No Soportada | Alertar al super_admin; detener llamadas a esa versión; requerir actualización de `META_API_VERSION`. |

---

## 7. Matriz Oficial de Endpoints, Versión y Permisos (v26.0)

| Endpoint Graph API (v26.0) | Método | Permiso Base | Tipo de Acceso | Business Verification | App Review | Activo Requerido en System User | Documentación Oficial | Alternativa Manual |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|---|
| `GET /act_<ID>/insights` | GET | `ads_read` | Standard / Advanced | Requerida | Requerido para prod | Cuenta Publicitaria (`act_<ID>`) | [Insights API Reference](https://developers.facebook.com/docs/marketing-api/insights) | Ninguna (Requiere API). |
| `GET /act_<ID>/campaigns` | GET | `ads_read` | Standard / Advanced | Requerida | Requerido para prod | Cuenta Publicitaria (`act_<ID>`) | [Campaign Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group) | Ninguna (Requiere API). |
| `GET /act_<ID>/adsets` | GET | `ads_read` | Standard / Advanced | Requerida | Requerido para prod | Cuenta Publicitaria (`act_<ID>`) | [AdSet Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign) | Ninguna (Requiere API). |
| `GET /<business_id>/owned_ad_accounts` | GET | `business_management` | Advanced | Requerida | Requerido para prod | Business Portfolio | [Business Accounts API](https://developers.facebook.com/docs/marketing-api/business-asset-management) | **Super Admin ingresa los `adAccountIds` manualmente** en la UI. |
| `GET /<business_id>/datasets` | GET | `business_management` | Advanced | Requerida | Requerido para prod | Business Portfolio | [Datasets API](https://developers.facebook.com/docs/marketing-api/data-sources) | **Super Admin ingresa los `datasetIds` manualmente** en la UI. |

> [!NOTE]
> Si la app no dispone de `business_management` aprobado en App Review, la aplicación puede operar al 100% de sus capacidades analíticas utilizando exclusivamente `ads_read` y configurando las cuentas y datasets mediante ingreso manual de identificadores por el `super_admin`.

---

## 8. Modelo Multi-Tenant y Clave Idempotente

### 8.1. Clave Idempotente Tenant-Scoped en `meta_insights_daily`

Para evitar colisiones y duplicaciones en cuentas compartidas o ejecuciones concurrentes, la clave única se define como:

```javascript
{
  clientId: ObjectId("..."),           // Tenant autorizado obligatorio
  adAccountId: "act_123456789",        // Cuenta publicitaria
  adsetId: "238512345678901",          // Conjunto de anuncios
  date: "2026-08-24",                  // Fecha en formato YYYY-MM-DD
  attributionSettingKey: "7d_click_1d_view", // Ventana normalizada
  actionReportTime: "conversion"       // Momento de atribución normalizado
}
```

* **Normalización de Nulos:** Los valores no provistos se normalizan a `"default"` o `"conversion"` antes de persistir la clave.
* **Inmutabilidad del Snapshot:** `datasetId` y `pixelId` se almacenan en el documento como **snapshot histórico de atribución** al momento de la sincronización. Si en el futuro se modifica el píxel del AdSet en Meta, los registros históricos de métricas previas no se reescriben.

---

## 9. Reasignación de Activos e Historial de Cambios

### 9.1. Modelo `ClientMetaScope` con Temporalidad
```javascript
{
  _id: ObjectId,
  clientId: ObjectId,                  // Empresa asignada
  adAccountId: String,                 // Cuenta publicitaria
  allowedDatasetIds: [String],         // Datasets autorizados
  manuallyAssignedCampaignIds: [String], // Campañas manuales sin píxel
  isExclusiveAccount: Boolean,
  status: 'active' | 'archived',
  effectiveFrom: Date,                 // Fecha desde la cual aplica la asignación
  effectiveTo: Date | null,            // Fecha hasta la cual aplicó (null = vigente)
  assignedByUserId: ObjectId,          // Super admin responsable
  assignmentReason: String,            // Motivo documentado de la asignación
  createdAt: Date,
  updatedAt: Date
}
```

### 9.2. Reglas de Reasignación Histórica
1. **No Reclasificación Automática:** Si una cuenta o dataset se reasigna de la Empresa A a la Empresa B:
   - Se cierra el registro anterior estableciendo `effectiveTo = new Date()`.
   - Se crea un nuevo registro para la Empresa B con `effectiveFrom = new Date()`.
   - Los documentos históricos de `meta_insights_daily` correspondientes al período previo **conservan el `clientId` de la Empresa A**.
2. **Reclasificación Retroactiva Explícita:** Si el `super_admin` requiere reasignar métricas históricas pasadas, el CRM exige una acción administrativa explícita (`POST /api/meta/reclassify-historical`) con previsualización del impacto de filas, confirmación obligatoria y registro en auditoría.

---

## 10. Modelos MongoDB (Colecciones de Etapa 4)

* `meta_connections`: Configuración de System User y estado de conexión.
* `meta_ad_accounts`: Catálogo de cuentas descubiertas o configuradas manualmente.
* `meta_data_sources`: Catálogo de datasets y píxeles del portafolio.
* `client_meta_scopes`: Asignaciones temporizadas y auditadas por empresa.
* `meta_campaigns` & `meta_adsets`: Estructura de campañas y AdSets con referencias a píxel.
* `meta_insights_daily`: Métricas diarias tenant-scoped con importes en centavos (`spendMinor`).
* `meta_sync_checkpoints`: Cursores y estado de reanudación serverless.
* `meta_sync_logs`: Auditoría de sincronizaciones sin datos sensibles.
* `meta_asset_conflicts`: Registro y seguimiento de conflictos multitenant.

---

## 11. Índices Idempotentes

1. **`meta_insights_daily`:**
   - `{ clientId: 1, adAccountId: 1, adsetId: 1, date: 1, attributionSettingKey: 1, actionReportTime: 1 }` (**Único Tenant-Scoped**).
   - `{ clientId: 1, date: 1, currency: 1 }` (Consultas de Dashboard y Reportes).
   - `{ clientId: 1, datasetId: 1, date: 1 }` (Consultas por Píxel/Dataset).
   - `{ clientId: 1, campaignId: 1, date: 1 }` (Consultas por Campaña).
2. **`client_meta_scopes`:**
   - `{ clientId: 1, adAccountId: 1, status: 1 }` (Búsqueda de scopes activos).
3. **`meta_data_sources`:**
   - `{ metaDatasetId: 1 }` (**Único**).
   - `{ assignedClientId: 1, status: 1 }`.
4. **`meta_ad_accounts`:**
   - `{ adAccountId: 1 }` (**Único**).
5. **`meta_asset_conflicts`:**
   - `{ conflictCode: 1, entityId: 1, resolvedAt: 1 }`.

---

## 12. Cuentas Compartidas y Campañas Mixtas

* **Cuentas Compartidas (`isShared = true`):** El backend nunca ejecuta agregaciones sobre la cuenta completa para un cliente. Aplica `$match: { clientId: user.clientId }` asegurando que el cliente solo sume AdSets asociados a sus Datasets asignados o campañas manuales.
* **Campaña Mixta (`MIXED_TENANT_CAMPAIGN`):** Si una campaña contiene AdSets asignados a diferentes empresas:
  1. Se bloquea la visualización del total de la campaña para los roles `client`.
  2. Cada cliente solo visualiza las métricas de sus AdSets autorizados.
  3. Se genera un registro en `meta_asset_conflicts` visible en el panel del `super_admin`.
* **Campañas sin Píxel en Cuenta Compartida:** Requieren asignación manual explícita por el `super_admin` (`manuallyAssignedCampaignIds`).

---

## 13. Sincronización Serverless y Control de Rate Limits

### 13.1. Arquitectura de Sincronización
1. **GitHub Actions (Cron cada 6h):** Envía un `POST` liviano a `/.netlify/functions/api-meta-sync` autenticado mediante header `X-Cron-Auth: <CRON_SECRET>` sin incluir credenciales de Meta.
2. **Trigger (`api-meta-sync.js`):** Valida autorización, registra el job en `meta_sync_logs`, inicializa `meta_sync_checkpoints` e invoca la Netlify Background Function `meta-sync-background.js`. Responde `202 Accepted` de inmediato.
3. **Background Worker (`meta-sync-background.js`):** Dispone de **hasta 15 minutos** de tiempo de ejecución serverless en Netlify. Procesa cuentas en lotes, guardando cursor y estado periódicamente.

### 13.2. Tratamiento de Rate Limits
El cliente `MetaApiClient` procesa:
* Header `x-business-use-case-usage` (Uso de CPU, tiempo total y llamadas por cuenta publicitaria).
* Header `x-app-usage` (Uso global de la App).
* Header `Retry-After` ante HTTP 429.
* **Políticas Preventivas del CRM:**
  - Si el uso reportado supera el **75%**, introduce pausas automáticas de 2 a 5 segundos entre solicitudes.
  - Si el uso supera el **90%** o se recibe HTTP 429 / código 613, suspende temporalmente la cuenta actual, guarda checkpoint y agenda reanudación mediante Exponential Backoff con Jitter ($T = 2^n + \text{rand}(0, 1000)\text{ms}$).

---

## 14. Métricas Financieras, Fórmulas y Monedas

### 14.1. Fórmulas Protegidas
* **Inversión ($):** $\text{spendMinor} / 100$.
* **Ingresos Cobrados ($):** $\text{collectedAmountMinor} / 100$ (desde la colección `sales` de la Etapa 3).
* **CPL:** $\text{Inversión Meta} / \text{Leads CRM}$ (o `null` con `hasData: false` si Leads = 0).
* **CPA:** $\text{Inversión Meta} / \text{Ventas Ganadas CRM}$ (o `null` con `hasData: false` si Ventas = 0).
* **ROAS Cobrado:** $\text{Ingresos Cobrados Atribuibles} / \text{Inversión Atribuible}$ (o `null` si Inversión = 0).
* **Alcance (`reach`):** Se advierte explícitamente en la UI que no es una métrica aditiva entre días.

### 14.2. Segregación Multimoneda
ARS y USD se calculan y presentan en bloques separados (`spendByCurrency`). Jamás se suman linealmente importes de divisas distintas sin conversión histórica auditada.

---

## 15. Seguridad, Privacidad y Cumplimiento de Políticas

### Declaración de Alcance y Cumplimiento Estricto
1. **Cero Scraping:** No se realizan consultas no autorizadas ni scraping de Business Suite o Ads Manager.
2. **Cero Descarga de Eventos Individuales:** No se almacenan eventos individuales del píxel ni datos de navegación de personas.
3. **Cero Escritura o Modificación:** No se implementa `ads_management` ni modificación de campañas/presupuestos.
4. **Cero Lead Ads / CAPI en esta Etapa:** Lead Ads y Conversions API quedan formalmente diferidos a etapas posteriores.
5. **Andromeda:** Se ratifica que es infraestructura interna de Meta para subastas y recomendación profunda. El CRM actúa únicamente como auditor y lector de métricas oficiales.

---

## 16. Plan de Testing Exhaustivo (32 Casos de Prueba)

### A. Unit Tests (Backend & Fórmulas)
1. Normalización de `spendMinor` a centavos enteros.
2. Fórmulas de CPL, CPA y ROAS con división segura ante denominadores cero.
3. Generación determinista de `appsecret_proof` con HMAC-SHA256.
4. Clasificación y tipificación de errores de Graph API (190, 200, 17, 32, 613, 100).
5. Algoritmo de Exponential Backoff con Jitter ante rate limits.
6. Construcción y normalización de clave compuesta tenant-scoped.

### B. Integration Tests (Multi-Tenant, Sync & Conflictos)
7. `super_admin` descubre o lista todas las cuentas autorizadas.
8. `client` consulta únicamente sus cuentas, campañas y métricas autorizadas.
9. Manipulación de `clientId` en query/body por un `client` es descartada forzando su sesión.
10. Manipulación de `adAccountId`, `campaignId` o `datasetId` ajeno devuelve 404/403 opaco.
11. Asignar un dataset ya vinculado a otra empresa genera error 409 `DATA_SOURCE_ALREADY_ASSIGNED`.
12. Campaña con AdSets de diferentes empresas genera conflicto `MIXED_TENANT_CAMPAIGN` y oculta total al cliente.
13. Campaña sin píxel en cuenta exclusiva hereda tenant; en cuenta compartida exige asignación manual.
14. Reasignación de activo cierra período anterior (`effectiveTo`) y no modifica el histórico del tenant original.
15. Sincronización repetida del mismo día y AdSet es 100% idempotente (no duplica documentos en `meta_insights_daily`).
16. Reanudación desde `meta_sync_checkpoints` continúa en el cursor correcto tras interrupción.
17. Monedas ARS y USD se almacenan y agregan estrictamente segregadas.
18. Error 401 de Meta marca conexión como inválida sin cerrar la sesión Firebase del usuario.
19. Rate limit de Meta activa throttling preventivo sin abortar el worker.
20. Endpoints de la API son estrictamente de lectura (rechazan métodos POST/PUT de modificación de campañas en Meta).

### C. Frontend Tests (Componentes & UI)
21. `CampaignsPage` renderiza la jerarquía Empresa $\rightarrow$ Dataset $\rightarrow$ Campañas $\rightarrow$ AdSets.
22. Cambio de empresa en selector de `super_admin` actualiza tablas y KPIs sin mezclar datos.
23. Dos empresas con distinta inversión muestran métricas independientes sin fallback cruzado.
24. `salesperson` no visualiza paneles de asignación ni configuración publicitaria.
25. Métricas no disponibles muestran `"-"` o `"Sin datos"` (jamás ceros falsos).
26. Tooltip en columna `reach` advierte sobre la no aditividad de la métrica.
27. Banner de conflicto `ConflictBanner` se renderiza cuando existen alertas activas.
28. `MetaAssetManagerModal` permite asociar cuentas y datasets por `super_admin`.
29. Errores de API muestran estados controlados con botón *"Reintentar"*.
30. Indicador de última sincronización muestra fecha y estado de actualización de datos.
31. Botón de sincronización manual muestra estado de carga y bloquea envíos duplicados.
32. Selector de moneda filtra métricas de la divisa elegida sin conversiones implícitas.

---

## 17. Plan de Despliegue Progresivo y Rollback

### 17.1. Despliegue Progresivo
1. **Configuración de Variables de Entorno en Netlify:** `META_APP_ID`, `META_APP_SECRET`, `META_SYSTEM_USER_TOKEN`, `META_BUSINESS_ID`, `META_API_VERSION = "v26.0"`, `CRON_SECRET`.
2. **Índices en MongoDB Atlas:** Ejecución de `ensureIndexes` con índices tenant-scoped de Meta.
3. **Despliegue de Netlify Functions:** Endpoints de backend y worker background.
4. **Mapeo Inicial de Activos:** El `super_admin` vincula cuentas y datasets a las empresas.
5. **Backfill Inicial (90 días):** Ejecución controlada de la primera descarga histórica.
6. **Activación de Frontend y GitHub Actions:** Despliegue de `CampaignsPage.jsx` y activación del cron cada 6 horas.

### 17.2. Rollback Inmediato
* Desactivar el workflow de GitHub Actions.
* El frontend oculta las vistas de Meta mediante feature flag sin afectar Leads, Pipeline ni Ventas.
* Los datos de la Etapa 3 permanecen intactos y operativos al 100%.

---

## 18. Lista Exacta de Archivos a Crear / Modificar

### Archivos Nuevos
* `netlify/functions/_shared/metaClient.js` (Cliente oficial Graph API v26.0 con HMAC proof y rate limit handler).
* `netlify/functions/api-meta-assets.js` (Endpoint de descubrimiento y asignación de activos).
* `netlify/functions/api-meta-insights.js` (Endpoint de consulta de métricas agregadas y jerárquicas).
* `netlify/functions/api-meta-sync.js` (Trigger y webhook de sincronización).
* `netlify/functions/meta-sync-background.js` (Netlify Background Function para procesamiento pesado).
* `models/MetaAdAccount.js` (Modelo y validadores).
* `models/MetaDataSource.js` (Modelo y validadores).
* `models/ClientMetaScope.js` (Modelo y validadores con temporalidad).
* `models/MetaInsightDaily.js` (Modelo y validadores con clave tenant-scoped).
* `src/components/meta/MetaAssetManagerModal.jsx` (Modal de gestión de activos para super_admin).
* `src/components/meta/ConflictBanner.jsx` (Banner de alertas de conflictos multitenant).
* `src/test/meta-backend.test.js` (Suite de pruebas backend de Meta).
* `src/test/meta-frontend.test.jsx` (Suite de pruebas frontend de Campañas).
* `.github/workflows/meta-sync-cron.yml` (Workflow de sincronización programada cada 6h).

### Archivos a Modificar
* `netlify/functions/_shared/db.js` (Agregar índices tenant-scoped de Meta en `ensureIndexes`).
* `netlify/functions/api-dashboard.js` (Incorporar métricas de Meta en agregación de KPIs).
* `netlify/functions/_shared/permissions.js` (Validación de scopes de Meta).
* `src/pages/CampaignsPage.jsx` (Implementación completa de la UI de Campañas).
* `src/pages/DashboardPage.jsx` (Reemplazo de placeholders de Meta por valores calculados).
* `netlify.toml` (Configuración de redirects para endpoints `/api/meta/*`).
* `CHANGELOG.md` & `DECISIONS.md` (Documentación arquitectónica).

---

## 19. Criterios de Aceptación de la Etapa 4

1. Comunicación exitosa con Graph API fijada en `v26.0` con `appsecret_proof`.
2. Asignación explícita y auditada de cuentas/datasets por `super_admin`.
3. Aislamiento estricto por `clientId` en todas las consultas de métricas e inventario.
4. Dashboard y Campañas reflejando inversión, CPL, CPA y ROAS real sobre ingresos cobrados.
5. Detección y bloqueo preventivo ante conflictos de cuentas compartidas o píxeles duplicados.
6. Sincronización serverless 100% idempotente y reanudable por checkpoints.
7. Suite completa de 32 pruebas pasando al 100% en Vitest sin errores de lint ni advertencias de build.
