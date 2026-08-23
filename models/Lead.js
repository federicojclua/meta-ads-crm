export const LEAD_STAGES = ['new', 'contacted', 'qualified', 'won', 'lost'];
export const LEAD_SOURCES = ['manual', 'csv'];
export const LEAD_STATUSES = ['active', 'archived'];

/**
 * Normalizes email address to lowercase and trimmed string.
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

/**
 * Normalizes phone number: trims whitespace and strips non-digit characters except leading plus (+).
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  const leadingPlus = trimmed.startsWith('+') ? '+' : '';
  const digitsOnly = trimmed.replace(/\D/g, '');
  return leadingPlus + digitsOnly;
}

/**
 * Validates a lead payload before insertion or update.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateLeadDocument(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio para asociar el prospecto a una empresa.');
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre del prospecto es obligatorio.');
  }

  const hasEmail = Boolean(data.email && typeof data.email === 'string' && data.email.trim().length > 0);
  const hasPhone = Boolean(data.phone && typeof data.phone === 'string' && data.phone.trim().length > 0);

  if (!hasEmail && !hasPhone) {
    errors.push('Debe proporcionar al menos un correo electrónico o un número de teléfono de contacto.');
  }

  if (hasEmail && !data.email.includes('@')) {
    errors.push('El correo electrónico proporcionado no tiene un formato válido.');
  }

  if (data.stage && !LEAD_STAGES.includes(data.stage)) {
    errors.push(`Etapa inválida. Debe ser una de: ${LEAD_STAGES.join(', ')}`);
  }

  if (data.stage === 'lost') {
    if (!data.lostReason || typeof data.lostReason !== 'string' || data.lostReason.trim().length === 0) {
      errors.push('El motivo de pérdida (lostReason) es obligatorio cuando el prospecto se pasa a la etapa Perdido.');
    }
  }

  if (data.lostReason && typeof data.lostReason === 'string' && data.lostReason.length > 500) {
    errors.push('El motivo de pérdida no puede superar los 500 caracteres.');
  }

  if (data.notes && typeof data.notes === 'string' && data.notes.length > 2000) {
    errors.push('Las notas del prospecto no pueden superar los 2000 caracteres.');
  }

  if (data.source && !LEAD_SOURCES.includes(data.source)) {
    errors.push(`Origen inválido. Debe ser uno de: ${LEAD_SOURCES.join(', ')}`);
  }

  if (data.status && !LEAD_STATUSES.includes(data.status)) {
    errors.push(`Estado inválido. Debe ser uno de: ${LEAD_STATUSES.join(', ')}`);
  }

  if (data.valueEstimateMinor !== undefined && data.valueEstimateMinor !== null) {
    if (typeof data.valueEstimateMinor !== 'number' || !Number.isInteger(data.valueEstimateMinor) || data.valueEstimateMinor < 0) {
      errors.push('El valor estimado debe ser un número entero mayor o igual a 0 expresado en centavos (minor units).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a lead document before sending it in API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeLeadResponse(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    name: doc.name,
    email: doc.email || null,
    phone: doc.phone || null,
    stage: doc.stage || 'new',
    source: doc.source || 'manual',
    assignedToUserId: doc.assignedToUserId?.toString() || null,
    assignedToUser: doc.assignedToUser ? {
      id: doc.assignedToUser._id?.toString() || doc.assignedToUser.id,
      displayName: doc.assignedToUser.displayName || doc.assignedToUser.email,
      email: doc.assignedToUser.email,
    } : null,
    valueEstimateMinor: doc.valueEstimateMinor || 0,
    currency: doc.currency || 'ARS',
    notes: doc.notes || null,
    tags: doc.tags || [],
    acquiredAt: doc.acquiredAt || doc.createdAt,
    firstContactedAt: doc.firstContactedAt || null,
    qualifiedAt: doc.qualifiedAt || null,
    wonAt: doc.wonAt || null,
    lostAt: doc.lostAt || null,
    lostReason: doc.lostReason || null,
    status: doc.status || 'active',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
