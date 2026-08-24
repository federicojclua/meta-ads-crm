import { ObjectId } from 'mongodb';

export const CAMPAIGN_STATUSES = ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'];

/**
 * Validates Meta Campaign document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateMetaCampaign(data) {
  const errors = [];

  if (!data.campaignId || typeof data.campaignId !== 'string') {
    errors.push('El identificador de la campaña de Meta (campaignId) es obligatorio.');
  }

  if (!data.adAccountId || typeof data.adAccountId !== 'string') {
    errors.push('El identificador de la cuenta publicitaria (adAccountId) es obligatorio.');
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('El nombre de la campaña es obligatorio.');
  }

  if (data.assignedClientId && !ObjectId.isValid(data.assignedClientId)) {
    errors.push('El ID de empresa asignada (assignedClientId) debe ser un ObjectId válido.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes Meta Campaign document for API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeMetaCampaignResponse(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    campaignId: doc.campaignId,
    adAccountId: doc.adAccountId,
    name: doc.name,
    objective: doc.objective || 'OUTCOME_TRAFFIC',
    status: doc.status || 'PAUSED',
    effectiveStatus: doc.effectiveStatus || doc.status || 'PAUSED',
    assignedClientId: doc.assignedClientId?.toString() || null,
    hasMultipleTenants: Boolean(doc.hasMultipleTenants),
    dailyBudgetMinor: doc.dailyBudgetMinor || null,
    lifetimeBudgetMinor: doc.lifetimeBudgetMinor || null,
    updatedAt: doc.updatedAt,
  };
}
