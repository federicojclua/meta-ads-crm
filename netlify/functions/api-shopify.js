/**
 * @file api-shopify.js
 * @description Netlify Function Serverless Controller para el módulo de Dropshipping estilo AutoDS.
 * Gestiona la transformación de productos de AliExpress, cálculo de márgenes y exportación
 * directa hacia la Admin API de Shopify (versión 2024-01).
 */

import {
  transformProductData,
  exportToShopify,
  testShopifyConnection,
  calculateDropshippingPricing,
  syncShopifyInventoryWithSupplier,
} from './_shared/ecommerceEngine/shopifyDropshippingService.js';
import {
  fetchAliExpressProduct,
  extractAliExpressProductId,
} from './_shared/ecommerceEngine/aliExpressService.js';
import {
  getCuratedUSOpportunities,
  auditProductForUSMarket,
} from './_shared/ecommerceEngine/opportunityEngine.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';

/**
 * Cabeceras estándar de CORS y seguridad para todas las respuestas HTTP
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Shopify-Access-Token',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

/**
 * Helper para estructurar respuestas JSON consistentes para el frontend en React
 */
function buildResponse(statusCode, body) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

/**
 * Valida los datos en crudo recibidos de AliExpress antes de procesarlos
 * @param {object} body - Payload en crudo recibido en la petición
 * @returns {{ valid: boolean, error?: string, code?: string }}
 */
function validateRawProductPayload(body) {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: 'El cuerpo de la petición (JSON) es requerido y debe ser un objeto.',
      code: 'ERR_EMPTY_PAYLOAD',
    };
  }

  // Título
  if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
    return {
      valid: false,
      error: 'El campo "title" es requerido y debe ser un texto no vacío.',
      code: 'ERR_MISSING_TITLE',
    };
  }

  // Imágenes
  if (!Array.isArray(body.images)) {
    return {
      valid: false,
      error: 'El campo "images" es requerido y debe ser un arreglo de URLs.',
      code: 'ERR_INVALID_IMAGES_ARRAY',
    };
  }

  // Precio Original
  const originalPrice = parseFloat(body.originalPrice);
  if (isNaN(originalPrice) || originalPrice < 0) {
    return {
      valid: false,
      error: 'El campo "originalPrice" es requerido y debe ser un número mayor o igual a 0 (USD).',
      code: 'ERR_INVALID_ORIGINAL_PRICE',
    };
  }

  // Costo de Envío (opcional pero si se envía debe ser numérico)
  if (body.shippingCost !== undefined && (isNaN(parseFloat(body.shippingCost)) || parseFloat(body.shippingCost) < 0)) {
    return {
      valid: false,
      error: 'El campo "shippingCost" debe ser un número mayor o igual a 0 (USD).',
      code: 'ERR_INVALID_SHIPPING_COST',
    };
  }

  return { valid: true };
}

/**
 * Handler principal de la Netlify Function
 */
