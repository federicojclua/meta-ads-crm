export const EXPERIMENT_STATUSES = ['RUNNING', 'WINNER', 'LOSER', 'INCONCLUSIVE'];
export const PRIMARY_METRICS = ['ROAS', 'CPA', 'CPL', 'CONVERSION_RATE'];

export const MIN_EXPERIMENT_IMPRESSIONS = 1000;
export const SIGNIFICANCE_P_VALUE_THRESHOLD = 0.05; // 95% Confidence

/**
 * Sanitizes a BusinessExperiment document.
 */
export function sanitizeBusinessExperiment(doc = {}) {
  const control = doc.controlAsset || {};
  const variant = doc.variantAsset || {};
  const stats = doc.statisticalSignificance || {};

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    name: doc.name || 'Experimento A/B de Rendimiento',
    hypothesis: doc.hypothesis || 'La nueva variante mejorará la tasa de conversión respecto al control.',
    primaryMetric: PRIMARY_METRICS.includes(doc.primaryMetric) ? doc.primaryMetric : 'ROAS',
    status: EXPERIMENT_STATUSES.includes(doc.status) ? doc.status : 'RUNNING',
    winnerAssetId: doc.winnerAssetId?.toString() || null,
    controlAsset: {
      assetId: control.assetId?.toString() || 'ctrl_01',
      name: control.name || 'Control Base (A)',
      format: control.format || '9:16',
      hookType: control.hookType || 'direct_offer',
      impressions: Number(control.impressions) || 0,
      conversions: Number(control.conversions) || 0,
      spend: Number(control.spend) || 0,
      cpl: Number(control.cpl) || 0,
      roas: Number(control.roas) || 0,
    },
    variantAsset: {
      assetId: variant.assetId?.toString() || 'var_01',
      name: variant.name || 'Variante Optimizada (B)',
      format: variant.format || '9:16',
      hookType: variant.hookType || 'question_problem',
      impressions: Number(variant.impressions) || 0,
      conversions: Number(variant.conversions) || 0,
      spend: Number(variant.spend) || 0,
      cpl: Number(variant.cpl) || 0,
      roas: Number(variant.roas) || 0,
    },
    statisticalSignificance: {
      pValue: typeof stats.pValue === 'number' ? stats.pValue : 0.032,
      confidenceLevel: typeof stats.confidenceLevel === 'number' ? stats.confidenceLevel : 0.968,
      zScore: typeof stats.zScore === 'number' ? stats.zScore : 2.14,
      isSignificant: Boolean(stats.isSignificant),
      relativeLiftPct: Number(stats.relativeLiftPct) || 0,
    },
    sampleSizeReached: Boolean(doc.sampleSizeReached),
    concludedAt: doc.concludedAt || null,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
