import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const isSalesperson = user.role === 'salesperson';
  const leadsCollection = db.collection('leads');
  const salesCollection = db.collection('sales');
  const usersCollection = db.collection('users');
  const clientsCollection = db.collection('clients');
  const method = event.httpMethod;

  if (method !== 'GET') {
    return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
  }

  try {
    const params = event.queryStringParameters || {};
    let targetClientId = null;
    let clientDoc = null;

    if (!isGlobal) {
      targetClientId = ObjectId.isValid(clientScope) ? new ObjectId(clientScope) : clientScope;
      clientDoc = await clientsCollection.findOne({ _id: targetClientId });
    } else if (params.clientId) {
      const rawId = params.clientId.trim();
      const queryId = ObjectId.isValid(rawId) ? new ObjectId(rawId) : rawId;
      clientDoc = await clientsCollection.findOne({ _id: queryId });
      if (clientDoc) {
        targetClientId = clientDoc._id;
      }
    }

    // Date range filter
    const dateFilter = {};
    if (params.startDate) {
      dateFilter.$gte = new Date(params.startDate);
    }
    if (params.endDate) {
      dateFilter.$lte = new Date(params.endDate);
    }

    // Lead query - strict tenant scoping first
    const leadQuery = { status: 'active' };
    if (targetClientId) {
      leadQuery.clientId = targetClientId;
    }
    if (isSalesperson) {
      leadQuery.assignedToUserId = user._id;
    }
    if (Object.keys(dateFilter).length > 0) {
      leadQuery.acquiredAt = dateFilter;
    }

    // Sales query (strictly exclude cancelled)
    const salesQuery = { status: { $ne: 'cancelled' } };
    if (targetClientId) {
      salesQuery.clientId = targetClientId;
    }
    if (Object.keys(dateFilter).length > 0) {
      salesQuery.soldAt = dateFilter;
    }

    // Fetch lead aggregates
    const [
      totalLeadsCount,
      newLeadsCount,
      contactedLeadsCount,
      qualifiedLeadsCount,
      wonLeadsCount,
      lostLeadsCount,
    ] = await Promise.all([
      leadsCollection.countDocuments(leadQuery),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'new' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'contacted' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'qualified' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'won' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'lost' }),
    ]);

    // Conversion rate: null and hasConversionData: false when denominator is zero
    const hasConversionData = totalLeadsCount > 0;
    const conversionRate = hasConversionData
      ? Number(((wonLeadsCount / totalLeadsCount) * 100).toFixed(1))
      : null;

    // Fetch sales and calculate collected revenue per currency
    if (isSalesperson) {
      const assignedLeads = await leadsCollection
        .find({ assignedToUserId: user._id })
        .project({ _id: 1 })
        .toArray();
      const leadIds = assignedLeads.map((l) => l._id);
      salesQuery.leadId = { $in: leadIds };
    }

    const allSales = await salesCollection.find(salesQuery).toArray();

    const revenueByCurrency = {};
    let totalCollectedDefaultMinor = 0;

    allSales.forEach((sale) => {
      const curr = sale.currency || 'ARS';
      const collectedMinor = sale.collectedAmountMinor || 0;
      const collectedDefaultMinor = sale.collectedAmountDefaultMinor || collectedMinor;

      if (!revenueByCurrency[curr]) {
        revenueByCurrency[curr] = {
          collectedMinor: 0,
          totalAmountMinor: 0,
          salesCount: 0,
        };
      }

      revenueByCurrency[curr].collectedMinor += collectedMinor;
      revenueByCurrency[curr].totalAmountMinor += sale.amountMinor || 0;
      revenueByCurrency[curr].salesCount += 1;

      totalCollectedDefaultMinor += collectedDefaultMinor;
    });

    // Format currencies
    const formattedRevenue = {};
    Object.keys(revenueByCurrency).forEach((curr) => {
      formattedRevenue[curr] = {
        collectedMinor: revenueByCurrency[curr].collectedMinor,
        collectedFormatted: (revenueByCurrency[curr].collectedMinor / 100).toLocaleString('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        totalAmountFormatted: (revenueByCurrency[curr].totalAmountMinor / 100).toLocaleString('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        salesCount: revenueByCurrency[curr].salesCount,
      };
    });

    // Salespeople performance ranking (only for client / admin / super_admin)
    let salespeoplePerformance = [];
    if (!isSalesperson && targetClientId) {
      const salespeople = await usersCollection
        .find({
          status: 'active',
          $or: [{ clientId: targetClientId }, { clientIds: targetClientId }],
        })
        .project({ displayName: 1, email: 1, role: 1 })
        .toArray();

      for (const sp of salespeople) {
        const [spTotal, spWon] = await Promise.all([
          leadsCollection.countDocuments({ clientId: targetClientId, assignedToUserId: sp._id, status: 'active' }),
          leadsCollection.countDocuments({ clientId: targetClientId, assignedToUserId: sp._id, stage: 'won', status: 'active' }),
        ]);

        const spLeads = await leadsCollection.find({ clientId: targetClientId, assignedToUserId: sp._id }).project({ _id: 1 }).toArray();
        const spLeadIds = spLeads.map((l) => l._id);
        const spSales = await salesCollection.find({ clientId: targetClientId, leadId: { $in: spLeadIds }, status: { $ne: 'cancelled' } }).toArray();

        let spCollectedMinor = 0;
        spSales.forEach((s) => {
          spCollectedMinor += s.collectedAmountDefaultMinor || s.collectedAmountMinor || 0;
        });

        const spHasConv = spTotal > 0;
        const spConvRate = spHasConv ? Number(((spWon / spTotal) * 100).toFixed(1)) : null;

        salespeoplePerformance.push({
          id: sp._id.toString(),
          displayName: sp.displayName || sp.email,
          email: sp.email,
          role: sp.role,
          leadsCount: spTotal,
          wonLeadsCount: spWon,
          conversionRate: spConvRate,
          hasConversionData: spHasConv,
          collectedMinor: spCollectedMinor,
          collectedFormatted: (spCollectedMinor / 100).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
        });
      }

      salespeoplePerformance.sort((a, b) => b.collectedMinor - a.collectedMinor);
    }

    const defaultCurrency = clientDoc?.defaultCurrency || 'ARS';

    return jsonResponse(200, {
      kpis: {
        totalLeadsCount,
        activeLeadsCount: totalLeadsCount,
        wonLeadsCount,
        conversionRate,
        hasConversionData,
        pipelineBreakdown: {
          new: newLeadsCount,
          contacted: contactedLeadsCount,
          qualified: qualifiedLeadsCount,
          won: wonLeadsCount,
          lost: lostLeadsCount,
        },
        revenueByCurrency: formattedRevenue,
        totalCollectedDefaultMinor,
        totalCollectedFormatted: (totalCollectedDefaultMinor / 100).toLocaleString('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        defaultCurrency,
        // Explicit Meta Ads Placeholders without false zeros (Stage 4)
        metaMetrics: {
          hasMetaIntegration: false,
          adSpend: null,
          cpl: null,
          cpa: null,
          roas: null,
          message: 'Sin datos de Meta Ads (Integración programada para Etapa 4).',
        },
      },
      salespeoplePerformance,
    });
  } catch (err) {
    console.error('[API_DASHBOARD_ERROR]', err.message);
    return errorResponse(500, 'Error interno al generar las estadísticas del dashboard.', 'INTERNAL_SERVER_ERROR');
  }
}
