/**
 * @file aliExpressService.js
 * @description Servicio de integración con AliExpress Dropshipping Open API (IOP/TOP).
 * Gestiona la firma criptográfica HMAC-SHA256 / MD5, extracción de datos por ID de producto o URL,
 * y normalización de especificaciones (título, imágenes, precio costo en USD, inventario y variantes).
 */

import crypto from 'node:crypto';

/**
 * Endpoints oficiales de AliExpress Open Platform
 * /sync → APIs de negocio (product.get, order, etc.)
 * /rest → APIs de sistema (auth/token)
 */
const ALIEXPRESS_API_GATEWAY = 'https://api-sg.aliexpress.com/sync';

/**
 * Extrae el ID numérico de producto a partir de una URL completa de AliExpress o un ID directo.
 * Soporta formatos como:
 * - "https://www.aliexpress.com/item/1005006321458921.html"
 * - "https://es.aliexpress.com/item/1005007412345678.html?spm=..."
 * - "1005006321458921"
 *
 * @param {string} input - URL o ID del producto
 * @returns {string|null} ID numérico de producto o null si no es válido
 */
export function extractAliExpressProductId(input) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // 1. Si ya es una cadena de dígitos de longitud habitual (8 a 25 dígitos)
  if (/^\d{8,25}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Extraer del patrón estándar de URL: /item/(\d+).html
  const itemMatch = trimmed.match(/\/item\/(\d+)\.html/i);
  if (itemMatch && itemMatch[1]) {
    return itemMatch[1];
  }

  // 3. Extraer de parámetros de query string ?productId=... o ?id=...
  const queryMatch = trimmed.match(/[?&](?:productId|id|itemId)=(\d+)/i);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // 4. Buscar cualquier secuencia de 10 a 20 dígitos en la URL
  const digitMatch = trimmed.match(/(\d{10,20})/);
  if (digitMatch && digitMatch[1]) {
    return digitMatch[1];
  }

  return null;
}

/**
 * Genera la firma criptográfica requerida por la API de AliExpress (IOP / TOP).
 * Reglas de firma:
 * 1. Ordenar alfabéticamente todas las claves de parámetros (excluyendo 'sign').
 * 2. Concatenar cada clave con su respectivo valor (sin separadores).
 * 3. Si sign_method === 'sha256', aplicar HMAC-SHA256 con el APP_SECRET como clave.
 * 4. Si sign_method === 'md5', aplicar MD5(secret + params + secret).
 * 5. Convertir a hexadecimal en MAYÚSCULAS.
 *
 * @param {object} params - Parámetros de la petición
 * @param {string} appSecret - Secret del cliente (process.env.ALIEXPRESS_APP_SECRET)
 * @param {string} [signMethod='sha256'] - Algoritmo ('sha256' o 'md5')
 * @param {string} [apiPath=''] - Path de la API IOP (prefijo del base string para la firma)
 * @returns {string} Firma en hexadecimal mayúscula
 */
