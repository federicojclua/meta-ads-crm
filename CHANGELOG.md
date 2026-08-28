# Anima MKT CRM — Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added — Stage 20: E-Commerce Intelligence, CRO & Retention Engine (2026-08-28)
- **Modelos de E-Commerce Intelligence & Memoria de Retención (`models/`)**:
  - `models/EcommerceProduct.js`: Esquema de producto dropshipping/KDP (`sourceType`, `salePrice`, `cost`, `shippingCost`, `estimatedMargin`, `status`, `productScore`, `confidenceScore`).
  - `models/EcommerceProductAnalysis.js`: Esquema versionado (`analysisVersion`) con desglose de features, benefits, outcomes, pain points, desires, objections, 10 subscores, 5 ángulos comerciales, 10 ganchos categorizados, metadata KDP y matriz de hechos vs inferencias (`OBSERVED`, `INFERRED`, `RECOMMENDED`, `UNKNOWN`).
  - `models/EcommerceCroAudit.js`: Esquema de auditoría CRO en 10 dimensiones con prioridades (P0-P3), esfuerzo/impacto, Quick Wins y estructura para informe PDF.
  - `models/EcommerceCustomer.js`: Perfil unificado de comprador (`totalOrders`, `totalRevenue`, `averageOrderValue`, `realLtv`, `predictedLtv`, `purchaseFrequencyDays`, `retentionStatus`, `optInWhatsApp`).
  - `models/EcommerceOrder.js`: Esquema normalizado de órdenes (`subtotal`, `discounts`, `shipping`, `taxes`, `total`, `isRetentionPurchase`, `idempotencyKey`).
  - `models/EcommerceRetentionRule.js`: Reglas de retención configurables (+30d recompra, +45d venta cruzada, +60d reactivación, +90d win-back).
  - `models/EcommerceRetentionEvent.js`: Cola de eventos programados (`SCHEDULED`, `SENT`, `BLOCKED`, `CONVERTED`) con verificación de seguridad.
- **Servicios de Backend E-Commerce (`netlify/functions/_shared/ecommerceEngine/`)**:
  - `urlFetcherService.js`: Lector seguro de páginas con protección estricta contra SSRF (bloqueo de loopback `127.0.0.1`, IPs privadas `10.x`, `172.16-31.x`, `192.168.x`, endpoints de metadatos `169.254.169.254`), timeout de 6s y fallback elegante.
  - `productIntelligenceService.js`: Motor de análisis IA para Dropshipping & Amazon KDP, cálculo de ANIMA Product Score (0-100), Angle Engine (5 ángulos) y Hook Generator (10 ganchos sin falsos claims). Matriz de compliance KDP (cero keyword stuffing, cero menciones de bestseller).
  - `croAnalyzerService.js`: Evaluación de 10 dimensiones CRO (Claridad, Propuesta de Valor, Confianza, Envíos, Precio/Valor, Prueba Social, Objeciones, CTA, Móvil UX, Checkout), extracción de Quick Wins y generación de estructura de reporte PDF.
  - `webhookAdapters.js`: Validación de firma criptográfica HMAC-SHA256 (`verifyShopifyHmac`), normalizadores para Shopify y WooCommerce (`ShopifyAdapter`, `WooCommerceAdapter`), e ingestión idempotente (`processNormalizedOrderService`) para evitar órdenes o clientes duplicados ante reintentos.
  - `retentionEngineService.js`: Guardián de seguridad de WhatsApp (consentimiento, formato, rate limit de 7 días), integración con `controlPlaneService` para envíos automáticos, analítica de LTV real vs proyectado y motor de recomendaciones de Cross-Sell con justificación explicativa ("Why This Product").
- **Endpoints de E-Commerce (`netlify/functions/api-ecommerce.js`)**:
  - `GET /api/ecommerce/dashboard`: Resumen de métricas de productos, CRO, compradores y retención.
  - `POST /api/ecommerce/products/analyze`: Diagnóstico de producto dropshipping o libro KDP.
  - `GET /api/ecommerce/products` & `POST /api/ecommerce/products/save`: Biblioteca persistente y versionada de productos.
  - `POST /api/ecommerce/cro/analyze`: Auditoría completa de landing page.
  - `GET /api/ecommerce/customers`: Listado de perfiles de clientes con LTV real y proyectado.
  - `GET /api/ecommerce/ltv`: Analítica avanzada de cohortes y retorno de retención.
  - `GET /api/ecommerce/retention-rules` & `GET /api/ecommerce/retention-events`: Monitoreo de reglas y cola de retención.
  - `POST /api/ecommerce/retention/dispatch`: Despacho de mensajes programados con control de seguridad.
  - `GET /api/ecommerce/cross-sell`: Recomendaciones de productos complementarios con justificación racional.
  - `POST /api/ecommerce/webhooks/shopify` & `POST /api/ecommerce/webhooks/woocommerce`: Webhooks de órdenes pagadas con HMAC.
- **Frontend E-Commerce Intelligence (`src/pages/EcommerceCroPage.jsx`, `Sidebar.jsx`)**:
  - Navegación integral por pestañas: *🎯 Product Intelligence*, *🔍 CRO Analyzer*, *📊 Embudo & Drop-off*, *👥 Customer Retention*, *📚 Product Library*, *📈 LTV & Revenue*, *⚡ Automation & Rules*, *🏷️ Meta Ads Catálogo*, *🤝 Afiliados*, *📄 Reports*.
  - Modal interactivo de exportación de Informe Ejecutivo PDF de CRO.
  - Botón de Closed-Loop `[ ✨ Crear Oferta Comercial ]` conectado con Creative Studio.
  - Icono `ShoppingBag` y etiqueta `E-Commerce Intelligence` en la barra lateral.
- **Suite de Pruebas Automatizadas (5 nuevas suites / 12 nuevos tests — Total: 82 suites / 429 tests 100% green)**:
  - `src/test/ecommerce-product-intelligence.test.js`: Validación de score, 5 ángulos, 10 hooks y compliance KDP.
  - `src/test/ecommerce-cro-analyzer.test.js`: Validación de 10 dimensiones CRO, Quick Wins y reporte PDF.
  - `src/test/ecommerce-webhook-security.test.js`: Validación de HMAC-SHA256, protección SSRF e idempotencia estricta.
  - `src/test/ecommerce-retention-ltv.test.js`: Validación de reglas de elegibilidad WhatsApp, LTV y Cross-Sell.
  - `src/test/ecommerce-intelligence-frontend.test.jsx`: Pruebas de integración de interfaz, tabs y análisis.

### Added — Stages 20 & 21: Experimentation & Decision Engine (2026-08-28)
- **Modelos de Experimentos y Alertas (`models/BusinessExperiment.js`, `models/SystemAlert.js`)**:
  - `BusinessExperiment`: Esquema estructurado para A/B Testing científico (`hypothesis`, `controlAsset`, `variantAsset`, `primaryMetric`, `status`, `winnerAssetId`, `statisticalSignificance`, `sampleSizeReached`).
  - `SystemAlert`: Esquema estructurado para detección de anomalías 24/7 (`alertType`, `severity`, `target`, `metricsSnapshot`, `aiDecision`, `status`, `triggeredAt`, `resolvedAt`).
- **Motor de A/B Testing Estadístico (`experimentationService.js`)**:
  - Evaluación de proporciones y prueba $Z\text{-score}$ con cálculo exacto de $p\text{-value}$ y nivel de significancia ($p < 0.05$, confianza $\ge 95\%$).
  - Filtro de tamaño de muestra mínimo ($n \ge 1.000$ impresiones por variante) para evitar falsos positivos o conclusiones prematuras.
  - Clasificación de experimentos en `WINNER`, `LOSER`, `INCONCLUSIVE` o `RUNNING` y retroalimentación automática hacia `PatternMemory` (Etapa 19).
- **Daemon de Monitoreo de Anomalías 24/7 (`alertEngineService.js`)**:
  - Matriz de 5 triggers críticos:
    1. `CPL_ANOMALY`: Salto de CPL $\ge +35\%$ vs benchmark en las últimas 48h.
    2. `ROAS_DROP`: Caída de ROAS $< 0.7\times$ del benchmark financiero.
    3. `LEAD_DROP`: Descenso de volumen de leads $\ge -40\%$ en 48h.
    4. `CREATIVE_FATIGUE`: Frecuencia $> 3.8$ combinada con caída de CTR $\ge 25\%$.
    5. `SLA_LEAK`: Leads calificados sin atención $> 60\text{ minutos}$.
- **The Decision Engine & Control Plane Execution (`decisionEngineService.js`)**:
  - Generación de decisiones prescriptivas estructuradas en 4 bloques: 1. Diagnóstico, 2. Evidencia Dura, 3. Recomendación, 4. Acción Propuesta.
  - Ejecución en un solo clic (`PAUSE_AD`, `SCALE_BUDGET`, `TRIGGER_AI_SETTER`) gobernada y auditada a través del `Agent Control Plane` (Etapa 14) con registro inmutable en `ai_action_logs`.
- **Endpoints de Decision Engine (`netlify/functions/api-decision-engine.js`)**:
  - `GET /api/decision-engine/alerts`: Escaneo y obtención de anomalías activas.
  - `POST /api/decision-engine/execute-action`: Ejecución segura de recomendaciones vía Control Plane.
  - `GET /api/decision-engine/experiments`: Listado de experimentos A/B activos y concluidos.
  - `POST /api/decision-engine/experiments/create`: Creación y puesta en marcha de un nuevo test de hipótesis.
  - `POST /api/decision-engine/experiments/evaluate`: Recálculo estadístico en tiempo real.
- **UI Decision & Experimentation Center (`src/pages/DecisionCenterPage.jsx`, `Sidebar.jsx`, `App.jsx`)**:
  - Pestaña *⚡ Decisiones*: KPIs ejecutivos, tarjetas de anomalías con los 4 bloques diagnósticos, y botones de ejecución de acción inmediata.
  - Pestaña *🧪 Experimentos A/B*: Visualizador comparativo de Control vs Variante con métricas clave y widget de significancia ($p\text{-value}$, nivel de confianza, $Z\text{-score}$, lift relativo).
  - Modal interactivo para creación de nuevos experimentos A/B.
  - Nueva ruta `/app/decision-center` y acceso `"Decisiones & A/B"` con icono `Zap` en la barra lateral.
- **Suite de Pruebas Automatizadas (4 nuevas suites / 9 nuevos tests — Total: 77 suites / 417 tests 100% green)**:
  - `experimentation-statistics.test.js`, `alert-engine-triggers.test.js`, `decision-engine-control-plane.test.js`, `decision-center-frontend.test.jsx`.

