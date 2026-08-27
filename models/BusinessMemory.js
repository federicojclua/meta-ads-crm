export const MEMORY_DIMENSIONS = [
  'brandMemory',
  'businessMemory',
  'salesMemory',
  'audienceMemory',
  'creativeMemory',
  'campaignMemory',
  'revenueMemory',
];

export const DEFAULT_BUSINESS_MEMORY = {
  brandMemory: {
    commercialName: 'Cliente Activo',
    positioning: 'Líder en tecnología y equipamiento empresarial',
    brandTone: 'Profesional, cercano y resolutivo',
    approvedValuePropositions: [
      'Garantía oficial y servicio técnico certificado',
      'Financiación en hasta 12 cuotas fijas',
      'Envíos en el día a todo el NOA',
    ],
  },
  businessMemory: {
    businessModel: 'B2B / B2C High-Ticket Retail',
    averageTicket: 1299999,
    peakSeasonMonths: ['Marzo', 'Agosto', 'Noviembre', 'Diciembre'],
    grossMarginTargetPct: 35,
  },
  salesMemory: {
    leadObjectionPatterns: [
      { objection: 'Consultando por precio de contado', resolution: 'Ofrecer 10% de descuento por transferencia o plan 12 cuotas' },
      { objection: 'Duda sobre compatibilidad técnica', resolution: 'Asignar a especialista técnico en menos de 5 minutos' },
    ],
    averageQualificationTimeHours: 1.8,
    historicalCloseRatePct: 16.5,
    topRepPerformance: { repName: 'Agustín Gómez', closeRatePct: 22.4 },
  },
  audienceMemory: {
    highLtvSegments: ['Empresas de desarrollo de software', 'Estudios contables y jurídicos', 'Pymes industriales'],
    bestDemographics: { location: 'Tucumán y Salta', ageRange: '28-52 años', topDevice: 'Mobile (Android & iOS)' },
    provenExclusions: ['Compradores de los últimos 60 días', 'Personal interno'],
  },
  creativeMemory: {
    bestAngles: ['Problema & Fricción de hardware viejo', 'Oferta Directa 12 Cuotas', 'Prueba Social con empresas'],
    bestAspectRatios: ['9:16 (Reels/Stories: 4.2% CTR)', '1:1 (Feed: 2.8% CTR)'],
    averageFatigueCycleDays: 19,
    hookRetentionRatePct: 48.6,
  },
  campaignMemory: {
    historicalBenchmarkCpl: 1650,
    optimalDailyBudgetRange: { min: 15000, max: 45000 },
    bestBiddingStrategy: 'LOWEST_COST_WITH_BID_CAP',
  },
  revenueMemory: {
    mrr: 18500000,
    collectionEfficiencyPct: 96.8,
    averagePaymentDelayDays: 3.2,
    netContributionMarginPct: 28.4,
  },
  performanceDna: {
    bestHooks: [
      '¿Tu computadora se traba justo cuando más la necesitás?',
      'Equipá tu empresa con notebooks de alto rendimiento en 12 cuotas.',
      'Garantía oficial y entrega inmediata en Tucumán.',
    ],
    bestFormats: ['Video Reel 9:16 con Avatar + B-Roll Real', 'Carrusel de 3 Ofertas'],
    bestOffers: ['12 Cuotas Fijas sin Interés con Banco Macro/Galicia', 'Descuento 15% Contado Efectivo'],
    bestCtas: ['Solicitar Financiación por WhatsApp', 'Hablar con un Especialista'],
  },
  winningPatterns: [
    {
      patternId: 'win_01',
      dimension: 'creative',
      title: 'Hook con Avatar + B-Roll de Empresa Real',
      metricImpact: '+38% CTR y -34% CPL',
      confidenceScore: 0.94,
      context: 'Los videos combinados de avatar IA con tomas reales de la tienda aumentan radicalmente la confianza.',
    },
    {
      patternId: 'win_02',
      dimension: 'sales',
      title: 'Respuesta en menos de 5 minutos en WhatsApp',
      metricImpact: 'Tasa de cierre pasa de 9% a 21%',
      confidenceScore: 0.98,
      context: 'El primer contacto dentro de los 300 segundos cuadruplica la conversión comercial.',
    },
  ],
  losingPatterns: [
    {
      patternId: 'loss_01',
      dimension: 'creative',
      title: 'Anuncios estáticos sin precio ni cuotas visibles',
      failureReason: 'Genera consultas basura descalificadas y alto rebote.',
      avoidRules: 'Siempre superponer programáticamente el precio base y la cantidad de cuotas fijas.',
    },
    {
      patternId: 'loss_02',
      dimension: 'audience',
      title: 'Segmentación hiper-específica con menos de 50.000 de audiencia',
      failureReason: 'Satura la frecuencia en 4 días y triplica el CPM.',
      avoidRules: 'Utilizar Advantage+ Broad targeting en subastas locales de NOA.',
    },
  ],
};

/**
 * Sanitizes a BusinessMemory document.
 */
export function sanitizeBusinessMemory(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    brandMemory: { ...DEFAULT_BUSINESS_MEMORY.brandMemory, ...(doc.brandMemory || {}) },
    businessMemory: { ...DEFAULT_BUSINESS_MEMORY.businessMemory, ...(doc.businessMemory || {}) },
    salesMemory: { ...DEFAULT_BUSINESS_MEMORY.salesMemory, ...(doc.salesMemory || {}) },
    audienceMemory: { ...DEFAULT_BUSINESS_MEMORY.audienceMemory, ...(doc.audienceMemory || {}) },
    creativeMemory: { ...DEFAULT_BUSINESS_MEMORY.creativeMemory, ...(doc.creativeMemory || {}) },
    campaignMemory: { ...DEFAULT_BUSINESS_MEMORY.campaignMemory, ...(doc.campaignMemory || {}) },
    revenueMemory: { ...DEFAULT_BUSINESS_MEMORY.revenueMemory, ...(doc.revenueMemory || {}) },
    performanceDna: { ...DEFAULT_BUSINESS_MEMORY.performanceDna, ...(doc.performanceDna || {}) },
    winningPatterns: Array.isArray(doc.winningPatterns) && doc.winningPatterns.length > 0
      ? doc.winningPatterns
      : DEFAULT_BUSINESS_MEMORY.winningPatterns,
    losingPatterns: Array.isArray(doc.losingPatterns) && doc.losingPatterns.length > 0
      ? doc.losingPatterns
      : DEFAULT_BUSINESS_MEMORY.losingPatterns,
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
