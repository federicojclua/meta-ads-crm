/**
 * Anima MKT CRM — Client Model Schema & Validation
 */

export const CLIENT_STATUSES = ['active', 'inactive'];
export const SUPPORTED_CURRENCIES = ['ARS', 'USD'];

/**
 * Generates a URL-safe slug from a business name
 * @param {string} name
 * @returns {string}
 */
export function generateSlug(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // remove leading/trailing hyphens
    .substring(0, 60);
}

export function validateClientDocument(client) {
  const errors = [];

  if (!client.name || typeof client.name !== 'string' || client.name.trim().length === 0) {
    errors.push('El nombre comercial de la empresa es obligatorio.');
  }

  if (!client.slug || typeof client.slug !== 'string' || client.slug.trim().length === 0) {
    errors.push('El slug es obligatorio.');
  }

  if (client.status && !CLIENT_STATUSES.includes(client.status)) {
    errors.push(`Estado inválido. Debe ser uno de: ${CLIENT_STATUSES.join(', ')}`);
  }

  if (client.defaultCurrency && !SUPPORTED_CURRENCIES.includes(client.defaultCurrency)) {
    errors.push(`Divisa por defecto inválida. Debe ser una de: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  if (client.enabledCurrencies) {
    if (!Array.isArray(client.enabledCurrencies) || client.enabledCurrencies.length === 0) {
      errors.push('enabledCurrencies debe ser un array con al menos una divisa válida.');
    } else {
      const invalid = client.enabledCurrencies.filter((c) => !SUPPORTED_CURRENCIES.includes(c));
      if (invalid.length > 0) {
        errors.push(`Divisas no soportadas: ${invalid.join(', ')}`);
      }
    }
  }

  // Security check: ensure meta accounts do not contain secrets or access tokens
  if (client.metaAdAccountIds) {
    if (!Array.isArray(client.metaAdAccountIds)) {
      errors.push('metaAdAccountIds debe ser un array de identificadores.');
    } else {
      for (const accountId of client.metaAdAccountIds) {
        if (typeof accountId !== 'string' || accountId.length > 50 || accountId.includes('EAAB') || accountId.includes('EAA')) {
          errors.push('Identificador de cuenta Meta inválido o contiene tokens no autorizados.');
          break;
        }
      }
    }
  }

  if (client.metaBusinessId && (typeof client.metaBusinessId !== 'string' || client.metaBusinessId.includes('EAAB'))) {
    errors.push('metaBusinessId inválido o contiene tokens no autorizados.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeClientResponse(client) {
  if (!client) return null;
  return {
    _id: client._id ? client._id.toString() : undefined,
    name: client.name,
    normalizedName: client.normalizedName,
    slug: client.slug,
    status: client.status || 'active',
    legalName: client.legalName || null,
    country: client.country || 'AR',
    timezone: client.timezone || 'America/Argentina/Tucuman',
    defaultCurrency: client.defaultCurrency || 'ARS',
    enabledCurrencies: client.enabledCurrencies || ['ARS', 'USD'],
    metaBusinessId: client.metaBusinessId || null,
    metaAdAccountIds: client.metaAdAccountIds || [],
    createdBy: client.createdBy ? client.createdBy.toString() : null,
    updatedBy: client.updatedBy ? client.updatedBy.toString() : null,
    createdAt: client.createdAt ? new Date(client.createdAt).toISOString() : null,
    updatedAt: client.updatedAt ? new Date(client.updatedAt).toISOString() : null,
    deactivatedAt: client.deactivatedAt ? new Date(client.deactivatedAt).toISOString() : null,
  };
}