### Added — Stage 19: ANIMA Learning Engine & Closed-Loop Intelligence (2026-08-28)
- **Modelos de Memoria de Patrones (`models/PatternMemory.js`)**:
  - Esquema estructurado para almacenar `Winning DNA`, `Losing DNA` y alertas de `Fatiga Creativa` (`patternType`, `featureCombination`, `metrics`, `statisticalConfidence`, `headline`, `diagnosis`, `prescriptiveAction`, `appliedCount`).
  - Filtro de significancia estadística estricto (`MIN_STATISTICAL_SPEND = 5000` ARS, `MIN_STATISTICAL_IMPRESSIONS = 1000`) para descartar activos con muestras insuficientes antes de la clusterización.
- **Motor de Aprendizaje y Reconocimiento de Patrones (`learningEngineService.js`)**:
  - Cruce causal y determinista entre la metadata de Asset Intelligence (Etapa 16/17), el rendimiento publicitario de Meta Ads (Etapa 18) y las ventas y True Profit del CRM (Etapa 15B).
  - Algoritmo de extracción de patrones:
    - *Winning DNA*: Combinaciones con $\text{ROAS} \ge 1.25\times$ el promedio o Margen de True Profit $> 30\%$, con confianza estadística $\ge 85\%$.
    - *Losing DNA*: Combinaciones con $\text{CPA} \ge 1.4\times$ el promedio o $\text{ROAS} < 0.7\times$.
    - *Fatiga Creativa*: Piezas con Frecuencia $> 3.5$ y caída de $\text{CTR} > 20\%$ en los últimos 7 días.
  - Sincronización automática de subdocumentos en `BusinessMemory.winningPatterns` y `BusinessMemory.losingPatterns`.
  - Generador de presets para el Creative Studio (`generateCreativeStudioPreset`).
- **Endpoints de Learning Engine (`netlify/functions/api-learning-engine.js`)**:
  - `GET /api/learning-engine/insights`: Obtiene el resumen de patrones, diagnósticos de IA y alertas de fatiga.
  - `POST /api/learning-engine/sync-patterns`: Escaneo y re-clusterización analítica de activos bajo demanda o vía CRON.
  - `POST /api/learning-engine/apply-to-creative-studio`: Genera el brief pre-configurado para retroalimentar al Creative Studio.
- **UI Learning Center (`src/pages/LearningCenterPage.jsx`, `Sidebar.jsx`, `App.jsx`)**:
  - Dashboard ejecutivo con tarjetas de KPIs (Patrones Analizados, Winning DNA Activos, Lift de ROAS Promedio +42.5%, Alertas de Fatiga).
  - Banner de Diagnóstico Causal de IA (Gemini Adaptive Learning).
  - Columna 🏆 *Winning Performance DNA* con tarjetas interactivas y botón `"✨ Aplicar al Creative Studio"`.
  - Columna ⚠️ *Losing DNA & Fatiga Creativa* con diagnósticos causales y acciones correctivas.
  - Nueva ruta `/app/learning-center` y acceso con icono `Brain` en la barra de navegación lateral.
- **Suite de Pruebas Automatizadas (6 nuevos tests / 108 en total en 36 suites)**:
  - `learning-engine-patterns.test.js`, `learning-engine-api.test.js`, `learning-center-frontend.test.jsx`.

### Added — Stages 16/17 Evolution: Asset Intelligence & Brand Guardian (2026-08-27)
- **Asset Intelligence Metadata (`models/CreativeAsset.js`, `CampaignCreative.js`)**:
  - Estructura de metadatos para cada pieza generada: `format` (1:1, 9:16, 1.91:1), `assetType`, `hookType`, `ctaType`, `offerId` (vinculado a la oferta activa de la Etapa 15B), `presenterType`, `brandComplianceScore`, y contenedor de `performanceMetrics` para futuros webhooks de Meta.
- **Brand Guardian & Automated Compliance Matrix (`brandGuardianService.js`)**:
  - Matriz de auditoría de 100 puntos en 4 dimensiones críticas:
    1. *Logo Integrity (25 pts)*: Presencia y nitidez del logo oficial.
    2. *Color Palette Match (25 pts)*: Coherencia estricta con la paleta de colores del Brand DNA.
    3. *Offer & Price Accuracy (25 pts)*: Concordancia exacta con el precio, cuotas y bonos de la `active_offer` (zero-hallucination).
    4. *Brand Safety & Forbidden Rules (25 pts)*: Ausencia total de términos o estilos prohibidos (`forbiddenElements`).
  - Endpoints: `POST /api/brand-guardian/audit-asset` y `POST /api/brand-guardian/gatekeeper-check`.
- **Gatekeeper Automatic Blocking Logic (Umbral $\ge 85/100$)**:
  - Si un asset obtiene un score $< 85$ o viola restricciones de marca, su estado se fuerza a `NEEDS_REVIEW` o `REJECTED`, bloqueando automáticamente su publicación en el Meta Launch Engine.
- **UI Creative Studio & Brand Badges (`CreativeStudioPage.jsx`)**:
  - Insignia interactiva de cumplimiento `🛡️ Brand Guardian Compliance` con desglose por dimensión y validación en vivo del Gatekeeper en el Editor y en la Galería de Campañas.
- **Suite de Pruebas Automatizadas (7 nuevos tests / 102 en total en 33 suites)**:
  - `brand-guardian-audit.test.js`, `asset-gatekeeper-blocking.test.js`, `brand-guardian-frontend.test.jsx`.
- **Estructura de Costos y True Profit Determinista (`models/Product.js`, `profitCalculator.js`)**:
  - Esquema `costStructure` para cada producto: `COGS` (Costo de fabricación/compra), `gatewayFeePercent` (Comisión pasarela 3.5%), `shippingCost` (Envío logístico), `estimatedCpa` (Costo de adquisición publicitaria en Meta Ads), `otherUnitCosts` y `targetMinMarginPercent`.
  - Motor de cálculo puramente aritmético en Node.js para determinar el **True Profit ($)** unitario real, el **Margen Neto (%)** y el **Descuento Máximo Seguro (%)** sin alucinaciones de IA.
- **AI Offer Engine & Orquestación Estratégica (`models/OfferArchitecture.js`, `offerService.js`)**:
  - Generador de **3 Variaciones Estratégicas de Oferta**:
    - **Offer A (Flash Sale Directo)**: Descuento agresivo seguro respetando el margen mínimo.
    - **Offer B (Master Bundle de Alto Valor - Recomendada)**: Mantiene precio completo y añade bonos de valor percibido ($70.000) con bajo costo real ($6.500), maximizando el True Profit ($).
    - **Offer C (Cero Riesgo & Financiación Flexible)**: 12 cuotas fijas + 30 días de garantía sin riesgo.
  - Endpoints: `POST /api/offers/calculate-profit`, `POST /api/offers/generate`, `GET /api/offers/product/:productId`, `POST /api/offers/activate`.
- **UI Offer Studio (`OfferEnginePanel.jsx`, `CreativeStudioPage.jsx`)**:
  - Modal interactivo con editor de costos en tiempo real, desglose de True Profit con velocímetro de margen y visualización de tarjetas A/B/C.
  - Botón de activación que inyecta la oferta ganadora al `CreativeProfile` para que el Creative Studio y Video Studio diseñen anuncios sobre una oferta rentable.
- **Suite de Pruebas Automatizadas (7 nuevos tests / 95 en total en 30 suites)**:
  - `profit-calculator.test.js`, `offer-engine-service.test.js`, `offer-engine-frontend.test.jsx`.
- **AI Agent Control Plane & Zero-Rogue Security (`models/AIToolPermissionMatrix.js`, `controlPlaneService.js`)**:
  - Matriz de permisos granular por herramienta y agente (`qualifier`, `setter`, `followup`, `reactivation`, `copilot`, `director`).
  - Interceptor de seguridad que suspende en estado `pending_approval` toda acción de riesgo (ej. descuentos $> 15\%$, presupuestos publicitarios $> \$50.000$, cambios a etapas sensibles o activación de campañas en Meta).
  - Modelo inmutable `AIActionLog` para auditoría forense (`agentId`, `toolName`, `inputData`, `reasoning`, `status`, `approverUserId`, `timestamp`).
  - Endpoints `/api/sales-engine/permissions`, `/api/sales-engine/action-logs`, `/api/sales-engine/action-logs/:id/approve` y `/reject`.
- **Multi-Agent Squad & Follow-Up Engine (`followUpEngine.js`)**:
  - Escuadrón de 4 agentes especializados: `Qualifier`, `Setter`, `Follow-up Agent` y `Reactivation Agent`.
  - Cadencia de seguimiento automatizado en 4 etapas:
    - `Paso 1 (+24h)`: Recordatorio cordial.
    - `Paso 2 (+48h)`: Prueba social y casos de éxito.
    - `Paso 3 (+72h)`: Aviso de cierre de atención.
    - `Paso 4 (+96h)`: Derivación a cola de reactivación en etapa `lost`.
- **Sales Intelligence & Human vs AI Benchmarking (`salesIntelligenceService.js`)**:
  - Comparativa de rendimiento entre vendedores humanos y el escuadrón de IA (Leads Asignados, TTFR, Calificados, Citas Agendadas, Ventas Cerradas, Revenue y Conversión).
- **WhatsApp Revenue Intelligence (Atribución Closed-Loop)**:
  - Trazabilidad de ingresos extremo a extremo: `Meta Campaign -> WhatsApp Conversation -> Qualified Lead -> Seller -> Sale -> Revenue`.
  - Badge visual de atribución publicitaria en la cabecera de chat de `WhatsAppInboxPage`.
- **Suite de Pruebas Automatizadas (11 nuevos tests / 88 en total en 27 suites)**:
  - `agent-control-plane.test.js`, `follow-up-engine.test.js`, `sales-intelligence-attribution.test.js`, `sales-engine-frontend.test.jsx`.
- **ANIMA Business Memory Engine & Performance DNA (`models/BusinessMemory.js`, `memoryEngine.js`)**:
  - Almacenamiento histórico estructurado en **7 dimensiones de memoria de negocio**: `Brand Memory`, `Business Memory`, `Sales Memory`, `Audience Memory`, `Creative Memory`, `Campaign Memory` y `Revenue Memory`.
  - **Performance DNA**: Clasificación de `Best Hooks`, `Best Formats`, `Best Offers` y `Best CTAs` basados en el histórico de CPA y ROAS.
  - **Patrones de Éxito y Fracaso**: Registro explícito de `Winning Patterns` (+38% CTR, respuesta rápida en WhatsApp) y `Losing Patterns` con reglas de bloqueo para evitar que la IA repita errores del pasado.
