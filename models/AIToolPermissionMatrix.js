export const AI_AGENT_ROLES = [
  'qualifier',
  'setter',
  'followup',
  'reactivation',
  'copilot',
  'director',
];

export const AI_TOOLS = [
  'create_lead',
  'classify_lead',
  'generate_reply',
  'send_whatsapp',
  'schedule_appointment',
  'apply_discount',
  'create_meta_campaign_draft',
  'activate_meta_campaign',
  'change_budget',
  'delete_campaign',
];

export const DEFAULT_TOOL_PERMISSIONS = {
  qualifier: {
    create_lead: { isAllowed: true, requiresApproval: 'never' },
    classify_lead: { isAllowed: true, requiresApproval: 'never' },
    generate_reply: { isAllowed: true, requiresApproval: 'never' },
    send_whatsapp: { isAllowed: true, requiresApproval: 'conditional', maxConfidenceThreshold: 0.85 },
    schedule_appointment: { isAllowed: false, requiresApproval: 'always' },
    apply_discount: { isAllowed: false, requiresApproval: 'always' },
    create_meta_campaign_draft: { isAllowed: false, requiresApproval: 'always' },
    activate_meta_campaign: { isAllowed: false, requiresApproval: 'always' },
    change_budget: { isAllowed: false, requiresApproval: 'always' },
    delete_campaign: { isAllowed: false, requiresApproval: 'always' },
  },
  setter: {
    create_lead: { isAllowed: true, requiresApproval: 'never' },
    classify_lead: { isAllowed: true, requiresApproval: 'never' },
    generate_reply: { isAllowed: true, requiresApproval: 'never' },
    send_whatsapp: { isAllowed: true, requiresApproval: 'never' },
    schedule_appointment: { isAllowed: true, requiresApproval: 'never' },
    apply_discount: { isAllowed: true, requiresApproval: 'conditional', maxDiscountPct: 15 },
    create_meta_campaign_draft: { isAllowed: false, requiresApproval: 'always' },
    activate_meta_campaign: { isAllowed: false, requiresApproval: 'always' },
    change_budget: { isAllowed: false, requiresApproval: 'always' },
    delete_campaign: { isAllowed: false, requiresApproval: 'always' },
  },
  followup: {
    create_lead: { isAllowed: false, requiresApproval: 'always' },
    classify_lead: { isAllowed: true, requiresApproval: 'never' },
    generate_reply: { isAllowed: true, requiresApproval: 'never' },
    send_whatsapp: { isAllowed: true, requiresApproval: 'conditional', maxConfidenceThreshold: 0.80 },
    schedule_appointment: { isAllowed: false, requiresApproval: 'always' },
    apply_discount: { isAllowed: false, requiresApproval: 'always' },
    create_meta_campaign_draft: { isAllowed: false, requiresApproval: 'always' },
    activate_meta_campaign: { isAllowed: false, requiresApproval: 'always' },
    change_budget: { isAllowed: false, requiresApproval: 'always' },
    delete_campaign: { isAllowed: false, requiresApproval: 'always' },
  },
  reactivation: {
    create_lead: { isAllowed: false, requiresApproval: 'always' },
    classify_lead: { isAllowed: true, requiresApproval: 'never' },
    generate_reply: { isAllowed: true, requiresApproval: 'never' },
    send_whatsapp: { isAllowed: true, requiresApproval: 'conditional', maxConfidenceThreshold: 0.80 },
    schedule_appointment: { isAllowed: false, requiresApproval: 'always' },
    apply_discount: { isAllowed: true, requiresApproval: 'conditional', maxDiscountPct: 20 },
    create_meta_campaign_draft: { isAllowed: false, requiresApproval: 'always' },
    activate_meta_campaign: { isAllowed: false, requiresApproval: 'always' },
    change_budget: { isAllowed: false, requiresApproval: 'always' },
    delete_campaign: { isAllowed: false, requiresApproval: 'always' },
  },
  copilot: {
    create_lead: { isAllowed: true, requiresApproval: 'never' },
    classify_lead: { isAllowed: true, requiresApproval: 'never' },
    generate_reply: { isAllowed: true, requiresApproval: 'never' },
    send_whatsapp: { isAllowed: false, requiresApproval: 'always' },
    schedule_appointment: { isAllowed: false, requiresApproval: 'always' },
    apply_discount: { isAllowed: false, requiresApproval: 'always' },
    create_meta_campaign_draft: { isAllowed: true, requiresApproval: 'never' },
    activate_meta_campaign: { isAllowed: false, requiresApproval: 'always' },
    change_budget: { isAllowed: true, requiresApproval: 'conditional', maxDailyBudget: 50000 },
    delete_campaign: { isAllowed: false, requiresApproval: 'always' },
  },
  director: {
    create_lead: { isAllowed: false, requiresApproval: 'always' },
    classify_lead: { isAllowed: false, requiresApproval: 'always' },
    generate_reply: { isAllowed: true, requiresApproval: 'never' },
    send_whatsapp: { isAllowed: false, requiresApproval: 'always' },
    schedule_appointment: { isAllowed: false, requiresApproval: 'always' },
    apply_discount: { isAllowed: false, requiresApproval: 'always' },
    create_meta_campaign_draft: { isAllowed: true, requiresApproval: 'never' },
    activate_meta_campaign: { isAllowed: false, requiresApproval: 'always' },
    change_budget: { isAllowed: false, requiresApproval: 'always' },
    delete_campaign: { isAllowed: false, requiresApproval: 'always' },
  },
};

