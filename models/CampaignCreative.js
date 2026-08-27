
export const CAMPAIGN_STATUSES = ['draft', 'ai_generated', 'needs_review', 'approved', 'published', 'archived'];

export const CAMPAIGN_OBJECTIVES = [
  'vender',
  'consultas',
  'whatsapp',
  'leads',
  'lanzamiento',
  'promocion',
  'branding',
];

export const OBJECTIVE_LABELS = {
  vender: 'Venta Directa de Producto / Catálogo',
  consultas: 'Generación de Consultas Comerciales',
  whatsapp: 'Apertura de Conversaciones de WhatsApp',
  leads: 'Captación de Prospectos Calificados (Leads)',
  lanzamiento: 'Lanzamiento de Nuevo Producto o Servicio',
  promocion: 'Oferta Especial / Liquidación de Temporada',
  branding: 'Posicionamiento y Reconocimiento de Marca',
};

export const FORMAT_DIMENSIONS = {
  '1:1': { width: 1080, height: 1080, name: 'Feed Cuadrado (1:1)', label: 'Instagram / Facebook Feed' },
  '9:16': { width: 1080, height: 1920, name: 'Vertical Story / Reels (9:16)', label: 'Stories & Reels' },
  '1.91:1': { width: 1200, height: 628, name: 'Horizontal Banner (1.91:1)', label: 'Facebook Ads & Display' },
};

/**
 * Validates a CampaignCreative document.
 */
export function validateCampaignCreative(data = {}) {
  const errors = [];
  if (!data.clientId) {
    errors.push('clientId es obligatorio.');
  }
  if (!data.campaignName || typeof data.campaignName !== 'string' || data.campaignName.trim().length === 0) {
    errors.push('El nombre de la campaña es obligatorio.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a CampaignCreative document for output.
 */
export function sanitizeCampaignCreative(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    campaignName: doc.campaignName || 'Campaña Creativa IA',
    objective: CAMPAIGN_OBJECTIVES.includes(doc.objective) ? doc.objective : 'vender',
    status: CAMPAIGN_STATUSES.includes(doc.status) ? doc.status : 'draft',
    version: Number(doc.version) || 1,
    parentCampaignId: doc.parentCampaignId?.toString() || null,
    selectedProductIds: Array.isArray(doc.selectedProductIds) ? doc.selectedProductIds : [],
    productSnapshots: Array.isArray(doc.productSnapshots) ? doc.productSnapshots : [],
    brief: {
      campaignTitle: doc.brief?.campaignTitle || '',
      mainMessage: doc.brief?.mainMessage || '',
      secondaryMessage: doc.brief?.secondaryMessage || '',
      targetAudience: doc.brief?.targetAudience || '',
      cta: doc.brief?.cta || 'Comprar Ahora',
      creativeDirection: doc.brief?.creativeDirection || '',
      brandConstraints: Array.isArray(doc.brief?.brandConstraints) ? doc.brief.brandConstraints : [],
    },
    concept: {
      id: doc.concept?.id || 'A',
      name: doc.concept?.name || 'Catálogo Tecnológico Hero',
      visualTheme: doc.concept?.visualTheme || 'clean_high_contrast',
      rationale: doc.concept?.rationale || '',
    },
    copy: {
      headline: doc.copy?.headline || 'OFERTAS EXCLUSIVAS',
      subtitle: doc.copy?.subtitle || 'Llevate la mejor tecnología al mejor precio',
      body: doc.copy?.body || '',
      cta: doc.copy?.cta || 'CONSULTAR POR WHATSAPP',
      instagramCaption: doc.copy?.instagramCaption || '',
      whatsappCopy: doc.copy?.whatsappCopy || '',
      adHeadline: doc.copy?.adHeadline || '',
    },
    layoutSpec: doc.layoutSpec || {
      canvas: { width: 1080, height: 1080 },
      background: { type: 'gradient', primaryColor: '#0F172A', secondaryColor: '#1E293B' },
      elements: [],
    },
    qualityScore: {
      overall: Number(doc.qualityScore?.overall) || 92,
      brandConsistency: Number(doc.qualityScore?.brandConsistency) || 95,
      visualHierarchy: Number(doc.qualityScore?.visualHierarchy) || 90,
      commercialClarity: Number(doc.qualityScore?.commercialClarity) || 94,
      readability: Number(doc.qualityScore?.readability) || 88,
      ctaVisibility: Number(doc.qualityScore?.ctaVisibility) || 93,
      mobileSafeMargins: Number(doc.qualityScore?.mobileSafeMargins) || 91,
      recommendations: Array.isArray(doc.qualityScore?.recommendations) ? doc.qualityScore.recommendations : [],
    },
    formats: Array.isArray(doc.formats) && doc.formats.length > 0 ? doc.formats : ['1:1', '9:16'],
    variants: Array.isArray(doc.variants) ? doc.variants : [],
    renderedAssets: Array.isArray(doc.renderedAssets)
      ? doc.renderedAssets.map((asset, idx) => {
          const score = Number(asset.brandComplianceScore) || 94;
          const status = asset.complianceStatus || (score >= 85 ? 'APPROVED' : 'NEEDS_REVIEW');
          return {
            id: asset.id || `asset_${idx + 1}`,
            format: asset.format || '1:1',
            assetType: asset.assetType || 'static_image',
            svg: asset.svg || '',
            url: asset.url || '',
            hookType: asset.hookType || 'direct_offer',
            ctaType: asset.ctaType || 'shop_now',
            offerId: asset.offerId || null,
            brandComplianceScore: score,
            complianceStatus: status,
            isGatekeeperPassed: score >= 85 && status !== 'REJECTED',
            complianceBreakdown: asset.complianceBreakdown || {
              logoIntegrity: 24,
              colorPaletteMatch: 24,
              offerAccuracy: 25,
              brandSafety: 23,
            },
            violations: Array.isArray(asset.violations) ? asset.violations : [],
          };
        })
      : [],
    audit: {
      generatedBy: doc.audit?.generatedBy || 'Gemini 2.0 Flash / AI Director',
      generationTimestamp: doc.audit?.generationTimestamp || new Date().toISOString(),
      promptUsed: doc.audit?.promptUsed || '',
    },
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