- **ANIMA Business Health Score (0 a 100 - Determinista)**:
  - Algoritmo matemático objetivo auditado en 6 sub-dimensiones:
    1. **Adquisición (15%)**: Ratio CPL Actual vs Benchmark Histórico.
    2. **Creatividad (15%)**: CTR medio con penalización por fatiga creativa.
    3. **Ventas (20%)**: Tasa de cierre Lead-a-Venta vs meta histórica.
    4. **Respuesta (15%)**: Cumplimiento de SLA y TTFR en WhatsApp.
    5. **Facturación (20%)**: Cumplimiento de meta de ingresos MTD.
    6. **Rentabilidad (15%)**: Margen neto de contribución.
  - Insignia y velocímetro integrados en la cabecera del Dashboard principal.
- **Goals & Forecast Engine (`models/BusinessGoals.js`, `api-business-intelligence.js`)**:
  - Proyección de fin de mes mediante regresión de ritmo diario (`Daily Run Rate`), cálculo de brecha (`Gap`) y cálculo de **Ritmo Diario Requerido (`Required Daily Pace`)** para alcanzar la meta.
- **Transparencia de Costos & Margen Real de Agencia (Agency True Profit)**:
  - Fórmula estricta: `Client Revenue - Meta Spend - AI API Costs (usage_events) - Payment Gateway (3.5%) - Infrastructure - Human Ops = Agency Margin`.
  - Panel visual de rentabilidad y desglose de costos en `RevenueDashboardPage`.
- **Suite de Pruebas Automatizadas (14 nuevos tests / 77 en total en 23 suites)**:
  - `business-memory-engine.test.js`, `anima-health-score.test.js`, `forecast-engine-profitability.test.js`, `business-intelligence-frontend.test.jsx`.
- **Descubrimiento Dinámico de Capacidades (`models/MetaCapability.js`, `metaAdsLaunchService.js`, `api-meta-launch.js`)**:
  - Módulo `discoverMetaCapabilities` para consultar en tiempo real qué objetivos (`OUTCOME_LEADS`, `OUTCOME_SALES`), ubicaciones y destinos de leads soporta la cuenta publicitaria en Meta Ads.
  - Selector de Cuentas aislado por `clientId` (Business Manager $\rightarrow$ Ad Account $\rightarrow$ Facebook Page $\rightarrow$ Instagram Profile $\rightarrow$ Pixel/Dataset).
- **Estratega IA de Campañas Gemini & Guardrails Financieros**:
  - `recommendAIStrategy`: Gemini analiza el Brand DNA, productos y presupuesto recomendado para devolver una estructura simplificada (1 CBO + 2 AdSets + 6 Ads) y matriz de ángulos (Fricción, Oferta Directa, Prueba Social).
  - *Budget Guardrails*: Límite diario estricto de seguridad ($50.000 ARS/día) y segmentación Advantage+ con exclusiones de clientes existentes.
- **Pipeline Transaccional e Idempotencia (`clientRequestId`)**:
  - Pipeline transaccional paso a paso (`create_campaign` $\rightarrow$ `create_adset` $\rightarrow$ `create_creative` $\rightarrow$ `create_ad` $\rightarrow$ `attach_form`).
  - Idempotencia garantizada por token `clientRequestId` para prevenir duplicaciones de campañas por doble clic o microcortes.
  - Registro de fallos parciales (`partial_creation`) y endpoint de recuperación `POST /api/meta-launch/:id/retry` que reanuda el paso fallido sin recrear recursos existentes en Meta Ads.
- **Validación Pre-Vuelo de 18 Puntos & Regla Absoluta PAUSED**:
  - Verificación exhaustiva de 18 puntos (cuentas, token de acceso, formularios instantáneos, URLs de privacidad, presupuestos y permisos).
  - Creación inicial **estrictamente en estado `PAUSED`** (Cero Gasto Automático). Activación explícita mediante confirmación del usuario (`POST /api/meta-launch/:id/activate`).
- **Atribución a Ciclo Cerrado & Winner Engine**:
  - Cruce de datos entre gasto de Meta Ads y ventas ganadas en el CRM (`Sale.amount`) para calcular el ROAS real (ej. 146.1x), CPL real y CPA real.
  - Detección algorítmica de Fatiga Creativa (*Creative Fatigue*) cuando la frecuencia supera 2.2 y el CPL incrementa, activando el generador de nuevas variantes creativas (`POST /api/meta-launch/:id/refresh-creatives`).
- **Suite de Pruebas Automatizadas (11 nuevos tests / 63 en total en 19 suites)**:
  - `meta-launch-pipeline.test.js`, `meta-attribution-loop.test.js`, `meta-launch-ui.test.jsx`.
- **Video DNA, Avatares Persistentes & Voces (`models/CreativeProfile.js`, `videoProviderRouter.js`)**:
  - Extensión de `CreativeProfile` con perfiles de video (`cameraStyle`, `lightingStyle`, `editingPacing`), sintetizadores de voz multi-tenant y avatares con inyección de `AvatarID` para consistencia de personaje en todas las generaciones.
- **Continuity Engine & Scene Graph (`models/VideoProject.js`, `api-video-studio.js`)**:
  - Modelo `VideoProject` con array de escenas (`Hook`, `Problem`, `Solution`, `CTA`) y almacenamiento de `ContinuityPack`.
  - Lógica "Next Scene Intelligence": inyección automática del `last_frame` de la escena previa como `first_frame` en la siguiente escena para eliminar saltos visuales.
  - Generador de Storyboard Direct-Response con Gemini (Hook -> Problem -> Proof -> CTA) con estimación de reducción de CPL.
- **Mixed Media Timeline & Editor (`src/pages/VideoStudioPage.jsx`)**:
  - Línea de tiempo visual interactiva que permite intercalar video orgánico grabado con celular (B-roll real) con avatares IA, locuciones y overlays programáticos.
  - Reproductor con visualizador de zonas seguras (*Safe Zones*) para Reels/TikTok y badges de precio sin alucinaciones de texto.
- **Meta Ads Campaign Launch Engine & Safety Guardrails (`models/MetaCampaignLaunch.js`, `metaAdsLaunchService.js`, `api-meta-launch.js`)**:
  - Wizard de orquestación de campañas Meta Ads conectado directamente al CRM.
  - **Regla Innegociable de Seguridad**: Creación estricta de campañas en estado **`PAUSED`** (o `DRAFT`) con límites de presupuesto (*Budget Guardrails* de máximo $50.000/día).
  - Pre-Flight Check automatizado de **18 puntos de validación** (cuenta publicitaria, permisos, página, Instagram, formularios, presupuesto y audiencias).
  - Activación explícita mediante confirmación del usuario (`POST /api/meta-launch/:id/activate`).
- **Lead Winner Mode & Observabilidad de Costos (`models/AIUsage.js`)**:
  - Detector de patrones ganadores de anuncios (-34.8% CPL) para retroalimentar la generación de nuevas familias creativas.
  - Medidor de consumo de créditos de IA por inquilino con ruteo de costo (`Veo 3.1 Lite`, `Veo 3.1 Fast`, `Veo 3.1 Pro`).
- **Suite de Pruebas Automatizadas (9 nuevos tests / 52 en total)**:
  - `video-continuity-engine.test.js`, `meta-launch-engine.test.js` y `video-studio-frontend.test.jsx`.

### Added — Stage 16: AI Campaign Creative Engine (Sistema Operativo Creativo con Memoria de Marca) (2026-08-27)
- **Brand DNA & Memoria Creativa (`models/CreativeProfile.js`, `api-creative-profile.js`)**:
  - Entidad `CreativeProfile` con aislamiento multi-tenant por `clientId` para almacenar Logos oficiales, Tipografías, Paleta de Colores, Rubro/Vertical, Tono de Voz y Restricciones Negativas (*Forbidden Elements*).
  - Carga inteligente de Logos con Gemini Vision (`POST /api/creative-profile/analyze-logo`) sugiriendo paleta de colores y nivel de contraste AAA.
- **Catálogo de Productos & Assets Protegidos (`models/Product.js`, `api-products.js`)**:
  - Entidad `Product` con fotografías reales en PNG transparente, precios, cuotas fijas estructuradas y especificaciones.
- **Director de Arte Computacional & Estratega Gemini (`aiDirectorProvider.js`)**:
  - Generación de Brief Estratégico y 3 Propuestas Conceptuales diferenciadas (Concept A: Hero Protagonista, Concept B: Catálogo de Ofertas, Concept C: Storytelling).
  - Especificación de Diseño en JSON (`LayoutSpec`) con coordenadas precisas, dimensiones y jerarquía visual.
- **Motor de Composición Programática Zero-Hallucination (`programmaticRenderer.js`, `imageGenProvider.js`)**:
  - Separación estricta: fondos y texturas generados por IA, mientras que fotos reales, logotipos vectoriales, precios con separadores de miles y cuotas se ensamblan mediante SVG/Canvas de alta resolución.
  - Adaptación responsiva automática para formatos `1:1` (Feed), `9:16` (Story/Reels) y `1.91:1` (Banner horizontal).
- **Editor Visual, Quality Score & Memoria de Campañas (`CreativeStudioPage.jsx`, `api-creative-campaigns.js`)**:
  - Evaluación multidimensional de *Creative Quality Score* (0 a 100).
  - Editor interactivo para modificar titulares, precios y llamados a la acción (CTA).
  - Galería de campañas con funciones de "Reutilizar Campaña", "Crear Versión 2", "Mejorar con IA" y exportación en SVG.
- **Suite de Pruebas Automatizadas (9 tests)**:
  - Tests de Director de IA (`creative-engine-director.test.js`), Pipeline de Renderizado (`creative-rendering-pipeline.test.js`) y Frontend UI (`creative-studio-frontend.test.jsx`).

### Added — Stage 15: Motor de E-Commerce y Optimización de Conversión (CRO) (2026-08-27)
- **Hub de E-Commerce & Embudo de Drop-Off (`models/Ecommerce.js`, `api-ecommerce.js`, `EcommerceCroPage.jsx`)**:
  - Ingesta y normalización de eventos estándar GA4 E-Commerce y Meta Pixel (`view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`).
  - Cálculo de tasas de retención y porcentaje de caída (*Drop-off rate*) paso a paso.
  - Visualizador visual interactivo de embudo en `/app/ecommerce` con desglose comparativo móvil frente a escritorio.
- **Analizador UI/UX & Agente IA de CRO**:
  - Cálculo de *Friction Score* ponderado (0 a 100) combinando Bounce Rate, tiempo medio en página, ratio de abandono de checkout y disparidad de dispositivos.
  - Analítica de formularios campo por campo para identificar campos confusos o innecesarios.
  - Agente de IA para CRO (`POST /api/ecommerce/cro-diagnose`) con diagnóstico de puntos de fuga, soluciones técnicas y proyección de incremento en facturación (+24.5%).
- **Auditoría de Meta Ads Catálogo (Advantage+ Shopping) y Campañas de Llamadas**:
  - Extracción de ROAS de catálogo, CPA por producto y Costo por Añadir al Carrito (CPATC).
  - Auditoría de llamadas telefónicas cruzando clics en extensiones de anuncios con leads del CRM para obtener el ratio *Call-to-Close*.
