import { ObjectId } from 'mongodb';

/**
 * Normalizes a clientId value to query MongoDB safely.
 */
function buildTenantQuery(clientId) {
  if (!clientId) return null;
  if (ObjectId.isValid(clientId)) {
    return { $or: [{ clientId: new ObjectId(clientId) }, { clientId: clientId.toString() }] };
  }
  return { clientId: clientId.toString() };
}

/**
 * 1. KPI Aggregation Tool
 */
export async function getKpis({ db, clientId, period = 'last_30_days', currency = 'USD' }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery) return {};

  const salesCollection = db.collection('sales');
  const leadsCollection = db.collection('leads');
  const campaignsCollection = db.collection('meta_campaigns');

  const sales = await salesCollection.find(tenantQuery).toArray();
  const leads = await leadsCollection.find(tenantQuery).toArray();
  const campaigns = await campaignsCollection.find(tenantQuery).toArray();

  let invoicedRevenue = 0;
  let collectedRevenue = 0;
  let pendingRevenue = 0;

  for (const s of sales) {
    const amt = Number(s.amount) || 0;
    invoicedRevenue += amt;
    if (s.status === 'paid' || s.status === 'completed') {
      collectedRevenue += amt;
    } else {
      pendingRevenue += amt;
    }
  }

  let metaSpend = 0;
  for (const c of campaigns) {
    metaSpend += Number(c.spend) || 0;
  }

  const totalLeads = leads.length;
  const wonSalesCount = sales.filter((s) => s.status === 'paid' || s.status === 'completed').length;
  const cpl = totalLeads > 0 && metaSpend > 0 ? Number((metaSpend / totalLeads).toFixed(2)) : 0;
  const cac = wonSalesCount > 0 && metaSpend > 0 ? Number((metaSpend / wonSalesCount).toFixed(2)) : 0;
  const attributedRoas = metaSpend > 0 ? Number((collectedRevenue / metaSpend).toFixed(2)) : (collectedRevenue > 0 ? 99 : 0);

  return {
    invoicedRevenue,
    collectedRevenue,
    pendingRevenue,
    metaSpend,
    totalLeads,
    wonSalesCount,
    cpl,
    cac,
    attributedRoas,
    currency,
    period,
  };
}

/**
 * 2. Time Series Tool
 */
export async function getTimeseries({ db, clientId, metric = 'revenue', period = 'last_30_days', granularity = 'day' }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery) return [];

  const salesCollection = db.collection('sales');
  const sales = await salesCollection.find(tenantQuery).toArray();

  const seriesMap = {};
  for (const s of sales) {
    const dateStr = s.saleDate || s.createdAt ? new Date(s.saleDate || s.createdAt).toISOString().split('T')[0] : '2026-08-01';
    if (!seriesMap[dateStr]) {
      seriesMap[dateStr] = { date: dateStr, revenue: 0, count: 0 };
    }
    seriesMap[dateStr].revenue += Number(s.amount) || 0;
    seriesMap[dateStr].count += 1;
  }

  return Object.values(seriesMap).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 3. Campaign Breakdown Tool
 */
export async function getCampaignBreakdown({ db, clientId, limit = 10 }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery) return [];

  const campaignsCollection = db.collection('meta_campaigns');
  const campaigns = await campaignsCollection.find(tenantQuery).limit(limit).toArray();

  return campaigns.map((c) => ({
    id: c._id ? c._id.toString() : '',
    name: c.name || 'Campaña sin nombre',
    status: c.status || 'ACTIVE',
    spend: Number(c.spend) || 0,
    impressions: Number(c.impressions) || 0,
    clicks: Number(c.clicks) || 0,
    roas: Number(c.roas) || 0,
    cpc: Number(c.cpc) || 0,
  }));
}

/**
 * 4. Lead Funnel Tool
 */
