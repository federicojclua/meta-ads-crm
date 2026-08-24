import { ObjectId } from 'mongodb';

/**
 * Validates a MetaInsightDaily document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateMetaInsightDaily(data) {
  const errors = [];

  if (!data.clientId || !ObjectId.isValid(data.clientId)) {
    errors.push('El identificador de empresa (clientId) es obligatorio y debe ser un ObjectId válido.');
  }

  if (!data.adAccountId || typeof data.adAccountId !== 'string') {
    errors.push('El identificador de cuenta (adAccountId) es obligatorio.');
  }

  if (!data.adsetId || typeof data.adsetId !== 'string') {
    errors.push('El identificador de conjunto de anuncios (adsetId) es obligatorio.');
  }

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('La fecha del insight (date) debe tener formato YYYY-MM-DD.');
  }

  if (typeof data.spendMinor !== 'number' || !Number.isInteger(data.spendMinor) || data.spendMinor < 0) {
    errors.push('La inversión (spendMinor) debe ser un número entero mayor o igual a 0 expresado en centavos.');
  }

  if (!data.currency || typeof data.currency !== 'string') {
    errors.push('La moneda del insight es obligatoria (ej: ARS, USD).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculates protected derived metrics from base insight numbers.
 * @param {Object} insight
 * @returns {Object}
 */
export function calculateDerivedMetrics(insight) {
  const spendMinor = insight.spendMinor || 0;
  const spend = spendMinor / 100;
  const impressions = insight.impressions || 0;
  const clicks = insight.clicks || 0;
  const linkClicks = insight.linkClicks || 0;
  const leadsCrm = insight.leadsCrm || 0;
  const wonSalesCrm = insight.wonSalesCrm || 0;
  const collectedRevenueMinor = insight.collectedRevenueMinor || 0;
  const collectedRevenue = collectedRevenueMinor / 100;

  // Safe CTR
  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : null;

  // Safe CPC
  const cpcMinor = clicks > 0 ? Math.round(spendMinor / clicks) : null;
  const cpc = cpcMinor !== null ? cpcMinor / 100 : null;

  // Safe CPM
  const cpmMinor = impressions > 0 ? Math.round((spendMinor / impressions) * 1000) : null;
  const cpm = cpmMinor !== null ? cpmMinor / 100 : null;

  // Safe CPL (Cost per CRM Lead)
  const cplMinor = leadsCrm > 0 ? Math.round(spendMinor / leadsCrm) : null;
  const cpl = cplMinor !== null ? cplMinor / 100 : null;

  // Safe CPA (Cost per Won Sale)
  const cpaMinor = wonSalesCrm > 0 ? Math.round(spendMinor / wonSalesCrm) : null;
  const cpa = cpaMinor !== null ? cpaMinor / 100 : null;

  // Safe Conversion Rate (Won / Leads)
  const conversionRate = leadsCrm > 0 ? Number(((wonSalesCrm / leadsCrm) * 100).toFixed(2)) : null;

  // Safe ROAS on Collected Revenue
  const roas = spendMinor > 0 && collectedRevenueMinor > 0
    ? Number((collectedRevenueMinor / spendMinor).toFixed(2))
    : null;

  return {
    spendMinor,
    spend,
    impressions,
    clicks,
    linkClicks,
    ctr,
    hasCtr: ctr !== null,
    cpc,
    cpcMinor,
    hasCpc: cpc !== null,
    cpm,
    cpmMinor,
    hasCpm: cpm !== null,
    leadsCrm,
    wonSalesCrm,
    collectedRevenueMinor,
    collectedRevenue,
    cpl,
    cplMinor,
    hasCpl: cpl !== null,
    cpa,
    cpaMinor,
    hasCpa: cpa !== null,
    conversionRate,
    hasConversionData: conversionRate !== null,
    roas,
    hasRoas: roas !== null,
  };
}

/**
 * Sanitizes Meta Insight Daily document for API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeMetaInsightDailyResponse(doc) {
  if (!doc) return null;
  const derived = calculateDerivedMetrics(doc);

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    adAccountId: doc.adAccountId,
    campaignId: doc.campaignId || null,
    campaignName: doc.campaignName || null,
    adsetId: doc.adsetId,
    adsetName: doc.adsetName || null,
    datasetId: doc.datasetId || null,
    date: doc.date,
    currency: doc.currency || 'ARS',
    attributionSettingKey: doc.attributionSettingKey || 'default',
    actionReportTime: doc.actionReportTime || 'conversion',
    reach: doc.reach || 0,
    landingPageViews: doc.landingPageViews || 0,
    actions: doc.actions || [],
    actionValues: doc.actionValues || [],
    costPerActionType: doc.costPerActionType || [],
    primaryResultType: doc.primaryResultType || 'lead',
    primaryResultCount: doc.primaryResultCount || 0,
    ...derived,
    syncedAt: doc.syncedAt || doc.createdAt,
  };
}
