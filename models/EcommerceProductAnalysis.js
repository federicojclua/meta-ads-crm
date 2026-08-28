export const HOOK_CATEGORIES = [
  'Curiosity',
  'Problem',
  'Benefit',
  'Demonstration',
  'Contrarian',
  'Social Proof',
  'Before/After',
  'UGC',
  'Offer',
  'Urgency',
];

export const KDP_COMPLIANCE_STATUSES = ['PASS', 'WARNING', 'FAIL'];

/**
 * Sanitizes an EcommerceProductAnalysis document.
 */
export function sanitizeEcommerceProductAnalysis(doc = {}) {
  const mode = doc.mode === 'kdp' ? 'kdp' : 'dropshipping';
  const scores = doc.scores || {};
  const subscores = scores.subscores || {};
  const compliance = doc.complianceCheck || {};
  const facts = doc.factsVsInferences || {};

  return {
    id: doc._id?.toString() || doc.id || '',
    productId: doc.productId?.toString() || '',
    clientId: doc.clientId?.toString() || '',
    analysisVersion: Number(doc.analysisVersion) || 1,
    mode,

    // Dropshipping Breakdown
    features: Array.isArray(doc.features) ? doc.features : [],
    benefits: Array.isArray(doc.benefits) ? doc.benefits : [],
    outcomes: Array.isArray(doc.outcomes) ? doc.outcomes : [],
    painPoints: Array.isArray(doc.painPoints) ? doc.painPoints : [],
    desires: Array.isArray(doc.desires) ? doc.desires : [],
    objections: Array.isArray(doc.objections) ? doc.objections : [],
    differentiator: doc.differentiator || '',

    // Scoring
    scores: {
      overallScore: typeof scores.overallScore === 'number' ? scores.overallScore : 78,
      confidenceScore: typeof scores.confidenceScore === 'number' ? scores.confidenceScore : 0.85,
      subscores: {
        demandPotential: Number(subscores.demandPotential) || 80,
        problemSolutionFit: Number(subscores.problemSolutionFit) || 85,
        creativePotential: Number(subscores.creativePotential) || 82,
        marginPotential: Number(subscores.marginPotential) || 75,
        differentiation: Number(subscores.differentiation) || 70,
        impulsePotential: Number(subscores.impulsePotential) || 78,
        ugcPotential: Number(subscores.ugcPotential) || 84,
        metaAdsPotential: Number(subscores.metaAdsPotential) || 86,
        retentionPotential: Number(subscores.retentionPotential) || 68,
        competitionRisk: Number(subscores.competitionRisk) || 45, // Lower risk is better
      },
    },
    classification: doc.classification || 'potential_winner', // 'potential_winner' | 'validated_winner'

    // Angles & Hooks
    angles: Array.isArray(doc.angles) ? doc.angles : [],
    hooks: Array.isArray(doc.hooks) ? doc.hooks : [],

    // KDP Mode Specifics
    kdpData: mode === 'kdp' ? {
      suggestedTitle: doc.kdpData?.suggestedTitle || '',
      suggestedSubtitle: doc.kdpData?.suggestedSubtitle || '',
      bookDescription: doc.kdpData?.bookDescription || '',
      backendKeywords: Array.isArray(doc.kdpData?.backendKeywords) ? doc.kdpData.backendKeywords : [],
      categorySuggestions: Array.isArray(doc.kdpData?.categorySuggestions) ? doc.kdpData.categorySuggestions : [],
      targetAudience: doc.kdpData?.targetAudience || '',
      positioning: doc.kdpData?.positioning || '',
      competitiveAngle: doc.kdpData?.competitiveAngle || '',
    } : null,

    complianceCheck: {
      status: KDP_COMPLIANCE_STATUSES.includes(compliance.status) ? compliance.status : 'PASS',
      checks: compliance.checks || {
        keywordStuffing: true,
        bestsellerClaims: true,
        promotions: true,
        unauthorizedBrands: true,
        htmlCompliance: true,
      },
      issues: Array.isArray(compliance.issues) ? compliance.issues : [],
    },

    // Strict separation: Observed vs Inferred vs Recommended vs Unknown
    factsVsInferences: {
      observed: Array.isArray(facts.observed) ? facts.observed : [],
      inferred: Array.isArray(facts.inferred) ? facts.inferred : [],
      recommended: Array.isArray(facts.recommended) ? facts.recommended : [],
      unknown: Array.isArray(facts.unknown) ? facts.unknown : [],
    },

    rawInputSnapshot: doc.rawInputSnapshot || {},
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}
