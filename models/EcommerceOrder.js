export const ECOMMERCE_PROVIDERS = ['shopify', 'woocommerce', 'manual'];
export const ORDER_FINANCIAL_STATUSES = ['paid', 'pending', 'refunded', 'voided'];

/**
 * Sanitizes an EcommerceOrder document.
 */
export function sanitizeEcommerceOrder(doc = {}) {
  const items = Array.isArray(doc.items) ? doc.items : [];

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    storeId: doc.storeId || 'store_main',
    provider: ECOMMERCE_PROVIDERS.includes(doc.provider) ? doc.provider : 'shopify',
    externalOrderId: doc.externalOrderId?.toString() || '',
    externalCustomerId: doc.externalCustomerId?.toString() || '',
    customerId: doc.customerId?.toString() || '',
    orderNumber: doc.orderNumber || '#1001',
    financialStatus: ORDER_FINANCIAL_STATUSES.includes(doc.financialStatus) ? doc.financialStatus : 'paid',
    items: items.map((item) => ({
      productId: item.productId?.toString() || '',
      sku: item.sku || '',
      title: item.title || 'Producto',
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      total: (Number(item.quantity) || 1) * (Number(item.price) || 0),
    })),
    subtotal: Number(doc.subtotal) || 0,
    discounts: Number(doc.discounts) || 0,
    shipping: Number(doc.shipping) || 0,
    taxes: Number(doc.taxes) || 0,
    total: Number(doc.total) || 0,
    currency: doc.currency || 'ARS',
    orderDate: doc.orderDate || doc.createdAt || new Date().toISOString(),
    isRetentionPurchase: Boolean(doc.isRetentionPurchase),
    retentionCampaignId: doc.retentionCampaignId?.toString() || null,
    idempotencyKey: doc.idempotencyKey || '',
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}
