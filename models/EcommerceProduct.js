export const PRODUCT_SOURCE_TYPES = ['dropshipping', 'kdp', 'manual'];
export const PRODUCT_STATUSES = ['possible_winner', 'testing', 'validated_winner', 'discarded'];

/**
 * Validates an EcommerceProduct document.
 */
export function validateEcommerceProduct(data = {}) {
  const errors = [];

  if (!data.clientId) {
    errors.push('clientId es obligatorio.');
  }

  if (!data.productName || typeof data.productName !== 'string' || data.productName.trim().length === 0) {
    errors.push('El nombre del producto es obligatorio.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes an EcommerceProduct document.
 */
export function sanitizeEcommerceProduct(doc = {}) {
  const salePrice = Number(doc.salePrice) || 0;
  const cost = Number(doc.cost) || 0;
  const shippingCost = Number(doc.shippingCost) || 0;
  const estimatedMargin = salePrice > 0 ? Number((((salePrice - cost - shippingCost) / salePrice) * 100).toFixed(1)) : 0;

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    createdBy: doc.createdBy?.toString() || '',
    sourceType: PRODUCT_SOURCE_TYPES.includes(doc.sourceType) ? doc.sourceType : 'dropshipping',
    sourceUrl: doc.sourceUrl || '',
    competitorUrl: doc.competitorUrl || '',
    productName: doc.productName || 'Producto sin nombre',
    category: doc.category || 'General',
    market: doc.market || 'LATAM / Argentina',
    country: doc.country || 'AR',
    currency: doc.currency || 'ARS',
    salePrice,
    cost,
    shippingCost,
    estimatedMargin,
    targetMargin: Number(doc.targetMargin) || 35,
    status: PRODUCT_STATUSES.includes(doc.status) ? doc.status : 'possible_winner',
    latestAnalysisId: doc.latestAnalysisId?.toString() || null,
    productScore: typeof doc.productScore === 'number' ? doc.productScore : 0,
    confidenceScore: typeof doc.confidenceScore === 'number' ? doc.confidenceScore : 0,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
