import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanProductTitle,
  calculateDropshippingPricing,
  mapShopifyImages,
  transformProductData,
  normalizeShopifyStoreUrl,
  exportToShopify,
  testShopifyConnection,
} from '../../netlify/functions/_shared/ecommerceEngine/shopifyDropshippingService.js';
import {
  extractAliExpressProductId,
  generateAliExpressSignature,
  normalizeAliExpressApiResponse,
  fetchAliExpressProduct,
} from '../../netlify/functions/_shared/ecommerceEngine/aliExpressService.js';
import { handler } from '../../netlify/functions/api-shopify.js';

describe('Shopify Dropshipping (AutoDS Simulator) Integration Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SHOPIFY_STORE_URL = 'https://mi-tienda-test.myshopify.com/';
    process.env.SHOPIFY_ACCESS_TOKEN = 'shpat_test_access_token_12345';
    process.env.ALIEXPRESS_APP_KEY = '545792';
    process.env.ALIEXPRESS_APP_SECRET = '6FugeMXsqFaF2YS4ujMjsPuoAsnjGdCk';
    process.env.ALIEXPRESS_ACCESS_TOKEN = 'mock_ae_access_token_123';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ----------------------------------------------------
  // 1. Limpieza heurística de títulos de AliExpress
  // ----------------------------------------------------
  describe('cleanProductTitle', () => {
    it('remueve palabras de spam y etiquetas promocionales típicas de marketplaces', () => {
      const dirtyTitle = '[HOT SALE] 2024 New Arrival Wireless Earbuds Bluetooth 5.3 (Free Shipping) Drop shipping Top Quality';
      const cleaned = cleanProductTitle(dirtyTitle);

      expect(cleaned).not.toMatch(/hot sale/i);
      expect(cleaned).not.toMatch(/free shipping/i);
      expect(cleaned).not.toMatch(/drop shipping/i);
      expect(cleaned).not.toMatch(/top quality/i);
      expect(cleaned).not.toMatch(/2024/i);
      expect(cleaned).toContain('Wireless Earbuds Bluetooth 5.3');
    });

    it('convierte títulos en mayúsculas sostenidas a capitalización legible', () => {
      const uppercaseTitle = 'ELECTRIC MASSAGE GUN DEEP TISSUE MUSCLE RELAXATION';
      const cleaned = cleanProductTitle(uppercaseTitle);

      expect(cleaned).toBe('Electric Massage Gun Deep Tissue Muscle Relaxation');
    });

    it('limpia signos de puntuación duplicados y caracteres extraños', () => {
      const noisyTitle = '*** Mini Portable Fan *** USB Rechargeable || Fast Delivery !!!';
      const cleaned = cleanProductTitle(noisyTitle);

      expect(cleaned).toContain('Mini Portable Fan USB Rechargeable');
      expect(cleaned).not.toContain('***');
      expect(cleaned).not.toContain('||');
      expect(cleaned).not.toContain('!!!');
    });

    it('maneja strings vacíos o no válidos retornando un fallback seguro', () => {
      expect(cleanProductTitle(null)).toBe('Imported Dropshipping Product');
      expect(cleanProductTitle('')).toBe('Imported Dropshipping Product');
    });
  });

  // ----------------------------------------------------
  // 2. Cálculo de precios y compare-at según reglas AutoDS
  // ----------------------------------------------------
  describe('calculateDropshippingPricing', () => {
    it('aplica la fórmula (precio_original + costo_envio) * 2.5 y +20% para compare_at_price', () => {
      const originalPrice = 10;
      const shippingCost = 2;

      // Base: 10 + 2 = 12 USD
      // Selling price: 12 * 2.5 = 30.00 USD
      // Compare at price: 30 * 1.20 = 36.00 USD
      const pricing = calculateDropshippingPricing(originalPrice, shippingCost);

      expect(pricing.costBase).toBe(12.0);
      expect(pricing.sellingPrice).toBe('30.00');
      expect(pricing.numericPrice).toBe(30.0);
      expect(pricing.compareAtPrice).toBe('36.00');
      expect(pricing.numericCompareAtPrice).toBe(36.0);
      expect(pricing.estimatedProfit).toBe(18.0); // 30 - 12
      expect(pricing.profitMarginPct).toBe(60.0); // (18 / 30) * 100
    });

    it('gestiona correctamente decimales con redondeo financiero estándar', () => {
      const originalPrice = 14.99;
      const shippingCost = 3.5;

      // Base: 14.99 + 3.50 = 18.49 USD
      // Selling price: 18.49 * 2.5 = 46.225 -> 46.23 USD
      // Compare at: 46.23 * 1.20 = 55.476 -> 55.48 USD
      const pricing = calculateDropshippingPricing(originalPrice, shippingCost);

      expect(pricing.costBase).toBe(18.49);
      expect(pricing.sellingPrice).toBe('46.23');
      expect(pricing.compareAtPrice).toBe('55.48');
      expect(pricing.estimatedProfit).toBe(27.74);
    });

    it('soporta valores 0 o indefinidos sin arrojar NaN', () => {
      const pricing = calculateDropshippingPricing(0, 0);
      expect(pricing.sellingPrice).toBe('0.00');
      expect(pricing.compareAtPrice).toBe('0.00');
      expect(pricing.estimatedProfit).toBe(0.0);
    });
  });

  // ----------------------------------------------------
  // 3. Mapeo y normalización de imágenes para Shopify
  // ----------------------------------------------------
  describe('mapShopifyImages', () => {
    it('convierte un array de URLs crudas al formato [{ src: url }]', () => {
      const rawImages = [
        'https://ae01.alicdn.com/kf/S123456.jpg',
        'https://ae01.alicdn.com/kf/S789012.jpg',
      ];

      const mapped = mapShopifyImages(rawImages);

      expect(mapped).toEqual([
        { src: 'https://ae01.alicdn.com/kf/S123456.jpg' },
        { src: 'https://ae01.alicdn.com/kf/S789012.jpg' },
      ]);
    });

    it('elimina duplicados, filtra entradas vacías y normaliza URLs relativas de protocolo', () => {
      const mixedImages = [
        '//ae01.alicdn.com/kf/relative1.jpg',
        'https://ae01.alicdn.com/kf/relative1.jpg', // Duplicado tras normalizar https:
        '',
        null,
        'invalid-url-without-protocol',
        { url: 'https://ae01.alicdn.com/kf/object-url.jpg' },
      ];

      const mapped = mapShopifyImages(mixedImages);

      expect(mapped).toEqual([
        { src: 'https://ae01.alicdn.com/kf/relative1.jpg' },
        { src: 'https://ae01.alicdn.com/kf/object-url.jpg' },
      ]);
    });
  });

  // ----------------------------------------------------
  // 4. Transformación de producto (transformProductData)
  // ----------------------------------------------------
  describe('transformProductData', () => {
    it('construye la estructura completa requerida por Shopify Admin API 2024-01', () => {
      const rawProduct = {
        title: '[HOT SALE] Smart Watch Ultra 2 Amoled Display 2024 Free Shipping',
        images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
        originalPrice: 20.0,
        shippingCost: 4.0,
        inventory: 250,
        description: 'Smartwatch sumergible con monitor cardíaco y batería de 10 días.',
        vendor: 'Novati Store',
        productType: 'Smartwatches',
      };

      const transformed = transformProductData(rawProduct);

      expect(transformed.product).toBeDefined();
      expect(transformed.product.title).toBe('Smart Watch Ultra 2 Amoled Display');
      expect(transformed.product.vendor).toBe('Novati Store');
      expect(transformed.product.product_type).toBe('Smartwatches');
      expect(transformed.product.images).toHaveLength(2);
      expect(transformed.product.images[0]).toEqual({ src: 'https://example.com/img1.jpg' });

      // Verificación de variantes
      expect(transformed.product.variants).toHaveLength(1);
      const variant = transformed.product.variants[0];
      // (20 + 4) * 2.5 = 60.00
      expect(variant.price).toBe('60.00');
      // 60.00 * 1.20 = 72.00
      expect(variant.compare_at_price).toBe('72.00');
      expect(variant.inventory_management).toBe('shopify');
      expect(variant.inventory_quantity).toBe(250);

      // Verificación de metadata
      expect(transformed._meta.pricing.sellingPrice).toBe('60.00');
      expect(transformed._meta.pricing.compareAtPrice).toBe('72.00');
      expect(transformed._meta.pricing.estimatedProfit).toBe(36.0);
    });

    it('arroja error si el argumento rawProduct es nulo o no es objeto', () => {
      expect(() => transformProductData(null)).toThrow(/rawProduct es requerido/);
    });
  });

  // ----------------------------------------------------
  // 5. Normalización de URLs de tienda
  // ----------------------------------------------------
  describe('normalizeShopifyStoreUrl', () => {
    it('normaliza URLs con https, http y barras finales', () => {
      expect(normalizeShopifyStoreUrl('https://tienda.myshopify.com/')).toBe('tienda.myshopify.com');
      expect(normalizeShopifyStoreUrl('http://tienda.myshopify.com')).toBe('tienda.myshopify.com');
      expect(normalizeShopifyStoreUrl('tienda.myshopify.com')).toBe('tienda.myshopify.com');
    });
  });

  // ----------------------------------------------------
  // 6. Exportación a Shopify Admin API 2024-01 (exportToShopify)
  // ----------------------------------------------------
  describe('exportToShopify', () => {
    it('envía petición POST con cabecera X-Shopify-Access-Token y payload correcto', async () => {
      const mockShopifyResponse = {
        product: {
          id: 8877665544,
          title: 'Smart Watch Ultra 2',
          handle: 'smart-watch-ultra-2',
          status: 'active',
          variants: [{ id: 111, price: '60.00' }],
          images: [{ id: 222, src: 'https://example.com/img1.jpg' }],
          created_at: '2026-09-08T15:00:00Z',
        },
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        status: 201,
        ok: true,
        text: async () => JSON.stringify(mockShopifyResponse),
      });

      const payload = {
        product: {
          title: 'Smart Watch Ultra 2',
          variants: [{ price: '60.00', compare_at_price: '72.00' }],
        },
      };

      const result = await exportToShopify(payload);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];

      expect(calledUrl).toBe('https://mi-tienda-test.myshopify.com/admin/api/2024-01/products.json');
      expect(calledOptions.method).toBe('POST');
      expect(calledOptions.headers['X-Shopify-Access-Token']).toBe('shpat_test_access_token_12345');
      expect(calledOptions.headers['Content-Type']).toBe('application/json');

      expect(result.success).toBe(true);
      expect(result.product.id).toBe(8877665544);
      expect(result.product.adminUrl).toContain('/admin/products/8877665544');
    });

    it('arroja error 500 explicativo si falta SHOPIFY_STORE_URL o SHOPIFY_ACCESS_TOKEN', async () => {
      delete process.env.SHOPIFY_STORE_URL;
      await expect(exportToShopify({ product: { title: 'Test' } })).rejects.toThrow(
        /SHOPIFY_STORE_URL no está configurada/
      );

      process.env.SHOPIFY_STORE_URL = 'tienda.myshopify.com';
      delete process.env.SHOPIFY_ACCESS_TOKEN;
      await expect(exportToShopify({ product: { title: 'Test' } })).rejects.toThrow(
        /SHOPIFY_ACCESS_TOKEN no está configurada/
      );
    });

    it('maneja error 401 Unauthorized de Shopify con mensaje claro', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        status: 401,
        ok: false,
        text: async () => JSON.stringify({ errors: '[API] Invalid API key or access token' }),
        headers: new Headers(),
      });

      await expect(exportToShopify({ product: { title: 'Test' } })).rejects.toThrow(
        /Autenticación fallida con Shopify/
      );
    });

    it('maneja error 429 Rate Limit leyendo Retry-After', async () => {
      const headers = new Headers();
      headers.set('Retry-After', '4');

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        status: 429,
        ok: false,
        text: async () => JSON.stringify({ errors: 'Exceeded 2.0 calls per second' }),
        headers,
      });

      await expect(exportToShopify({ product: { title: 'Test' } })).rejects.toThrow(
        /Límite de peticiones de Shopify alcanzado.*Reintentar en 4 segundos/
      );
    });

    it('maneja errores de validación 422 de Shopify', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        status: 422,
        ok: false,
        text: async () => JSON.stringify({ errors: { title: ["can't be blank"] } }),
        headers: new Headers(),
      });

      await expect(exportToShopify({ product: { title: 'Test' } })).rejects.toThrow(
        /Errores de validación de Shopify: title: can't be blank/
      );
    });
  });

  // ----------------------------------------------------
  // 7. Prueba de Conexión (testShopifyConnection)
  // ----------------------------------------------------
  describe('testShopifyConnection', () => {
    it('retorna información básica de la tienda al conectarse exitosamente', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          shop: {
            id: 12345,
            name: 'Tienda Oficial Novati',
            domain: 'tienda-novati.com',
            myshopify_domain: 'tienda-novati.myshopify.com',
            currency: 'USD',
          },
        }),
      });

      const res = await testShopifyConnection();
      expect(res.connected).toBe(true);
      expect(res.shop.name).toBe('Tienda Oficial Novati');
    });
  });

  // ----------------------------------------------------
  // 8. Controlador Serverless Netlify Function (api-shopify.js)
  // ----------------------------------------------------
  describe('Netlify Function Controller (handler)', () => {
    it('responde 204 con cabeceras CORS en solicitudes OPTIONS', async () => {
      const event = {
        httpMethod: 'OPTIONS',
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(204);
      expect(res.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
    });

    it('POST /api/shopify/transform: valida payload y devuelve preview sin llamar a Shopify', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      const event = {
        httpMethod: 'POST',
        path: '/api/shopify/transform',
        body: JSON.stringify({
          title: '[HOT] Gaming Mouse RGB 7200 DPI (Free Shipping)',
          images: ['https://example.com/mouse.jpg'],
          originalPrice: 8.0,
          shippingCost: 2.0,
          inventory: 50,
        }),
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(true);
      expect(parsed.data.product.title).toBe('Gaming Mouse RGB 7200 DPI');
      // (8 + 2) * 2.5 = 25.00
      expect(parsed.data._meta.pricing.sellingPrice).toBe('25.00');
      // 25 * 1.2 = 30.00
      expect(parsed.data._meta.pricing.compareAtPrice).toBe('30.00');

      // Comprobar que NO llamó a la Admin API de Shopify
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('POST /api/shopify/import: valida datos faltantes y retorna 400 descriptivo', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/shopify/import',
        body: JSON.stringify({
          // Falta title
          images: ['https://example.com/test.jpg'],
          originalPrice: 15.0,
        }),
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(400);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(false);
      expect(parsed.error).toContain('title');
      expect(parsed.code).toBe('ERR_MISSING_TITLE');
    });

    it('POST /api/shopify/import: ejecuta pipeline completo (AliExpress -> Transform -> Shopify API)', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        status: 201,
        ok: true,
        text: async () =>
          JSON.stringify({
            product: {
              id: 998877,
              title: 'Posture Corrector Brace',
              handle: 'posture-corrector-brace',
              variants: [{ id: 456, price: '37.50' }],
            },
          }),
      });

      const event = {
        httpMethod: 'POST',
        path: '/api/shopify/import',
        body: JSON.stringify({
          title: '[NEW 2024] Posture Corrector Brace Adjustable Support (Hot Sale)',
          images: ['https://example.com/brace.jpg'],
          originalPrice: 12.0,
          shippingCost: 3.0,
          inventory: 80,
          description: 'Corrector de postura ergonómico unisex.',
        }),
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(201);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(true);
      expect(parsed.data.shopifyProduct.id).toBe(998877);
      // (12 + 3) * 2.5 = 37.50
      expect(parsed.data.pricingSummary.sellingPrice).toBe('37.50');
      // 37.50 * 1.20 = 45.00
      expect(parsed.data.pricingSummary.compareAtPrice).toBe('45.00');
    });

    it('GET /api/shopify/calculate: calcula precios vía query params para el frontend', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/shopify/calculate',
        queryStringParameters: {
          originalPrice: '16.00',
          shippingCost: '4.00',
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(true);
      // (16 + 4) * 2.5 = 50.00
      expect(parsed.data.sellingPrice).toBe('50.00');
      // 50 * 1.2 = 60.00
      expect(parsed.data.compareAtPrice).toBe('60.00');
    });

    it('POST /api/shopify/sync-aliexpress: rechaza petición si falta productId o URL', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/shopify/sync-aliexpress',
        body: JSON.stringify({}),
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(400);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(false);
      expect(parsed.code).toBe('ERR_MISSING_PRODUCT_INPUT');
    });

    it('POST /api/shopify/sync-aliexpress: ejecuta el flujo ETL de 3 pasos (AliExpress API -> Transformación -> Shopify API)', async () => {
      // Mock de respuesta de AliExpress Dropshipping API
      const mockAliExpressResponse = {
        aliexpress_ds_product_get_response: {
          result: {
            ae_item_base_info_dto: {
              product_id: 1005006321458921,
              subject: '[HOT SALE] Smart Heated Eye Mask 2024 (Free Shipping)',
              detail: '<p>Antifaz térmico para ojos con masajeador vibratorio y bluetooth.</p>',
            },
            ae_multimedia_info_dto: {
              image_urls: 'https://ae01.alicdn.com/kf/S111.jpg;https://ae01.alicdn.com/kf/S222.jpg',
            },
            ae_item_sku_info_dtos: {
              ae_item_sku_info_d_t_o: [
                {
                  sku_id: '1200001',
                  offer_sale_price: '18.00',
                  sku_price: '25.00',
                  sku_available_stock: 120,
                },
              ],
            },
          },
        },
      };

      // Mock de respuesta de Shopify Admin API 2024-01
      const mockShopifyResponse = {
        product: {
          id: 5544332211,
          title: 'Smart Heated Eye Mask',
          handle: 'smart-heated-eye-mask',
          status: 'active',
          variants: [{ id: 9988, price: '45.00', compare_at_price: '54.00' }],
        },
      };

      // Spy sobre fetch para responder a AliExpress (1er llamado) y luego a Shopify (2do llamado)
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          text: async () => JSON.stringify(mockAliExpressResponse),
        })
        .mockResolvedValueOnce({
          status: 201,
          ok: true,
          text: async () => JSON.stringify(mockShopifyResponse),
        });

      const event = {
        httpMethod: 'POST',
        path: '/api/shopify/sync-aliexpress',
        body: JSON.stringify({
          url: 'https://es.aliexpress.com/item/1005006321458921.html?spm=test',
          shippingCost: 0,
        }),
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(201);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      // Verificación de datos de AliExpress extraídos
      expect(parsed.data.aliExpress.productId).toBe('1005006321458921');
      expect(parsed.data.aliExpress.costUsd).toBe(18.0);

      // Verificación de fórmulas financieras
      // Costo: 18.00 -> Venta: 18 * 2.5 = 45.00
      // Compare at: 45 * 1.20 = 54.00
      expect(parsed.data.pricing.sellingPrice).toBe('45.00');
      expect(parsed.data.pricing.compareAtPrice).toBe('54.00');
      expect(parsed.data.pricing.estimatedProfit).toBe(27.0); // 45 - 18
      expect(parsed.data.pricing.profitMarginPct).toBe(60.0);

      // Verificación de Shopify
      expect(parsed.data.shopifyProduct.id).toBe(5544332211);
    });
  });

  // ----------------------------------------------------
  // 9. Funciones Específicas de AliExpress Dropshipping
  // ----------------------------------------------------
  describe('AliExpress Dropshipping Service Utilities', () => {
    it('extractAliExpressProductId extrae ID desde URLs completas o cadenas de números', () => {
      expect(extractAliExpressProductId('1005006321458921')).toBe('1005006321458921');
      expect(extractAliExpressProductId('https://www.aliexpress.com/item/1005006321458921.html')).toBe('1005006321458921');
      expect(extractAliExpressProductId('https://es.aliexpress.com/item/1005007412345678.html?spm=a2g0o.productlist')).toBe('1005007412345678');
      expect(extractAliExpressProductId('https://aliexpress.com/item?productId=1005009988776655')).toBe('1005009988776655');
      expect(extractAliExpressProductId('invalid-string-without-digits')).toBeNull();
    });

    it('generateAliExpressSignature ordena alfabéticamente y genera hash HMAC-SHA256 en mayúsculas', () => {
      const params = {
        app_key: '545792',
        method: 'aliexpress.ds.product.get',
        product_id: '1005006321458921',
        v: '2.0',
      };
      const secret = 'testSecret123';

      const sigSha256 = generateAliExpressSignature(params, secret, 'sha256');
      expect(typeof sigSha256).toBe('string');
      expect(sigSha256).toBe(sigSha256.toUpperCase());
      expect(sigSha256).toHaveLength(64); // SHA256 hex length

      const sigMd5 = generateAliExpressSignature(params, secret, 'md5');
      expect(typeof sigMd5).toBe('string');
      expect(sigMd5).toBe(sigMd5.toUpperCase());
      expect(sigMd5).toHaveLength(32); // MD5 hex length
    });

    it('fetchAliExpressProduct maneja error_response de AliExpress con mensaje amigable', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: async () =>
          JSON.stringify({
            error_response: {
              code: '15',
              sub_code: 'isv.product-not-found',
              sub_msg: 'This product is not found or not available for dropshipping',
            },
          }),
      });

      await expect(fetchAliExpressProduct('1005006321458921')).rejects.toThrow(
        /no fue encontrado o no está disponible para dropshipping/
      );
    });
  });
});