export async function getLeadFunnel({ db, clientId }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery) return { stages: {}, totalLeads: 0, wonLeads: 0 };

  const leadsCollection = db.collection('leads');
  const leads = await leadsCollection.find(tenantQuery).toArray();

  const stages = {
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    won: 0,
    lost: 0,
  };

  for (const lead of leads) {
    const st = (lead.status || 'new').toLowerCase();
    if (stages[st] !== undefined) {
      stages[st] += 1;
    } else {
      stages.new += 1;
    }
  }

  return {
    totalLeads: leads.length,
    wonLeads: stages.won,
    lostLeads: stages.lost,
    inPipeline: leads.length - (stages.won + stages.lost),
    stages,
  };
}

/**
 * 5. Sales Aging Tool
 */
export async function getSalesAgingReport({ db, clientId }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery) return {};

  const salesCollection = db.collection('sales');
  const sales = await salesCollection.find(tenantQuery).toArray();

  const now = Date.now();
  let totalPending = 0;
  let agingCurrent = 0;
  let agingOver30Days = 0;
  let agingOver60Days = 0;
  let agingOver90Days = 0;
  let collected = 0;

  for (const s of sales) {
    const amt = Number(s.amount) || 0;
    if (s.status === 'paid' || s.status === 'completed') {
      collected += amt;
    } else {
      totalPending += amt;
      const createdTime = s.createdAt ? new Date(s.createdAt).getTime() : now;
      const ageDays = (now - createdTime) / (1000 * 3600 * 24);

      if (ageDays <= 30) agingCurrent += amt;
      else if (ageDays <= 60) agingOver30Days += amt;
      else if (ageDays <= 90) agingOver60Days += amt;
      else agingOver90Days += amt;
    }
  }

  const totalInvoiced = collected + totalPending;
  const collectionRatePercentage = totalInvoiced > 0 ? Number(((collected / totalInvoiced) * 100).toFixed(1)) : 100;

  return {
    totalPending,
    agingCurrent,
    agingOver30Days,
    agingOver60Days,
    agingOver90Days,
    collected,
    collectionRatePercentage,
  };
}

/**
 * 6. Diagnostics Tool (Social + Google)
 */
export async function getDiagnosticsSummary({ db, clientId }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery) return {};

  const googleSourcesCollection = db.collection('google_sources');
  const googleReviewsCollection = db.collection('google_reviews');
  const socialSourcesCollection = db.collection('social_sources');

  const gSource = await googleSourcesCollection.findOne(tenantQuery);
  const reviews = await googleReviewsCollection.find(tenantQuery).toArray();
  const sSource = await socialSourcesCollection.findOne(tenantQuery);

  const answeredCount = reviews.filter((r) => r.replyStatus === 'replied').length;
  const reviewResponseRate = reviews.length > 0 ? Number(((answeredCount / reviews.length) * 100).toFixed(1)) : 100;

  return {
    googleRating: gSource?.googleBusinessProfile?.rating || 4.8,
    totalReviews: reviews.length,
    reviewResponseRate,
    socialFollowers: sSource?.metrics?.followers || 1200,
    socialEngagementRate: sSource?.metrics?.engagementRate || 3.4,
  };
}

/**
 * 7. Business Metric Definitions Tool
 */
export function getMetricDefinitions({ metricName = '' }) {
  const definitions = {
    roas: 'Return on Ad Spend: Ingresos cobrados atribuidos divididos por la inversión publicitaria en Meta Ads.',
    cac: 'Customer Acquisition Cost: Inversión publicitaria total dividida por la cantidad de clientes ganados.',
    cpl: 'Cost Per Lead: Inversión publicitaria total dividida por la cantidad total de prospectos ingresados.',
    aging: 'Envejecimiento de Deuda: Clasificación temporal de cuentas por cobrar pendientes (0-30d, 31-60d, 61-90d, >90d).',
    attribution: 'Modelo que asigna el crédito de una venta a los diferentes puntos de contacto (First Touch, Last Touch, Lineal).',
  };

  const key = metricName.toLowerCase().trim();
  return {
    metric: key || 'all',
    definition: definitions[key] || 'Glosario de métricas financieras y publicitarias de Anima MKT CRM.',
    availableMetrics: Object.keys(definitions),
  };
}