/**
 * Checks if an AI tool execution is allowed and if it requires human approval.
 */
export function checkToolExecutionPermission({
  agentRole = 'qualifier',
  toolName = 'send_whatsapp',
  inputData = {},
  matrix = DEFAULT_TOOL_PERMISSIONS,
} = {}) {
  const roleRules = matrix[agentRole] || DEFAULT_TOOL_PERMISSIONS[agentRole] || {};
  const toolRule = roleRules[toolName];

  if (!toolRule || !toolRule.isAllowed) {
    return {
      allowed: false,
      requiresApproval: false,
      reason: `La herramienta '${toolName}' no está autorizada para el agente '${agentRole}'.`,
    };
  }

  // 1. Unconditional Approval Rule
  if (toolRule.requiresApproval === 'always') {
    return {
      allowed: true,
      requiresApproval: true,
      reason: `La herramienta '${toolName}' requiere confirmación humana obligatoria antes de ejecutarse.`,
    };
  }

  // 2. Conditional Approval Rules
  if (toolRule.requiresApproval === 'conditional') {
    if (toolName === 'apply_discount') {
      const discountPct = Number(inputData.discountPct) || 0;
      const maxAllowed = toolRule.maxDiscountPct || 15;
      if (discountPct > maxAllowed) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Descuento del ${discountPct}% excede el límite autónomo del ${maxAllowed}%. Requiere aprobación.`,
        };
      }
    }

    if (toolName === 'change_budget') {
      const budget = Number(inputData.dailyBudget) || 0;
      const maxBudget = toolRule.maxDailyBudget || 50000;
      if (budget > maxBudget) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Presupuesto diario de $${budget.toLocaleString()} excede el límite autónomo de $${maxBudget.toLocaleString()}. Requiere aprobación.`,
        };
      }
    }

    if (toolName === 'send_whatsapp' && inputData.confidenceScore !== undefined) {
      const threshold = toolRule.maxConfidenceThreshold || 0.85;
      if (Number(inputData.confidenceScore) < threshold) {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `Score de confianza (${inputData.confidenceScore}) inferior al umbral autónomo (${threshold}). Requiere revisión humana.`,
        };
      }
    }
  }

  return {
    allowed: true,
    requiresApproval: false,
    reason: 'Acción autorizada para ejecución autónoma inmediata.',
  };
}

/**
 * Sanitizes an AIToolPermissionMatrix document.
 */
export function sanitizeAIToolPermissionMatrix(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    permissions: doc.permissions || DEFAULT_TOOL_PERMISSIONS,
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
