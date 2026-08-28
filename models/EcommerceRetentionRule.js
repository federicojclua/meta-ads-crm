export const RETENTION_ACTION_TYPES = ['repurchase', 'cross_sell', 'reactivation', 'win_back'];

export const DEFAULT_RETENTION_RULES = [
  {
    name: 'Recompra / Reposición (+30 Días)',
    delayDays: 30,
    actionType: 'repurchase',
    targetCategory: 'General',
    whatsappTemplateId: 'retention_repurchase_30d',
    messageBody: '¡Hola {{name}}! Esperamos que estés disfrutando tu compra de {{productName}}. Te compartimos un beneficio exclusivo de recompra con 15% OFF.',
    couponConfig: { code: 'VIP15', discountPct: 15, validDays: 7 },
    enabled: true,
  },
  {
    name: 'Venta Cruzada / Accesorios (+45 Días)',
    delayDays: 45,
    actionType: 'cross_sell',
    targetCategory: 'General',
    whatsappTemplateId: 'retention_cross_sell_45d',
    messageBody: '¡Hola {{name}}! Varios clientes que adquirieron {{productName}} sumaron {{recommendedProduct}} para maximizar su rendimiento. ¿Te gustaría conocer las opciones?',
    couponConfig: { code: 'CROSS10', discountPct: 10, validDays: 5 },
    enabled: true,
  },
  {
    name: 'Reactivación de Cliente (+60 Días)',
    delayDays: 60,
    actionType: 'reactivation',
    targetCategory: 'General',
    whatsappTemplateId: 'retention_reactivation_60d',
    messageBody: '¡Hola {{name}}! Hace 2 meses que no nos visitás. Tenemos nuevos lanzamientos en tu categoría favorita con envío prioritario.',
    couponConfig: { code: 'VUELVE20', discountPct: 20, validDays: 10 },
    enabled: true,
  },
  {
    name: 'Recuperación Win-Back (+90 Días)',
    delayDays: 90,
    actionType: 'win_back',
    targetCategory: 'General',
    whatsappTemplateId: 'retention_winback_90d',
    messageBody: '¡Hola {{name}}! Queremos saber cómo fue tu experiencia. Como cliente destacado, tenés un cupón especial del 25% OFF para tu próxima orden.',
    couponConfig: { code: 'WINBACK25', discountPct: 25, validDays: 14 },
    enabled: true,
  },
];

/**
 * Sanitizes an EcommerceRetentionRule document.
 */
export function sanitizeEcommerceRetentionRule(doc = {}) {
  const coupon = doc.couponConfig || {};

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    name: doc.name || 'Regla de Retención',
    delayDays: Number(doc.delayDays) || 30,
    actionType: RETENTION_ACTION_TYPES.includes(doc.actionType) ? doc.actionType : 'repurchase',
    targetCategory: doc.targetCategory || 'General',
    targetProductId: doc.targetProductId?.toString() || null,
    recommendedProducts: Array.isArray(doc.recommendedProducts) ? doc.recommendedProducts : [],
    whatsappTemplateId: doc.whatsappTemplateId || 'retention_default',
    messageBody: doc.messageBody || 'Hola {{name}}, tenemos un beneficio especial para vos.',
    couponConfig: {
      code: coupon.code || 'VIP10',
      discountPct: Number(coupon.discountPct) || 10,
      validDays: Number(coupon.validDays) || 7,
    },
    enabled: doc.enabled !== false,
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}
