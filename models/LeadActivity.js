export const ACTIVITY_TYPES = [
  'stage_change',
  'assignment',
  'note',
  'sale_created',
  'sale_updated',
  'payment_collected',
  'status_change',
  'system',
];

/**
 * Validates an activity document before insertion.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateLeadActivity(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.leadId) {
    errors.push('El campo leadId es obligatorio.');
  }

  if (!data.type || !ACTIVITY_TYPES.includes(data.type)) {
    errors.push(`Tipo de actividad inválido. Debe ser uno de: ${ACTIVITY_TYPES.join(', ')}`);
  }

  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('La descripción de la actividad no puede estar vacía.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes an activity document for API response.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeActivityResponse(doc) {
  if (!doc) return null;

  return {
    id: doc._id ? doc._id.toString() : null,
    clientId: doc.clientId ? doc.clientId.toString() : null,
    leadId: doc.leadId ? doc.leadId.toString() : null,
    type: doc.type,
    description: doc.description || '',
    data: doc.data || {},
    performedBy: doc.performedBy ? doc.performedBy.toString() : null,
    performedByName: doc.performedByName || 'Sistema',
    createdAt: doc.createdAt || null,
  };
}
