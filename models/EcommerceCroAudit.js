export const CRO_DIMENSIONS = [
  { key: 'offer_clarity', label: '1. Claridad de la Oferta (Offer Clarity)' },
  { key: 'value_proposition', label: '2. Propuesta de Valor (Value Proposition)' },
  { key: 'trust_badges', label: '3. Elementos de Confianza (Trust & Security)' },
  { key: 'shipping_policy', label: '4. Claridad en Envíos & Plazos (Shipping)' },
  { key: 'price_value_ratio', label: '5. Relación Precio / Valor Percibido (Price/Value)' },
  { key: 'social_proof', label: '6. Prueba Social & Reseñas Verificadas (Social Proof)' },
  { key: 'objections_faq', label: '7. Tratamiento de Objeciones & FAQ (Objections)' },
  { key: 'cta_effectiveness', label: '8. Visibilidad y Fuerza del CTA (CTA)' },
  { key: 'mobile_ux', label: '9. Experiencia Móvil & Velocidad (Mobile UX)' },
  { key: 'checkout_friction', label: '10. Fricción en el Checkout (Checkout Friction)' },
];

export const CRO_PRIORITIES = ['P0', 'P1', 'P2', 'P3'];

/**
 * Sanitizes an EcommerceCroAudit document.
 */
export function sanitizeEcommerceCroAudit(doc = {}) {
  const subscores = doc.subscores || {};
  const facts = doc.factsVsInferences || {};

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    url: doc.url || '',
    targetAudience: doc.targetAudience || '',
    campaignObjective: doc.campaignObjective || 'Conversions / Sales',
    croScore: typeof doc.croScore === 'number' ? doc.croScore : 72,
    subscores: {
      offer: Number(subscores.offer) || 75,
      trust: Number(subscores.trust) || 68,
      ux: Number(subscores.ux) || 70,
      mobile: Number(subscores.mobile) || 65,
      proof: Number(subscores.proof) || 80,
      shipping: Number(subscores.shipping) || 60,
      checkout: Number(subscores.checkout) || 55,
      cta: Number(subscores.cta) || 78,
    },
    executiveSummary: doc.executiveSummary || 'Auditoría CRO integral de la landing page con enfoque en reducción de fricción.',
    dimensions: Array.isArray(doc.dimensions) ? doc.dimensions : [],
    quickWins: Array.isArray(doc.quickWins) ? doc.quickWins : [],
    topProblems: Array.isArray(doc.topProblems) ? doc.topProblems : [],
    topOpportunities: Array.isArray(doc.topOpportunities) ? doc.topOpportunities : [],
    highImpactChanges: Array.isArray(doc.highImpactChanges) ? doc.highImpactChanges : [],
    recommendedExperiments: Array.isArray(doc.recommendedExperiments) ? doc.recommendedExperiments : [],
    potentialImpact: doc.potentialImpact || 'Alto potencial de incremento de tasa de conversión tras mitigar fricción en checkout móvil.',
    factsVsInferences: {
      observed: Array.isArray(facts.observed) ? facts.observed : [],
      inferred: Array.isArray(facts.inferred) ? facts.inferred : [],
      recommended: Array.isArray(facts.recommended) ? facts.recommended : [],
      unknown: Array.isArray(facts.unknown) ? facts.unknown : [],
    },
    pdfReportData: doc.pdfReportData || null,
    createdAt: doc.createdAt || new Date().toISOString(),
  };
}
