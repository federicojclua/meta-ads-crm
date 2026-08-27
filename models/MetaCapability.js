export const DEFAULT_META_CAPABILITIES = {
  supportedObjectives: ['OUTCOME_LEADS', 'OUTCOME_SALES', 'OUTCOME_ENGAGEMENT', 'OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS'],
  supportedPlacements: ['advantage_plus', 'instagram_feed', 'instagram_reels', 'instagram_stories', 'facebook_feed', 'facebook_reels'],
  supportedLeadDestinations: ['instant_form', 'whatsapp', 'website_conversion'],
  advantagePlusSupported: true,
  dynamicCreativeSupported: true,
  apiVersion: 'v19.0',
};

/**
 * Sanitizes a MetaCapability document.
 */
export function sanitizeMetaCapability(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    adAccountId: doc.adAccountId || 'act_983748291',
    businessManagerId: doc.businessManagerId || 'bm_123456789',
    pageId: doc.pageId || 'page_987654321',
    instagramId: doc.instagramId || 'ig_555444333',
    datasetId: doc.datasetId || 'dataset_111222333',
    capabilities: {
      supportedObjectives: Array.isArray(doc.capabilities?.supportedObjectives)
        ? doc.capabilities.supportedObjectives
        : DEFAULT_META_CAPABILITIES.supportedObjectives,
      supportedPlacements: Array.isArray(doc.capabilities?.supportedPlacements)
        ? doc.capabilities.supportedPlacements
        : DEFAULT_META_CAPABILITIES.supportedPlacements,
      supportedLeadDestinations: Array.isArray(doc.capabilities?.supportedLeadDestinations)
        ? doc.capabilities.supportedLeadDestinations
        : DEFAULT_META_CAPABILITIES.supportedLeadDestinations,
      advantagePlusSupported: doc.capabilities?.advantagePlusSupported ?? true,
      dynamicCreativeSupported: doc.capabilities?.dynamicCreativeSupported ?? true,
      apiVersion: doc.capabilities?.apiVersion || 'v19.0',
    },
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
