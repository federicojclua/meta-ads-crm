export const SALE_STATUSES = ['pending', 'partial', 'collected', 'cancelled'];
export const SUPPORTED_CURRENCIES = ['ARS', 'USD'];

/**
 * Automatically derives the sale status based on collected amount vs total amount.
 * @param {number} amountMinor
 * @param {number} collectedAmountMinor
 * @param {boolean} isCancelled
 * @returns {string}
 */
export function deriveSaleStatus(amountMinor, collectedAmountMinor, isCancelled = false) {
  if (isCancelled) return 'cancelled';
  if (collectedAmountMinor >= amountMinor && amountMinor > 0) return 'collected';
  if (collectedAmountMinor > 0 && collectedAmountMinor < amountMinor) return 'partial';
  return 'pending';
}

/**
 * Validates a sale payload before insertion or update.
 * @param {Object} data
 * @param {Object} [clientContext] Optional client document to validate currency restrictions
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateSaleDocument(data, clientContext = null) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.leadId) {
    errors.push('El campo leadId es obligatorio.');
  }

  if (!Number.isInteger(data.amountMinor) || data.amountMinor <= 0) {
    errors.push('El importe total de la venta (amountMinor) debe ser un entero positivo expresado en centavos.');
  }

  if (!data.currency || !SUPPORTED_CURRENCIES.includes(data.currency)) {
    errors.push(`Divisa no soportada. Debe ser una de: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  if (clientContext && clientContext.enabledCurrencies) {
    if (!clientContext.enabledCurrencies.includes(data.currency)) {
      errors.push(`La divisa ${data.currency} no está habilitada para esta empresa.`);
    }
  }

  if (data.collectedAmountMinor !== undefined && data.collectedAmountMinor !== null) {
    if (!Number.isInteger(data.collectedAmountMinor) || data.collectedAmountMinor < 0) {
      errors.push('El importe cobrado (collectedAmountMinor) debe ser un entero no negativo expresado en centavos.');
    } else if (data.collectedAmountMinor > data.amountMinor) {
      errors.push('El importe cobrado no puede ser superior al importe total de la venta.');
    }
  }

  if (data.status && !SALE_STATUSES.includes(data.status)) {
    errors.push(`Estado de venta inválido. Debe ser uno de: ${SALE_STATUSES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a sale document before sending it in API responses.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeSaleResponse(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    leadId: doc.leadId?.toString() || doc.leadId,
    amountMinor: doc.amountMinor || 0,
    amountFormatted: ((doc.amountMinor || 0) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
    currency: doc.currency || 'ARS',
    collectedAmountMinor: doc.collectedAmountMinor || 0,
    collectedAmountFormatted: ((doc.collectedAmountMinor || 0) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
    collectedAmountDefaultMinor: doc.collectedAmountDefaultMinor || doc.collectedAmountMinor || 0,
    status: doc.status || 'pending',
    payments: Array.isArray(doc.payments)
      ? doc.payments.map((p) => {
          const amtMinor = p.amountMinor ?? p.paymentAmountMinor ?? 0;
          const defMinor = p.amountDefaultMinor ?? p.convertedAmountDefaultMinor ?? amtMinor;
          const colBy = p.collectedBy?.toString() || p.collectedByUserId?.toString() || null;
          return {
            id: p._id?.toString() || p.id,
            amountMinor: amtMinor,
            amountFormatted: (amtMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
            amountDefaultMinor: defMinor,
            amountDefaultFormatted: (defMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
            exchangeRateToDefault: p.exchangeRateToDefault || 1,
            collectedAt: p.collectedAt || p.createdAt,
            collectedBy: colBy,
            notes: p.notes || null,
          };
        })
      : [],
    soldAt: doc.soldAt || doc.createdAt,
    collectedAt: doc.collectedAt || null,
    cancelledAt: doc.cancelledAt || null,
    notes: doc.notes || null,
    createdByUserId: doc.createdByUserId?.toString() || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
