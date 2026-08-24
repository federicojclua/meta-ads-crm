import crypto from 'node:crypto';
import { getMetaConfig, sanitizeMetaLog } from './metaConfig.js';

export class MetaApiError extends Error {
  constructor(message, { statusCode, metaCode, metaSubcode, metaType, fbtraceId, details } = {}) {
    super(sanitizeMetaLog(message));
    this.name = 'MetaApiError';
    this.statusCode = statusCode || 500;
    this.metaCode = metaCode || null;
    this.metaSubcode = metaSubcode || null;
    this.metaType = metaType || 'UNKNOWN';
    this.fbtraceId = fbtraceId || null;
    this.details = sanitizeMetaLog(details) || null;
  }
}

/**
 * Calculates HMAC-SHA256 proof for secure Graph API requests.
 * @param {string} token
 * @param {string} appSecret
 * @returns {string|null}
 */
export function generateAppSecretProof(token, appSecret) {
  if (!token || !appSecret) return null;
  return crypto.createHmac('sha256', appSecret).update(token).digest('hex');
}

/**
 * Official Graph API v26.0 Verified Endpoints Allowlist.
 * Prevents execution of unverified or generic guessed edges (e.g. /{business_id}/datasets).
 */
const VERIFIED_EDGE_PATTERNS = [
  /^debug_token$/i,
  /^me$/i,
  /^act_[0-9]+\/(campaigns|adsets|insights|customconversions|assigned_users)$/i,
  /^[0-9]+\/(owned_ad_accounts|client_ad_accounts|owned_pixels)$/i,
  /^[0-9]+$/i, // Direct asset query (e.g. GET /{pixel_id} or GET /{ad_account_id})
];

export function isVerifiedMetaEndpoint(endpoint) {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const pathOnly = clean.split('?')[0];
  return VERIFIED_EDGE_PATTERNS.some((pattern) => pattern.test(pathOnly));
}

/**
 * Parses usage headers returned by Meta Graph API.
 * @param {Headers} headers
 * @returns {Object}
 */
export function parseRateLimitHeaders(headers) {
  let appUsage = null;
  let businessUsage = null;
  let retryAfter = null;

  if (!headers || typeof headers.get !== 'function') {
    return {
      appUsage: null,
      businessUsage: null,
      retryAfter: null,
      maxUtilization: 0,
      isThrottlingRecommended: false,
      isNearLimit: false,
    };
  }

  try {
    const rawAppUsage = headers.get('x-app-usage');
    if (rawAppUsage) {
      appUsage = JSON.parse(rawAppUsage);
    }
  } catch {
    // Ignore JSON parse error
  }

  try {
    const rawBusinessUsage = headers.get('x-business-use-case-usage');
    if (rawBusinessUsage) {
      businessUsage = JSON.parse(rawBusinessUsage);
    }
  } catch {
    // Ignore JSON parse error
  }

  const rawRetryAfter = headers.get('retry-after');
  if (rawRetryAfter) {
    retryAfter = parseInt(rawRetryAfter, 10) || 60;
  }

  // Calculate highest utilization percentage
  let maxUtilization = 0;
  if (appUsage) {
    maxUtilization = Math.max(
      maxUtilization,
      appUsage.call_count || 0,
      appUsage.total_cputime || 0,
      appUsage.total_time || 0
    );
  }
  if (businessUsage && typeof businessUsage === 'object') {
    for (const key of Object.keys(businessUsage)) {
      const items = businessUsage[key];
      if (Array.isArray(items)) {
        for (const item of items) {
          maxUtilization = Math.max(
            maxUtilization,
            item.call_count || 0,
            item.total_cputime || 0,
            item.total_time || 0
          );
        }
      }
    }
  }

  return {
    appUsage,
    businessUsage,
    retryAfter,
    maxUtilization,
    isThrottlingRecommended: maxUtilization >= 75,
    isNearLimit: maxUtilization >= 90,
  };
}

/**
 * Server-side Meta Graph API Client for Node.js 24 LTS.
 * Strictly uses Authorization: Bearer <token> in headers. NEVER places token in URL.
 */