- **Red de Referidos, Afiliados & Dropshipping (`models/Affiliate.js`, `api-affiliates.js`)**:
  - Modelo de partners/afiliados, gestor de códigos promocionales (`promoCode`) y endpoint de atribución (`POST /api/affiliates/track`).
  - Calculador de **Margen Neto Real** en cascada ($Ingreso - Gasto Ads - COGS Dropshipping - Comisiones$).
- **Copiloto de Ventas E-Commerce (IA)**:
  - 3 nuevas herramientas deterministas en `copilotTools.js`: `get_checkout_dropoff`, `get_affiliate_roi`, `get_top_selling_products`.
  - Respuestas analíticas de Director de E-Commerce para tácticas de upselling y recuperación de carritos por WhatsApp.
- **Suite de Pruebas Automatizadas (10 tests)**:
  - Pruebas unitarias de embudo (`ecommerce-funnel.test.js`), unit economics de afiliados (`affiliates-profitability.test.js`) y frontend UI (`ecommerce-frontend.test.jsx`).

### Added — Stage 14: Hub Omnicanal (WhatsApp, Instagram Direct, Facebook Messenger), Agentes IA Autónomos ("El Cerebro"), Analítica de SLA y Motor de Remarketing ICP (2026-08-27)
- **Hub Omnicanal Integral (WhatsApp, Instagram Direct y Facebook Messenger)**:
  - Soporte multi-canal en `api-whatsapp-webhook.js` para procesar payloads de Meta Graph API v19.0+ correspondientes a `whatsapp_business_account`, `object: 'instagram'` y `object: 'page'` (Messenger).
  - Normalización unificada de contactos, hilos de chat y creación automática de leads con origen discriminado (`source: 'whatsapp' | 'instagram' | 'facebook'`).
  - Badges distintivos por canal en tarjetas de chat del Inbox (WA verde, IG rosa/violeta, FB azul) y selector de filtrado por canal.
- **"El Cerebro Empresarial" y Base de Conocimiento Multi-Tenant (`models/AiBrain.js`, `api-whatsapp.js`, `SettingsPage.jsx`)**:
  - Colección `ai_brain` en MongoDB Atlas con aislamiento por `clientId`.
  - Panel interactivo en `/app/settings` ("Equipo IA") para configurar Rubro y Tono de Voz, Base de Conocimiento (Servicios, Precios, FAQs y Políticas), y Reglas de Calificación de Prospectos.
  - Endpoints `GET /api/whatsapp/brain` y `PUT /api/whatsapp/brain` para persistencia en tiempo real.
- **Agentes Autónomos Calificador y Setter con Hand-off Humano (`agentEngine.js`)**:
  - Motor de evaluación contextual que analiza mensajes entrantes en leads nuevos (`stage: 'new'`).
  - Respuestas fundamentadas en la base de conocimiento y promoción automática de prospectos a etapa `qualified` (`CALIFICADO`) en el pipeline comercial cuando se detecta presupuesto/interés concreto.
  - Detección de frustración o consultas complejas con silenciado automático del bot (`isBotMuted: true`), registro de actividad `bot_handoff` y botón de control manual en la cabecera del chat.
- **Analizador Conversacional y Rendimiento de SLA (`api-team-sla.js`, `RevenueDashboardPage.jsx`)**:
  - Cálculo de Tiempo de Primera Respuesta (TTFR), tasa de conversión de leads ganados (`won`) por vendedor y métricas globales del equipo comercial.
  - **Alerta Roja de Fuga de Leads**: Detección y notificación urgente de prospectos calificados con más de 12 horas sin respuesta de un agente humano.
  - Sección interactiva en el Dashboard de Revenue (`RevenueDashboardPage.jsx`).
- **Motor de Remarketing y Perfil de Cliente Ideal (ICP) (`api-audiences-export.js`, `CampaignsPage.jsx`)**:
  - Exportador directo de audiencias personalizadas para Meta Ads en formato CSV canónico (`email,phone,fn,ln,country,value`) con teléfonos E.164.
  - Botón "Exportar Audiencias Meta" en `/app/campaigns` para descargar prospectos ganados, perdidos o estancados.
- **Suite de Pruebas Automatizadas**:
  - Agregadas 3 nuevas suites (`agent-brain.test.js`, `omnichannel-webhook.test.js`, `team-sla.test.js`) con validación al 100% de webhook omnicanal, motor de IA, cálculo de SLA y exportación de audiencias CSV.

### Added — Stage 13: Bandeja de Entrada Omnicanal (Inbox) de WhatsApp Cloud API con Tiempo Real y Pipeline Comercial (2026-08-27)
- **Bandeja de Entrada Omnicanal Clon UX/UI "MB Suite" (`WhatsAppInboxPage.jsx`)**:
  - **Panel Izquierdo (Lista de Chats)**: Dropdown verde de selección de líneas activas (`+54 9 11...`) con opciones de "+ Agregar otro número" y "Gestionar plantillas"; buscador en tiempo real por nombre o teléfono; filtros rápidos ("Todos", "No leídos" con badge contador, "Archivados"); filtros secundarios por Vendedor y Etiquetas; lista interactiva de tarjetas con avatar, nombre, teléfono, checks de lectura (`✓`/`✓✓` en azul/gris), preview de mensaje y badge de línea/pipeline.
  - **Panel Central (Conversación Activa)**: Cabecera con datos del contacto, indicador de estado y botones de acción rápida; ventana de conversación con burbujas WhatsApp (esmeralda saliente y neutro entrante), timestamps, checks de entrega y auto-scroll; input bar con textarea multilínea (Enter para enviar) y botón de envío.
  - **Panel Derecho (Contexto Comercial CRM)**: Ficha de datos del lead, selector interactivo de Etapa en el Pipeline Kanban (`NUEVO`, `CONTACTADO`, `CALIFICADO`, `GANADO`, `PERDIDO`), etiquetas asociadas, editor de notas internas rápidas y botón directo a la ficha del CRM.
- **Infraestructura de Webhook Meta WhatsApp Cloud API (`api-whatsapp-webhook.js`)**:
  - Endpoint `GET`: Handshake y verificación criptográfica de Meta (`hub.mode`, `hub.verify_token`, `hub.challenge`).
  - Endpoint `POST`: Ingesta y normalización de eventos de mensajes entrantes y actualizaciones de estado (`sent`, `delivered`, `read`).
  - **Regla 1 de Sinergia con el Pipeline**: Creación automática e inmediata de un Lead en etapa `new` (`NUEVO`) en la colección `leads` cuando un número nuevo envía un mensaje, vinculando el prospecto y registrando la actividad en el CRM.
  - Respuesta instantánea HTTP 200 `{ status: 'EVENT_RECEIVED' }` para evitar bucles de reintento en los servidores de Meta.
- **Motor de Mensajería & Endpoints Serverless (`api-whatsapp.js`)**:
  - `GET /api/whatsapp/lines`: Consulta de líneas conectadas por empresa (`clientId`).
  - `POST /api/whatsapp/lines`: Conexión y registro de nuevas líneas telefónicas (`phoneNumberId`, `wabaId`, `displayPhoneNumber`).
  - `GET /api/whatsapp/chats`: Consulta de hilos con filtrado por línea, término de búsqueda, vendedor, etiquetas y estado.
  - `GET /api/whatsapp/chats/:chatId/messages`: Historial paginado de mensajes y reseteo automático del contador de no leídos (`unreadCount: 0`).
  - `POST /api/whatsapp/send`: Despacho de mensajes salientes a la API oficial de Meta Graph (`v19.0+`) o simulación en sandbox, persistencia de mensaje y registro de actividad en el Lead.
  - `PATCH /api/whatsapp/chats/:chatId`: Actualización de estado del chat, etiquetas, asignación de vendedor y sincronización bidireccional con la etapa del Lead en el Kanban.
- **Modelos de Datos y Normalización E.164 (`models/WhatsApp.js`)**:
  - Colecciones `wa_lines`, `wa_chats` y `wa_messages` con validadores y sanitizadores de esquemas.
  - Normalizador canónico `normalizePhoneNumber` que garantiza formato internacional estándar con `+` (ej: `+5491144556677`).
- **Preparación para Etapa 14 (Equipo IA en `SettingsPage.jsx`)**:
  - Añadida sección "Equipo IA" en Ajustes con tarjetas y toggles para el "Agente Calificador de Prospectos" y "Agente Setter de Citas".
- **Internacionalización Completa (i18n)**:
  - Diccionarios bilingües en español (`es`) e inglés (`en`) para todas las cadenas de texto del Inbox en `LanguageContext.jsx`.
- **Suite de Pruebas Automatizadas (41 suites, 316 tests)**:
  - Agregadas 16 pruebas unitarias, de webhook, de validación multi-tenant y de frontend (`whatsapp-webhook.test.js`, `whatsapp-security.test.js`, `whatsapp-backend.test.js`, `whatsapp-frontend.test.jsx`) con 100% de éxito en todo el proyecto.

