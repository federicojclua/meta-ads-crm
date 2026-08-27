export const OFFER_TYPES = ['direct_discount', 'value_bundle', 'risk_free_financing'];

/**
 * Sanitizes an OfferArchitecture document.
 */
export function sanitizeOfferArchitecture(doc = {}) {
  const offers = Array.isArray(doc.offers)
    ? doc.offers.map((offer, idx) => ({
        id: offer.id || `offer_${idx + 1}`,
        name: offer.name || `Oferta ${String.fromCharCode(65 + idx)}`,
        type: OFFER_TYPES.includes(offer.type) ? offer.type : 'value_bundle',
        headline: offer.headline || 'Oferta Exclusiva',
        coreProduct: offer.coreProduct || '',
        valueAddons: Array.isArray(offer.valueAddons) ? offer.valueAddons : [],
        urgencyScarcity: offer.urgencyScarcity || 'Solo por tiempo limitado',
        riskReversal: offer.riskReversal || 'Garantía Oficial 1 Año',
        paymentTerms: offer.paymentTerms || '12 cuotas fijas',
        projectedPrice: Number(offer.projectedPrice) || 0,
        projectedTrueProfit: Number(offer.projectedTrueProfit) || 0,
        projectedMarginPct: Number(offer.projectedMarginPct) || 0,
        aiStrategyNotes: offer.aiStrategyNotes || '',
        isRecommended: Boolean(offer.isRecommended),
      }))
    : [];

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    productId: doc.productId?.toString() || '',
    productName: doc.productName || '',
    offers,
    activeOfferId: doc.activeOfferId || (offers[0]?.id || null),
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
