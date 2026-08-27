export const ASSET_TYPES = ['static_image', 'video', 'carousel_card'];
export const ASSET_FORMATS = ['1:1', '9:16', '16:9', '1.91:1', '4:5'];
export const HOOK_TYPES = ['question_problem', 'direct_offer', 'social_proof', 'scarcity', 'pain_point', 'curiosity'];
export const CTA_TYPES = ['shop_now', 'send_whatsapp', 'claim_offer', 'learn_more', 'subscribe'];
export const PRESENTER_TYPES = ['static_product', 'ai_avatar', 'b_roll', 'organic_person', 'motion_graphics'];
export const COMPLIANCE_STATUSES = ['APPROVED', 'NEEDS_REVIEW', 'REJECTED'];

export const BRAND_GUARDIAN_GATEKEEPER_THRESHOLD = 85;

/**
 * Sanitizes a CreativeAsset document.
 */
export function sanitizeCreativeAsset(doc = {}) {
  const brandComplianceScore = Number(doc.brandComplianceScore) || 0;
  const isGatekeeperPassed = brandComplianceScore >= BRAND_GUARDIAN_GATEKEEPER_THRESHOLD && doc.complianceStatus !== 'REJECTED';

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    campaignId: doc.campaignId?.toString() || null,
    assetName: doc.assetName || 'Asset Creativo',
    format: ASSET_FORMATS.includes(doc.format) ? doc.format : '1:1',
    assetType: ASSET_TYPES.includes(doc.assetType) ? doc.assetType : 'static_image',
    hookType: HOOK_TYPES.includes(doc.hookType) ? doc.hookType : 'direct_offer',
    ctaType: CTA_TYPES.includes(doc.ctaType) ? doc.ctaType : 'shop_now',
    offerId: doc.offerId?.toString() || null,
    presenterType: PRESENTER_TYPES.includes(doc.presenterType) ? doc.presenterType : 'static_product',
    url: doc.url || '',
    svg: doc.svg || null,
    brandComplianceScore,
    complianceStatus: COMPLIANCE_STATUSES.includes(doc.complianceStatus)
      ? doc.complianceStatus
      : (brandComplianceScore >= BRAND_GUARDIAN_GATEKEEPER_THRESHOLD ? 'APPROVED' : 'NEEDS_REVIEW'),
    complianceBreakdown: {
      logoIntegrity: Number(doc.complianceBreakdown?.logoIntegrity) || 0,
      colorPaletteMatch: Number(doc.complianceBreakdown?.colorPaletteMatch) || 0,
      offerAccuracy: Number(doc.complianceBreakdown?.offerAccuracy) || 0,
      brandSafety: Number(doc.complianceBreakdown?.brandSafety) || 0,
    },
    violations: Array.isArray(doc.violations) ? doc.violations : [],
    recommendations: Array.isArray(doc.recommendations) ? doc.recommendations : [],
    isGatekeeperPassed,
    performanceMetrics: doc.performanceMetrics || {
      roas: null,
      cpa: null,
      ctr: null,
      spend: null,
      impressions: null,
      conversions: null,
    },
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
