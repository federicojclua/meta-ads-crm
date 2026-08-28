export const CUSTOMER_RETENTION_STATUSES = ['active', 'at_risk', 'dormant', 'churned'];

/**
 * Sanitizes an EcommerceCustomer document.
 */
export function sanitizeEcommerceCustomer(doc = {}) {
  const totalOrders = Number(doc.totalOrders) || 0;
  const totalRevenue = Number(doc.totalRevenue) || 0;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    storeId: doc.storeId || 'store_main',
    externalCustomerId: doc.externalCustomerId?.toString() || '',
    email: doc.email || '',
    phone: doc.phone || '',
    normalizedPhone: doc.normalizedPhone || (doc.phone ? doc.phone.replace(/\D/g, '') : ''),
    name: doc.name || 'Cliente E-Commerce',
    totalOrders,
    totalRevenue,
    averageOrderValue,
    realLtv: Number(doc.realLtv) || totalRevenue,
    predictedLtv: Number(doc.predictedLtv) || Math.round(totalRevenue * 1.35),
    firstPurchaseAt: doc.firstPurchaseAt || doc.createdAt || new Date().toISOString(),
    lastPurchaseAt: doc.lastPurchaseAt || doc.createdAt || new Date().toISOString(),
    purchaseFrequencyDays: Number(doc.purchaseFrequencyDays) || 30,
    topCategories: Array.isArray(doc.topCategories) ? doc.topCategories : [],
    purchasedProductIds: Array.isArray(doc.purchasedProductIds) ? doc.purchasedProductIds : [],
    retentionStatus: CUSTOMER_RETENTION_STATUSES.includes(doc.retentionStatus) ? doc.retentionStatus : 'active',
    optInWhatsApp: doc.optInWhatsApp !== false,
    tags: Array.isArray(doc.tags) ? doc.tags : ['shopify_buyer'],
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
