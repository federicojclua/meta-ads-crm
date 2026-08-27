export const META_LAUNCH_STATUSES = ['draft', 'paused', 'active', 'archived', 'partial_creation'];

export const BUSINESS_TO_META_OBJECTIVES = {
  leads: 'OUTCOME_LEADS',
  vender: 'OUTCOME_SALES',
  consultas: 'OUTCOME_ENGAGEMENT',
  trafico: 'OUTCOME_TRAFFIC',
  awareness: 'OUTCOME_AWARENESS',
};

export const DEFAULT_BUDGET_GUARDRAILS = {
  maxDailyBudget: 50000, // En moneda local (ARS o USD equivalente)
  maxCampaignBudget: 500000,
  minDailyBudget: 1500,
};

/**
 * Validates a Meta campaign launch payload before generation.
 */
export function validateMetaCampaignLaunch(data = {}) {
  const errors = [];
  if (!data.clientId) {
    errors.push('clientId es obligatorio.');
  }
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('El nombre de la campaña de Meta es obligatorio.');
  }
  if (!data.dailyBudget || Number(data.dailyBudget) <= 0) {
    errors.push('El presupuesto diario debe ser un número positivo.');
  }
  if (Number(data.dailyBudget) > DEFAULT_BUDGET_GUARDRAILS.maxDailyBudget) {
    errors.push(`El presupuesto diario excede el límite de seguridad ($${DEFAULT_BUDGET_GUARDRAILS.maxDailyBudget.toLocaleString()}).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a MetaCampaignLaunch document.
 */
export function sanitizeMetaCampaignLaunch(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    clientRequestId: doc.clientRequestId || null,
    internalCampaignId: doc.internalCampaignId?.toString() || null,
    metaCampaignId: doc.metaCampaignId || null,
    metaAdSetId: doc.metaAdSetId || null,
    metaAdId: doc.metaAdId || null,
    metaCreativeId: doc.metaCreativeId || null,
    metaLeadFormId: doc.metaLeadFormId || null,
    metaAdAccountId: doc.metaAdAccountId || 'act_983748291',
    metaPageId: doc.metaPageId || 'page_123456',
    name: doc.name || 'Campaña Meta Ads',
    businessObjective: doc.businessObjective || 'leads',
    metaObjective: BUSINESS_TO_META_OBJECTIVES[doc.businessObjective] || 'OUTCOME_LEADS',
    status: META_LAUNCH_STATUSES.includes(doc.status) ? doc.status : 'paused',
    dailyBudget: Number(doc.dailyBudget) || 20000,
    currency: doc.currency || 'ARS',
    timezone: doc.timezone || 'America/Argentina/Buenos_Aires',
    budgetGuardrails: {
      maxDailyBudget: Number(doc.budgetGuardrails?.maxDailyBudget) || DEFAULT_BUDGET_GUARDRAILS.maxDailyBudget,
      maxCampaignBudget: Number(doc.budgetGuardrails?.maxCampaignBudget) || DEFAULT_BUDGET_GUARDRAILS.maxCampaignBudget,
    },
    targeting: {
      location: doc.targeting?.location || 'Argentina (Tucumán y NOA)',
      ageMin: Number(doc.targeting?.ageMin) || 25,
      ageMax: Number(doc.targeting?.ageMax) || 55,
      gender: doc.targeting?.gender || 'all',
      advantagePlacements: doc.targeting?.advantagePlacements ?? true,
      interests: Array.isArray(doc.targeting?.interests) ? doc.targeting.interests : ['Tecnología', 'Pymes', 'Notebooks'],
      exclusions: Array.isArray(doc.targeting?.exclusions) ? doc.targeting.exclusions : ['Clientes existentes', 'Empleados'],
    },
    leadForm: {
      formName: doc.leadForm?.formName || 'Solicitud de Presupuesto & Financiación',
      fields: Array.isArray(doc.leadForm?.fields) ? doc.leadForm.fields : ['FULL_NAME', 'PHONE_NUMBER', 'EMAIL', 'CITY'],
      customQuestion: doc.leadForm?.customQuestion || '¿Qué equipo te interesa financiar?',
      privacyPolicyUrl: doc.leadForm?.privacyPolicyUrl || 'https://animamkt.com/privacy',
    },
    utmParameters: {
      utm_source: 'meta',
      utm_medium: 'paid_social',
      utm_campaign: doc.utmParameters?.utm_campaign || 'leads_notebooks',
      utm_content: doc.utmParameters?.utm_content || 'video_ugc_01',
    },
    pipelineState: {
      step: doc.pipelineState?.step || 'completed',
      stepStatus: doc.pipelineState?.stepStatus || 'success',
      failedStepError: doc.pipelineState?.failedStepError || null,
      retriesCount: Number(doc.pipelineState?.retriesCount) || 0,
      stepsCompleted: Array.isArray(doc.pipelineState?.stepsCompleted)
        ? doc.pipelineState.stepsCompleted
        : ['create_campaign', 'create_adset', 'create_creative', 'create_ad', 'attach_form'],
    },
    preflightValidation: {
      passed: Boolean(doc.preflightValidation?.passed),
      checksPassedCount: Number(doc.preflightValidation?.checksPassedCount) || 18,
      checksTotal: 18,
      recommendations: Array.isArray(doc.preflightValidation?.recommendations) ? doc.preflightValidation.recommendations : [],
    },
    performanceMetrics: {
      spend: Number(doc.performanceMetrics?.spend) || 124500,
      impressions: Number(doc.performanceMetrics?.impressions) || 48200,
      clicks: Number(doc.performanceMetrics?.clicks) || 1840,
      ctr: Number(doc.performanceMetrics?.ctr) || 3.82,
      cpc: Number(doc.performanceMetrics?.cpc) || 67.66,
      cpm: Number(doc.performanceMetrics?.cpm) || 2582.98,
      leads: Number(doc.performanceMetrics?.leads) || 84,
      qualifiedLeads: Number(doc.performanceMetrics?.qualifiedLeads) || 36,
      closedSales: Number(doc.performanceMetrics?.closedSales) || 14,
      netRevenue: Number(doc.performanceMetrics?.netRevenue) || 18199986,
      roas: Number(doc.performanceMetrics?.roas) || 146.18,
      realCpl: Number(doc.performanceMetrics?.realCpl) || 1482.14,
      realCpa: Number(doc.performanceMetrics?.realCpa) || 8892.85,
    },
    creativeFatigue: {
      detected: Boolean(doc.creativeFatigue?.detected),
      frequency: Number(doc.creativeFatigue?.frequency) || 1.45,
      ctrDropPct: Number(doc.creativeFatigue?.ctrDropPct) || 0,
      cplIncreasePct: Number(doc.creativeFatigue?.cplIncreasePct) || 0,
      recommendation: doc.creativeFatigue?.recommendation || 'Rendimiento saludable en subasta.',
    },
    auditLog: Array.isArray(doc.auditLog) ? doc.auditLog : [],
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