### Added — Stage 11: Copiloto de Revenue Intelligence con IA (2026-08-27)
- **Asistente Estratégico de Solo Lectura & Control Humano**: Diseñado e implementado el Copiloto de Revenue Intelligence como un asistente analítico estrictamente consultivo (sin permisos de escritura en campañas ni en base de datos), conservando siempre la supervisión y control del usuario.
- **Aislamiento Multi-Tenant Estricto (Threat Model)**: Aislamiento forzado donde el `clientId` es extraído exclusivamente de la sesión verificada en backend (Firebase Auth). Si el usuario es administrador global, la empresa seleccionada se valida rigurosamente; si es cliente/inquilino, queda encapsulado a su propio `clientScope`. Cero inyección de queries MongoDB dinámicas.
- **Herramientas Deterministas Tipadas (`copilotTools.js`)**: 7 herramientas analíticas allowlisted (`getKpis`, `getTimeseries`, `getCampaignBreakdown`, `getLeadFunnel`, `getSalesAgingReport`, `getDiagnosticsSummary`, `getMetricDefinitions`) que calculan con 100% de precisión matemática finanzas, ROAS atribuido, CPL, embudo de leads, antigüedad de deuda (aging) y presencia digital.
- **Adaptador de Proveedores con Circuit Breaker (`copilotProviderAdapter.js`)**: Soporte agnóstico desacoplado para Motor Determinista Local, Google Gemini API y OpenAI API con interruptor de circuito automático (5 fallos consecutivos, 60s de enfriamiento, timeout de 15s) para garantizar alta disponibilidad.
- **Esquema de Respuesta Estructurado & Política de Abstención (`copilotSchema.js`)**: Validación rígida de schema JSON (`shortAnswer`, `numericalEvidence`, `confidence`, `suggestedActions`, `dashboardLink`, `limitations`). Detección y bloqueo de prompt injections con respuesta preventiva de abstención honesta y anonimización de PII/API keys.
- **Endpoint Serverless con Rate Limiting (15 req/min)**: Implementado `api-copilot.js` con soporte para `/api/copilot/suggestions` y `/api/copilot/query`, rate limiter por IP/Usuario en MongoDB con TTL index.
- **Interfaz Conversacional Avanzada (`CopilotPage.jsx`)**: Vista interactiva con selector de empresa, período y moneda, chips de preguntas estratégicas recomendadas, evidencia numérica destacada en badges, lista de acciones recomendadas, links profundos a dashboards, botones de feedback (👍/👎) y copiado al portapapeles.
- **Internacionalización Completa (i18n)**: Diccionarios bilingües en español (`es`) e inglés (`en`) para todos los componentes, etiquetas y avisos del Copiloto en `LanguageContext.jsx`.
- **Suite de Pruebas Automatizadas (37 suites, 300 tests)**: Agregadas 20 pruebas unitarias, de seguridad, de evaluación sintética y de frontend (`copilot-tools.test.js`, `copilot-security.test.js`, `copilot-evals.test.js`, `copilot-backend.test.js` y `copilot-frontend.test.jsx`) con 100% de éxito en toda la suite.
- **Modo Prospección (Sin Credenciales Administrativas)**: Agregado switch en modal de vinculación y bandera `isProspectingMode` en `GoogleSource` para evaluar y auditar clientes potenciales usando únicamente sus métricas públicas de Google Places antes de firmar contrato.
- **Prompt Maestro de Radiografía de Lead & Closer de Ventas**: Generador de diagnósticos para prospección comercial con 1-clic de copiado estructurado en: 1) Matriz de Esfuerzo vs. Recompensa (ALTO/MEDIO/BAJO), 2) Puntos Ciegos / La Herida (3 vulnerabilidades críticas), y 3) Ángulo de Venta / El Cierre (guion exacto de 2 párrafos para WhatsApp o reuniones) con integración a Kommo CRM.
- **Prompt Maestro para Estrategia SEO/SEM (Anima MKT Digital)**: Botón interactivo de copiado pre-cargado con métricas consolidadas y plan táctico de 3 tareas técnicas y 3 acciones comerciales para seguimiento en pipeline.
- **Modelos de Datos y Aislamiento Multi-Tenant**: Creadas colecciones `google_sources`, `google_reviews`, `google_snapshots`, `google_competitors` y `google_analyses` con validación estricta de esquemas y aislamiento por `clientId`.
- **Motor Matemático Determinista (`googleMetrics.js`)**: Cálculo puro de calificación promedio, distribución de estrellas (1-5), tasa de respuesta, tiempo medio de respuesta en horas, CTR orgánico medio, posición media en Search Console, detección de consultas de alto alcance/bajo CTR y radar competitivo local.
- **Redactor Asistido de Respuestas a Reseñas con IA (`googleAi.js`)**: Generación de respuestas empáticas y educadas en modo **borrador editable** con protección anti-prompt injection (nunca auto-publicadas a Google).
- **Diagnóstico Estratégico de Google con IA**: Reporte estructurado con 5 pilares (Ficha & Reputación, SEO Orgánico, Conversión Web, Eficiencia Ads, Posición Competitiva), hallazgos priorizados con responsables sugeridos, quick wins y roadmap táctico 30/60/90 días.
- **Endpoints Serverless con Rate Limiting (10 req/min)**: Implementados `api-google-sources.js`, `api-google-reviews.js`, `api-google-snapshots.js`, `api-google-competitors.js` y `api-google-ai.js` con purga segura en cascada al desconectar entidades.
- **Interfaz Interactiva y Accesible (`GoogleIntelligencePage.jsx`)**: Vista multi-pestaña (Visión General, Ficha & Reseñas, SEO & Search Console, Tráfico & Ads, Radar Competitivo, Diagnóstico IA) con selector de empresas, redactor de respuestas y advertencias de atribución explícitas.
- **Internacionalización Completa (i18n)**: Diccionarios bilingües en español (`es`) e inglés (`en`) para todos los componentes y métricas de Google Intelligence.
- **Suite de Pruebas Automatizadas (32 suites, 280 tests)**: Agregadas 16 pruebas unitarias e integradas (`google-metrics.test.js`, `google-ai.test.js`, `google-backend.test.js` y `google-frontend.test.jsx`) con 100% de éxito en toda la suite.

### Fixed — Stage 8 Social Analyzer Empty State & Auth Guard Hotfix (2026-08-27)
- **Protección de Carga de Autenticación en `SocialAnalyzerPage.jsx`**: Incorporada la bandera `authLoading` en los efectos de carga inicial para evitar disparar peticiones prematuras a `/api/social/sources` antes de que el token de Firebase y el `userProfile` estén listos.
- **Manejo Seguro de Inquilinos Vacíos en `api-social-sources.js`**: Si un inquilino no posee perfiles sociales aún o no cuenta con empresa asignada, el endpoint retorna código HTTP 200 con `{ ok: true, sources: [] }` en lugar de responder con un error 403 `TENANT_SCOPE_MISSING`.
- **Eliminación de Banners de Error Falsos Positivos**: El banner rojo de alerta solo se activa ante fallos reales de red o servidor, asegurando que ante una colección vacía la interfaz renderice fluidamente el `EmptyState` amigable invitando a vincular el perfil social.
- **Sanitización de Consultas en Backend**: Agregada verificación de valores inválidos (`'undefined'`, `'null'`, `'all'`) y optional chaining defensivo en propiedades de `SocialSource` y `SocialAnalysis`.

### Added — Stage 8: Analizador de Clientes de Facebook & Instagram con IA (2026-08-27)
- **Modelos de Datos y Aislamiento Multi-Tenant**: Implementadas colecciones `social_sources`, `social_snapshots` y `social_analyses` con validación exhaustiva de esquemas, soporte para perfiles de Instagram/Facebook y aislamiento estricto por `clientId`.
- **Motor Matemático Determinista (`socialMetrics.js`)**: Cálculo puro de cadencia semanal/mensual, días promedio entre posts, distribución porcentual de formatos (Reels, Carruseles, Fotos), Tasa de Engagement sobre Alcance real (`rates.engagementRateOverReach`), Proxy sobre Seguidores (`rates.engagementRateOverFollowers`), e Índice de Regularidad/Consistencia (0-100).
- **Protección Anti-Prompt Injection (`promptSanitizer.js`)**: Sanitización profunda de textos libres, captions, bios y comentarios, eliminando intentos de override de instrucciones (`SYSTEM:`, `ignore previous instructions`), caracteres de control ASCII y delimitadores de bloques de código.
- **Motor de IA Desacoplado con Fallback Determinista (`ai.js`)**: Adaptador agnóstico de proveedor (soporte para Gemini 2.0 Flash y Groq Llama 3.3) con validación estricta de schema JSON en 5 pilares estratégicos y plan de acción táctico a 30 días. Generador de reportes deterministas para operar sin dependencia de APIs externas.
- **Endpoints Serverless con Rate Limiting**: Creados `api-social-sources.js`, `api-social-snapshot.js` y `api-social-analyzer.js` con límite de 10 ejecuciones por minuto y purga segura en cascada al desvincular perfiles.
- **Frontend Interactivo y Accesible (`SocialAnalyzerPage.jsx`)**: Vista completa con tarjeta de perfil, KPI badges deterministas, reporte diagnóstico de IA, desglose de pilares, matriz de hallazgos accionables, plan táctico a 30 días, importador manual de publicaciones CSV/JSON y modales de vinculación.
- **Internacionalización Completa (i18n)**: Diccionarios completos en español (`es`) e inglés (`en`) para todos los textos, métricas y tooltips del analizador social.
- **Suite de Pruebas Automatizadas (28 suites, 261 tests)**: Agregadas 17 pruebas unitarias e integradas (`social-metrics.test.js`, `ai-prompt-sanitizer.test.js`, `ai-schema-validator.test.js`, `social-backend.test.js` y `social-frontend.test.jsx`) con 100% de éxito en toda la suite.
- **Internacionalización Global Completa (i18n)**: Integrado el hook `useLanguage` y diccionarios completos en español (`es`) e inglés (`en`) en todos los componentes y vistas principales (`Sidebar.jsx`, `Header.jsx`, `RevenueDashboardPage.jsx`, `AdminCenterPage.jsx`, `LeadsPage.jsx`, `CampaignsPage.jsx`, `SettingsPage.jsx` y `formatRole`). Eliminados todos los textos en "Spanglish" del sistema, permitiendo un cambio fluido y consistente de idioma en toda la plataforma.
- **Localización Dinámica e i18n**: Configurada localización dinámica basada en el idioma activo de `LanguageProvider` y la zona horaria del inquilino (tenant) para formatear monedas, números y fechas a través de helpers `formatCurrency`, `formatDate` y `formatNumber` en todo el flujo del frontend.
- **Límite de Tasa (Rate Limiting) en Netlify Functions**: Creado middleware centralizado basado en MongoDB (`checkRateLimit`) con índice TTL para mitigar abuso en endpoints críticos (`api-meta-sync` y `api-dashboard-revenue-export`).
- **Seguridad HTTP & CSP**: Configurado un conjunto estricto de cabeceras HTTP de seguridad (incluyendo Content Security Policy compatible con Firebase Auth y Google Fonts) en `netlify.toml`.
- **Manejo de Errores Global (React Boundary)**: Implementado e integrado componente `ErrorBoundary` a nivel raíz para mitigar excepciones imprevistas del renderizado en React.
- **Plan de Contingencia & Recuperación**: Diseñado manual operativo `RECOVERY.md` para backups de base de datos, rollback en Netlify y mitigación de catástrofes.
- **Garantía E2E y Robustez del Backend**: Validado que la suite de 244 pruebas unitarias pase con 100% de éxito, corrigiendo la preautorización de contraseñas de Firebase y previniendo colisiones de test sprying.

### Added — Stage 6: Panel de Administración & Seguridad Multi-Tenant (2026-08-26)
- **Invitaciones Criptográficas de Un Solo Uso**: Implementado flujo de preautorización que genera tokens seguros de un solo uso con hash SHA-256 (`invitationTokenHash`) y expiración de 7 días.
- **Auditoría Multi-Tenant de Empresas**: Registro automatizado de logs de auditoría (`audit_logs`) con diffs detallados para creación, modificación, deactivación y reactivación de empresas.
- **Logs de Sync Meta Paginados**: Endpoint GET con aislamiento de inquilinos y paginación para consultar el historial de sincronización.
- **Panel Administrativo Consolidado (UI)**: Nueva interfaz unificada `AdminCenterPage.jsx` con pestañas para CRUD de empresas, usuarios/invitaciones, activos Meta, salud & sync, tasas de cambio e historial de auditoría.
- **Robustez de Tests**: Corregidos mocks e integraciones para que toda la suite de 244 tests pase con éxito (100% pass), con compatibilidad total para preautorizaciones legacy.

