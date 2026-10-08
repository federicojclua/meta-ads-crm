/**
 * Knowledge FAQ & Unanswered Queries Model.
 *
 * Powers the interactive Knowledge Base and the "Lo que no supo" (Unanswered Queries)
 * section for Grupo Novati.
 */

export const FAQ_CATEGORIES = [
  'general',
  'comercial',
  'planes_promos',
  'soporte_tecnico',
  'insumos',
  'cobros_liquidaciones',
];

export const FAQ_CATEGORY_LABELS = {
  general: 'General',
  comercial: 'Comercial & Ventas',
  planes_promos: 'Planes y Promociones',
  soporte_tecnico: 'Soporte Técnico',
  insumos: 'Insumos y Rollos',
  cobros_liquidaciones: 'Cobros y Fiserv',
};

/**
 * Validates a FAQ document payload.
 *
 * @param {Object} data
 * @param {boolean} [isUpdate=false]
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateFaqDocument(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate && !data.clientId) {
    errors.push('El campo clientId es obligatorio para asociar la FAQ.');
  }

  if (!isUpdate && (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0)) {
    errors.push('La pregunta es obligatoria.');
  }

  if (!isUpdate && (!data.answer || typeof data.answer !== 'string' || data.answer.trim().length === 0)) {
    errors.push('La respuesta es obligatoria.');
  }

  if (data.category && !FAQ_CATEGORIES.includes(data.category)) {
    errors.push(`Categoría inválida. Debe ser una de: ${FAQ_CATEGORIES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a FAQ document for API responses.
 *
 * @param {Object} doc
 * @returns {Object|null}
 */
export function sanitizeFaq(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    question: doc.question || '',
    answer: doc.answer || '',
    category: doc.category || 'general',
    categoryLabel: FAQ_CATEGORY_LABELS[doc.category] || 'General',
    keywords: Array.isArray(doc.keywords) ? doc.keywords : [],
    isActive: doc.isActive !== undefined ? Boolean(doc.isActive) : true,
    timesQueried: doc.timesQueried || 0,
    createdAt: doc.createdAt || new Date(),
    updatedAt: doc.updatedAt || doc.createdAt || new Date(),
  };
}

/**
 * Sanitizes an Unanswered Query document for API responses.
 *
 * @param {Object} doc
 * @returns {Object|null}
 */
export function sanitizeUnansweredQuery(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    question: doc.question || '',
    customerPhone: doc.customerPhone || '',
    customerName: doc.customerName || '',
    chatId: doc.chatId?.toString() || doc.chatId || null,
    source: doc.source || 'whatsapp_bot',
    status: doc.status || 'pendiente', // 'pendiente' | 'aprendido' | 'descartado'
    learnedFaqId: doc.learnedFaqId?.toString() || doc.learnedFaqId || null,
    createdAt: doc.createdAt || new Date(),
    learnedAt: doc.learnedAt || null,
  };
}
