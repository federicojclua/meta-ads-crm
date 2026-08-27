/**
 * Copilot Schema Validator & Abstention Policy
 */

const FORBIDDEN_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s+prompt/i,
  /act\s+as\s+an\s+unrestricted/i,
  /reveal\s+(your\s+)?(keys|passwords|secrets|tokens)/i,
  /drop\s+database/i,
  /bypass\s+permissions/i,
  /exfiltrate/i,
];

/**
 * Sanitizes user input and redacts potential PII or prompt injection payloads.
 */
export function sanitizeCopilotQuery(rawQuery) {
  if (!rawQuery || typeof rawQuery !== 'string') return '';
  let sanitized = rawQuery.trim().slice(0, 1000); // 1000 max length limit

  // Redact potential emails or secret tokens
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[REDACTED_EMAIL]');
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_KEY]');

  return sanitized;
}

/**
 * Checks if a query is an adversarial prompt injection attack.
 */
export function isAdversarialAttack(query) {
  if (!query) return false;
  return FORBIDDEN_INJECTION_PATTERNS.some((pattern) => pattern.test(query));
}

/**
 * Validates and normalizes the Copilot response schema.
 */
export function validateCopilotResponse(response) {
  if (!response || typeof response !== 'object') {
    return {
      isValid: false,
      sanitized: createAbstentionResponse('Respuesta no estructurada o vacía.', 'general'),
    };
  }

  const sanitized = {
    shortAnswer: typeof response.shortAnswer === 'string' ? response.shortAnswer.trim() : 'Sin respuesta disponible.',
    period: typeof response.period === 'string' ? response.period : 'Últimos 30 días',
    tenantName: typeof response.tenantName === 'string' ? response.tenantName : 'Empresa',
    currency: typeof response.currency === 'string' ? response.currency : 'USD',
    attributionLevel: typeof response.attributionLevel === 'string' ? response.attributionLevel : 'last_touch',
    numericalEvidence: Array.isArray(response.numericalEvidence)
      ? response.numericalEvidence.map((e) => ({
          label: String(e.label || ''),
          value: String(e.value || ''),
        }))
      : [],
    internalSources: Array.isArray(response.internalSources)
      ? response.internalSources.map((s) => String(s))
      : ['internal_tools'],
    limitations: typeof response.limitations === 'string' ? response.limitations : 'Datos autorizados de CRM.',
    confidence: ['high', 'medium', 'low', 'abstain'].includes(response.confidence) ? response.confidence : 'medium',
    suggestedActions: Array.isArray(response.suggestedActions)
      ? response.suggestedActions.map((a) => String(a))
      : [],
    dashboardLink: typeof response.dashboardLink === 'string' ? response.dashboardLink : '/app',
    timestamp: response.timestamp || new Date().toISOString(),
    provider: response.provider || 'deterministic_engine',
  };

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Generates an explicit Abstention response conforming to the strict safety policy.
 */
export function createAbstentionResponse(reason, query = '') {
  return {
    shortAnswer: `No es posible determinar la respuesta con los datos disponibles. ${reason}`,
    period: 'Sin período específico',
    tenantName: 'N/A',
    currency: 'USD',
    attributionLevel: 'none',
    numericalEvidence: [],
    internalSources: ['abstention_policy'],
    limitations: 'Se abstuvo de responder para evitar alucinaciones o interpretaciones no fundamentadas.',
    confidence: 'abstain',
    suggestedActions: [
      'Verificar que existan registros cargados en el período seleccionado.',
      'Comprobar la vinculación de fuentes en Meta Ads o Google Intelligence.',
    ],
    dashboardLink: '/app',
    timestamp: new Date().toISOString(),
    provider: 'safety_abstention_guard',
  };
}
