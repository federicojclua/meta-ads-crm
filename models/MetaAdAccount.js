import { ObjectId } from 'mongodb';

export const META_ACCOUNT_STATUSES = {
  1: 'ACTIVE',
  2: 'DISABLED',
  3: 'UNSETTLED',
  7: 'PENDING_RISK_REVIEW',
  8: 'PENDING_SETTLEMENT',
  9: 'IN_GRACE_PERIOD',
  100: 'PENDING_CLOSURE',
  101: 'CLOSED',
  201: 'ANY_ACTIVE',
  202: 'ANY_CLOSED',
};

/**
 * Validates Meta Ad Account document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateMetaAdAccount(data) {
  const errors = [];

  if (!data.adAccountId || typeof data.adAccountId !== 'string' || !data.adAccountId.startsWith('act_')) {
    errors.push("El identificador de la cuenta publicitaria (adAccountId) es obligatorio y debe comenzar con 'act_'.");
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre de la cuenta publicitaria es obligatorio.');
  }

  if (!data.currency || typeof data.currency !== 'string') {
    errors.push('La moneda de la cuenta publicitaria es obligatoria (ej: ARS, USD).');
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
 * Sanitizes Meta Ad Account document for API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeMetaAdAccountResponse(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    adAccountId: doc.adAccountId,
    name: doc.name,
    currency: doc.currency || 'ARS',
    timezoneName: doc.timezoneName || 'America/Argentina/Buenos_Aires',
    accountStatus: doc.accountStatus || 1,
    statusLabel: META_ACCOUNT_STATUSES[doc.accountStatus] || 'UNKNOWN',
    assignedClientId: doc.assignedClientId?.toString() || null,
    isShared: Boolean(doc.isShared),
    discoveredAt: doc.discoveredAt || doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
