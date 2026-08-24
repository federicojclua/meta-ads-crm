import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { sanitizeMetaLog } from './_shared/metaConfig.js';
import { calculateDerivedMetrics } from '../../models/MetaInsightDaily.js';

export const handler = async (event) => {
  try {
    const auth = await verifyAuthorizedUser(event);
    if (!auth.authorized) {
      return errorResponse(auth.statusCode || 401, auth.error || 'No autorizado.', auth.code || 'UNAUTHORIZED');
    }

    const { isGlobal, clientScope, user } = auth;
    const isSuperAdmin = user?.role === 'super_admin';
    const db = auth.db || (await getDb());
    const method = event.httpMethod;

    if (method !== 'GET') {
      return errorResponse(405, 'Método no permitido. Utilice GET.', 'METHOD_NOT_ALLOWED');
    }

    const params = event.queryStringParameters || {};
    const insightsCollection = db.collection('meta_insights_daily');
    const campaignsCollection = db.collection('meta_campaigns');
    const adsetsCollection = db.collection('meta_adsets');
    const dataSourcesCollection = db.collection('meta_data_sources');
    const leadsCollection = db.collection('leads');
    const salesCollection = db.collection('sales');
    const clientsCollection = db.collection('clients');

    // 1. Determine authorized target clientId
    let targetClientId = null;
    if (isGlobal) {
      if (params.clientId && ObjectId.isValid(params.clientId)) {
        targetClientId = new ObjectId(params.clientId);
        const clientExists = await clientsCollection.findOne({ _id: targetClientId, status: 'active' });
        if (!clientExists) {
          return errorResponse(404, 'Empresa no encontrada o inactiva.', 'CLIENT_NOT_FOUND');
        }
      }
    } else {
      if (!clientScope || !ObjectId.isValid(clientScope)) {
        return errorResponse(403, 'Usuario sin empresa autorizada.', 'FORBIDDEN');
      }
      targetClientId = new ObjectId(clientScope);
    }

    // 2. Build tenant query filter (Tenant-First)
    const matchQuery = {};
    if (targetClientId) {
      matchQuery.clientId = targetClientId;
    }

    if (params.currency) {
      matchQuery.currency = params.currency.toUpperCase();
    }

    if (params.adAccountId) {
      matchQuery.adAccountId = params.adAccountId;
    }

    if (params.datasetId) {
      matchQuery.datasetId = params.datasetId;
    }

    if (params.campaignId) {
      matchQuery.campaignId = params.campaignId;
    }

    if (params.dateStart || params.dateStop) {
      matchQuery.date = {};
      if (params.dateStart) matchQuery.date.$gte = params.dateStart;
      if (params.dateStop) matchQuery.date.$lte = params.dateStop;
    }

    const level = params.level || 'summary'; // 'summary', 'dataset', 'campaign', 'adset'

    // Helper: calculate collected revenue filtered strictly by payment collectedAt
    const extractAttributedPayments = (salesDocs, dateStartStr, dateStopStr, currency) => {
      let totalCollectedMinor = 0;
      let matchingPaymentsCount = 0;

      for (const sale of salesDocs) {
        if (sale.status === 'cancelled') continue;
        if (sale.currency !== currency) continue;

        const payments = Array.isArray(sale.payments) ? sale.payments : [];
        if (payments.length > 0) {
          for (const p of payments) {
            if (p.collectedAt) {
              const pDateStr = new Date(p.collectedAt).toISOString().split('T')[0];
              if (dateStartStr && pDateStr < dateStartStr) continue;
              if (dateStopStr && pDateStr > dateStopStr) continue;
            }
            totalCollectedMinor += p.amountMinor || 0;
            matchingPaymentsCount++;
          }
        } else {
          // Fallback if no payment array
          totalCollectedMinor += sale.collectedAmountMinor || 0;
        }
      }

      return { totalCollectedMinor, matchingPaymentsCount };
    };

    // 3. Aggregate insights based on requested level
    let aggregatedResults = [];

    if (level === 'campaign') {
      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: { campaignId: '$campaignId', currency: '$currency' },
            spendMinor: { $sum: '$spendMinor' },
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
            linkClicks: { $sum: '$linkClicks' },
            landingPageViews: { $sum: '$landingPageViews' },
            actions: { $push: '$actions' },
            actionValues: { $push: '$actionValues' },
            adsetsCount: { $addToSet: '$adsetId' },
            dates: { $addToSet: '$date' },
          },
        },
      ];

      const rawCampaigns = await insightsCollection.aggregate(pipeline).toArray();
      const campaignIds = rawCampaigns.map((r) => r._id.campaignId).filter(Boolean);
      const campaignDocs = await campaignsCollection.find({ campaignId: { $in: campaignIds } }).toArray();
      const campaignMap = new Map(campaignDocs.map((c) => [c.campaignId, c]));

      aggregatedResults = await Promise.all(
        rawCampaigns.map(async (row) => {
          const campId = row._id.campaignId;
          const currency = row._id.currency;
          const campDoc = campaignMap.get(campId) || {};

          // Check mixed-tenant security
          if (campDoc.hasMultipleTenants && !isSuperAdmin) {
            // Restrict full aggregated campaign data if multiple tenants exist
            return {
              campaignId: campId,
              campaignName: 'Campaña con múltiples empresas (Datos Aislados)',
              status: campDoc.status || 'PAUSED',
              currency,
              isMixedTenant: true,
              dataRestricted: true,
              spendMinor: row.spendMinor,
              spend: row.spendMinor / 100,
              metaLeadCount: 0,
              metaPurchaseCount: 0,
              hasAttributionData: false,
              crmAttributedLeads: null,
              crmAttributedSales: null,
              crmAttributedCollectedMinor: null,
              cplCrm: null,
              cpaCrm: null,
              roasCollected: null,
              attributionNote: 'Campaña mixta: visualización global restringida para proteger datos entre empresas.',
            };
          }

          // Compute Meta reported metrics from action arrays
          let metaLeadCount = 0;
          let metaPurchaseCount = 0;
          let metaConversionValueMinor = 0;

          if (Array.isArray(row.actions)) {
            for (const actionGroup of row.actions) {
              if (Array.isArray(actionGroup)) {
                for (const act of actionGroup) {
                  if (act.actionType === 'lead' || act.actionType.includes('lead') || act.actionType.includes('lead_grouped')) {
                    metaLeadCount += act.value || 0;
                  }
                  if (act.actionType === 'purchase' || act.actionType.includes('purchase')) {
                    metaPurchaseCount += act.value || 0;
                  }
                }
              }
            }
          }

          if (Array.isArray(row.actionValues)) {
            for (const valGroup of row.actionValues) {
              if (Array.isArray(valGroup)) {
                for (const val of valGroup) {
                  metaConversionValueMinor += val.valueMinor || 0;
                }
              }
            }
          }

          // STRICT CRM ATTRIBUTION: ONLY count leads and sales explicitly tagged with this campaign ID
          const attributedLeadsFilter = {
            ...(targetClientId ? { clientId: targetClientId } : {}),
            metaCampaignId: campId,
            status: { $ne: 'deleted' },
          };

          const attributedLeadsCount = await leadsCollection.countDocuments(attributedLeadsFilter);
          const hasAttribution = attributedLeadsCount > 0;

          let crmWonSalesCount = 0;
          let crmCollectedRevenueMinor = 0;

          if (hasAttribution) {
            const attributedSalesDocs = await salesCollection
              .find({
                ...(targetClientId ? { clientId: targetClientId } : {}),
                currency,
                status: { $ne: 'cancelled' },
                metaCampaignId: campId,
              })
              .toArray();

            crmWonSalesCount = attributedSalesDocs.length;
            const paymentExtract = extractAttributedPayments(
              attributedSalesDocs,
              params.dateStart,
              params.dateStop,
              currency
            );
            crmCollectedRevenueMinor = paymentExtract.totalCollectedMinor;
          }

          const baseMetrics = calculateDerivedMetrics({
            spendMinor: row.spendMinor,
            impressions: row.impressions,
            clicks: row.clicks,
            linkClicks: row.linkClicks,
            leadsCrm: hasAttribution ? attributedLeadsCount : 0,
            wonSalesCrm: hasAttribution ? crmWonSalesCount : 0,
            collectedRevenueMinor: hasAttribution ? crmCollectedRevenueMinor : 0,
          });

          // Meta-derived cost per result
          const spendMajor = row.spendMinor / 100;
          const metaCostPerLead = metaLeadCount > 0 ? Number((spendMajor / metaLeadCount).toFixed(2)) : null;
          const metaCostPerPurchase = metaPurchaseCount > 0 ? Number((spendMajor / metaPurchaseCount).toFixed(2)) : null;

          return {
            campaignId: campId,
            campaignName: campDoc.name || campId || 'Campaña sin nombre',
            status: campDoc.status || 'PAUSED',
            currency,
            adsetsCount: (row.adsetsCount || []).length,
            // 1. Meta-Reported Metrics (Origen: Meta)
            metaSpendMinor: row.spendMinor,
            metaSpend: spendMajor,
            metaImpressions: row.impressions || 0,
            metaClicks: row.clicks || 0,
            metaCtr: baseMetrics.ctr,
            metaCpc: baseMetrics.cpc,
            metaCpm: baseMetrics.cpm,
            metaLeadCount,
            metaPurchaseCount,
            metaConversionValueMinor,
            metaConversionValue: metaConversionValueMinor / 100,
            metaCostPerLead,
            metaCostPerPurchase,
            primaryResultActionType: metaLeadCount > 0 ? 'lead' : metaPurchaseCount > 0 ? 'purchase' : 'link_click',
            // 2. Strict CRM Attributed Metrics
            hasAttributionData: hasAttribution,
            crmAttributedLeads: hasAttribution ? attributedLeadsCount : null,
            crmAttributedSales: hasAttribution ? crmWonSalesCount : null,
            crmAttributedCollectedMinor: hasAttribution ? crmCollectedRevenueMinor : null,
            crmAttributedCollectedFormatted: hasAttribution
              ? (crmCollectedRevenueMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })
              : null,
            cplCrm: hasAttribution ? baseMetrics.cpl : null,
            cpaCrm: hasAttribution ? baseMetrics.cpa : null,
            roasCollected: hasAttribution ? baseMetrics.roas : null,
            attributionStatus: hasAttribution ? 'Atribuido a Campaña' : 'Sin atribución CRM disponible',
          };
        })
      );
    } else if (level === 'dataset') {
      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: { datasetId: '$datasetId', currency: '$currency' },
            spendMinor: { $sum: '$spendMinor' },
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
            linkClicks: { $sum: '$linkClicks' },
            campaignsCount: { $addToSet: '$campaignId' },
            adsetsCount: { $addToSet: '$adsetId' },
          },
        },
      ];

      const rawDatasets = await insightsCollection.aggregate(pipeline).toArray();
      const datasetIds = rawDatasets.map((r) => r._id.datasetId).filter(Boolean);
      const sourceDocs = await dataSourcesCollection.find({ metaDatasetId: { $in: datasetIds } }).toArray();
      const sourceMap = new Map(sourceDocs.map((s) => [s.metaDatasetId, s]));

      aggregatedResults = rawDatasets.map((row) => {
        const datasetId = row._id.datasetId;
        const sourceDoc = sourceMap.get(datasetId);
        const currency = row._id.currency;

        const metrics = calculateDerivedMetrics({
          spendMinor: row.spendMinor,
          impressions: row.impressions,
          clicks: row.clicks,
          linkClicks: row.linkClicks,
        });

        return {
          datasetId: datasetId || 'unassigned',
          datasetName: sourceDoc?.name || (datasetId ? `Dataset ${datasetId}` : 'Sin píxel/dataset identificado'),
          type: sourceDoc?.type || 'dataset',
          currency,
          campaignsCount: (row.campaignsCount || []).length,
          adsetsCount: (row.adsetsCount || []).length,
          metaSpendMinor: row.spendMinor,
          metaSpend: row.spendMinor / 100,
          metaImpressions: row.impressions || 0,
          metaClicks: row.clicks || 0,
          metaCtr: metrics.ctr,
          metaCpc: metrics.cpc,
          hasAttributionData: false,
          crmAttributedLeads: null,
          crmAttributedSales: null,
          cplCrm: null,
          cpaCrm: null,
          roasCollected: null,
          attributionNote: 'Métricas de píxel/dataset informadas por Meta. No asociadas a leads directos sin atribución.',
        };
      });
    } else if (level === 'adset') {
      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: { adsetId: '$adsetId', currency: '$currency' },
            campaignId: { $first: '$campaignId' },
            datasetId: { $first: '$datasetId' },
            spendMinor: { $sum: '$spendMinor' },
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
            linkClicks: { $sum: '$linkClicks' },
          },
        },
      ];

      const rawAdsets = await insightsCollection.aggregate(pipeline).toArray();
      const adsetIds = rawAdsets.map((r) => r._id.adsetId).filter(Boolean);
      const adsetDocs = await adsetsCollection.find({ adsetId: { $in: adsetIds } }).toArray();
      const adsetMap = new Map(adsetDocs.map((a) => [a.adsetId, a]));

      aggregatedResults = rawAdsets.map((row) => {
        const adsetId = row._id.adsetId;
        const adsetDoc = adsetMap.get(adsetId) || {};
        const currency = row._id.currency;

        const metrics = calculateDerivedMetrics({
          spendMinor: row.spendMinor,
          impressions: row.impressions,
          clicks: row.clicks,
          linkClicks: row.linkClicks,
        });

        return {
          adsetId,
          adsetName: adsetDoc.name || adsetId,
          campaignId: row.campaignId,
          datasetId: row.datasetId || null,
          currency,
          metaSpendMinor: row.spendMinor,
          metaSpend: row.spendMinor / 100,
          metaImpressions: row.impressions || 0,
          metaClicks: row.clicks || 0,
          metaCtr: metrics.ctr,
          metaCpc: metrics.cpc,
          hasAttributionData: false,
          crmAttributedLeads: null,
          crmAttributedSales: null,
          cplCrm: null,
          cpaCrm: null,
          roasCollected: null,
          attributionNote: 'Métricas a nivel de conjunto de anuncios (AdSet).',
        };
      });
    } else {
      // Summary Level: Blended Tenant Metrics
      const pipeline = [
        { $match: matchQuery },
        {
          $group: {
            _id: '$currency',
            spendMinor: { $sum: '$spendMinor' },
            impressions: { $sum: '$impressions' },
            clicks: { $sum: '$clicks' },
            linkClicks: { $sum: '$linkClicks' },
            campaignsCount: { $addToSet: '$campaignId' },
            adsetsCount: { $addToSet: '$adsetId' },
          },
        },
      ];

      const rawSummary = await insightsCollection.aggregate(pipeline).toArray();

      aggregatedResults = await Promise.all(
        rawSummary.map(async (row) => {
          const currency = row._id || 'ARS';

          // Tenant total CRM leads (for blended overview)
          const totalTenantLeads = await leadsCollection.countDocuments({
            ...(targetClientId ? { clientId: targetClientId } : {}),
            status: { $ne: 'deleted' },
          });

          // Tenant total CRM sales
          const tenantSalesDocs = await salesCollection
            .find({
              ...(targetClientId ? { clientId: targetClientId } : {}),
              currency,
              status: { $ne: 'cancelled' },
            })
            .toArray();

          const totalWonSalesCount = tenantSalesDocs.length;
          const paymentExtract = extractAttributedPayments(
            tenantSalesDocs,
            params.dateStart,
            params.dateStop,
            currency
          );
          const totalCollectedRevenueMinor = paymentExtract.totalCollectedMinor;

          const totalSpendMajor = row.spendMinor / 100;
          const totalCollectedMajor = totalCollectedRevenueMinor / 100;

          // Blended formulas clearly identified as non-attributed
          const blendedCpl = totalTenantLeads > 0 ? Number((totalSpendMajor / totalTenantLeads).toFixed(2)) : null;
          const blendedCpa = totalWonSalesCount > 0 ? Number((totalSpendMajor / totalWonSalesCount).toFixed(2)) : null;
          const blendedRoas = totalSpendMajor > 0 && totalCollectedMajor > 0
            ? Number((totalCollectedMajor / totalSpendMajor).toFixed(2))
            : null;

          return {
            currency,
            campaignsCount: (row.campaignsCount || []).length,
            adsetsCount: (row.adsetsCount || []).length,
            totalMetaSpendMinor: row.spendMinor,
            totalMetaSpend: totalSpendMajor,
            totalMetaImpressions: row.impressions || 0,
            totalMetaClicks: row.clicks || 0,
            totalCrmLeads: totalTenantLeads,
            totalCrmWonSales: totalWonSalesCount,
            totalCrmCollectedMinor: totalCollectedRevenueMinor,
            totalCrmCollectedFormatted: totalCollectedMajor.toLocaleString('es-AR', { minimumFractionDigits: 2 }),
            // Blended KPIs (Labeled as non-attributed blended metrics)
            isBlended: true,
            blendedCpl,
            blendedCpa,
            blendedRoas,
            attributionNote: 'Métrica blended a nivel empresa — no atribuida a campañas particulares.',
          };
        })
      );
    }

    // Get last sync timestamp
    let lastSyncedAt = null;
    try {
      const lastSyncDoc = await insightsCollection.find(matchQuery).sort({ syncedAt: -1 }).limit(1).toArray();
      lastSyncedAt = lastSyncDoc[0]?.syncedAt || null;
    } catch {
      // ignore
    }

    return jsonResponse(200, {
      ok: true,
      level,
      results: aggregatedResults,
      lastSyncedAt,
      isDataAvailable: aggregatedResults.length > 0,
    });
  } catch (err) {
    console.error('[META_INSIGHTS_ERROR]', sanitizeMetaLog(err.message));
    return errorResponse(500, 'Error interno al consultar métricas de Meta Ads.', 'INTERNAL_SERVER_ERROR');
  }
};
