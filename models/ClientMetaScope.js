import { ObjectId } from 'mongodb';

export const CLIENT_META_SCOPE_STATUSES = ['active', 'archived', 'paused'];

/**
 * Validates Client Meta Scope document with temporal assignment.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateClientMetaScope(data) {
  const errors = [];

  if (!data.clientId || !ObjectId.isValid(data.clientId)) {
    errors.push('El ID de empresa (clientId) es obligatorio y debe ser un ObjectId válido.');
  }

  if (!data.adAccountId || typeof data.adAccountId !== 'string' || !data.adAccountId.startsWith('act_')) {
    errors.push("El identificador de la cuenta publicitaria (adAccountId) es obligatorio y debe comenzar con 'act_'.");
  }

  if (data.allowedDatasetIds && !Array.isArray(data.allowedDatasetIds)) {
    errors.push('allowedDatasetIds debe ser un array de identificadores de datasets/píxeles.');
  }

  if (data.manuallyAssignedCampaignIds && !Array.isArray(data.manuallyAssignedCampaignIds)) {
    errors.push('manuallyAssignedCampaignIds debe ser un array de identificadores de campañas.');
  }

  if (!data.effectiveFrom || !(data.effectiveFrom instanceof Date || !isNaN(Date.parse(data.effectiveFrom)))) {
    errors.push('La fecha de vigencia inicial (effectiveFrom) es obligatoria.');
  }

  if (data.effectiveTo && !(data.effectiveTo instanceof Date || !isNaN(Date.parse(data.effectiveTo)))) {
    errors.push('La fecha de vigencia final (effectiveTo) debe ser una fecha válida.');
  }

  if (!data.assignedByUserId || !ObjectId.isValid(data.assignedByUserId)) {
    errors.push('El ID del usuario que realizó la asignación (assignedByUserId) es obligatorio.');
  }

  if (!data.assignmentReason || typeof data.assignmentReason !== 'string' || data.assignmentReason.trim().length === 0) {
    errors.push('El motivo de asignación o reasignación (assignmentReason) es obligatorio para fines de auditoría.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes Client Meta Scope document for API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeClientMetaScope(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    adAccountId: doc.adAccountId,
    allowedDatasetIds: doc.allowedDatasetIds || [],
    manuallyAssignedCampaignIds: doc.manuallyAssignedCampaignIds || [],
    isExclusiveAccount: Boolean(doc.isExclusiveAccount),
    status: doc.status || 'active',
    effectiveFrom: doc.effectiveFrom,
    effectiveTo: doc.effectiveTo || null,
    assignedByUserId: doc.assignedByUserId?.toString() || null,
    assignmentReason: doc.assignmentReason || 'Asignación comercial inicial.',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
