/**
 * @file shopifyDropshippingService.js
 * @description Servicio de integración de Dropshipping estilo AutoDS para Shopify Admin API (2024-01).
 * Implementa normalización y sanitización de datos de AliExpress, cálculo de márgenes y precios,
 * y despacho seguro hacia el endpoint /products.json de Shopify.
 */

/**
 * Lista de términos y patrones ruidosos típicos en títulos de marketplaces (AliExpress, etc.)
 */
const JUNK_KEYWORDS = [
  /\bfree\s+shipping\b/gi,
  /\bdrop\s*shipping\b/gi,
  /\bhot\s+sale\b/gi,
  /\btop\s+quality\b/gi,
  /\bhigh\s+quality\b/gi,
  /\bbest\s+quality\b/gi,
  /\bnew\s+arrival(s)?\b/gi,
  /\bbrand\s+new\b/gi,
  /\bwholesale\b/gi,
  /\bcheapest\b/gi,
  /\bcheap\b/gi,
  /\bdiscount\b/gi,
  /\bpromotion\b/gi,
  /\bfast\s+delivery\b/gi,
  /\bin\s+stock\b/gi,
  /\b202[3-9]\b/gi, // Años como 2024, 2025, 2026
  /\b100%\s*(original|new|real)?\b/gi,
  /\bbest\s+selling\b/gi,
  /\bflash\s+deal(s)?\b/gi,
  /\blowest\s+price\b/gi,
  /\bfactory\s+outlet\b/gi,
  /\bfactory\s+price\b/gi,
];

/**
 * Limpia y optimiza el título en crudo de un producto (proveniente de AliExpress o similares).
 * Remueve palabras clave de spam, etiquetas entre corchetes/paréntesis y normaliza puntuación.
 *
 * @param {string} rawTitle - Título en crudo
 * @returns {string} Título limpio y formateado para ecommerce
 */
