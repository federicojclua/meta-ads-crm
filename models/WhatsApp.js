export const CHANNELS = ['whatsapp', 'instagram', 'facebook'];
export const WA_LINE_STATUSES = ['active', 'disconnected', 'pending_verification'];
export const WA_CHAT_STATUSES = ['active', 'archived'];
export const WA_MESSAGE_DIRECTIONS = ['inbound', 'outbound'];
export const WA_MESSAGE_TYPES = ['text', 'image', 'document', 'template', 'audio', 'video'];
export const WA_MESSAGE_STATUSES = ['sent', 'delivered', 'read', 'failed'];

/**
 * Normalizes phone number: strips non-digit characters and ensures leading plus (+).
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digitsOnly = phone.trim().replace(/\D/g, '');
  if (!digitsOnly) return '';
  return `+${digitsOnly}`;
}

/**
 * Validates a WhatsApp/Omnichannel Line document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateWaLine(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio para vincular la línea.');
  }

  if (!data.phoneNumberId || typeof data.phoneNumberId !== 'string' || data.phoneNumberId.trim().length === 0) {
    errors.push('El ID del canal / Phone Number ID de Meta Cloud API es obligatorio.');
  }

  if (!data.displayPhoneNumber || typeof data.displayPhoneNumber !== 'string' || data.displayPhoneNumber.trim().length === 0) {
    errors.push('El número o identificador visible es obligatorio.');
  }

  if (data.status && !WA_LINE_STATUSES.includes(data.status)) {
    errors.push(`Estado de línea inválido. Debe ser uno de: ${WA_LINE_STATUSES.join(', ')}`);
  }

  if (data.channel && !CHANNELS.includes(data.channel)) {
    errors.push(`Canal inválido. Debe ser uno de: ${CHANNELS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a WhatsApp Line document for API output.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeWaLine(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    phoneNumberId: doc.phoneNumberId,
    wabaId: doc.wabaId || null,
    displayPhoneNumber: doc.displayPhoneNumber,
    name: doc.name || doc.displayPhoneNumber,
    channel: doc.channel || 'whatsapp',
    status: doc.status || 'active',
    qualityRating: doc.qualityRating || 'GREEN',
    isDefault: Boolean(doc.isDefault),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Validates a Chat thread.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateWaChat(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.contactPhone || typeof data.contactPhone !== 'string' || data.contactPhone.trim().length === 0) {
    errors.push('El teléfono o identificador del contacto es obligatorio.');
  }

  if (data.status && !WA_CHAT_STATUSES.includes(data.status)) {
    errors.push(`Estado del chat inválido. Debe ser uno de: ${WA_CHAT_STATUSES.join(', ')}`);
  }

  if (data.channel && !CHANNELS.includes(data.channel)) {
    errors.push(`Canal del chat inválido. Debe ser uno de: ${CHANNELS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a Chat document for API output.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeWaChat(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    lineId: doc.lineId?.toString() || doc.lineId,
    lineDisplayNumber: doc.lineDisplayNumber || null,
    channel: doc.channel || 'whatsapp',
    contactPhone: doc.contactPhone,
    contactName: doc.contactName || doc.contactPhone,
    unreadCount: Number(doc.unreadCount) || 0,
    isBotMuted: Boolean(doc.isBotMuted),
    botLastIntervenedAt: doc.botLastIntervenedAt || null,
    lastMessage: doc.lastMessage ? {
      text: doc.lastMessage.text || '',
      type: doc.lastMessage.type || 'text',
      direction: doc.lastMessage.direction || 'inbound',
      status: doc.lastMessage.status || 'received',
      timestamp: doc.lastMessage.timestamp || doc.lastMessageAt || doc.updatedAt,
    } : null,
    lastMessageAt: doc.lastMessageAt || doc.updatedAt || doc.createdAt,
    leadId: doc.leadId?.toString() || null,
    lead: doc.lead ? {
      id: doc.lead._id?.toString() || doc.lead.id,
      name: doc.lead.name,
      stage: doc.lead.stage || 'new',
      email: doc.lead.email || null,
      phone: doc.lead.phone || null,
      valueEstimateMinor: doc.lead.valueEstimateMinor || 0,
      currency: doc.lead.currency || 'ARS',
      notes: doc.lead.notes || '',
      tags: doc.lead.tags || [],
    } : null,
    assignedToUserId: doc.assignedToUserId?.toString() || null,
    assignedToUser: doc.assignedToUser ? {
      id: doc.assignedToUser._id?.toString() || doc.assignedToUser.id,
      displayName: doc.assignedToUser.displayName || doc.assignedToUser.email,
      email: doc.assignedToUser.email,
    } : null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    status: doc.status || 'active',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Validates a Message.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateWaMessage(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.chatId) {
    errors.push('El campo chatId es obligatorio.');
  }

  if (!data.direction || !WA_MESSAGE_DIRECTIONS.includes(data.direction)) {
    errors.push(`Dirección del mensaje inválida (${data.direction}). Debe ser inbound o outbound.`);
  }

  if (data.type && !WA_MESSAGE_TYPES.includes(data.type)) {
    errors.push(`Tipo de mensaje inválido. Debe ser uno de: ${WA_MESSAGE_TYPES.join(', ')}`);
  }

  if (!data.text && !data.mediaUrl && !data.templateName) {
    errors.push('El mensaje debe contener texto, una URL multimedia o un nombre de plantilla.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a Message document for API output.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeWaMessage(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    chatId: doc.chatId?.toString() || doc.chatId,
    wamid: doc.wamid || null,
    channel: doc.channel || 'whatsapp',
    direction: doc.direction || 'inbound',
    type: doc.type || 'text',
    text: doc.text || '',
    mediaUrl: doc.mediaUrl || null,
    status: doc.status || 'sent',
    timestamp: doc.timestamp || doc.createdAt,
    senderName: doc.senderName || null,
    createdAt: doc.createdAt,
  };
}