export class MetaApiClient {
  constructor(customConfig = {}) {
    const defaultCfg = getMetaConfig();
    this.config = { ...defaultCfg, ...customConfig };
  }

  /**
   * Executes an authenticated request to Meta Graph API v26.0.
   * @param {string} endpoint - e.g. 'act_123456/insights'
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async request(endpoint, options = {}) {
    if (!this.config.isConfigured) {
      throw new MetaApiError('La integración con Meta Ads no se encuentra configurada en el servidor.', {
        statusCode: 503,
        metaType: 'META_NOT_CONFIGURED',
      });
    }

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // Block unverified guessed endpoints
    if (!isVerifiedMetaEndpoint(cleanEndpoint)) {
      throw new MetaApiError(`El endpoint solicitado no está verificado en Meta Graph API ${this.config.apiVersion}: ${cleanEndpoint}`, {
        statusCode: 400,
        metaType: 'META_ENDPOINT_UNAVAILABLE',
      });
    }

    const {
      method = 'GET',
      params = {},
      body = null,
      timeoutMs = this.config.requestTimeoutMs,
      maxRetries = 2,
    } = options;

    const token = this.config.systemUserToken;
    const proof = generateAppSecretProof(token, this.config.appSecret);

    const url = new URL(`${this.config.baseUrl}/${cleanEndpoint}`);

    // Append appsecret_proof in query parameter for Graph API verification
    if (proof) {
      url.searchParams.set('appsecret_proof', proof);
    }

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object') {
          url.searchParams.set(key, JSON.stringify(value));
        } else {
          url.searchParams.set(key, String(value));
        }
      }
    }

    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const fetchOptions = {
          method,
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'AnimaMktCRM/1.0 (+https://animamkt.com)',
          },
          signal: controller.signal,
        };

        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          fetchOptions.headers['Content-Type'] = 'application/json';
          fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url.toString(), fetchOptions);
        clearTimeout(timeoutId);

        const rateLimits = parseRateLimitHeaders(response.headers);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const metaError = data.error || {};
          const metaCode = metaError.code || response.status;
          const metaSubcode = metaError.error_subcode || null;
          const metaType = metaError.type || 'GRAPH_API_ERROR';
          const fbtraceId = metaError.fbtrace_id || null;
          const rawMessage = metaError.message || `HTTP ${response.status} Error de Meta Graph API`;

          // Handle rate limit errors (codes 17, 32, 613, HTTP 429)
          if (response.status === 429 || metaCode === 17 || metaCode === 32 || metaCode === 613) {
            const delayMs = (rateLimits.retryAfter || Math.pow(2, attempt + 1)) * 1000 + Math.floor(Math.random() * 500);
            if (attempt < maxRetries) {
              console.warn(`[META_RATE_LIMIT] Throttling activo. Reintentando en ${delayMs}ms (intento ${attempt + 1}/${maxRetries})`);
              await new Promise((r) => setTimeout(r, delayMs));
              continue;
            }
          }

          // Handle transient temporary server errors (code 1, 2)
          if ((metaCode === 1 || metaCode === 2) && attempt < maxRetries) {
            const delayMs = (attempt + 1) * 1000 + Math.floor(Math.random() * 300);
            console.warn(`[META_TRANSIENT_ERROR] Fallo temporal de Meta. Reintentando en ${delayMs}ms`);
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }

          // Invalid or expired token (code 190)
          if (metaCode === 190) {
            throw new MetaApiError('El token de Meta Ads ha expirado o fue revocado. Actualice META_SYSTEM_USER_TOKEN.', {
              statusCode: 401,
              metaCode,
              metaSubcode,
              metaType: 'META_AUTH_INVALID',
              fbtraceId,
            });
          }

          // Permission error (code 200)
          if (metaCode === 200) {
            throw new MetaApiError('Permisos insuficientes en Meta Graph API. Requiere permiso ads_read asignado.', {
              statusCode: 403,
              metaCode,
              metaSubcode,
              metaType: 'META_PERMISSION_DENIED',
              fbtraceId,
            });
          }

          throw new MetaApiError(rawMessage, {
            statusCode: response.status,
            metaCode,
            metaSubcode,
            metaType,
            fbtraceId,
            details: metaError,
          });
        }

        return {
          data,
          rateLimits,
        };
      } catch (err) {
        clearTimeout(timeoutId);

        if (err.name === 'AbortError') {
          lastError = new MetaApiError(`Timeout en solicitud a Meta Graph API tras ${timeoutMs}ms`, {
            statusCode: 504,
            metaType: 'META_TIMEOUT',
          });
        } else if (err instanceof MetaApiError) {
          lastError = err;
          // Non-retryable authentication or client errors
          if ([400, 401, 403, 404].includes(err.statusCode)) {
            throw err;
          }
        } else {
          lastError = new MetaApiError(`Error de red al conectar con Meta Graph API: ${err.message}`, {
            statusCode: 502,
            metaType: 'META_NETWORK_ERROR',
          });
        }

        if (attempt === maxRetries) {
          throw lastError;
        }

        const backoffMs = Math.pow(2, attempt + 1) * 1000 + Math.floor(Math.random() * 300);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }

    throw lastError || new MetaApiError('Error desconocido en cliente Meta API.', { statusCode: 500 });
  }

  /**
   * Fetches all pages of a paginated Graph API edge.
   * @param {string} endpoint
   * @param {Object} [options]
   * @returns {Promise<Array>}
   */
  async fetchAllPages(endpoint, options = {}) {
    const { params = {}, maxPages = 10 } = options;
    const allItems = [];
    let currentEndpoint = endpoint;
    let currentParams = { ...params };
    let pageCount = 0;

    while (currentEndpoint && pageCount < maxPages) {
      pageCount++;
      const result = await this.request(currentEndpoint, {
        method: 'GET',
        params: currentParams,
      });

      const items = result.data?.data || [];
      allItems.push(...items);

      // Check for next page cursor in pagination metadata
      const nextCursor = result.data?.paging?.cursors?.after;
      const hasNext = Boolean(result.data?.paging?.next);

      if (hasNext && nextCursor) {
        currentParams = { ...params, after: nextCursor };
      } else {
        break;
      }

      // Check if rate limiting is near threshold
      if (result.rateLimits.isNearLimit) {
        console.warn('[META_RATE_LIMIT] Límite de uso cercano al 90%. Deteniendo paginación.');
        break;
      }
    }

    return allItems;
  }