### Added — Stage 5B: Revenue Dashboard & Historical Multimoneda (2026-08-26)
- **Modelo de Tasas de Cambio (`ExchangeRate.js`)**: Agregado modelo de validación, búsqueda e históricos cronológicos de tipo `exchange_rates` (USD a ARS).
- **API de Tasas (`api-exchange-rates.js`)**: Creado endpoint administrativo con control de super_admin, logs de auditoría y validación de superposiciones.
- **Motor de Agregación de Revenue (`api-dashboard-revenue.js`)**: Motor con cálculo de ROAS Blended/Atribuido, CPL, CPA y control estricto multi-tenant y de vendedor.
- **API de Exportación (`api-dashboard-revenue-export.js`)**: Endpoint para generar CSV protegido contra CSV injection y payloads PDF JSON.
- **Frontend del Revenue Dashboard (`RevenueDashboardPage.jsx`)**: Vista de performance con filtros por URL, gráficos SVG dinámicos integrados, embudo y desglose por campañas con drill-down a adsets.
- **Pruebas y Linter**: Agregadas 13 pruebas unitarias de conversión y 3 pruebas de aislamiento multi-tenant e integración.

### Fixed — Frontend Dashboard Race Condition Hotfix (2026-08-26)
- **Prevención de Condiciones de Carrera**: Se restringió la llamada a las funciones `fetchStats` y `fetchClients` en `DashboardPage.jsx` para que no se ejecuten hasta que `auth.currentUser` y `userProfile` estén completamente cargados, asegurando que la petición inyecte el token de Firebase y evitando respuestas HTTP 401 en producción (bypasseado en el entorno de pruebas unitarias).
- **Manejo Correcto de Errores de Sesión**: Se añadió soporte explícito para códigos HTTP 401 (`ApiError.status === 401`) en el catch del panel de control para que configure el estado de error de forma adecuada y no lo muestre erróneamente como "empresa inexistente o inactiva".

### Fixed — Dashboard Multiempresa Hotfix (2026-08-26)
- **Bypass del Control de Inquilinos en Vista Global**: Se corrigió la compuerta inicial en `api-dashboard.js` para interceptar explícitamente los literales serializados `"undefined"`, `"null"`, `"all"`, y vacíos. Para administradores globales, se saltea la verificación y obtención de empresa individual, evitando fallos 404 erróneos y permitiendo acceder limpiamente al panel unificado de "Todas las Empresas".
- **Soporte de Espacios en Identificadores**: Se actualizó la expresión regular sintáctica para soportar espacios (`/^[a-zA-Z0-9\s-_]+$/`), permitiendo slugs heredados de semillas previas.
- **Trazabilidad y Control de Excepciones**: Se agregaron logs de diagnóstico detallados (`DASHBOARD_DIAGNOSTIC`) en la entrada del handler y se estructuró la captura de excepciones de base de datos para responder de forma consistente con HTTP `500` en lugar de enmascararse como `404`.

### Fixed — Dashboard Multiempresa Hotfix (2026-08-25)
- **Soporte de Slugs e Identificadores tipo String en Dashboard**: Se flexibilizó la validación inicial de `clientId`/`clientScope` en `api-dashboard.js` para admitir cualquier identificador alfanumérico limpio con guiones y guiones bajos (`/^[a-zA-Z0-9-_]+$/`), posibilitando el uso de slugs (como `"perfumeria-marion"`) y evitando respuestas 400 prematuras.
- **Búsqueda Robusta Multiformato**: Se introdujo el helper `findClient` para buscar empresas en la base de datos de manera secuencial (por ObjectId, string `_id` o `slug`), normalizando `targetClientId` al tipo nativo del `_id` persistido.
- **Alineación de Tipos de Base de Datos**: Se utiliza `targetClientId` directamente en las consultas de agregación de leads, cobros, rendimiento y campañas Meta para mantener estricta consistencia de tipos y satisfacer assertions de pruebas existentes.

### Fixed — Dashboard Multiempresa Direct in main (2026-08-25)
- **Soporte ObjectId vs Strings en Dashboard:** Se corrigió la validación y obtención del cliente en `api-dashboard.js` para buscar de forma flexible tanto por `ObjectId` como por string de ID o slug como fallback, y normalizar `targetClientId` con el `_id` real de la base de datos para asegurar el aislamiento y consistencia de tipos en consultas subsiguientes.
- **Robustez de Validación de clientId:** Se endureció la validación del identificador de empresa para requerir strings de 24 caracteres hexadecimales conformes con `ObjectId` en el backend, respondiendo HTTP `400` ante solicitudes malformadas.
- **Pruebas de Aislamiento Global:** Se añadió un caso de prueba para certificar que la vista global ("Todas las Empresas") incluye únicamente información de empresas activas, excluyendo empresas inactivas.

### Fixed — Dashboard Multiempresa Direct in main (2026-08-24)
- **Soporte de Vista Global ("Todas las Empresas") en Backend:** Se modificó `api-dashboard.js` para admitir consultas sin `clientId` (o con `clientId=all`), filtrando leads, ventas y vendedores de únicamente empresas con `status: 'active'`.
- **Aseguramiento Multidivisa:** Se prohibió sumar directamente monedas diferentes (ARS y USD). La agregación y KPIs financieros del dashboard (`totalCollectedFormatted`, `adSpendFormatted`, `roasFormatted`, `cplFormatted`, `cpaFormatted`) ahora se desglosan limpiamente por divisa separados por una barra diagonal (` / `) si hay múltiples divisas, y conservan la presentación normal si hay una sola moneda.
- **Aislamiento en Ranking de Vendedores:** Se incluyeron únicamente usuarios con `role: 'salesperson'` en el ranking comercial, y se añadió la propiedad `companyName` para identificar la empresa de pertenencia de cada vendedor en la vista global y evitar colisiones de nombres o identificadores de distintos tenants.
- **Actualización de Etiquetas Visuales:** Se actualizaron las constantes visuales del sistema para mostrar `FASE 5A` en lugar de `ETAPA 3 · ACTIVA`, actualizando dinámicamente el header y badges correspondientes.
- **Limpieza de Estados de Carga:** Se configuró el vaciado del estado de estadísticas (`stats = null`) en el frontend inmediatamente al cambiar de empresa seleccionada para evitar visualizaciones mezcladas de datos anteriores.
- **Robustez de Tests:** Se incorporaron 20 casos de prueba exhaustivos en las suites de backend (`dashboard-backend.test.js`) y frontend (`dashboard-frontend.test.jsx`) para validar todas las combinaciones de roles, scopes y visualización de monedas.

### Added — Phase 5A Gate 1: Endurecimiento Técnico Previo a la Activación (2026-08-24)
- **Reclasificación de APP_URL:** Modificado el workflow `.github/workflows/meta-sync-cron.yml` para consumir `APP_URL` desde `vars.APP_URL` (variable pública) en lugar de un secret, manteniendo `CRON_SECRET` protegido en secrets.
- **Endurecimiento de /status:** Refactorizado el endpoint `GET /api/meta/status` para retornar exclusivamente booleanos (`hasAppId`, `hasAppSecret`, `hasSystemUserToken`, etc.) y versionamiento, eliminando cualquier fragmento o enmascaramiento parcial del token para prevenir filtraciones.
- **Kill Switch de Sincronización Manual:** Implementada la validación de `META_MANUAL_SYNC_ENABLED` en `api-meta-sync.js`. Si no está en `true`, cualquier intento de trigger manual retorna un error `503 Service Unavailable` con código `META_MANUAL_SYNC_DISABLED`, sin afectar la ejecución del cron automatizado con `X-Cron-Auth`.
- **Cobertura de Pruebas Unitarias:** Añadidas y robustecidas pruebas unitarias en Vitest para certificar las validaciones del workflow, el kill switch, el alta administrativa, conflictos de datasets y preservación histórica.

### Fixed — Stage 4 Corrective Fixes (2026-08-24)
- **Consistencia de Sanitizadores:** Se renombraron las funciones sanitizadoras en los modelos a `sanitizeMetaAdAccount`, `sanitizeMetaDataSource` y `sanitizeClientMetaScope` para coincidir exactamente con las importaciones de los endpoints.
- **Helper de Base de Datos:** Se implementó y exportó la función `getDb` en `db.js` para resolver problemas de importación y carga dinámica de la base de datos en las Netlify Functions de la Etapa 4.
- **Ejecución en Segundo Plano Asíncrona:** Se refactorizó `api-meta-sync.js` para disparar asíncronamente al worker `meta-sync-background.js` (Netlify Background Function) y retornar un código HTTP `202 Accepted` de forma inmediata.
- **Seguridad en Background Worker:** Se actualizó `meta-sync-background.js` para verificar de forma estricta el token `X-Cron-Auth` y reutilizar el `jobId` original creado por el trigger para evitar duplicados en la base de datos.
- **Acceso Explicito en Multiempresa:** Se requiere obligatoriamente el parámetro `clientId` en las consultas de métricas e insights de Meta Ads para administradores globales, y se desactivó la opción de "Todas las empresas" en la interfaz de campañas para prevenir agregaciones globales accidentales.
- **Robustez en GitHub Actions:** Se ajustó la frecuencia del cron a `17 */6 * * *`, se configuró concurrencia única mediante un grupo de concurrencia de GitHub, se configuró `META_SYNC_ENABLED=false` por defecto y se sanitizaron los logs de salida.
- **Pruebas y Cobertura:** Se agregaron 8 nuevos casos de pruebas unitarias robustas en Vitest, alcanzando un total de 171 pruebas pasando exitosamente con 0 advertencias de ESLint.

### Added — Stage 4: Official Integration with Meta Marketing API v26.0, Ad Campaigns, Pixels/Datasets & Multi-Tenant Metrics (2026-08-24)
- **Integración Oficial con Meta Graph API v26.0 (`_shared/metaClient.js`, `_shared/metaConfig.js`):**
  - Cliente nativo Node.js 24 (`fetch` + `crypto`) sin dependencias pesadas.
  - Firma obligatoria `appsecret_proof` mediante HMAC-SHA256 para todas las solicitudes al Graph API.
  - Rate limiting adaptativo con lectura de headers oficiales `x-business-use-case-usage`, `x-app-usage` y `Retry-After`.
  - Paginación automática segura con límite configurable y backoff exponencial con jitter ante errores 5xx / rate limit (códigos 1, 2, 17, 32, 613).
  - Sanitización de logs (`sanitizeMetaLog`) para evitar filtración de tokens, secrets o credenciales.
