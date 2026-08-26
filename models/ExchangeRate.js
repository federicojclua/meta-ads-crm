
export const RATE_TYPES = ['official', 'commercial', 'custom'];
export const SUPPORTED_CURRENCIES = ['ARS', 'USD'];

/**
 * Validates an ExchangeRate document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateExchangeRate(data) {
  const errors = [];

  if (!data.baseCurrency || !SUPPORTED_CURRENCIES.includes(data.baseCurrency)) {
    errors.push(`Moneda base no soportada. Debe ser una de: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  if (!data.quoteCurrency || !SUPPORTED_CURRENCIES.includes(data.quoteCurrency)) {
    errors.push(`Moneda de cotización no soportada. Debe ser una de: ${SUPPORTED_CURRENCIES.join(', ')}`);
  }

  if (data.baseCurrency === data.quoteCurrency) {
    errors.push('La moneda base y la moneda de cotización no pueden ser la misma.');
  }

  // Pinned to USD -> ARS for this CRM MVP
  if (data.baseCurrency !== 'USD' || data.quoteCurrency !== 'ARS') {
    errors.push('El sistema actualmente solo admite USD como moneda base y ARS como moneda de cotización.');
  }

  if (typeof data.quotePerBase !== 'number' || data.quotePerBase <= 0) {
    errors.push('La tasa de cambio (quotePerBase) debe ser un número positivo mayor a 0.');
  }

  if (data.rateType && !RATE_TYPES.includes(data.rateType)) {
    errors.push(`Tipo de tasa inválido. Debe ser uno de: ${RATE_TYPES.join(', ')}`);
  }

  if (!data.validFrom) {
    errors.push('La fecha de inicio de validez (validFrom) es obligatoria.');
  } else {
    const fromDate = new Date(data.validFrom);
    if (isNaN(fromDate.getTime())) {
      errors.push('La fecha de inicio de validez (validFrom) tiene un formato inválido.');
    }
  }

  if (data.validTo) {
    const fromDate = new Date(data.validFrom);
    const toDate = new Date(data.validTo);
    if (isNaN(toDate.getTime())) {
      errors.push('La fecha de fin de validez (validTo) tiene un formato inválido.');
    } else if (toDate <= fromDate) {
      errors.push('La fecha de fin de validez (validTo) debe ser posterior a la fecha de inicio (validFrom).');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Finds the historical exchange rate applicable to a specific date.
 * @param {Array<Object>} rates List of exchange rate documents
 * @param {Date|string} date The date of the event
 * @param {string} base [default='USD']
 * @param {string} quote [default='ARS']
 * @returns {Object|null}
 */
export function findRateForDate(rates, date, base = 'USD', quote = 'ARS') {
  if (!rates || !Array.isArray(rates) || rates.length === 0) return null;
  const targetTime = new Date(date).getTime();

  for (const rate of rates) {
    if (rate.baseCurrency !== base || rate.quoteCurrency !== quote) continue;

    const fromTime = new Date(rate.validFrom).getTime();
    const toTime = rate.validTo ? new Date(rate.validTo).getTime() : null;

    if (targetTime >= fromTime && (toTime === null || targetTime <= toTime)) {
      return rate;
    }
  }

  return null;
}

/**
 * Converts minor currency units (cents) historically using a list of rates.
 * @param {number} amountMinor Amount in cents (integer)
 * @param {string} fromCurrency Currency of the amount ('ARS' or 'USD')
 * @param {string} toCurrency Target currency ('ARS' or 'USD')
 * @param {Date|string} date The date of the transaction/insight
 * @param {Array<Object>} rates List of active exchange rates
 * @returns {number|null} Converted amount in cents (rounded integer), or null if rate is missing
 */
export function convertCurrencyHistorically(amountMinor, fromCurrency, toCurrency, date, rates) {
  if (!SUPPORTED_CURRENCIES.includes(fromCurrency) || !SUPPORTED_CURRENCIES.includes(toCurrency)) {
    return null;
  }

  if (fromCurrency === toCurrency) {
    return amountMinor;
  }

  const rateDoc = findRateForDate(rates, date, 'USD', 'ARS');
  if (!rateDoc) {
    return null; // Missing rate for this date
  }

  const rate = rateDoc.quotePerBase;

  if (fromCurrency === 'USD' && toCurrency === 'ARS') {
    // USD -> ARS: multiply by rate
    return Math.round(amountMinor * rate);
  } else if (fromCurrency === 'ARS' && toCurrency === 'USD') {
    // ARS -> USD: divide by rate
    return Math.round(amountMinor / rate);
  }

  return null;
}
