export const PATTERN_TYPES = ['WINNING', 'LOSING', 'FATIGUE_WARNING'];

export const MIN_STATISTICAL_SPEND = 5000;
export const MIN_STATISTICAL_IMPRESSIONS = 1000;

/**
 * Sanitizes a PatternMemory document for output.
 */
export function sanitizePatternMemory(doc = {}) {
  const metrics = doc.metrics || {};
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    patternType: PATTERN_TYPES.includes(doc.patternType) ? doc.patternType : 'WINNING',
    featureCombination: {
      hookType: doc.featureCombination?.hookType || 'direct_offer',
      format: doc.featureCombination?.format || '9:16',
      offerType: doc.featureCombination?.offerType || 'value_bundle',
      presenterType: doc.featureCombination?.presenterType || 'static_product',
      assetType: doc.featureCombination?.assetType || 'video',
    },
    metrics: {
      avgRoas: Number(metrics.avgRoas) || 0,
      avgCpl: Number(metrics.avgCpl) || 0,
      avgTrueProfit: Number(metrics.avgTrueProfit) || 0,
      avgCtr: Number(metrics.avgCtr) || 0,
      conversionRate: Number(metrics.conversionRate) || 0,
      sampleSize: Number(metrics.sampleSize) || 0,
      totalSpend: Number(metrics.totalSpend) || 0,
      salesClosed: Number(metrics.salesClosed) || 0,
      liftVsAveragePct: Number(metrics.liftVsAveragePct) || 0,
    },
    statisticalConfidence: Number(doc.statisticalConfidence) || 0.9,
    headline: doc.headline || 'Patrón de Rendimiento Identificado',
    diagnosis: doc.diagnosis || 'Patrón detectado basado en datos históricos de Meta Ads y ventas del CRM.',
    prescriptiveAction: doc.prescriptiveAction || 'Replicar esta combinación en la próxima campaña.',
    appliedCount: Number(doc.appliedCount) || 0,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