- **Modelado Canónico y Seguridad Multi-Tenant (`models/`, `_shared/db.js`):**
  - Desacoplamiento canónico: Cuentas publicitarias (`meta_ad_accounts`) y Datasets/Píxeles (`meta_data_sources`) como activos paralelos vinculados al Portfolio de Meta.
  - Asignación temporal explícita por empresa (`client_meta_scopes`) con `effectiveFrom`, `effectiveTo`, `assignedByUserId`, `assignmentReason` y auditoría completa.
  - Almacenamiento diario idempotente a nivel de AdSet (`meta_insights_daily`) con índice único tenant-scoped: `{ clientId: 1, adAccountId: 1, adsetId: 1, date: 1, attributionSettingKey: 1, actionReportTime: 1 }`.
  - Fórmulas financieras protegidas: Inversión en unidades menores (`spendMinor` en centavos), CPL, CPA, CTR, CPC, CPM y ROAS sobre cobros reales (`ROAS = ingresos cobrados atribuibles / inversión atribuible`).
  - Detección automática y alerta de campañas mixtas (`MIXED_TENANT_CAMPAIGN` en `meta_asset_conflicts`).
- **Endpoints de Catálogo, Asignación y Métricas (`api-meta-assets.js`, `api-meta-insights.js`, `api-meta-sync.js`):**
  - `GET /api/meta/status`: Diagnóstico de conexión, token enmascarado y rate limits.
  - `GET /api/meta/assets`: Listado de cuentas, datasets y scopes filtrados por empresa.
  - `POST /api/meta/assets/manual`: Carga manual de IDs de cuentas o datasets por `super_admin`.
  - `POST /api/meta/assign`: Asignación temporal con motivo y validación de datasets no duplicados.
  - `POST /api/meta/reclassify-historical`: Previsualización con `dryRun: true` y reclasificación administrativa retroactiva.
  - `GET /api/meta/insights`: Consulta agregada jerárquica (`summary`, `dataset`, `campaign`, `adset`) con cruce de leads y cobros CRM.
  - `POST /api/meta/sync`: Disparo de sincronización manual (super_admin) o cron del sistema (`x-cron-auth`).
  - `meta-sync-background.js`: Background Function de Netlify con checkpoints por cuenta y ventana de tiempo.
- **Interfaz de Usuario y Dashboard (`CampaignsPage.jsx`, `DashboardPage.jsx`, `components/meta/`):**
  - Vista completa de Campañas con selector de niveles, filtros por empresa, divisa y fechas, y tabla combinada Meta + CRM.
  - Componente `ConflictBanner.jsx` para advertir sobre campañas mixtas.
  - Modal `MetaAssetManagerModal.jsx` para administración, descubrimiento y asignación de activos.
  - Integración de KPIs reales de Meta Ads en `DashboardPage.jsx` (Inversión, CPL, CPA, ROAS sobre cobros y botón *"Abrir Campañas"*).
- **Pruebas Automatizadas y Calidad:**
  - Nuevas suites `meta-backend.test.js` y `meta-frontend.test.jsx` cubriendo el 100% de los flujos.
  - 150 tests pasando exitosamente en los 20 archivos de test con `npm run lint` en 0 errores.
- **Dashboard Multiempresa y Aislamiento Estadístico (`api-dashboard.js`, `DashboardPage.jsx`):**
  - Se implementó el filtrado estricto por `clientId` para roles globales (`super_admin`/`admin`), validando la existencia y estado activo del cliente en MongoDB.
  - Para `client` y `salesperson`, se ignora cualquier `clientId` de la URL y se fuerza siempre el `clientScope` de su sesión.
  - Se agregaron controles para evitar respuestas desfasadas (`activeRequestSeq`) en el cambio rápido de empresa en el selector.
  - Se agregó el botón *"Abrir Pipeline"* para navegar directamente al Kanban de la empresa seleccionada.
- **Rendimiento por Vendedor y Soporte Multimoneda:**
  - El ranking filtra exclusivamente usuarios con `role: 'salesperson'` y estado `active` o `invited` vinculados a la empresa.
  - Se desglosan ventas registradas y cobros separados por divisa (`ARS` y `USD`), sin sumarlos directamente.
- **Formalización de Reglas de Asignación Comercial y Preasignación:**
  - Los prospectos sólo pueden asignarse a usuarios con `role: 'salesperson'` y estado `active` o `invited` de la misma empresa.
  - Los vendedores invitados aparecen identificados en los selectores como `"(Pendiente de activación)"` y conservan su cartera preasignada tras vincularse con Google.
  - Se rechaza en backend cualquier asignación a roles `client`, vendedores de otra empresa o usuarios suspendidos.
- **Reparación Automática Idempotente de Asignaciones Históricas (`_shared/db.js`):**
  - Rutina `repairInvalidAssignments` que desasigna prospectos vinculados a roles no autorizados (como asignaciones previas a `client`) y registra actividades de auditoría en `lead_activities`.
- **Auditoría Financiera y Control de Cobros:**
  - Validación del caso de prueba: Venta de $100.000 ARS con cobro inicial de $70.000 ARS $\rightarrow$ saldo $30.000 ARS (`partial`), cobro posterior de $30.000 $\rightarrow$ `collected`, e intento de sobrecobro rechazado (409).
- **Pruebas Automatizadas:**
  - Se agregó la suite `stage3-audit-final.test.js` (11 pruebas nuevas, 18 suites y 138 tests pasando al 100%).

### Fixed — Hotfix: Unify HTTP POST Contract for Lead Transitions & Actions (2026-08-23)
- **Unificación de Método HTTP a POST en Acciones y Transiciones de Leads:**
  - Se corrigió el error HTTP `405 Method Not Allowed` (`"Utilice POST."`) en `/api/leads/:id/stage`: se unificó la invocación a `apiClient.post(`/api/leads/${leadId}/stage`, { stage, ...(stage === 'lost' ? { lostReason } : {}) })`.
  - Se corrigieron los métodos en `LeadsPage.jsx` para `/api/leads/:id/assign`, `/api/leads/:id/archive`, `/api/leads/:id/reactivate` utilizando `apiClient.post`.
  - Se agregaron helpers HTTP directos en `apiClient` (`apiClient.get`, `apiClient.post`, `apiClient.patch`, `apiClient.put`, `apiClient.delete`).
  - Se aseguró la resolución consistente de vendedores utilizando `sp.id || sp._id` en `LeadDetailModal.jsx` y `LeadsPage.jsx`.
  - Se agregaron pruebas de integración cubriendo transiciones de etapas desde el modal de detalle y desde las flechas rápidas del Kanban.

### Fixed — Hotfix: Controlled Company Selector & State Synchronization in Leads Creation (2026-08-23)
- **Selector Controlado de Empresa para Leads (`LeadModal.jsx`, `CsvImportModal.jsx`):**
  - Se corrigió la desincronización de estado en la creación de prospectos para `super_admin`/`admin`: el formulario ahora utiliza un selector completamente controlado con opción inicial explícita `<option value="">Seleccionar empresa</option>`.
  - Para `client` y `salesperson`, el selector de empresa permanece oculto y el backend asigna automáticamente el `clientId` autorizado de su sesión.
  - Se envía siempre el `_id` interno de MongoDB y se valida en frontend y backend con el mensaje en español: `"Debe seleccionar la empresa a la que pertenece el prospecto."`.
  - Se agregaron pruebas unitarias y de integración en frontend y backend validando la obligatoriedad y el envío correcto del `clientId`.

