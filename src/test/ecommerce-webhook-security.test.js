import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  verifyShopifyHmac,
  ShopifyAdapter,
  WooCommerceAdapter,
  processNormalizedOrderService,
} from '../../netlify/functions/_shared/ecommerceEngine/webhookAdapters.js';
import { isSafeUrl } from '../../netlify/functions/_shared/ecommerceEngine/urlFetcherService.js';

describe('Stage 20 — E-Commerce Webhook Security, Idempotency & SSRF Protection Tests', () => {
  it('1. verifyShopifyHmac valida correctamente firmas HMAC-SHA256 y rechaza firmas manipuladas', () => {
    const secret = 'shpss_test_secret_9988';
    const rawBody = JSON.stringify({ id: 12345, total_price: '45000.00' });

    const validHmac = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
    const invalidHmac = 'invalid_hmac_signature_base64=';

    expect(verifyShopifyHmac({ rawBody, hmacHeader: validHmac, secret })).toBe(true);
    expect(verifyShopifyHmac({ rawBody, hmacHeader: invalidHmac, secret })).toBe(false);
    expect(verifyShopifyHmac({ rawBody: 'tampered body', hmacHeader: validHmac, secret })).toBe(false);
  });

  it('2. isSafeUrl previene ataques SSRF bloqueando localhost, IPs privadas y metadata endpoints', () => {
    expect(isSafeUrl('http://localhost:3000/test').isSafe).toBe(false);
    expect(isSafeUrl('http://127.0.0.1:8080').isSafe).toBe(false);
    expect(isSafeUrl('http://169.254.169.254/latest/meta-data/').isSafe).toBe(false);
    expect(isSafeUrl('http://10.0.0.1/admin').isSafe).toBe(false);
    expect(isSafeUrl('http://192.168.1.1/router').isSafe).toBe(false);
    expect(isSafeUrl('ftp://example.com/file').isSafe).toBe(false);

    // Valid Public URLs
    expect(isSafeUrl('https://tienda-oficial.com.ar/producto').isSafe).toBe(true);
    expect(isSafeUrl('https://amazon.com/dp/B08N5WRWNW').isSafe).toBe(true);
  });

  it('3. processNormalizedOrderService implementa idempotencia estricta para evitar duplicaciones de órdenes y clientes', async () => {
    let webhookEvents = [];
    let customers = [];
    let orders = [];

    const mockDb = {
      collection: (name) => {
        if (name === 'ecommerce_webhook_events') {
          return {
            findOne: async (query) => webhookEvents.find((e) => e.idempotencyKey === query.idempotencyKey),
            insertOne: async (doc) => { webhookEvents.push(doc); return { insertedId: 'evt_101' }; },
          };
        }
        if (name === 'ecommerce_customers') {
          return {
            findOne: async () => customers[0] || null,
            findOneAndUpdate: async (q, update) => {
              const cust = { _id: 'cust_101', name: 'Juan Perez', totalOrders: 1, totalRevenue: 45000 };
              customers.push(cust);
              return cust;
            },
          };
        }
        if (name === 'ecommerce_orders') {
          return {
            insertOne: async (doc) => { orders.push(doc); return { insertedId: 'ord_101' }; },
          };
        }
        if (name === 'ecommerce_retention_rules') {
          return {
            find: () => ({ toArray: async () => [{ _id: 'rule_1', delayDays: 30, name: 'Recompra 30d' }] }),
          };
        }
        if (name === 'ecommerce_retention_events') {
          return {
            insertOne: async (doc) => ({ insertedId: 'ret_evt_101' }),
          };
        }
        return {};
      },
    };

    const normalized = ShopifyAdapter.normalizeOrder(
      {
        id: 998877,
        order_number: 1005,
        total_price: '45000.00',
        customer: { first_name: 'Juan', last_name: 'Perez', email: 'juan@test.com', phone: '+5491144445555' },
        line_items: [{ product_id: 101, title: 'Notebook Pro', quantity: 1, price: '45000.00' }],
      },
      '65df44444444444444444444',
      'store_01'
    );

    // First Webhook Delivery
    const firstResult = await processNormalizedOrderService({
      normalizedOrder: normalized,
      db: mockDb,
      provider: 'shopify',
    });

    expect(firstResult.ok).toBe(true);
    expect(firstResult.deduplicated).toBe(false);
    expect(orders.length).toBe(1);

    // Second (Duplicate / Retried) Webhook Delivery
    const duplicateResult = await processNormalizedOrderService({
      normalizedOrder: normalized,
      db: mockDb,
      provider: 'shopify',
    });

    expect(duplicateResult.ok).toBe(true);
    expect(duplicateResult.deduplicated).toBe(true);
    expect(duplicateResult.status).toBe('SKIPPED');
    // Orders count remains exactly 1!
    expect(orders.length).toBe(1);
  });
});
