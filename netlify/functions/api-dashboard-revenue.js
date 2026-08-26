import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { calculateDerivedMetrics } from '../../models/MetaInsightDaily.js';
import { convertCurrencyHistorically } from '../../models/ExchangeRate.js';

async function findClient(idOrSlug, clientsCollection) {
  if (!idOrSlug) return null;
  if (!clientsCollection || typeof clientsCollection.findOne !== 'function') {
    return { _id: idOrSlug };
  }
  if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
    const doc = await clientsCollection.findOne({ _id: new ObjectId(idOrSlug) });
    if (doc) return doc;
  }
  const docByStrId = await clientsCollection.findOne({ _id: idOrSlug });
  if (docByStrId) return docByStrId;
  const docBySlug = await clientsCollection.findOne({ slug: idOrSlug });
  if (docBySlug) return docBySlug;
  return null;
}

/**
 * Netlify Function: api-dashboard-revenue
 * Consolidates Meta Ads performance with CRM Leads, Sales and Payments.
 * Supports date ranges, campaign and salesperson filters, granularity, and historical currency conversion.
 */
export const handler = async (event) => {
  try {
    const auth = await verifyAuthorizedUser(event);
    if (!auth.authorized) {
      return errorResponse(auth.status, auth.error, auth.code);
    }

    const { user, clientScope, isGlobal } = auth;
    const db = auth.db || (await getDb());
    const method = event.httpMethod;

    if (method !== 'GET') {
      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    const params = event.queryStringParameters || {};

    // 1. Strict Tenant Scoping & Authorization Validation
    const rawClientId = (params.clientId !== undefined && params.clientId !== null)
      ? String(params.clientId).trim()
      : (params.clientid !== undefined && params.clientid !== null)
        ? String(params.clientid).trim()
        : '';

    let clientDoc = null;
    const clientsCollection = db.collection('clients');

    if (!isGlobal) {
      if (!clientScope) {
        return errorResponse(403, 'Usuario sin empresa asignada.', 'FORBIDDEN');
      }
      clientDoc = await findClient(clientScope, clientsCollection);
    } else {
      if (!rawClientId) {
        return errorResponse(400, 'El parámetro clientId es obligatorio para administradores globales.', 'CLIENT_ID_REQUIRED');
      }
      clientDoc = await findClient(rawClientId, clientsCollection);
    }

    if (!clientDoc || clientDoc.status === 'inactive') {
      return errorResponse(404, 'La empresa seleccionada no existe o está inactiva.', 'CLIENT_NOT_FOUND');
    }

    const targetClientId = clientDoc._id;   // Respect Salesperson role constraints
    const isSalesperson = user.role === 'salesperson';
    let salespersonId = null;
    if (isSalesperson) {
      salespersonId = user._id;
    } else if (params.salespersonId && ObjectId.isValid(params.salespersonId)) {
      salespersonId = new ObjectId(params.salespersonId);
    }

    // 2. Date Range Parsing (UTC inclusive bounds)
    // Format YYYY-MM-DD
    const startDateStr = params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDateStr = params.endDate || new Date().toISOString().split('T')[0];

    const rangeStart = new Date(`${startDateStr}T00:00:00.000Z`);
    const rangeEnd = new Date(`${endDateStr}T23:59:59.999Z`);

    // 3. Other Filters
    const campaignId = params.campaignId || null;
    const granularity = params.granularity || 'daily'; // 'daily' | 'weekly' | 'monthly'
    const targetCurrency = params.currency || null; // 'ARS' | 'USD' | null (null = keep original currency)

    // Load active exchange rates
    const exchangeRates = await db.collection('exchange_rates').find({}).toArray();

    // 4. Fetch Core Collections
    const leadsCollection = db.collection('leads');
    const salesCollection = db.collection('sales');
    const metaInsightsCollection = db.collection('meta_insights_daily');

    // Build Leads query
    const leadFilter = {
      clientId: targetClientId,
      status: { $ne: 'deleted' },
      acquiredAt: { $gte: rangeStart, $lte: rangeEnd },
    };
    if (salespersonId) {
      leadFilter.assignedToUserId = salespersonId;
    }
    if (campaignId) {
      leadFilter.metaCampaignId = campaignId;
    }

    const allLeads = await leadsCollection.find(leadFilter).toArray();
    const leadIds = allLeads.map(l => l._id);

    // Build Sales and Payments query (exclude cancelled sales)
    const salesFilter = {
      clientId: targetClientId,
      status: { $ne: 'cancelled' },
      leadId: { $in: leadIds },
    };
    if (campaignId) {
      salesFilter.metaCampaignId = campaignId;
    }

    const allSales = await salesCollection.find(salesFilter).toArray();

    // Extract all payments that fall within the range
    const paymentsInRange = [];
    allSales.forEach(sale => {
      const payments = Array.isArray(sale.payments) ? sale.payments : [];
      payments.forEach(pay => {
        const payDate = new Date(pay.collectedAt || pay.createdAt);
        if (payDate >= rangeStart && payDate <= rangeEnd) {
          paymentsInRange.push({
            ...pay,
            saleId: sale._id,
            saleCurrency: sale.currency,
            leadId: sale.leadId,
            metaCampaignId: sale.metaCampaignId || null,
          });
        }
      });
    });

    // Build Meta Insights query
    const metaFilter = {
      clientId: targetClientId,
      date: { $gte: startDateStr, $lte: endDateStr },
    };
    if (campaignId) {
      metaFilter.campaignId = campaignId;
    }

    const allInsights = await metaInsightsCollection.find(metaFilter).toArray();

    // 5. Aggregate KPIs
    let hasExchangeRateError = false;

    // Helper to safely sum and convert values
    const safeConvertSum = (items, amountExtractor, currencyExtractor, dateExtractor) => {
      let totalMinor = 0;
      let breakdown = { ARS: 0, USD: 0 };

      for (const item of items) {
        const amt = amountExtractor(item);
        const curr = currencyExtractor(item);
        breakdown[curr] = (breakdown[curr] || 0) + amt;

        if (targetCurrency) {
          const dt = dateExtractor(item);
          const converted = convertCurrencyHistorically(amt, curr, targetCurrency, dt, exchangeRates);
          if (converted === null) {
            hasExchangeRateError = true;
          } else {
            totalMinor += converted;
          }
        }
      }

      return { totalMinor, breakdown };
    };

    // Calculate spend sums
    const spendAgg = safeConvertSum(
      allInsights,
      i => i.spendMinor || 0,
      i => i.currency || 'ARS',
      i => i.date
    );

    // Calculate payment revenue sums
    const revAgg = safeConvertSum(
      paymentsInRange,
      p => p.amountMinor || 0,
      p => p.saleCurrency || 'ARS',
      p => p.collectedAt || p.createdAt
    );

    // Direct Attributed CRM data (only count leads/sales explicitly tagged with a Meta Campaign)
    const attributedLeads = allLeads.filter(l => l.metaCampaignId);
    const attributedLeadIds = attributedLeads.map(l => l._id);
    const attributedSales = allSales.filter(s => s.metaCampaignId || attributedLeadIds.some(id => id.toString() === s.leadId?.toString()));
    const attributedPayments = paymentsInRange.filter(p => p.metaCampaignId || attributedLeadIds.some(id => id.toString() === p.leadId?.toString()));

    const attributedSpendAgg = safeConvertSum(
      allInsights.filter(i => i.campaignId),
      i => i.spendMinor || 0,
      i => i.currency || 'ARS',
      i => i.date
    );

    const attributedRevAgg = safeConvertSum(
      attributedPayments,
      p => p.amountMinor || 0,
      p => p.saleCurrency || 'ARS',
      p => p.collectedAt || p.createdAt
    );

    // 6. Blended vs Attributed KPIs Formatting
    const totalLeadsCount = allLeads.length;
    const totalWonSalesCount = allSales.filter(s => s.status === 'collected' || s.status === 'partial').length;

    const formattedSpend = targetCurrency
      ? (spendAgg.totalMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })
      : `${(spendAgg.breakdown.ARS / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS / ${(spendAgg.breakdown.USD / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })} USD`;

    const formattedRevenue = targetCurrency
      ? (revAgg.totalMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })
      : `${(revAgg.breakdown.ARS / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS / ${(revAgg.breakdown.USD / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })} USD`;

    // Blended cost calculations
    let blendedCpl = null;
    let blendedCpa = null;
    let blendedRoas = null;

    if (targetCurrency && !hasExchangeRateError) {
      const sp = spendAgg.totalMinor / 100;
      const rv = revAgg.totalMinor / 100;
      if (totalLeadsCount > 0) blendedCpl = Number((sp / totalLeadsCount).toFixed(2));
      if (totalWonSalesCount > 0) blendedCpa = Number((sp / totalWonSalesCount).toFixed(2));
      if (sp > 0) blendedRoas = Number((rv / sp).toFixed(2));
    }

    // Attributed cost calculations
    let attributedCpl = null;
    let attributedCpa = null;
    let attributedRoas = null;

    if (targetCurrency && !hasExchangeRateError) {
      const asp = attributedSpendAgg.totalMinor / 100;
      const arv = attributedRevAgg.totalMinor / 100;
      if (attributedLeads.length > 0) attributedCpl = Number((asp / attributedLeads.length).toFixed(2));
      if (attributedSales.length > 0) attributedCpa = Number((asp / attributedSales.length).toFixed(2));
      if (asp > 0) attributedRoas = Number((arv / asp).toFixed(2));
    }

    // 7. Funnel Cohortes Agregadas
    const funnelStages = {
      new: allLeads.filter(l => l.stage === 'new').length,
      contacted: allLeads.filter(l => l.stage === 'contacted').length,
      qualified: allLeads.filter(l => l.stage === 'qualified').length,
      won: allLeads.filter(l => l.stage === 'won').length,
      lost: allLeads.filter(l => l.stage === 'lost').length,
    };

    const funnelConversion = {
      total: totalLeadsCount,
      contactedOrFurther: allLeads.filter(l => ['contacted', 'qualified', 'won'].includes(l.stage)).length,
      qualifiedOrFurther: allLeads.filter(l => ['qualified', 'won'].includes(l.stage)).length,
      won: allLeads.filter(l => l.stage === 'won').length,
    };

    const conversionRates = {
      totalToContacted: funnelConversion.total > 0 ? Number(((funnelConversion.contactedOrFurther / funnelConversion.total) * 100).toFixed(1)) : 0,
      contactedToQualified: funnelConversion.contactedOrFurther > 0 ? Number(((funnelConversion.qualifiedOrFurther / funnelConversion.contactedOrFurther) * 100).toFixed(1)) : 0,
      qualifiedToWon: funnelConversion.qualifiedOrFurther > 0 ? Number(((funnelConversion.won / funnelConversion.qualifiedOrFurther) * 100).toFixed(1)) : 0,
      blendedConversion: funnelConversion.total > 0 ? Number(((funnelConversion.won / funnelConversion.total) * 100).toFixed(1)) : 0,
    };

    // 8. Granular Time-Series Bins
    const getBinKey = (dateInput, mode) => {
      const d = new Date(dateInput);
      if (mode === 'monthly') {
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      } else if (mode === 'weekly') {
        const day = d.getUTCDay();
        const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        const mon = new Date(d);
        mon.setUTCDate(diff);
        return mon.toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    };

    const binsMap = {};

    // Fill bins for date range to guarantee continuity
    let currentPtr = new Date(rangeStart);
    while (currentPtr <= rangeEnd) {
      const k = getBinKey(currentPtr, granularity);
      if (!binsMap[k]) {
        binsMap[k] = { date: k, spendMinor: 0, leadsCount: 0, revenueMinor: 0, originalCurrencies: { spend: { ARS: 0, USD: 0 }, revenue: { ARS: 0, USD: 0 } } };
      }
      // Increment ptr based on granularity to avoid infinite loop
      if (granularity === 'monthly') {
        currentPtr.setUTCMonth(currentPtr.getUTCMonth() + 1);
      } else if (granularity === 'weekly') {
        currentPtr.setUTCDate(currentPtr.getUTCDate() + 7);
      } else {
        currentPtr.setUTCDate(currentPtr.getUTCDate() + 1);
      }
    }

    // Put Meta Spend into bins
    allInsights.forEach(ins => {
      const k = getBinKey(new Date(ins.date), granularity);
      if (binsMap[k]) {
        const curr = ins.currency || 'ARS';
        binsMap[k].originalCurrencies.spend[curr] += ins.spendMinor || 0;
        if (targetCurrency) {
          const conv = convertCurrencyHistorically(ins.spendMinor || 0, curr, targetCurrency, ins.date, exchangeRates);
          binsMap[k].spendMinor += conv || 0;
        }
      }
    });

    // Put Leads into bins
    allLeads.forEach(lead => {
      const k = getBinKey(lead.acquiredAt, granularity);
      if (binsMap[k]) {
        binsMap[k].leadsCount += 1;
      }
    });

    // Put Payments into bins
    paymentsInRange.forEach(p => {
      const k = getBinKey(p.collectedAt || p.createdAt, granularity);
      if (binsMap[k]) {
        const curr = p.saleCurrency || 'ARS';
        binsMap[k].originalCurrencies.revenue[curr] += p.amountMinor || 0;
        if (targetCurrency) {
          const conv = convertCurrencyHistorically(p.amountMinor || 0, curr, targetCurrency, p.collectedAt || p.createdAt, exchangeRates);
          binsMap[k].revenueMinor += conv || 0;
        }
      }
    });

    const timeSeries = Object.values(binsMap).sort((a, b) => a.date.localeCompare(b.date));

    // 9. Campaigns Table & Drill-down
    const groupedCampaigns = {};
    allInsights.forEach(ins => {
      const cId = ins.campaignId || 'unassigned';
      if (!groupedCampaigns[cId]) {
        groupedCampaigns[cId] = { campaignId: cId, name: ins.campaignName || 'Campaña sin nombre', spendMinor: 0, currency: ins.currency || 'ARS', impressions: 0, clicks: 0, adSets: {} };
      }
      groupedCampaigns[cId].spendMinor += ins.spendMinor || 0;
      groupedCampaigns[cId].impressions += ins.impressions || 0;
      groupedCampaigns[cId].clicks += ins.clicks || 0;

      // Group AdSets
      const sId = ins.adsetId || 'unassigned';
      if (!groupedCampaigns[cId].adSets[sId]) {
        groupedCampaigns[cId].adSets[sId] = { adsetId: sId, name: ins.adsetName || 'AdSet sin nombre', spendMinor: 0, impressions: 0, clicks: 0 };
      }
      groupedCampaigns[cId].adSets[sId].spendMinor += ins.spendMinor || 0;
      groupedCampaigns[cId].adSets[sId].impressions += ins.impressions || 0;
      groupedCampaigns[cId].adSets[sId].clicks += ins.clicks || 0;
    });

    const campaignsTable = await Promise.all(
      Object.values(groupedCampaigns).map(async (c) => {
        const campLeads = allLeads.filter(l => l.metaCampaignId === c.campaignId);
        const campLeadIds = campLeads.map(l => l._id);
        const campSales = allSales.filter(s => s.metaCampaignId === c.campaignId || campLeadIds.some(id => id.toString() === s.leadId?.toString()));
        const campPayments = paymentsInRange.filter(p => p.metaCampaignId === c.campaignId || campLeadIds.some(id => id.toString() === p.leadId?.toString()));

        const campRevAgg = safeConvertSum(
          campPayments,
          p => p.amountMinor || 0,
          p => p.saleCurrency || 'ARS',
          p => p.collectedAt || p.createdAt
        );

        let finalCpl = null;
        let finalCpa = null;
        let finalRoas = null;

        if (targetCurrency) {
          const cSpendConv = convertCurrencyHistorically(c.spendMinor, c.currency, targetCurrency, rangeStart, exchangeRates) || 0;
          if (cSpendConv > 0) {
            if (campLeads.length > 0) finalCpl = Number(((cSpendConv / 100) / campLeads.length).toFixed(2));
            if (campSales.length > 0) finalCpa = Number(((cSpendConv / 100) / campSales.length).toFixed(2));
            finalRoas = Number((campRevAgg.totalMinor / cSpendConv).toFixed(2));
          }
        }

        const metrics = calculateDerivedMetrics({
          spendMinor: c.spendMinor,
          impressions: c.impressions,
          clicks: c.clicks,
        });

        // Convert AdSets
        const adSetsList = Object.values(c.adSets).map(as => {
          const asMetrics = calculateDerivedMetrics({
            spendMinor: as.spendMinor,
            impressions: as.impressions,
            clicks: as.clicks,
          });
          return {
            adsetId: as.adsetId,
            name: as.name,
            spend: as.spendMinor / 100,
            spendMinor: as.spendMinor,
            impressions: as.impressions,
            clicks: as.clicks,
            ctr: asMetrics.ctr,
            cpc: asMetrics.cpc,
          };
        });

        return {
          campaignId: c.campaignId,
          name: c.name,
          spend: c.spendMinor / 100,
          spendMinor: c.spendMinor,
          currency: c.currency,
          impressions: c.impressions,
          clicks: c.clicks,
          ctr: metrics.ctr,
          cpc: metrics.cpc,
          leadsCount: campLeads.length,
          salesCount: campSales.length,
          revenueMinor: campRevAgg.totalMinor,
          revenue: campRevAgg.totalMinor / 100,
          cpl: finalCpl,
          cpa: finalCpa,
          roas: finalRoas,
          adSets: adSetsList,
        };
      })
    );

    return jsonResponse(200, {
      ok: true,
      clientId: targetClientId.toString(),
      companyName: clientDoc.name,
      timezone: clientDoc.timezone || 'America/Argentina/Buenos_Aires',
      startDate: startDateStr,
      endDate: endDateStr,
      currency: targetCurrency,
      granularity,
      hasExchangeRateError,
      kpis: {
        totalLeadsCount,
        totalWonSales: totalWonSalesCount,
        spendFormatted: formattedSpend,
        spendMinor: spendAgg.totalMinor,
        revenueFormatted: formattedRevenue,
        revenueMinor: revAgg.totalMinor,
        blendedCpl,
        blendedCpa,
        blendedRoas,
        attributed: {
          leadsCount: attributedLeads.length,
          salesCount: attributedSales.length,
          spendMinor: attributedSpendAgg.totalMinor,
          revenueMinor: attributedRevAgg.totalMinor,
          cpl: attributedCpl,
          cpa: attributedCpa,
          roas: attributedRoas,
        },
      },
      funnel: {
        stages: funnelStages,
        conversion: funnelConversion,
        rates: conversionRates,
      },
      timeSeries,
      campaignsTable,
    });
  } catch (err) {
    console.error('[API_DASHBOARD_REVENUE_ERROR]', err.message);
    return errorResponse(500, 'Error interno al generar el informe de revenue.', 'INTERNAL_SERVER_ERROR');
  }
};
