import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { sanitizeEcommerceOrder } from '../../../../models/EcommerceOrder.js';
import { sanitizeEcommerceCustomer } from '../../../../models/EcommerceCustomer.js';
import { sanitizeEcommerceRetentionEvent } from '../../../../models/EcommerceRetentionEvent.js';

/**
 * Validates Shopify HMAC-SHA256 signature using raw body.
 */
export function verifyShopifyHmac({ rawBody = '', hmacHeader = '', secret = '' } = {}) {
  if (!rawBody || !hmacHeader || !secret) {
    return false;
  }

  try {
    const generatedHmac = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    const generatedBuf = Buffer.from(generatedHmac, 'utf8');
    const headerBuf = Buffer.from(hmacHeader, 'utf8');

    if (generatedBuf.length !== headerBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(generatedBuf, headerBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Shopify Adapter: Normalizes Shopify order payload.
 */
export const ShopifyAdapter = {
  normalizeOrder(payload = {}, clientId = null, storeId = 'shopify_store_01') {
    const customer = payload.customer || {};
    const lineItems = Array.isArray(payload.line_items) ? payload.line_items : [];

    const items = lineItems.map((item) => ({
      productId: item.product_id?.toString() || item.id?.toString() || 'prod_01',
      sku: item.sku || '',
      title: item.title || item.name || 'Producto E-Commerce',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.price) || 0),
    }));

    const phone = customer.phone || payload.phone || payload.shipping_address?.phone || '';
    const normalizedPhone = phone.replace(/\D/g, '');

    return {
      clientId: clientId ? (ObjectId.isValid(clientId) ? new ObjectId(clientId) : clientId) : null,
      storeId,
      provider: 'shopify',
      externalOrderId: payload.id?.toString() || `shop_ord_${Date.now()}`,
      externalCustomerId: customer.id?.toString() || `shop_cust_${Date.now()}`,
      orderNumber: payload.order_number ? `#${payload.order_number}` : (payload.name || '#1001'),
      customer: {
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Cliente Shopify',
        email: customer.email || payload.email || '',
        phone,
        normalizedPhone,
      },
      items,
      subtotal: Number(payload.subtotal_price) || Number(payload.current_subtotal_price) || 0,
      discounts: Number(payload.total_discounts) || 0,
      shipping: Array.isArray(payload.shipping_lines)
        ? payload.shipping_lines.reduce((acc, s) => acc + (Number(s.price) || 0), 0)
        : (Number(payload.total_shipping_price_set?.shop_money?.amount) || 0),
      taxes: Number(payload.total_tax) || 0,
      total: Number(payload.total_price) || 0,
      currency: payload.currency || 'ARS',
      financialStatus: payload.financial_status === 'paid' ? 'paid' : (payload.financial_status || 'paid'),
      orderDate: payload.created_at || payload.processed_at || new Date().toISOString(),
      idempotencyKey: `shopify_${storeId}_${payload.id || Date.now()}`,
    };
  },
};

/**
 * WooCommerce Adapter: Normalizes WooCommerce order payload.
 */
export const WooCommerceAdapter = {
  normalizeOrder(payload = {}, clientId = null, storeId = 'woo_store_01') {
    const billing = payload.billing || {};
    const lineItems = Array.isArray(payload.line_items) ? payload.line_items : [];

    const items = lineItems.map((item) => ({
      productId: item.product_id?.toString() || 'prod_woo_01',
      sku: item.sku || '',
      title: item.name || 'Producto WooCommerce',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || (Number(item.total) / (Number(item.quantity) || 1)),
      total: Number(item.total) || 0,
    }));

    const phone = billing.phone || '';
    const normalizedPhone = phone.replace(/\D/g, '');

    return {
      clientId: clientId ? (ObjectId.isValid(clientId) ? new ObjectId(clientId) : clientId) : null,
      storeId,
      provider: 'woocommerce',
      externalOrderId: payload.id?.toString() || `woo_ord_${Date.now()}`,
      externalCustomerId: payload.customer_id?.toString() || `woo_cust_${Date.now()}`,
      orderNumber: payload.number ? `#${payload.number}` : `#${payload.id || '1001'}`,
      customer: {
        name: `${billing.first_name || ''} ${billing.last_name || ''}`.trim() || 'Cliente WooCommerce',
        email: billing.email || '',
        phone,
        normalizedPhone,
      },
      items,
      subtotal: Number(payload.total) - Number(payload.total_tax) - Number(payload.shipping_total) || 0,
      discounts: Number(payload.discount_total) || 0,
      shipping: Number(payload.shipping_total) || 0,
      taxes: Number(payload.total_tax) || 0,
      total: Number(payload.total) || 0,
      currency: payload.currency || 'ARS',
      financialStatus: payload.status === 'completed' || payload.status === 'processing' ? 'paid' : payload.status,
      orderDate: payload.date_created || new Date().toISOString(),
      idempotencyKey: `woocommerce_${storeId}_${payload.id || Date.now()}`,
    };
  },
};

/**
 * Core Order Ingestion & Idempotent Retention Processor.
 */
export async function processNormalizedOrderService({
  normalizedOrder = {},
  db = null,
  rawEventId = null,
  provider = 'shopify',
} = {}) {
  const {
    clientId,
    storeId,
    externalOrderId,
    externalCustomerId,
    customer,
    items,
    total,
    currency,
    orderNumber,
    orderDate,
    financialStatus,
    idempotencyKey,
  } = normalizedOrder;

  const eventKey = idempotencyKey || `${provider}_${storeId}_${externalOrderId}`;

  // 1. Idempotency Check
  if (db) {
    const webhookEventsColl = db.collection('ecommerce_webhook_events');
    const existingEvent = await webhookEventsColl.findOne({ idempotencyKey: eventKey });

    if (existingEvent) {
      return {
        ok: true,
        deduplicated: true,
        status: 'SKIPPED',
        message: `Evento webhook ${eventKey} ya procesado previamente. Se omite duplicación.`,
      };
    }

    // Record Webhook Event
    await webhookEventsColl.insertOne({
      idempotencyKey: eventKey,
      clientId: clientId ? (ObjectId.isValid(clientId) ? new ObjectId(clientId) : clientId) : null,
      storeId,
      provider,
      externalOrderId,
      rawEventId,
      status: 'PROCESSED',
      receivedAt: new Date().toISOString(),
    });
  }

  // 2. Customer Profile Upsert (Customer Memory)
  let customerDoc = null;
  if (db && clientId) {
    const customersColl = db.collection('ecommerce_customers');
    const lookupQuery = customer.email
      ? { email: customer.email, clientId: new ObjectId(clientId) }
      : { normalizedPhone: customer.normalizedPhone, clientId: new ObjectId(clientId) };

    const existingCust = await customersColl.findOne(lookupQuery);

    const newTotalOrders = (existingCust?.totalOrders || 0) + 1;
    const newTotalRevenue = (existingCust?.totalRevenue || 0) + total;
    const newAov = Math.round(newTotalRevenue / newTotalOrders);

    const purchasedIds = existingCust?.purchasedProductIds || [];
    items.forEach((it) => {
      if (it.productId && !purchasedIds.includes(it.productId)) {
        purchasedIds.push(it.productId);
      }
    });

    const updatePayload = {
      $set: {
        name: customer.name || existingCust?.name || 'Cliente',
        email: customer.email || existingCust?.email || '',
        phone: customer.phone || existingCust?.phone || '',
        normalizedPhone: customer.normalizedPhone || existingCust?.normalizedPhone || '',
        totalOrders: newTotalOrders,
        totalRevenue: newTotalRevenue,
        averageOrderValue: newAov,
        realLtv: newTotalRevenue,
        predictedLtv: Math.round(newTotalRevenue * (newTotalOrders > 1 ? 1.45 : 1.25)),
        lastPurchaseAt: orderDate || new Date().toISOString(),
        purchasedProductIds: purchasedIds,
        retentionStatus: newTotalOrders > 1 ? 'active' : 'active',
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: {
        clientId: new ObjectId(clientId),
        storeId,
        externalCustomerId,
        firstPurchaseAt: orderDate || new Date().toISOString(),
        optInWhatsApp: true,
        tags: ['ecom_buyer', provider],
        createdAt: new Date().toISOString(),
      },
    };

    const upsertRes = await customersColl.findOneAndUpdate(
      lookupQuery,
      updatePayload,
      { upsert: true, returnDocument: 'after' }
    );

    customerDoc = upsertRes?.value || upsertRes;
  } else {
    customerDoc = {
      id: 'cust_mock_01',
      clientId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      totalOrders: 1,
      totalRevenue: total,
      realLtv: total,
    };
  }

  // 3. Save Order in MongoDB
  let orderDoc = null;
  if (db && clientId) {
    const ordersColl = db.collection('ecommerce_orders');
    const orderToInsert = {
      clientId: new ObjectId(clientId),
      storeId,
      provider,
      externalOrderId,
      externalCustomerId,
      customerId: customerDoc?._id || customerDoc?.id,
      orderNumber,
      financialStatus,
      items,
      subtotal: normalizedOrder.subtotal,
      discounts: normalizedOrder.discounts,
      shipping: normalizedOrder.shipping,
      taxes: normalizedOrder.taxes,
      total,
      currency,
      orderDate,
      idempotencyKey: eventKey,
      createdAt: new Date().toISOString(),
    };
    const insRes = await ordersColl.insertOne(orderToInsert);
    orderToInsert._id = insRes.insertedId;
    orderDoc = orderToInsert;
  } else {
    orderDoc = sanitizeEcommerceOrder({
      ...normalizedOrder,
      id: 'ord_mock_01',
      customerId: customerDoc?.id,
    });
  }

  // 4. Schedule Retention Events based on Client Retention Rules
  const scheduledRetentionEvents = [];
  if (db && clientId && financialStatus === 'paid') {
    const rulesColl = db.collection('ecommerce_retention_rules');
    const retentionEventsColl = db.collection('ecommerce_retention_events');

    const activeRules = await rulesColl.find({
      clientId: new ObjectId(clientId),
      enabled: true,
    }).toArray();

    const orderTime = new Date(orderDate || Date.now()).getTime();

    for (const rule of activeRules) {
      const scheduledDate = new Date(orderTime + rule.delayDays * 24 * 60 * 60 * 1000);
      const firstItem = items[0] || { title: 'tu producto' };

      const compiledMessage = (rule.messageBody || '')
        .replace(/{{name}}/g, customer.name || 'Cliente')
        .replace(/{{productName}}/g, firstItem.title)
        .replace(/{{recommendedProduct}}/g, 'el Pack Complementario');

      const retentionEventDoc = {
        clientId: new ObjectId(clientId),
        orderId: orderDoc?._id || orderDoc?.id,
        customerId: customerDoc?._id || customerDoc?.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        productName: firstItem.title,
        ruleId: rule._id,
        ruleName: rule.name,
        actionType: rule.actionType || 'repurchase',
        scheduledFor: scheduledDate.toISOString(),
        status: 'SCHEDULED',
        blockReason: null,
        whatsappMessagePayload: {
          phone: customer.phone,
          templateId: rule.whatsappTemplateId || 'retention_default',
          message: compiledMessage,
          couponCode: rule.couponConfig?.code || 'VIP15',
        },
        revenueAttributed: 0,
        createdAt: new Date().toISOString(),
      };

      const retInsRes = await retentionEventsColl.insertOne(retentionEventDoc);
      retentionEventDoc._id = retInsRes.insertedId;
      scheduledRetentionEvents.push(sanitizeEcommerceRetentionEvent(retentionEventDoc));
    }
  }

  return {
    ok: true,
    deduplicated: false,
    order: sanitizeEcommerceOrder(orderDoc),
    customer: sanitizeEcommerceCustomer(customerDoc),
    scheduledRetentionEvents,
  };
}
