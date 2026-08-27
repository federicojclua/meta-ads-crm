export const MODEL_TIERS = {
  'veo-3.1-lite': { name: 'Veo 3.1 Lite (Alto Volumen / Testing)', creditsPerSec: 1, costPerSecUsd: 0.015 },
  'veo-3.1-fast': { name: 'Veo 3.1 Fast (Iteración Rápida)', creditsPerSec: 2, costPerSecUsd: 0.03 },
  'veo-3.1-pro': { name: 'Veo 3.1 Pro (Hero 4K / Audio Nativo)', creditsPerSec: 5, costPerSecUsd: 0.075 },
};

/**
 * Calculates credit estimate for a given set of scenes.
 */
export function estimateProjectCredits(scenes = [], modelTier = 'veo-3.1-lite') {
  const tier = MODEL_TIERS[modelTier] || MODEL_TIERS['veo-3.1-lite'];
  const totalSec = scenes.reduce((acc, s) => acc + (Number(s.durationSec) || 5), 0);
  const creditsEstimated = Math.ceil(totalSec * tier.creditsPerSec);
  const estimatedCostUsd = Number((totalSec * tier.costPerSecUsd).toFixed(2));

  return {
    totalDurationSec: totalSec,
    creditsEstimated,
    estimatedCostUsd,
    modelTier,
    tierName: tier.name,
  };
}

/**
 * Sanitizes an AIUsage document.
 */
export function sanitizeAIUsage(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    billingPeriod: doc.billingPeriod || new Date().toISOString().slice(0, 7),
    creditsAllocated: Number(doc.creditsAllocated) || 2000,
    creditsConsumed: Number(doc.creditsConsumed) || 45,
    generationsCount: {
      images: Number(doc.generationsCount?.images) || 12,
      videos: Number(doc.generationsCount?.videos) || 4,
      voices: Number(doc.generationsCount?.voices) || 8,
      avatars: Number(doc.generationsCount?.avatars) || 3,
    },
    totalCostEstimatedUsd: Number(doc.totalCostEstimatedUsd) || 3.40,
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