export function generateAliExpressSignature(params, appSecret, signMethod = 'sha256', apiPath = '') {
  if (!appSecret || typeof appSecret !== 'string') {
    throw new Error('ALIEXPRESS_APP_SECRET es requerido para generar la firma de la petición.');
  }

  // 1. Filtrar parámetros válidos y excluir 'sign'
  const keys = Object.keys(params)
    .filter((k) => k !== 'sign' && params[k] !== undefined && params[k] !== null)
    .sort();

  // 2. Concatenar apiPath (IOP protocol) + clave + valor
  let baseString = apiPath || '';
  for (const key of keys) {
    baseString += `${key}${params[key]}`;
  }

  // 3. Generar hash criptográfico
  const method = (signMethod || 'sha256').toLowerCase();
  if (method === 'sha256' || method === 'hmac-sha256') {
    return crypto
      .createHmac('sha256', appSecret)
      .update(baseString, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  if (method === 'md5') {
    const md5String = `${appSecret}${baseString}${appSecret}`;
    return crypto
      .createHash('md5')
      .update(md5String, 'utf8')
      .digest('hex')
      .toUpperCase();
  }

  throw new Error(`Método de firma de AliExpress no soportado: "${signMethod}". Use "sha256" o "md5".`);
}

/**
 * Extrae y normaliza los datos del producto devuelto por la API de AliExpress a un esquema uniforme.
 *
 * @param {object} apiResult - Payload de respuesta de aliexpress.ds.product.get
 * @param {string} productId - ID del producto
 * @returns {object} Producto normalizado para su posterior transformación
 */
export function normalizeAliExpressApiResponse(apiResult, productId) {
  const result =
    apiResult?.aliexpress_ds_product_get_response?.result ||
    apiResult?.result ||
    apiResult;

  const baseInfo = result?.ae_item_base_info_dto || {};
  const multimediaInfo = result?.ae_multimedia_info_dto || {};
  const skuListWrapper = result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];
  const skuList = Array.isArray(skuListWrapper) ? skuListWrapper : [skuListWrapper].filter(Boolean);

  // 1. Título
  const title = baseInfo.subject || `AliExpress Product ${productId}`;

  // 2. Imágenes
  let images = [];
  if (multimediaInfo.image_urls) {
    if (Array.isArray(multimediaInfo.image_urls)) {
      images = multimediaInfo.image_urls;
    } else if (typeof multimediaInfo.image_urls === 'string') {
      images = multimediaInfo.image_urls.split(';').map((u) => u.trim()).filter(Boolean);
    }
  }

  // Si no vinieron imágenes en multimediaInfo, recolectar de SKUs
  if (images.length === 0) {
    for (const sku of skuList) {
      const propWrapper = sku?.ae_sku_property_dtos?.ae_sku_property_d_t_o || [];
      const props = Array.isArray(propWrapper) ? propWrapper : [propWrapper];
      for (const prop of props) {
        if (prop.sku_image && !images.includes(prop.sku_image)) {
          images.push(prop.sku_image);
        }
      }
    }
  }

  // 3. Precios y costo en USD
  // Buscar el precio de oferta o precio de SKU más bajo
  let minCost = Infinity;
  let totalStock = 0;

  for (const sku of skuList) {
    const rawPrice = sku.offer_sale_price || sku.sku_price || sku.price;
    const priceNum = parseFloat(rawPrice);
    if (!isNaN(priceNum) && priceNum > 0 && priceNum < minCost) {
      minCost = priceNum;
    }
    const stockNum = parseInt(sku.sku_available_stock || sku.ipm_sku_stock || 0, 10);
    if (!isNaN(stockNum)) {
      totalStock += stockNum;
    }
  }

  if (minCost === Infinity) {
    minCost = parseFloat(baseInfo.product_min_price || baseInfo.sale_price || 10.0);
  }

  // 4. Descripción
  const description = baseInfo.detail || `<p>${title}</p>`;

  return {
    productId: String(productId),
    title,
    images,
    originalPrice: Number(minCost.toFixed(2)),
    shippingCost: 0, // Envío estándar Dropshipping
    inventory: skuList.length > 0 ? totalStock : (totalStock > 0 ? totalStock : 100),
    description,
    vendor: 'AliExpress Direct',
    productType: 'Dropshipping',
    variantsRaw: skuList,
    rawResult: result,
  };
}

/**
 * Consulta la API oficial de AliExpress Dropshipping (aliexpress.ds.product.get)
 * utilizando las credenciales provistas y firma criptográfica.
 *
 * @param {string} productId - ID numérico de producto de AliExpress
 * @param {object} [options={}] - Parámetros de anulación o configuración
 * @param {string} [options.appKey] - Opcional, por defecto process.env.ALIEXPRESS_APP_KEY
 * @param {string} [options.appSecret] - Opcional, por defecto process.env.ALIEXPRESS_APP_SECRET
 * @param {string} [options.shipToCountry='US'] - País de destino para inventario y precios
 * @param {string} [options.targetCurrency='USD'] - Moneda objetivo
 * @param {number} [options.timeoutMs=15000] - Timeout en ms
 * @returns {Promise<object>} Objeto con los datos del producto en crudo listo para transformación
 */
export async function fetchAliExpressProduct(productId, options = {}) {
  const appKey = options.appKey || process.env.ALIEXPRESS_APP_KEY;
  const appSecret = options.appSecret || process.env.ALIEXPRESS_APP_SECRET;
  const accessToken = options.accessToken || process.env.ALIEXPRESS_ACCESS_TOKEN;

  if (!appKey) {
    const error = new Error('Credenciales faltantes: ALIEXPRESS_APP_KEY no está configurada en las variables de entorno.');
    error.statusCode = 500;
    error.code = 'ERR_ALIEXPRESS_CONFIG_APP_KEY_MISSING';
    throw error;
  }

  if (!appSecret) {
    const error = new Error('Credenciales faltantes: ALIEXPRESS_APP_SECRET no está configurada en las variables de entorno.');
    error.statusCode = 500;
    error.code = 'ERR_ALIEXPRESS_CONFIG_APP_SECRET_MISSING';
    throw error;
  }

  if (!accessToken) {
    const error = new Error('Credenciales faltantes: ALIEXPRESS_ACCESS_TOKEN no está configurada. Ejecutá: node scripts/aliexpress-get-token.mjs');
    error.statusCode = 500;
    error.code = 'ERR_ALIEXPRESS_CONFIG_ACCESS_TOKEN_MISSING';
    throw error;
  }

  const cleanProductId = extractAliExpressProductId(productId);
  if (!cleanProductId) {
    const error = new Error(`El ID o URL de producto de AliExpress es inválido: "${productId}". Debe ser un ID numérico o un link directo.`);
    error.statusCode = 400;
    error.code = 'ERR_INVALID_ALIEXPRESS_PRODUCT_ID';
    throw error;
  }

  // 1. Preparar parámetros de la llamada a la Dropshipping API (TOP protocol)
  const signMethod = 'sha256';
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const requestParams = {
    app_key: appKey,
    method: 'aliexpress.ds.product.get',
    session: accessToken,
    timestamp,
    format: 'json',
    v: '2.0',
    sign_method: signMethod,
    product_id: cleanProductId,
    ship_to_country: options.shipToCountry || 'US',
    target_currency: options.targetCurrency || 'USD',
    target_language: 'EN',
  };

  // 2. Generar firma oficial (TOP protocol: orden alfabético de parámetros)
  const signature = generateAliExpressSignature(requestParams, appSecret, signMethod);
  requestParams.sign = signature;

  // 3. Despachar petición HTTP POST a la pasarela de AliExpress
  const gatewayUrl = ALIEXPRESS_API_GATEWAY;
  const timeoutMs = options.timeoutMs || 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // IOP: params como query string en la URL
    const queryString = new URLSearchParams(requestParams).toString();

    const response = await fetch(`${gatewayUrl}?${queryString}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Anima-CRM-AliExpress-Dropshipping/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { raw: rawText };
    }

    // 4. Detección exhaustiva de errores de la API de AliExpress
    if (data.error_response) {
      const errObj = data.error_response;
      const subCode = errObj.sub_code || errObj.code || 'UNKNOWN';
      const subMsg = errObj.sub_msg || errObj.msg || 'Error en la API de AliExpress Dropshipping';

      let friendlyMsg = `Error de AliExpress Dropshipping (${subCode}): ${subMsg}`;
      let statusCode = 400;

      if (subCode.includes('product-not-found') || subCode.includes('ITEM_NOT_EXIST')) {
        friendlyMsg = `El producto con ID ${cleanProductId} no fue encontrado o no está disponible para dropshipping en AliExpress.`;
        statusCode = 404;
      } else if (subCode.includes('signature') || subCode.includes('sign')) {
        friendlyMsg = `Firma inválida al autenticar con AliExpress. Verifica ALIEXPRESS_APP_SECRET y ALIEXPRESS_APP_KEY. (${subMsg})`;
        statusCode = 401;
      } else if (subCode.includes('permission') || subCode.includes('access')) {
        friendlyMsg = `Tu cuenta de AliExpress Open Platform no tiene activados los permisos de Dropshipping API.`;
        statusCode = 403;
      }

      const apiErr = new Error(friendlyMsg);
      apiErr.statusCode = statusCode;
      apiErr.code = `ERR_ALIEXPRESS_${subCode.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
      apiErr.details = errObj;
      throw apiErr;
    }

    // 5. Validar que la respuesta contenga el resultado del producto
    const result = data?.aliexpress_ds_product_get_response?.result;
    if (!result) {
      const err = new Error(`AliExpress respondió sin datos válidos para el producto ID ${cleanProductId}.`);
      err.statusCode = 502;
      err.code = 'ERR_ALIEXPRESS_EMPTY_RESULT';
      err.details = data;
      throw err;
    }

    // 6. Normalizar datos extraídos
    return normalizeAliExpressApiResponse(data, cleanProductId);
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.statusCode) {
      throw err;
    }

    if (err.name === 'AbortError') {
      const timeoutError = new Error(`Tiempo de espera agotado (${timeoutMs / 1000}s) al consultar la API de AliExpress.`);
      timeoutError.statusCode = 504;
      timeoutError.code = 'ERR_ALIEXPRESS_TIMEOUT';
      throw timeoutError;
    }

    const networkError = new Error(`Fallo de conexión al comunicarse con AliExpress Open Platform: ${err.message}`);
    networkError.statusCode = 502;
    networkError.code = 'ERR_ALIEXPRESS_NETWORK_FAILURE';
    throw networkError;
  }
}
