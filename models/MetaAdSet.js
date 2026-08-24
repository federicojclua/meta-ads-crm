import { ObjectId } from 'mongodb';

/**
 * Validates Meta AdSet document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateMetaAdSet(data) {
  const errors = [];

  if (!data.adsetId || typeof data.adsetId !== 'string') {
    errors.push('El identificador del conjunto de anuncios de Meta (adsetId) es obligatorio.');
  }

  if (!data.campaignId || typeof data.campaignId !== 'string') {
    errors.push('El identificador de la campaña (campaignId) es obligatorio.');
  }

  if (!data.adAccountId || typeof data.adAccountId !== 'string') {
    errors.push('El identificador de la cuenta publicitaria (adAccountId) es obligatorio.');
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('El nombre del conjunto de anuncios es obligatorio.');
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
 * Sanitizes Meta AdSet document for API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeMetaAdSetResponse(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    adsetId: doc.adsetId,
    campaignId: doc.campaignId,
    adAccountId: doc.adAccountId,
    name: doc.name,
    status: doc.status || 'PAUSED',
    promotedObject: doc.promotedObject || { pixelId: null, customEventType: null },
    assignedDatasetId: doc.assignedDatasetId || doc.promotedObject?.pixelId || null,
    assignedClientId: doc.assignedClientId?.toString() || null,
    dailyBudgetMinor: doc.dailyBudgetMinor || null,
    lifetimeBudgetMinor: doc.lifetimeBudgetMinor || null,
    updatedAt: doc.updatedAt,
  };
}