export async function handler(event) {
  // 1. Manejo de peticiones preflight OPTIONS (CORS)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // 2. Normalización de ruta y método
  const path = event.path || '';
  const cleanPath = path
    .replace(/^\/?\.netlify\/functions\/api-shopify\/?/, '')
    .replace(/^\/?api\/shopify\/?/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const action = segments[0] || 'import';
  const subAction = segments[1] || null;
  const method = event.httpMethod;

  // 3. Verificación opcional de autenticación si se provee cabecera Authorization
  // Si se encuentra en entorno de producción y se provee token, validamos usuario del CRM
  const headers = event.headers || {};
  const authHeader = headers.authorization || headers.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    try {
      const auth = await verifyAuthorizedUser(event);
      if (!auth.authorized) {
        return buildResponse(auth.status || 401, {
          ok: false,
          error: auth.error || 'No autorizado para acceder a la API de Shopify.',
          code: auth.code || 'UNAUTHORIZED',
        });
      }
    } catch {
      // Si falla la verificación interna de auth, continuamos si no es obligatorio en dev
    }
  }

  try {
    // ----------------------------------------------------
    // GET /api/shopify/status o GET /api/shopify/health
    // ----------------------------------------------------
    if ((action === 'status' || action === 'health') && method === 'GET') {
      const connectionStatus = await testShopifyConnection();
      return buildResponse(200, {
        ok: true,
        data: {
          storeConfigured: !!process.env.SHOPIFY_STORE_URL,
          tokenConfigured: !!process.env.SHOPIFY_ACCESS_TOKEN,
          storeUrl: process.env.SHOPIFY_STORE_URL ? process.env.SHOPIFY_STORE_URL.replace(/https?:\/\//, '').split('/')[0] : null,
          connection: connectionStatus,
        },
      });
    }

    // ----------------------------------------------------
    // POST /api/shopify/transform o POST /api/shopify/products/transform
    // Transforma datos en crudo de AliExpress y calcula márgenes sin exportar a Shopify
    // ----------------------------------------------------
    if ((action === 'transform' || (action === 'products' && subAction === 'transform')) && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const validation = validateRawProductPayload(body);

      if (!validation.valid) {
        return buildResponse(400, {
          ok: false,
          error: validation.error,
          code: validation.code,
        });
      }

      const transformed = transformProductData(body);
      return buildResponse(200, {
        ok: true,
        message: 'Producto transformado y precios calculados correctamente.',
        data: transformed,
      });
    }

    // ----------------------------------------------------
    // POST /api/shopify/export o POST /api/shopify/products/export
    // Exporta a Shopify un objeto de producto ya transformado y revisado por el usuario
    // ----------------------------------------------------
    if ((action === 'export' || (action === 'products' && subAction === 'export')) && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const productPayload = body.product ? body : { product: body };

      if (!productPayload.product || !productPayload.product.title) {
        return buildResponse(400, {
          ok: false,
          error: 'El cuerpo de la petición debe contener un objeto "product" con al menos un "title".',
          code: 'ERR_INVALID_PRODUCT_DATA',
        });
      }

      const exportResult = await exportToShopify(productPayload);
      return buildResponse(201, {
        ok: true,
        message: 'Producto exportado exitosamente a Shopify.',
        data: exportResult,
      });
    }

    // ----------------------------------------------------
    // POST /api/shopify/sync-aliexpress o POST /api/shopify/aliexpress/sync
    // Flujo ETL de 3 Pasos solicitado:
    // 1. Extracción (AliExpress): Consulta a la Dropshipping API con firma HMAC-SHA256
    // 2. Transformación (Reglas de Negocio): Título limpio, price 2.5x, compare_at_price +20%, variantes e imágenes
    // 3. Carga (Shopify): POST a Shopify Admin API 2024-01 con X-Shopify-Access-Token
    // ----------------------------------------------------
    if (
      (action === 'sync-aliexpress' ||
        action === 'sync' ||
        (action === 'aliexpress' && subAction === 'sync')) &&
      method === 'POST'
    ) {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return buildResponse(400, {
          ok: false,
          error: 'Formato JSON inválido en el cuerpo de la solicitud.',
          code: 'ERR_INVALID_JSON',
        });
      }

      const input = body.aliexpress_item_id || body.productId || body.url || body.id;
      if (!input || typeof input !== 'string') {
        return buildResponse(400, {
          ok: false,
          error: 'Debe ingresar un ID numérico o enlace válido del producto de AliExpress (campo "aliexpress_item_id", "productId" o "url").',
          code: 'ERR_MISSING_PRODUCT_INPUT',
        });
      }

      const productId = extractAliExpressProductId(input);
      if (!productId) {
        return buildResponse(400, {
          ok: false,
          error: `No se pudo extraer un ID de producto válido desde "${input}". Asegúrese de pegar un ID o un enlace de AliExpress.`,
          code: 'ERR_INVALID_ALIEXPRESS_INPUT',
        });
      }

      // PASO 1: Extracción desde AliExpress Dropshipping API (Firma HMAC-SHA256)
      const rawProduct = await fetchAliExpressProduct(productId, {
        shipToCountry: body.shipToCountry || 'US',
        targetCurrency: 'USD',
      });

      // Sobrescribir costo de envío si el frontend lo envió explícitamente
      if (body.shippingCost !== undefined && !isNaN(parseFloat(body.shippingCost))) {
        rawProduct.shippingCost = parseFloat(body.shippingCost);
      }

      // PASO 2: Transformación con Reglas de Negocio (AutoDS: 2.5x, +20%, Título limpio)
      const transformed = transformProductData(rawProduct);

      // PASO 3: Carga a Shopify Admin API 2024-01 (/products.json)
      const exportResult = await exportToShopify(transformed);

      return buildResponse(201, {
        ok: true,
        message: 'Producto de AliExpress extraído, transformado y sincronizado exitosamente en Shopify.',
        data: {
          aliExpress: {
            productId: rawProduct.productId,
            originalTitle: rawProduct.title,
            costUsd: rawProduct.originalPrice,
            shippingUsd: rawProduct.shippingCost,
            inventory: rawProduct.inventory,
            imagesCount: rawProduct.images.length,
          },
          shopifyProduct: exportResult.product,
          pricing: transformed._meta.pricing,
          transformationMeta: transformed._meta,
        },
      });
    }

    // ----------------------------------------------------
    // POST /api/shopify/import o POST /api/shopify/products/import (o raíz POST /api/shopify)
    // Pipeline completo de AutoDS: Recibe crudo -> Transforma -> Exporta a Shopify
    // ----------------------------------------------------
    if (
      (action === 'import' || (action === 'products' && subAction === 'import') || action === '') &&
      method === 'POST'
    ) {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return buildResponse(400, {
          ok: false,
          error: 'Formato JSON inválido en el cuerpo de la solicitud.',
          code: 'ERR_INVALID_JSON',
        });
      }

      // Validar esquema en crudo
      const validation = validateRawProductPayload(body);
      if (!validation.valid) {
        return buildResponse(400, {
          ok: false,
          error: validation.error,
          code: validation.code,
        });
      }

      // 1. Transformar producto aplicando reglas de AutoDS
      const transformed = transformProductData(body);

      // 2. Exportar directamente a Shopify Admin API 2024-01
      const exportResult = await exportToShopify(transformed);

      return buildResponse(201, {
        ok: true,
        message: 'Producto de AliExpress importado y publicado exitosamente en Shopify.',
        data: {
          shopifyProduct: exportResult.product,
          pricingSummary: transformed._meta.pricing,
          transformationMeta: transformed._meta,
        },
      });
    }

    // ----------------------------------------------------
    // GET /api/shopify/calculator (Simulador de precios para el frontend)
    // ----------------------------------------------------
    if (action === 'calculate' && method === 'GET') {
      const q = event.queryStringParameters || {};
      const originalPrice = parseFloat(q.originalPrice || '0');
      const shippingCost = parseFloat(q.shippingCost || '0');

      const pricing = calculateDropshippingPricing(originalPrice, shippingCost);
      return buildResponse(200, {
        ok: true,
        data: pricing,
      });
    }

    // ----------------------------------------------------
    // POST /api/shopify/sync-stock o GET /api/shopify/sync-stock
    // Sincronización Automática de Stock con Proveedor en China (Auto-Draft si stock = 0)
    // ----------------------------------------------------
    if ((action === 'sync-stock' || action === 'stock-sync') && (method === 'POST' || method === 'GET')) {
      const syncReport = await syncShopifyInventoryWithSupplier();
      return buildResponse(200, {
        ok: true,
        message: `Sincronización de stock completada: ${syncReport.checkedCount} verificados, ${syncReport.updatedCount} activos, ${syncReport.draftedCount} pausados a borrador (sin stock).`,
        data: syncReport,
      });
    }

    // ----------------------------------------------------
    // GET /api/shopify/opportunities (Radar de Oportunidades USA)
    // ----------------------------------------------------
    if (action === 'opportunities' && method === 'GET') {
      const q = event.queryStringParameters || {};
      const minMargin = parseFloat(q.minMargin || '0');
      const category = (q.category || '').toLowerCase();
      const search = (q.search || '').toLowerCase();

      let opportunities = getCuratedUSOpportunities();

      if (minMargin > 0) {
        opportunities = opportunities.filter((op) => op.financials.marginPct >= minMargin);
      }
      if (category && category !== 'all') {
        opportunities = opportunities.filter((op) =>
          op.category.toLowerCase().includes(category) || op.niche.toLowerCase().includes(category)
        );
      }
      if (search) {
        opportunities = opportunities.filter(
          (op) =>
            op.title.toLowerCase().includes(search) ||
            op.description.toLowerCase().includes(search) ||
            op.category.toLowerCase().includes(search)
        );
      }

      return buildResponse(200, {
        ok: true,
        total: opportunities.length,
        data: opportunities,
      });
    }

    // ----------------------------------------------------
    // POST /api/shopify/opportunities/audit (Scanner Aduanero y Logístico)
    // ----------------------------------------------------
    if (action === 'opportunities' && method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return buildResponse(400, {
          ok: false,
          error: 'Formato JSON inválido en el cuerpo de la solicitud.',
          code: 'ERR_INVALID_JSON',
        });
      }

      // Si nos pasaron una URL o ID, podemos intentar extraer datos reales de AliExpress si no vinieron
      let productToAudit = { ...body };
      if (body.url || body.productId) {
        const cleanId = extractAliExpressProductId(body.url || body.productId);
        if (cleanId && (!body.title || !body.costUsd)) {
          try {
            const fetched = await fetchAliExpressProduct(cleanId, {
              shipToCountry: 'US',
              targetCurrency: 'USD',
            });
            productToAudit = {
              ...productToAudit,
              productId: cleanId,
              title: fetched.title,
              costUsd: fetched.originalPrice,
              shippingCostUsd: fetched.shippingCost || 0,
              description: fetched.description,
              category: fetched.productType || 'AliExpress Gadget',
            };
          } catch (fetchErr) {
            // Si la API falla o no hay conexión, auditamos con los datos provistos en el body
            console.warn('[Opportunities Audit]: Fallback to local inputs:', fetchErr.message);
          }
        }
      }

      const auditResult = auditProductForUSMarket(productToAudit);
      return buildResponse(200, {
        ok: true,
        data: auditResult,
      });
    }

    // Ruta no encontrada
    return buildResponse(404, {
      ok: false,
      error: `Ruta o método no soportado: ${method} /api/shopify/${segments.join('/')}`,
      code: 'ERR_ROUTE_NOT_FOUND',
      supportedRoutes: [
        'POST /api/shopify/import (Transforma y exporta)',
        'POST /api/shopify/transform (Previsualiza sin exportar)',
        'POST /api/shopify/export (Exporta producto transformado)',
        'GET /api/shopify/status (Estado de conexión)',
        'GET /api/shopify/calculate?originalPrice=X&shippingCost=Y',
      ],
    });
  } catch (error) {
    console.error('[Shopify API Controller Error]:', error);

    const statusCode = error.statusCode || 500;
    const responseBody = {
      ok: false,
      error: error.message || 'Error interno al procesar la solicitud con Shopify.',
      code: error.code || `ERR_SHOPIFY_CONTROLLER_${statusCode}`,
    };

    if (error.details) {
      responseBody.details = error.details;
    }

    return buildResponse(statusCode, responseBody);
  }
}
