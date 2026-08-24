import { ObjectId } from 'mongodb';

export const DATA_SOURCE_TYPES = ['dataset', 'pixel'];
export const DATA_SOURCE_STATUSES = ['active', 'conflict', 'unassigned', 'archived'];

/**
 * Validates Meta Data Source document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateMetaDataSource(data) {
  const errors = [];

  if (!data.metaDatasetId || typeof data.metaDatasetId !== 'string' || data.metaDatasetId.trim().length === 0) {
    errors.push('El identificador del Dataset o Píxel (metaDatasetId) es obligatorio.');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre de la fuente de datos es obligatorio.');
  }

  if (data.type && !DATA_SOURCE_TYPES.includes(data.type)) {
    errors.push(`Tipo de fuente de datos inválido. Debe ser uno de: ${DATA_SOURCE_TYPES.join(', ')}.`);
  }

  if (data.status && !DATA_SOURCE_STATUSES.includes(data.status)) {
    errors.push(`Estado inválido. Debe ser uno de: ${DATA_SOURCE_STATUSES.join(', ')}.`);
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
 * Sanitizes Meta Data Source document for API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeMetaDataSourceResponse(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString() || doc.id,
    metaDatasetId: doc.metaDatasetId,
    legacyPixelId: doc.legacyPixelId || null,
    name: doc.name,
    type: doc.type || 'dataset',
    assignedClientId: doc.assignedClientId?.toString() || null,
    connectedAdAccountIds: doc.connectedAdAccountIds || [],
    status: doc.status || 'unassigned',
    lastValidatedAt: doc.lastValidatedAt || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