### Fixed — Hotfix: React #130 Prevention, Centralized API Auth & ErrorBoundary (2026-08-23)
- **Corrección de Pantalla Blanca (React #130):**
  - Identificada la causa raíz: `LeadsPage` utilizaba `variant="danger"` en `<Alert>` tras fallos en la consulta; `Alert.jsx` no mapeaba `danger` y producía `undefined` como componente de ícono.
  - Se agregó mapeo explícito de variante `danger` (hacia `AlertCircle`) y fallback seguro universal `IconComponent = CustomIcon || icons[variant] || AlertCircle` en `Alert.jsx`.
  - Se aseguró fallback universal `IconComponent = Icon || FolderOpen` en `EmptyState.jsx`.
  - Se agregaron fallbacks seguros y verificación de que todos los componentes e íconos configurados para etapas existan.
- **Autenticación Centralizada en Consultas API (`src/lib/api.js`):**
  - Se corrigió la causa de los errores 401 en `/api/dashboard/stats`, `/api/leads`, `/api/clients`, `/api/users` y `/api/sales`: se eliminó el uso de `fetch` directo con `localStorage.getItem('token')`.
  - Se migraron todas las llamadas de `DashboardPage`, `LeadsPage`, `LeadDetailModal` y `CsvImportModal` a `apiClient`.
  - `apiClient` obtiene el token fresco de Firebase con `await auth.currentUser.getIdToken()`.
  - Ante un primer 401, renueva el token automáticamente con `await auth.currentUser.getIdToken(true)` y reintenta una sola vez.
  - Ante un 401 persistente, cierra la sesión de forma segura con `signOut(auth)`.
  - Las páginas no inician consultas hasta que la autenticación esté completamente resuelta (`loading: false && Boolean(firebaseUser)`).
- **Manejo de Errores Sin Métricas Cero Falsas:**
  - `DashboardPage` y `LeadsPage` muestran estados claros para 403, 500 y errores de red con botón de reintento, evitando mostrar métricas `0` ante errores HTTP.
- **Error Boundary:**
  - Se creó `src/components/ui/ErrorBoundary.jsx` conteniendo fallos de renderizado en módulos hijos, mostrando mensaje claro, `incidentId` seguro, botón de Reintento y botón de regreso al Dashboard, preservando el `MainLayout`.
- **Suite de Pruebas Automatizadas:**
  - Se agregaron 12 tests en `src/test/hotfix-react130-auth.test.jsx` cubriendo los 11 escenarios de verificación obligatorios (120 tests totales pasando al 100%).

### Added — Stage 3: Leads, Pipeline Comercial, Ventas e Ingresos Cobrados (2026-08-23)
- **Modelos de Datos & Estructuras en Centavos (`minor units`):**
  - Modelo `Lead`: Ciclo de vida estricto (`new`, `contacted`, `qualified`, `won`, `lost`), `source` limitado a `['manual', 'csv']` (sin Meta en esta etapa), `assignedToUserId`, `valueEstimateMinor`, timestamps de etapas (`acquiredAt`, `firstContactedAt`, `qualifiedAt`, `wonAt`, `lostAt`, `lostReason`), `status: 'active' | 'archived'`, normalizadores de email y teléfono, y clave de ingesta `ingestionKey`.
  - Motivo de pérdida obligatorio: `lostReason` requerido al marcar un prospecto como `lost` (máx 500 caracteres), y limpieza de `lostReason`/`lostAt` al salir de `lost`.
  - Timestamp inmutable de primer contacto: `firstContactedAt` inmutable una vez establecido el primer contacto.
  - Modelo `LeadActivity`: Colección `lead_activities` para registro de historial y notas comerciales (máx 2000 caracteres) vinculadas a prospectos y vendedores, con actor forzado en backend desde token autenticado.
  - Modelo `Sale`: Registro de ventas en centavos enteros (`amountMinor`), seguimiento de pagos parciales/totales (`collectedAmountMinor`, `collectedAmountDefaultMinor`), array `payments` inmutable con tipos de cambio históricos por cobro individual (`exchangeRateToDefault`), derivación automática de estado (`pending`, `partial`, `collected`, `cancelled`) y soporte multidivisa (`ARS`, `USD`).
- **Indexación y Migración Idempotente en MongoDB:**
  - Migración segura del índice de ingesta: detección y eliminación del índice simple `{ ingestionKey: 1 }`, y creación del índice compuesto canónico `{ clientId: 1, ingestionKey: 1 }` (`uniq_lead_client_ingestionKey`, único parcial con `{ ingestionKey: { $type: 'string' } }`).
  - Índices compuestos para `leads`: `{ clientId: 1, stage: 1 }`, `{ clientId: 1, assignedToUserId: 1 }`, `{ clientId: 1, normalizedEmail: 1 }`, `{ clientId: 1, normalizedPhone: 1 }`, `{ clientId: 1, acquiredAt: -1 }`, `{ clientId: 1, status: 1 }`.
  - Índices para `lead_activities`: `{ clientId: 1, leadId: 1, createdAt: -1 }`.
  - Índices para `sales`: `{ clientId: 1, leadId: 1 }`, `{ clientId: 1, status: 1 }`, `{ clientId: 1, soldAt: -1 }`.
- **Parser CSV Robusto RFC 4180 Unificado:**
  - `src/lib/csvParser.js`: Parser compartido para frontend y backend con soporte de UTF-8 BOM (`\uFEFF`), comas dentro de comillas, saltos de línea multilínea en notas, CRLF (`\r\n`), delimitadores automáticos (`,`, `;`), comillas escapadas (`""`), tolerancia a columnas extra y límites estrictos (máx 1 MB y 500 filas).
- **Endpoints de Backend Serverless:**
  - `api-leads.js`: CRUD completo de prospectos, sub-rutas `/stage`, `/assign`, `/archive`, `/reactivate`, `/activities`, e ingesta masiva `/import` con idempotencia multiempresa, detección de duplicados sin bloqueo y registro de actividad seguro sin PII en logs.
  - `api-sales.js`: Registro de ventas con scoping de vendedor (solo sobre leads asignados), cobros atómicos con `findOneAndUpdate` y condición `$lte` para evitar exceder el importe total (`409 COLLECTED_EXCEEDS_AMOUNT`), bloqueo para `salesperson` en cobros (`403 CANNOT_CONFIRM_COLLECTIONS`) y cancelaciones (`403 CANNOT_CANCEL_SALES`), y bloqueo de modificaciones sobre ventas canceladas (`400 SALE_CANCELLED`).
  - `api-dashboard.js`: Agregación de KPIs en tiempo real con `$match` de inquilino prioritario, filtros de fecha, cálculo seguro de tasa de conversión con división protegida (0.0), segregación estricta de divisas (sin sumar ARS y USD directamente), ranking de vendedores y placeholders explícitos de Meta Ads sin falsos ceros (`hasMetaIntegration: false`, `adSpend: null`, etc.).
  - Redirecciones en `netlify.toml` para `/api/leads`, `/api/leads/*`, `/api/sales`, `/api/sales/*`, y `/api/dashboard/*`.
- **Interfaz Visual & Experiencia de Usuario:**
  - Banner de etapa actualizado: `ETAPA 3 · ACTIVA` en el Header.
  - `LeadsPage.jsx`: Vista dual con Tablero Kanban interactivo y Vista Tabla con filtros avanzados en tiempo real.
  - `LeadModal.jsx`: Alta y edición accesible de prospectos.
  - `LeadDetailModal.jsx`: Ficha 360° con timeline de actividades, prompt interactivo para motivo de pérdida obligatorio, notas comerciales, avance de etapas y registro de ventas.
  - `SaleModal.jsx`: Modal accesible para registrar ventas, pagos parciales y cobros totales en centavos con validación de importes.
  - `CsvImportModal.jsx`: Importación masiva integrada con `parseCsvString`, previsualización tabular e informes de duplicados y errores.
  - `DashboardPage.jsx`: Panel de control conectado a estadísticas reales con visualización de ingresos por moneda y ranking comercial.
- **Suite de Pruebas Automatizadas:**
  - 15 suites de pruebas con 108 tests automatizados pasando al 100% en Vitest (pruebas de parser CSV RFC 4180, concurrencia en cobros, índices compuestos, validación de pipeline y scoping multiempresa).

### Added — Stage 2: Clientes, Aislamiento Multiempresa y Autorización de Usuarios (2026-08-22)
- **Modelo Client & Gestión Multi-Tenant:**
  - Esquema `Client` con nombre, `normalizedName`, `slug` único, `status` (`active | inactive`), `legalName`, `country`, `timezone`, `defaultCurrency` (`ARS | USD`), `enabledCurrencies`, `metaBusinessId` y `metaAdAccountIds` (solo identificadores de texto, sin tokens ni secretos).
  - Exclusividad estricta de cuentas publicitarias Meta: validación en `POST` y `PATCH` que rechaza identificadores ya asignados a otra empresa (`409 META_AD_ACCOUNT_ALREADY_ASSIGNED`).
  - Índices automáticos en MongoDB: `{ slug: 1 }` (único `uniq_client_slug`), `{ normalizedName: 1 }`, `{ status: 1 }`, `{ metaAdAccountIds: 1 }`.
  - Desactivación lógica de empresas (`status: 'inactive'` y `deactivatedAt`) en lugar de eliminación física.
- **Autorización de Usuarios & Migración de Índice Idempotente:**
  - Migración idempotente en `_shared/db.js` que detecta y elimina de forma segura índices únicos no parciales heredados sobre `firebaseUid`.
  - Creación del índice canónico `{ firebaseUid: 1 }` con `name: 'uniq_firebaseUid_when_bound'`, `unique: true` y `partialFilterExpression: { firebaseUid: { $type: 'string' } }`, tolerando ejecuciones concurrentes y permitiendo múltiples usuarios en estado `invited` con `firebaseUid: null`.
  - Preautorización de usuarios mediante `POST /api/users/authorize` con `firebaseUid: null` y `status: 'invited'`.
  - Vinculación atómica del `firebaseUid` durante el primer login con Google en `api-auth-me.js`, activando la cuenta (`status: 'active'`) y registrando `activatedAt`.
  - Jerarquía estricta: `super_admin` gestiona todos los roles; `admin` solo puede crear y modificar `client` y `salesperson`. Se bloquea la creación, modificación, cambio de rol, suspensión y reactivación entre administradores (`CANNOT_CREATE_ADMIN`, `CANNOT_MODIFY_ADMIN`, `CANNOT_GRANT_ADMIN`, `CANNOT_SUSPEND_ADMIN`, `CANNOT_REACTIVATE_ADMIN`).
  - Inviolabilidad de roles: ningún usuario puede modificar su propio rol (`CANNOT_MODIFY_OWN_ROLE`) ni auto-suspenderse (`CANNOT_SUSPEND_SELF`).
  - Suspensión y revocación con tolerancia a fallos: suspensión autoritativa en MongoDB con revocación en Firebase Admin en segundo plano; si Firebase no responde, devuelve HTTP 200 con advertencia `SESSION_REVOCATION_DEFERRED` y auditoría segura sin tokens.
- **Aislamiento Estricto en Backend (Tenant Scoping):**
  - Helper reusable `_shared/permissions.js` (`verifyAuthorizedUser`) que fuerza `clientId` en base de datos para roles `client` y `salesperson`.
  - Bloqueo automático `403 CLIENT_INACTIVE` ante intentos de acceso con empresas inactivas o deshabilitadas.
  - Rechazo `403 FORBIDDEN_CLIENT_ACCESS` ante intentos de manipulación de URLs o consultas a otros clientes.
- **Endpoints de API en Netlify Functions:**
  - `GET /api/clients`, `POST /api/clients`, `GET /api/clients/:id`, `PATCH /api/clients/:id`, `POST /api/clients/:id/deactivate`, `POST /api/clients/:id/reactivate`.
  - `GET /api/users`, `POST /api/users/authorize`, `PATCH /api/users/:id`, `POST /api/users/:id/suspend`, `POST /api/users/:id/reactivate`.
  - Redirects explícitos en `netlify.toml` para `/api/clients`, `/api/clients/*`, `/api/users`, `/api/users/*`.
- **Interfaz Visual en React:**
  - `ClientsPage.jsx` renovada con pestañas para "Empresas" y "Usuarios", buscador en tiempo real, filtros y badges de estado.
  - `Modal.jsx` accesible con cierre por Escape y backdrop.
  - `ClientModal.jsx` para creación y edición de empresas con identificadores de Meta Ads.
  - `UserModal.jsx` para preautorización y edición de usuarios con asignación de empresa.
  - `ConfirmDialog.jsx` accesible para desactivaciones y suspensiones.
- **Suite de Pruebas Automatizadas:**
  - 32 nuevas pruebas para backend y frontend de Clientes, Usuarios, Aislamiento Multiempresa y Migración de Índices.

### Added — Stage 1: Base Architecture & Authentication Setup (2026-08-21)
- **Base Architecture Setup:**
  - Project initialized with Vite + React SPA architecture.
  - Integration with Netlify Serverless Functions (CommonJS modular backend).
  - MongoDB database client integration with connection pooling and caching.
  - Firebase Authentication with Google Sign-In and Password providers.
  - Pinning of `firebase-admin@13.10.0` for rock-solid serverless stability.
- **Authentication & Authorization System:**
  - Google Sign-In with OAuth pop-up flow.
  - Atomic auto-bootstrap of the initial `super_admin` from `SUPER_ADMIN_EMAIL` environment variable.
  - Strict server-side token verification using Firebase Admin SDK.
  - Identity verification and session persistence in MongoDB `users` collection.
  - Diagnostic error reporting without secret leakage (`AUTH_DIAGNOSTIC`).
  - Account Linking section in Settings ("Seguridad de acceso") supporting Google and Password credential linking.
- **Design System & Visual Quality:**
  - Custom UI palette based on Tailwind CSS with warm backgrounds (`#F7F6F2`, `#FAF9F5`), Deep Emerald primary accents (`#0A4D3C`), and precise typography.
  - Fully accessible components: Buttons, Inputs, Alerts, Header, Navigation Sidebar, Modal.
  - Dedicated authentication pages: `LoginPage`, `ForgotPasswordPage`, `RegisterPage`, `BootstrapPage`.
- **Test Infrastructure:**
  - Vitest + Testing Library suite configured with 43 initial unit and integration tests.
