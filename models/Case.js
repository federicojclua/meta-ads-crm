/**
 * Case Model — Post-sales, Support, Supplies, Billing & Offboarding Tickets.
 *
 * Designed for Grupo Novati to handle all operational cases after lead acquisition:
 *   - Soporte técnico (terminales Clover, POSBerry, conectividad)
 *   - Insumos y rollos de papel térmico
 *   - Cobros y liquidaciones (Fiserv, acreditaciones, reclamos)
 *   - Bajas y cambios de equipo
 */

export const CASE_TYPES = [
  'soporte_tecnico',
  'insumos_rollos',
  'cobros_liquidaciones',
  'bajas',
  'otro',
];

export const CASE_TYPE_LABELS = {
  soporte_tecnico: 'Soporte técnico',
  insumos_rollos: 'Insumos y rollos',
  cobros_liquidaciones: 'Cobros y liquidaciones',
  bajas: 'Bajas y cambios',
  otro: 'Otro',
};

export const CASE_STATUSES = [
  'abierto',
  'en_curso',
  'esperando_cliente',
  'resuelto',
  'cancelado',
];

export const CASE_STATUS_LABELS = {
  abierto: 'Abierto',
  en_curso: 'En curso',
  esperando_cliente: 'Esperando cliente',
  resuelto: 'Resuelto',
  cancelado: 'Cancelado',
};

export const CASE_PRIORITIES = ['baja', 'media', 'alta', 'urgente'];

export const CASE_PRIORITY_LABELS = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

/**
 * Validates a case document payload.
 *
 * @param {Object} data
 * @param {boolean} [isUpdate=false]
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateCaseDocument(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.clientId) {
    errors.push('El campo clientId es obligatorio para asociar el caso a una empresa.');
  }

  if (!isUpdate && (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0)) {
    errors.push('El título o motivo del caso es obligatorio.');
  }

  if (data.type && !CASE_TYPES.includes(data.type)) {
    errors.push(`Tipo de caso inválido. Debe ser uno de: ${CASE_TYPES.join(', ')}`);
  }

  if (data.status && !CASE_STATUSES.includes(data.status)) {
    errors.push(`Estado de caso inválido. Debe ser uno de: ${CASE_STATUSES.join(', ')}`);
  }

  if (data.priority && !CASE_PRIORITIES.includes(data.priority)) {
    errors.push(`Prioridad inválida. Debe ser una de: ${CASE_PRIORITIES.join(', ')}`);
  }

  if (data.status === 'resuelto') {
    if (!data.resolutionNotes || typeof data.resolutionNotes !== 'string' || data.resolutionNotes.trim().length === 0) {
      errors.push('Para marcar un caso como resuelto se deben documentar las notas de resolución.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a case document for client-facing API responses.
 *
 * @param {Object} doc
 * @returns {Object|null}
 */
export function sanitizeCase(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    caseNumber: doc.caseNumber || 0,
    caseCode: doc.caseCode || (doc.caseNumber ? `#${doc.caseNumber}` : '#0000'),
    clientId: doc.clientId?.toString() || doc.clientId,
    leadId: doc.leadId?.toString() || doc.leadId || null,
    chatId: doc.chatId?.toString() || doc.chatId || null,
    contactName: doc.contactName || '',
    contactPhone: doc.contactPhone || '',
    title: doc.title || '',
    description: doc.description || '',
    type: doc.type || 'soporte_tecnico',
    typeLabel: CASE_TYPE_LABELS[doc.type] || 'Soporte técnico',
    status: doc.status || 'abierto',
    statusLabel: CASE_STATUS_LABELS[doc.status] || 'Abierto',
    priority: doc.priority || 'media',
    priorityLabel: CASE_PRIORITY_LABELS[doc.priority] || 'Media',
    assignedToUserId: doc.assignedToUserId?.toString() || doc.assignedToUserId || null,
    assignedToName: doc.assignedToName || 'Sin asignar',
    resolutionNotes: doc.resolutionNotes || null,
    resolvedAt: doc.resolvedAt || null,
    resolvedBy: doc.resolvedBy || null,
    activities: Array.isArray(doc.activities) ? doc.activities : [],
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || doc.createdAt || new Date(),
  };
}
