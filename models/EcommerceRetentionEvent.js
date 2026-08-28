export const RETENTION_EVENT_STATUSES = ['SCHEDULED', 'SENT', 'BLOCKED', 'CONVERTED', 'CANCELLED'];

/**
 * Sanitizes an EcommerceRetentionEvent document.
 */
export function sanitizeEcommerceRetentionEvent(doc = {}) {
  const payload = doc.whatsappMessagePayload || {};

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    orderId: doc.orderId?.toString() || '',
    customerId: doc.customerId?.toString() || '',
    customerName: doc.customerName || 'Cliente E-Commerce',
    customerPhone: doc.customerPhone || '',
    productName: doc.productName || 'Producto Adquirido',
    ruleId: doc.ruleId?.toString() || '',
    ruleName: doc.ruleName || 'Regla de Retención',
    actionType: doc.actionType || 'repurchase',
    scheduledFor: doc.scheduledFor || new Date().toISOString(),
    status: RETENTION_EVENT_STATUSES.includes(doc.status) ? doc.status : 'SCHEDULED',
    blockReason: doc.blockReason || null,
    whatsappMessagePayload: {
      phone: payload.phone || doc.customerPhone || '',
      templateId: payload.templateId || 'retention_template',
      message: payload.message || 'Mensaje de retención programado.',
      couponCode: payload.couponCode || '',
    },
    followUpLogId: doc.followUpLogId?.toString() || null,
    revenueAttributed: Number(doc.revenueAttributed) || 0,
    sentAt: doc.sentAt || null,
    convertedAt: doc.convertedAt || null,
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}