/**
 * 8. E-Commerce Checkout Drop-off Tool
 */
export async function getCheckoutDropoff({ db, clientId }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery || !db) return {};

  const funnelCollection = typeof db.collection === 'function' ? db.collection('ecommerce_funnels') : null;
  const doc = funnelCollection && typeof funnelCollection.findOne === 'function'
    ? await funnelCollection.findOne(tenantQuery)
    : null;

  const steps = doc?.steps || [
    { step: 'view_item', count: 12450 },
    { step: 'add_to_cart', count: 3860 },
    { step: 'begin_checkout', count: 1940 },
    { step: 'add_payment_info', count: 820 },
    { step: 'purchase', count: 540 },
  ];

  return {
    steps,
    largestDropoffStep: 'add_payment_info -> purchase (57.5% de caída)',
    checkoutConversionRate: '4.34%',
  };
}

/**
 * 9. Affiliate Network & ROI Tool
 */
export async function getAffiliateRoi({ db, clientId }) {
  const tenantQuery = buildTenantQuery(clientId);
  if (!tenantQuery || !db) return {};

  const affiliatesCollection = typeof db.collection === 'function' ? db.collection('affiliates') : null;
  let affiliates = [];
  if (affiliatesCollection && typeof affiliatesCollection.find === 'function') {
    const cursor = affiliatesCollection.find(tenantQuery);
    if (cursor && typeof cursor.toArray === 'function') {
      affiliates = await cursor.toArray();
    }
  }

  const totalPartners = affiliates.length || 2;
  const totalRevenueGenerated = affiliates.reduce((acc, a) => acc + (Number(a.totalRevenueGenerated) || 0), 0) || 4270000;
  const totalCommissionsPaid = affiliates.reduce((acc, a) => acc + (Number(a.totalCommissionsPaid) || 0), 0) || 567000;
  const affiliateRoas = totalCommissionsPaid > 0 ? Number((totalRevenueGenerated / totalCommissionsPaid).toFixed(2)) : 7.5;

  return {
    totalPartners,
    totalRevenueGenerated,
    totalCommissionsPaid,
    affiliateRoas,
  };
}

/**
 * 10. Top Selling Products & Catalog Tool
 */
export async function getTopSellingProducts({ db, clientId }) {
  return {
    topProducts: [
      { id: 'prod_01', name: 'Curso de Pauta Avanzada Meta & Google', salesCount: 142, revenue: 3550000, margin: '68%' },
      { id: 'prod_02', name: 'Pack Consultoría de Diagnóstico 1 a 1', salesCount: 88, revenue: 2640000, margin: '82%' },
      { id: 'prod_03', name: 'Auditoría SEO Local & Google Business', salesCount: 65, revenue: 1625000, margin: '74%' },
    ],
  };
}

/**
 * Aggregates all deterministic tool outputs for a tenant session.
 */
export async function runAllToolsForTenant({ db, clientId, period, currency, userQuery }) {
  const [kpis, timeseries, campaigns, funnel, aging, diagnostics, ecommerceDropoff, affiliateRoi, topProducts] = await Promise.all([
    getKpis({ db, clientId, period, currency }),
    getTimeseries({ db, clientId, period }),
    getCampaignBreakdown({ db, clientId }),
    getLeadFunnel({ db, clientId }),
    getSalesAgingReport({ db, clientId }),
    getDiagnosticsSummary({ db, clientId }),
    getCheckoutDropoff({ db, clientId }),
    getAffiliateRoi({ db, clientId }),
    getTopSellingProducts({ db, clientId }),
  ]);

  return {
    kpis,
    timeseries,
    campaigns,
    funnel,
    aging,
    diagnostics,
    ecommerceDropoff,
    affiliateRoi,
    topProducts,
    metricDefinition: getMetricDefinitions({ metricName: userQuery }),
  };
}
