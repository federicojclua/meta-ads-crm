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
      // Force user's authoritative tenant scope (ignore any client param from browser)
      targetClientId = ObjectId.isValid(clientScope) ? new ObjectId(clientScope) : clientScope;
      clientDoc = await clientsCollection.findOne({
        $or: [
          ...(ObjectId.isValid(clientScope) ? [{ _id: new ObjectId(clientScope) }] : []),
          { _id: clientScope },
          { slug: clientScope },
        ],
      });
    } else if (params.clientId && params.clientId.trim() !== '' && params.clientId.trim() !== 'all') {
      const rawId = params.clientId.trim();
      const queryConditions = [
        ...(ObjectId.isValid(rawId) ? [{ _id: new ObjectId(rawId) }] : []),
        { _id: rawId },
        { slug: rawId },
      ];
      clientDoc = await clientsCollection.findOne({ $or: queryConditions });
      if (!clientDoc || clientDoc.status !== 'active') {
        return errorResponse(404, 'La empresa especificada no existe o está inactiva.', 'CLIENT_NOT_FOUND');
      }
      targetClientId = clientDoc._id;
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

    // Sales query (strictly exclude cancelled sales)
    const salesQuery = { status: { $ne: 'cancelled' } };
    if (targetClientId) {
      salesQuery.clientId = targetClientId;
    }
    if (Object.keys(dateFilter).length > 0) {
      salesQuery.soldAt = dateFilter;
    }

    // If salesperson, only aggregate sales belonging to their assigned leads
    if (isSalesperson) {
      const assignedLeads = await leadsCollection
        .find({ assignedToUserId: user._id })
        .project({ _id: 1 })
        .toArray();
      const leadIds = assignedLeads.map((l) => l._id);
      salesQuery.leadId = { $in: leadIds };
    }

    // Fetch lead aggregates in parallel
    const [
      totalLeadsCount,
      newLeadsCount,
      contactedLeadsCount,
      qualifiedLeadsCount,
      wonLeadsCount,
      lostLeadsCount,
      allSales,
    ] = await Promise.all([
      leadsCollection.countDocuments(leadQuery),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'new' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'contacted' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'qualified' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'won' }),
      leadsCollection.countDocuments({ ...leadQuery, stage: 'lost' }),
      salesCollection.find(salesQuery).toArray(),
    ]);

    // Conversion rate: null and hasConversionData: false when denominator is zero
    const hasConversionData = totalLeadsCount > 0;
    const conversionRate = hasConversionData
      ? Number(((wonLeadsCount / totalLeadsCount) * 100).toFixed(1))
      : null;

    // Aggregate revenue per currency
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

    // Format revenue numbers
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

    // Salespeople performance ranking (for client / admin / super_admin)
    let salespeoplePerformance = [];
    if (!isSalesperson) {
      const spQuery = {
        role: 'salesperson',
        status: { $in: ['active', 'invited'] },
      };

      if (targetClientId) {
        spQuery.$or = [
          { clientId: targetClientId },
          { clientIds: targetClientId },
          { clientId: targetClientId.toString() },
          { clientIds: targetClientId.toString() },
        ];
      }

      const salespeople = await usersCollection
        .find(spQuery)
        .project({ displayName: 1, email: 1, role: 1, status: 1, clientId: 1, clientIds: 1 })
        .toArray();

      for (const sp of salespeople) {
        const leadFilter = {
          assignedToUserId: sp._id,
          status: 'active',
        };
        if (targetClientId) {
          leadFilter.clientId = targetClientId;
        }

        const [spTotal, spWon] = await Promise.all([
          leadsCollection.countDocuments(leadFilter),
          leadsCollection.countDocuments({ ...leadFilter, stage: 'won' }),
        ]);

        const spLeads = await leadsCollection.find(leadFilter).project({ _id: 1 }).toArray();
        const spLeadIds = spLeads.map((l) => l._id);

        const spSalesQuery = {
          leadId: { $in: spLeadIds },
          status: { $ne: 'cancelled' },
        };
        if (targetClientId) {
          spSalesQuery.clientId = targetClientId;
        }

        const spSales = await salesCollection.find(spSalesQuery).toArray();

        let spCollectedMinor = 0;
        const spRevenueByCurrency = {};

        spSales.forEach((s) => {
          const curr = s.currency || 'ARS';
          const collectedMinor = s.collectedAmountMinor || 0;
          const collectedDefaultMinor = s.collectedAmountDefaultMinor || collectedMinor;

          if (!spRevenueByCurrency[curr]) {
            spRevenueByCurrency[curr] = { collectedMinor: 0, salesCount: 0 };
          }
          spRevenueByCurrency[curr].collectedMinor += collectedMinor;
          spRevenueByCurrency[curr].salesCount += 1;

          spCollectedMinor += collectedDefaultMinor;
        });

        const spFormattedCurrency = {};
        Object.keys(spRevenueByCurrency).forEach((curr) => {
          spFormattedCurrency[curr] = {
            collectedMinor: spRevenueByCurrency[curr].collectedMinor,
            collectedFormatted: (spRevenueByCurrency[curr].collectedMinor / 100).toLocaleString('es-AR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            salesCount: spRevenueByCurrency[curr].salesCount,
          };
        });

        const spHasConv = spTotal > 0;
        const spConvRate = spHasConv ? Number(((spWon / spTotal) * 100).toFixed(1)) : null;

        salespeoplePerformance.push({
          id: sp._id.toString(),
          displayName: sp.displayName || sp.email,
          email: sp.email,
          role: sp.role,
          status: sp.status,
          isPendingActivation: sp.status === 'invited',
          leadsCount: spTotal,
          wonLeadsCount: spWon,
          salesCount: spSales.length,
          conversionRate: spConvRate,
          hasConversionData: spHasConv,
          collectedMinor: spCollectedMinor,
          collectedFormatted: (spCollectedMinor / 100).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          revenueByCurrency: spFormattedCurrency,
        });
      }

      salespeoplePerformance.sort((a, b) => b.collectedMinor - a.collectedMinor);
    }

    // Aggregate Meta Ads Metrics (Stage 4)
    let metaSummary = [];
    try {
      const metaInsightsCollection = db?.collection ? db.collection('meta_insights_daily') : null;
      const metaMatch = {};
      if (targetClientId) {
        metaMatch.clientId = targetClientId;
      }
      if (params.startDate || params.endDate) {
        metaMatch.date = {};
        if (params.startDate) metaMatch.date.$gte = params.startDate;
        if (params.endDate) metaMatch.date.$lte = params.endDate;
      }

      if (metaInsightsCollection && typeof metaInsightsCollection.aggregate === 'function') {
        metaSummary = await metaInsightsCollection
          .aggregate([
            { $match: metaMatch },
            {
              $group: {
                _id: '$currency',
                spendMinor: { $sum: '$spendMinor' },
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' },
              },
            },
          ])
          .toArray();
      }
    } catch {
      metaSummary = [];
    }

    let totalSpendDefaultMinor = 0;
    const spendByCurrency = {};
    const roasByCurrency = {};
    let hasMetaIntegration = metaSummary.length > 0;

    metaSummary.forEach((row) => {
      const curr = row._id || 'ARS';
      const sMinor = row.spendMinor || 0;
      spendByCurrency[curr] = {
        spendMinor: sMinor,
        spendFormatted: (sMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      };
      totalSpendDefaultMinor += sMinor;

      // Currency-segregated ROAS calculation
      const revMinor = (revenueByCurrency && revenueByCurrency[curr]?.collectedMinor) || 0;
      if (sMinor > 0 && revMinor > 0) {
        roasByCurrency[curr] = Number((revMinor / sMinor).toFixed(2));
      } else {
        roasByCurrency[curr] = null;
      }
    });

    const totalAdSpend = totalSpendDefaultMinor / 100;
    const totalCollected = totalCollectedDefaultMinor / 100;
    const defaultCurrency = clientDoc?.defaultCurrency || 'ARS';

    // Derived Financial & Performance KPIs (Blended Tenant Level)
    const cpl = hasMetaIntegration && totalLeadsCount > 0
      ? Number((totalAdSpend / totalLeadsCount).toFixed(2))
      : null;
    const cpa = hasMetaIntegration && wonLeadsCount > 0
      ? Number((totalAdSpend / wonLeadsCount).toFixed(2))
      : null;
    const primaryCurrency = Object.keys(spendByCurrency)[0] || defaultCurrency;
    const primaryRoas = roasByCurrency[primaryCurrency] ?? (hasMetaIntegration && totalAdSpend > 0 && totalCollected > 0
      ? Number((totalCollected / totalAdSpend).toFixed(2))
      : null);

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
        metaMetrics: {
          hasMetaIntegration,
          adSpend: hasMetaIntegration ? totalAdSpend : null,
          adSpendFormatted: hasMetaIntegration
            ? (totalSpendDefaultMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '0,00',
          spendByCurrency,
          roasByCurrency,
          cpl,
          hasCpl: cpl !== null,
          cpa,
          hasCpa: cpa !== null,
          roas: primaryRoas,
          hasRoas: primaryRoas !== null,
          isBlended: true,
          attributionNote: 'Métrica blended a nivel empresa — no atribuida a campañas particulares.',
          message: hasMetaIntegration ? 'Datos sincronizados de Meta Ads (Métricas blended).' : 'Sin datos de Meta Ads.',
        },
      },
      salespeoplePerformance,
    });
  } catch (err) {
    console.error('[API_DASHBOARD_ERROR]', err.message);
    return errorResponse(500, 'Error interno al generar las estadísticas del dashboard.', 'INTERNAL_SERVER_ERROR');
  }
}
