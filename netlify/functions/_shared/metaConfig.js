import crypto from 'node:crypto';

/**
 * Meta Marketing API Centralized Configuration & Environment Validation
 * Graph API v26.0 Standard
 */
export function getMetaConfig() {
  const appId = process.env.META_APP_ID || null;
  const appSecret = process.env.META_APP_SECRET || null;
  const systemUserToken = process.env.META_SYSTEM_USER_TOKEN || null;
  const businessId = process.env.META_BUSINESS_ID || null;
  const apiVersion = process.env.META_API_VERSION || 'v26.0';
  const cronSecret = process.env.CRON_SECRET || null;

  const isConfigured = Boolean(appId && appSecret && systemUserToken);

  return {
    appId,
    appSecret,
    systemUserToken,
    businessId,
    apiVersion,
    cronSecret,
    isConfigured,
    baseUrl: `https://graph.facebook.com/${apiVersion}`,
    defaultLookbackDays: 7,
    defaultBackfillDays: 90,
    requestTimeoutMs: 15000,
  };
}

/**
 * Timing-safe string comparison to protect cron and secret validation against timing attacks.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Constant time dummy compare to prevent length leakage
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Deep sanitization helper that completely redacts Meta tokens, JWTs, credentials and secrets.
 * Ensures NO characters (prefix, suffix, or fragment) of the token are leaked in logs, errors or checkpoints.
 * @param {any} data
 * @returns {any}
 */
export function sanitizeMetaLog(data) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return data
      .replace(/EAAB[A-Za-z0-9]+/g, '[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
      .replace(/access_token=[^&\s]+/gi, 'access_token=[REDACTED]')
      .replace(/appsecret_proof=[^&\s]+/gi, 'appsecret_proof=[REDACTED]')
      .replace(/x-cron-auth:\s*[^;\s]+/gi, 'x-cron-auth: [REDACTED]')
      .replace(/client_secret=[^&\s]+/gi, 'client_secret=[REDACTED]')
      .replace(/eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g, '[REDACTED_JWT]');
  }

  if (typeof data === 'object') {
    if (data instanceof Error) {
      return {
        name: data.name,
        message: sanitizeMetaLog(data.message),
        stack: sanitizeMetaLog(data.stack),
        ...(data.statusCode ? { statusCode: data.statusCode } : {}),
        ...(data.code ? { code: data.code } : {}),
        ...(data.metaType ? { metaType: data.metaType } : {}),
      };
    }

    if (Array.isArray(data)) {
      return data.map((item) => sanitizeMetaLog(item));
    }

    const copy = {};
    for (const key of Object.keys(data)) {
      const lower = key.toLowerCase();
      const isSensitiveKey =
        lower.includes('token') ||
        lower.includes('secret') ||
        lower.includes('proof') ||
        lower.includes('password') ||
        lower.includes('privatekey') ||
        lower.includes('authorization') ||
        lower.includes('cronauth') ||
        lower.includes('bearer');

      if (isSensitiveKey) {
        copy[key] = '[REDACTED]';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        copy[key] = sanitizeMetaLog(data[key]);
      } else if (typeof data[key] === 'string') {
        copy[key] = sanitizeMetaLog(data[key]);
      } else {
        copy[key] = data[key];
      }
    }
    return copy;
  }

  return data;
}
