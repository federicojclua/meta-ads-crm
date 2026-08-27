export const DEFAULT_BUSINESS_GOALS = {
  revenueTarget: 20000000, // 20M ARS
  salesTarget: 16, // 16 ventas cerradas
  leadTarget: 100, // 100 leads calificados
  cpaTarget: 9500, // CPA objetivo en ARS
  roasTarget: 120, // 120x
  profitTarget: 5500000, // 5.5M ARS de beneficio neto
};

/**
 * Sanitizes a BusinessGoals document.
 */
export function sanitizeBusinessGoals(doc = {}) {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    period: doc.period || currentPeriod,
    targets: {
      revenueTarget: Number(doc.targets?.revenueTarget) || DEFAULT_BUSINESS_GOALS.revenueTarget,
      salesTarget: Number(doc.targets?.salesTarget) || DEFAULT_BUSINESS_GOALS.salesTarget,
      leadTarget: Number(doc.targets?.leadTarget) || DEFAULT_BUSINESS_GOALS.leadTarget,
      cpaTarget: Number(doc.targets?.cpaTarget) || DEFAULT_BUSINESS_GOALS.cpaTarget,
      roasTarget: Number(doc.targets?.roasTarget) || DEFAULT_BUSINESS_GOALS.roasTarget,
      profitTarget: Number(doc.targets?.profitTarget) || DEFAULT_BUSINESS_GOALS.profitTarget,
    },
    notes: doc.notes || '',
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