export function cleanProductTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') {
    return 'Imported Dropshipping Product';
  }

  let cleaned = rawTitle;

  // 1. Eliminar corchetes o paréntesis con contenido promocional común: [Hot], (Free Shipping)
  cleaned = cleaned.replace(/\[[^\]]*(?:sale|hot|free|shipping|new|discount|deal|wholesale)[^\]]*\]/gi, '');
  cleaned = cleaned.replace(/\([^)]*(?:sale|hot|free|shipping|new|discount|deal|wholesale)[^)]*\)/gi, '');

  // 2. Remover palabras clave de spam definidas
  for (const regex of JUNK_KEYWORDS) {
    cleaned = cleaned.replace(regex, ' ');
  }

  // 3. Remover caracteres y separadores extraños o excesivos (|, *, _, ~, #, etc.)
  cleaned = cleaned.replace(/[*_~#^`|]/g, ' ');
  cleaned = cleaned.replace(/[-–—/\\:]{2,}/g, ' - ');
  cleaned = cleaned.replace(/[!?.]{2,}/g, '.');

  // 4. Compactar múltiples espacios y recortar
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // 5. Quitar separadores colgantes al inicio o al final
  cleaned = cleaned.replace(/^[-–—/\\:,\s]+|[-–—/\\:,\s]+$/g, '').trim();

  // Si el título quedó vacío o demasiado corto tras la limpieza, rescatar el original recortado
  if (cleaned.length < 5) {
    cleaned = rawTitle.replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  // 6. Si el título está en MAYÚSCULAS sostenidas, convertir a formato Capitalizado limpio
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 8) {
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
      .join(' ');
  }

  return cleaned;
}

/**
 * Calcula los precios de venta y precios tachados (compare-at) según las reglas de negocio de AutoDS:
 * - price = (precio_original + costo_envio) * 2.5
/**
 * Redondea un valor numérico a 2 decimales con precisión financiera en centavos (estándar Stripe/Shopify)
 * @param {number} value
 * @returns {number}
 */
export function roundFinancial(value) {
  return Math.round(Number(value) * 100) / 100;
}

/**
 * Calcula los precios de venta y precios tachados (compare-at) según las reglas de negocio de AutoDS:
 * - price = (precio_original + costo_envio) * 2.5
 * - compare_at_price = price * 1.20 (+20% sobre el precio de venta)
 *
 * Utiliza aritmética de centavos para garantizar precisión financiera y eliminar artefactos de coma flotante.
 *
 * @param {number|string} originalPrice - Precio del producto en el proveedor (USD)
 * @param {number|string} shippingCost - Costo del envío a EE. UU. (USD)
 * @returns {{ sellingPrice: string, compareAtPrice: string, numericPrice: number, numericCompareAtPrice: number, costBase: number, estimatedProfit: number, profitMarginPct: number }}
 */
export function calculateDropshippingPricing(originalPrice, shippingCost = 0) {
  const numOriginal = Math.max(0, parseFloat(originalPrice) || 0);
  const numShipping = Math.max(0, parseFloat(shippingCost) || 0);

  // Trabajar en centavos para precisión financiera absoluta (estándar Shopify/Stripe)
  const originalCents = Math.round(numOriginal * 100);
  const shippingCents = Math.round(numShipping * 100);
  const costBaseCents = originalCents + shippingCents;
  const costBase = costBaseCents / 100;

  // Regla: Multiplicador 2.5x sobre el costo base
  const sellingCents = Math.round(costBaseCents * 2.5);
  const numericPrice = sellingCents / 100;

  // Regla: 20% adicional sobre el precio de venta para el precio de comparación tachado
  const compareAtCents = Math.round(sellingCents * 1.2);
  const numericCompareAtPrice = compareAtCents / 100;

  // Métricas financieras proyectadas
  const estimatedProfit = (sellingCents - costBaseCents) / 100;
  const profitMarginPct = numericPrice > 0 ? Number(((estimatedProfit / numericPrice) * 100).toFixed(1)) : 0;

  return {
    sellingPrice: numericPrice.toFixed(2),
    compareAtPrice: numericCompareAtPrice.toFixed(2),
    numericPrice,
    numericCompareAtPrice,
    costBase,
    estimatedProfit,
    profitMarginPct,
  };
}

/**
 * Mapea y normaliza el arreglo de imágenes de AliExpress al formato requerido por la Admin API de Shopify.
 * Shopify espera: [{ "src": "https://url-imagen.jpg" }, ...]
 *
 * @param {Array<string|object>} rawImages - Lista de URLs o de objetos con URLs
 * @returns {Array<{ src: string }>}
 */
export function mapShopifyImages(rawImages) {
  if (!Array.isArray(rawImages)) {
    return [];
  }

  const validImages = [];
  const seenUrls = new Set();

  for (const item of rawImages) {
    let url = '';
    if (typeof item === 'string') {
      url = item.trim();
    } else if (item && typeof item === 'object') {
      url = (item.src || item.url || item.image || '').trim();
    }

    // Normalizar protocolo si viene en formato protocol-relative "//ae01.alicdn.com/..."
    if (url.startsWith('//')) {
      url = `https:${url}`;
    }

    // Validar que sea una URL HTTP/HTTPS válida y sin duplicados
    if (url && (url.startsWith('http://') || url.startsWith('https://')) && !seenUrls.has(url)) {
      seenUrls.add(url);
      validImages.push({ src: url });
    }
  }

  return validImages;
}

/**
 * Transforma un producto en crudo de AliExpress a la estructura oficial requerida por Shopify Admin API (2024-01).
 *
 * @param {object} rawProduct
 * @param {string} rawProduct.title - Título en crudo
 * @param {Array<string|object>} rawProduct.images - Lista de URLs de imágenes
 * @param {number|string} rawProduct.originalPrice - Precio original en USD
 * @param {number|string} [rawProduct.shippingCost=0] - Costo de envío a EE. UU. en USD
 * @param {number|string} [rawProduct.inventory=100] - Unidades en stock disponibles
 * @param {string} [rawProduct.description=''] - Descripción en HTML o texto plano
 * @param {string} [rawProduct.vendor='AutoDS Dropshipping'] - Proveedor o marca
 * @param {string} [rawProduct.productType='Dropshipping'] - Categoría o tipo de producto
 * @param {string|Array<string>} [rawProduct.tags=[]] - Etiquetas del producto
 * @returns {object} Objeto con la clave `product` lista para Shopify y metadata de cálculo `_meta`
 */
export function transformProductData(rawProduct) {
  if (!rawProduct || typeof rawProduct !== 'object') {
    throw new Error('El objeto rawProduct es requerido y debe ser un objeto válido.');
  }

  const {
    title = '',
    images = [],
    originalPrice = 0,
    shippingCost = 0,
    inventory = 100,
    description = '',
    vendor = 'AutoDS Dropshipping',
    productType = 'Dropshipping',
    tags = ['AliExpress Import', 'Dropshipping', 'AutoDS'],
  } = rawProduct;

  // 1. Limpiar el título
  const cleanedTitle = cleanProductTitle(title);

  // 2. Calcular precios y márgenes según reglas de negocio
  const pricing = calculateDropshippingPricing(originalPrice, shippingCost);

  // 3. Mapear imágenes al formato de Shopify
  const formattedImages = mapShopifyImages(images);

  // 4. Formatear descripción HTML
  const bodyHtml = description && typeof description === 'string' && description.trim()
    ? (description.includes('<') ? description : `<p>${description.replace(/\n/g, '<br/>')}</p>`)
    : `<p>${cleanedTitle}</p>`;

  // 5. Formatear tags (Shopify acepta string separado por comas o array)
  const formattedTags = Array.isArray(tags) ? tags.join(', ') : String(tags || '');

  // 6. Convertir inventario a número entero seguro
  const inventoryQuantity = Math.max(0, parseInt(inventory, 10) || 0);

  // 7. Construir estructura de variantes
  const variants = [
    {
      price: pricing.sellingPrice,
      compare_at_price: pricing.compareAtPrice,
      inventory_management: 'shopify',
      inventory_quantity: inventoryQuantity,
      requires_shipping: true,
      sku: `ADS-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
    },
  ];

  // 8. Payload compatible con POST /admin/api/2024-01/products.json
  const shopifyProduct = {
    title: cleanedTitle,
    body_html: bodyHtml,
    vendor: vendor || 'AutoDS Dropshipping',
    product_type: productType || 'Dropshipping',
    tags: formattedTags,
    images: formattedImages,
    variants,
  };

  return {
    product: shopifyProduct,
    _meta: {
      originalTitle: title,
      cleanedTitle,
      originalPrice: parseFloat(originalPrice) || 0,
      shippingCost: parseFloat(shippingCost) || 0,
      pricing,
      totalImagesMapped: formattedImages.length,
      inventoryQuantity,
      transformedAt: new Date().toISOString(),
    },
  };
}

/**
 * Normaliza la URL de la tienda de Shopify ingresada por el usuario o entorno.
 * Remueve http/https, barras finales y asegura el subdominio myshopify.com.
 *
 * @param {string} storeUrl - Valor de process.env.SHOPIFY_STORE_URL
 * @returns {string} Host normalizado (ej: "mi-tienda.myshopify.com")
 */
export function normalizeShopifyStoreUrl(storeUrl) {
  if (!storeUrl || typeof storeUrl !== 'string') {
    return '';
  }

  let normalized = storeUrl.trim();
  // Quitar protocolo
  normalized = normalized.replace(/^https?:\/\//i, '');
  // Quitar barras y rutas posteriores
  normalized = normalized.split('/')[0].trim();

  return normalized;
}

/**
 * Exporta un producto transformado a la Admin API de Shopify (versión 2024-01).
 * Realiza una petición POST a /admin/api/2024-01/products.json.
 *
 * @param {object} transformedPayload - Objeto retornado por transformProductData (o que contenga { product: { ... } })
 * @param {object} [options={}] - Parámetros de anulación opcionales (para pruebas o inyección)
 * @param {string} [options.storeUrl] - URL opcional para anular process.env.SHOPIFY_STORE_URL
 * @param {string} [options.accessToken] - Token opcional para anular process.env.SHOPIFY_ACCESS_TOKEN
 * @param {number} [options.timeoutMs=15000] - Tiempo de espera máximo en milisegundos
 * @returns {Promise<object>} Resultado con el producto creado en Shopify y metadatos de sincronización
 */
export async function exportToShopify(transformedPayload, options = {}) {
  // 1. Obtener y validar credenciales estrictamente desde el entorno o parámetros explícitos
  const rawStoreUrl = options.storeUrl || process.env.SHOPIFY_STORE_URL;
  const accessToken = options.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;

  if (!rawStoreUrl) {
    const error = new Error('Credenciales faltantes: SHOPIFY_STORE_URL no está configurada en las variables de entorno.');
    error.statusCode = 500;
    error.code = 'ERR_SHOPIFY_CONFIG_STORE_URL_MISSING';
    throw error;
  }

  if (!accessToken) {
    const error = new Error('Credenciales faltantes: SHOPIFY_ACCESS_TOKEN no está configurada en las variables de entorno.');
    error.statusCode = 500;
    error.code = 'ERR_SHOPIFY_CONFIG_ACCESS_TOKEN_MISSING';
    throw error;
  }

  const storeHost = normalizeShopifyStoreUrl(rawStoreUrl);
  if (!storeHost) {
    const error = new Error(`El formato de SHOPIFY_STORE_URL es inválido: "${rawStoreUrl}". Debe ser del formato "tu-tienda.myshopify.com".`);
    error.statusCode = 500;
    error.code = 'ERR_SHOPIFY_INVALID_STORE_URL';
    throw error;
  }

  // 2. Extraer el cuerpo del producto
  const productBody = transformedPayload?.product || transformedPayload;
  if (!productBody || !productBody.title) {
    const error = new Error('El objeto del producto a exportar es inválido o no contiene un título.');
    error.statusCode = 400;
    error.code = 'ERR_INVALID_PRODUCT_PAYLOAD';
    throw error;
  }

  // 3. Preparar la URL del endpoint Admin API 2024-01
  const endpointUrl = `https://${storeHost}/admin/api/2024-01/products.json`;
  const timeoutMs = options.timeoutMs || 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
        'User-Agent': 'Anima-CRM-AutoDS-Dropshipping/1.0',
      },
      body: JSON.stringify({ product: productBody }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const rawResponseText = await response.text();
    let responseData = {};
    try {
      responseData = rawResponseText ? JSON.parse(rawResponseText) : {};
    } catch {
      responseData = { raw: rawResponseText };
    }

    // 4. Manejo de respuestas exitosas (201 Created o 200 OK)
    if (response.status === 201 || response.status === 200) {
      const createdProduct = responseData.product || responseData;
      return {
        success: true,
        statusCode: response.status,
        message: 'Producto exportado exitosamente a Shopify.',
        product: {
          id: createdProduct.id,
          title: createdProduct.title,
          handle: createdProduct.handle,
          status: createdProduct.status || 'active',
          adminUrl: `https://${storeHost}/admin/products/${createdProduct.id}`,
          variantsCount: (createdProduct.variants || []).length,
          imagesCount: (createdProduct.images || []).length,
          createdAt: createdProduct.created_at,
          shopifyRaw: createdProduct,
        },
      };
    }

    // 5. Manejo detallado de errores HTTP de Shopify
    let detailedErrorMessage = 'Error desconocido al comunicarse con Shopify Admin API.';
    let errorCode = `ERR_SHOPIFY_API_${response.status}`;

    if (responseData.errors) {
      if (typeof responseData.errors === 'string') {
        detailedErrorMessage = responseData.errors;
      } else if (typeof responseData.errors === 'object') {
        // Shopify suele devolver { errors: { title: ["can't be blank"], base: ["..."] } }
        const formattedErrors = Object.entries(responseData.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        detailedErrorMessage = `Errores de validación de Shopify: ${formattedErrors}`;
      }
    } else if (responseData.error_description) {
      detailedErrorMessage = responseData.error_description;
    }

    if (response.status === 401) {
      detailedErrorMessage = 'Autenticación fallida con Shopify. Verifica que SHOPIFY_ACCESS_TOKEN sea válido y no haya expirado.';
      errorCode = 'ERR_SHOPIFY_UNAUTHORIZED';
    } else if (response.status === 403) {
      detailedErrorMessage = 'Permisos insuficientes en Shopify API. Asegúrate de que la aplicación personalizada tenga habilitado el alcance "write_products".';
      errorCode = 'ERR_SHOPIFY_FORBIDDEN';
    } else if (response.status === 404) {
      detailedErrorMessage = `Tienda o endpoint no encontrado en "${endpointUrl}". Verifica SHOPIFY_STORE_URL.`;
      errorCode = 'ERR_SHOPIFY_NOT_FOUND';
    } else if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '2';
      detailedErrorMessage = `Límite de peticiones de Shopify alcanzado (Rate Limit). Reintentar en ${retryAfter} segundos.`;
      errorCode = 'ERR_SHOPIFY_RATE_LIMIT';
    } else if (response.status === 422) {
      errorCode = 'ERR_SHOPIFY_UNPROCESSABLE_ENTITY';
    }

    const apiError = new Error(detailedErrorMessage);
    apiError.statusCode = response.status;
    apiError.code = errorCode;
    apiError.details = responseData;
    throw apiError;
  } catch (err) {
    clearTimeout(timeoutId);

    // Si ya es un error con statusCode asignado, re-lanzar
    if (err.statusCode) {
      throw err;
    }

    // Manejo de timeout / abort
    if (err.name === 'AbortError') {
      const timeoutError = new Error(`Tiempo de espera agotado (${timeoutMs / 1000}s) al exportar producto a Shopify.`);
      timeoutError.statusCode = 504;
      timeoutError.code = 'ERR_SHOPIFY_TIMEOUT';
      throw timeoutError;
    }

    // Error de red / DNS
    const networkError = new Error(`Fallo de conexión de red con Shopify Admin API: ${err.message}`);
    networkError.statusCode = 502;
    networkError.code = 'ERR_SHOPIFY_NETWORK_FAILURE';
    networkError.originalError = err;
    throw networkError;
  }
}

/**
 * Valida la conectividad con la tienda Shopify consultando la información básica de la tienda (/admin/api/2024-01/shop.json).
 *
 * @param {object} [options={}]
 * @returns {Promise<object>} Estado de conexión y nombre de la tienda
 */
export async function testShopifyConnection(options = {}) {
  const rawStoreUrl = options.storeUrl || process.env.SHOPIFY_STORE_URL;
  const accessToken = options.accessToken || process.env.SHOPIFY_ACCESS_TOKEN;

  if (!rawStoreUrl || !accessToken) {
    return {
      connected: false,
      configured: false,
      error: 'Variables SHOPIFY_STORE_URL o SHOPIFY_ACCESS_TOKEN no configuradas.',
    };
  }

  const storeHost = normalizeShopifyStoreUrl(rawStoreUrl);
  const endpointUrl = `https://${storeHost}/admin/api/2024-01/shop.json`;

  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      return {
        connected: false,
        configured: true,
        statusCode: response.status,
        error: `Shopify respondió con estado HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      connected: true,
      configured: true,
      shop: {
        id: data.shop?.id,
        name: data.shop?.name,
        email: data.shop?.email,
        domain: data.shop?.domain,
        myshopifyDomain: data.shop?.myshopify_domain,
        currency: data.shop?.currency,
        planName: data.shop?.plan_name,
      },
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      error: err.message,
    };
  }
}