  /**
   * Verifies connection and credentials with Meta Graph API v26.0 without leaking token details.
   * @returns {Promise<{ configured: boolean, connectionStatus: string, apiVersion: string, lastSuccessfulRequestAt: string|null, permissionsStatus: string }>}
   */
  async checkConnectionStatus() {
    if (!this.config.isConfigured) {
      return {
        configured: false,
        connectionStatus: 'not_configured',
        apiVersion: this.config.apiVersion,
        lastSuccessfulRequestAt: null,
        permissionsStatus: 'unconfigured',
      };
    }

    try {
      const res = await this.request('me', {
        params: { fields: 'id,name' },
        timeoutMs: 8000,
      });

      return {
        configured: true,
        connectionStatus: 'connected',
        apiVersion: this.config.apiVersion,
        lastSuccessfulRequestAt: new Date().toISOString(),
        permissionsStatus: 'ads_read_active',
        systemUserId: res.data?.id || null,
        systemUserName: res.data?.name || null,
      };
    } catch (err) {
      return {
        configured: true,
        connectionStatus: err.metaType === 'META_AUTH_INVALID' ? 'invalid_token' : 'connection_error',
        apiVersion: this.config.apiVersion,
        lastSuccessfulRequestAt: null,
        permissionsStatus: 'error',
      };
    }
  }

  /**
   * Validates a single Pixel/Dataset ID against official Graph API edge GET /{pixel_id}.
   * @param {string} pixelId
   * @returns {Promise<Object>}
   */
  async validatePixelId(pixelId) {
    const cleanId = String(pixelId).trim();
    return this.request(cleanId, {
      params: { fields: 'id,name,is_unavailable,creation_time' },
    });
  }
}
