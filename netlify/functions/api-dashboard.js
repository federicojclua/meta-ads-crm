import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';

async function findClient(idOrSlug, clientsCollection) {
  if (!idOrSlug) return null;
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

    let activeClients = [];
    if (clientsCollection && typeof clientsCollection.find === 'function') {
      const activeClientsCursor = clientsCollection.find({
        $or: [
          { status: 'active' },
          { status: { $exists: false } }
        ]
      });
      activeClients = activeClientsCursor && typeof activeClientsCursor.toArray === 'function'
        ? await activeClientsCursor.toArray()
        : [];
    }
    const activeClientIds = activeClients.map(c => c._id);
    const activeClientIdStrings = activeClients.map(c => c._id.toString());
    const allActiveIdentifiers = [...activeClientIds, ...activeClientIdStrings];

    let isRequestingAll = true;

    if (!isGlobal) {
      isRequestingAll = false;
      if (!clientScope || !/^[a-zA-Z0-9-_]+$/.test(clientScope)) {
        return errorResponse(400, 'Identificador de empresa malformado en la sesión.', 'INVALID_CLIENT_ID');
      }
      clientDoc = await findClient(clientScope, clientsCollection);
      const clientStatus = clientDoc?.status || 'active';
      if (!clientDoc || clientStatus !== 'active') {
        return errorResponse(404, 'La empresa especificada no existe o está inactiva.', 'CLIENT_NOT_FOUND');
      }
      targetClientId = clientDoc._id;
    } else if (params.clientId && params.clientId.trim() !== '') {
      const trimmedId = params.clientId.trim();
      if (trimmedId.toLowerCase() !== 'all') {
        isRequestingAll = false;
        if (!/^[a-zA-Z0-9-_]+$/.test(trimmedId)) {
          return errorResponse(400, 'Identificador de empresa malformado.', 'INVALID_CLIENT_ID');
        }
        clientDoc = await findClient(trimmedId, clientsCollection);
        const clientStatus = clientDoc?.status || 'active';
        if (!clientDoc || clientStatus !== 'active') {
          return errorResponse(404, 'La empresa especificada no existe o está inactiva.', 'CLIENT_NOT_FOUND');
        }
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
    if (!isRequestingAll && targetClientId) {
      leadQuery.clientId = targetClientId;
    } else if (isRequestingAll) {
      leadQuery.clientId = { $in: allActiveIdentifiers };
    }

    if (isSalesperson) {
      leadQuery.assignedToUserId = user._id;
    }
    if (Object.keys(dateFilter).length > 0) {
      leadQuery.acquiredAt = dateFilter;
    }

    // Sales query (strictly exclude cancelled sales)
    const salesQuery = { status: { $ne: 'cancelled' } };
    if (!isRequestingAll && targetClientId) {
      salesQuery.clientId = targetClientId;
    } else if (isRequestingAll) {
      salesQuery.clientId = { $in: allActiveIdentifiers };
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

      if (!isRequestingAll && targetClientId) {
        spQuery.$or = [
          { clientId: targetClientId },
          { clientIds: targetClientId },
          { clientId: targetClientId.toString() },
          { clientIds: targetClientId.toString() },
        ];
      } else {
        spQuery.$or = [
          { clientId: { $in: allActiveIdentifiers } },
          { clientIds: { $in: allActiveIdentifiers } },
        ];
      }

      const rawSalespeople = await usersCollection
        .find(spQuery)
        .project({ displayName: 1, email: 1, role: 1, status: 1, clientId: 1, clientIds: 1 })
        .toArray();
      const salespeople = rawSalespeople.filter(u => u.role === 'salesperson');

      for (const sp of salespeople) {
        const leadFilter = {
          assignedToUserId: sp._id,
          status: 'active',
        };
        if (!isRequestingAll && targetClientId) {
          leadFilter.clientId = targetClientId;
        } else {
          leadFilter.clientId = { $in: allActiveIdentifiers };
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
        if (!isRequestingAll && targetClientId) {
          spSalesQuery.clientId = targetClientId;
        } else {
          spSalesQuery.clientId = { $in: allActiveIdentifiers };
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

        const spClientId = sp.clientId || sp.clientIds?.[0];
        const associatedClient = activeClients.find(
          (c) => c._id.toString() === spClientId?.toString() || c.slug === spClientId?.toString()
        );
        const companyName = associatedClient ? associatedClient.name : 'Sin empresa';

        salespeoplePerformance.push({
          id: sp._id.toString(),
          displayName: sp.displayName || sp.email,
          companyName,
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
      if (!isRequestingAll && targetClientId) {
        metaMatch.clientId = targetClientId;
      } else if (isRequestingAll) {
        metaMatch.clientId = { $in: allActiveIdentifiers };
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

    const spendByCurrency = {};
    const roasByCurrency = {};
    const cplByCurrency = {};
    const cpaByCurrency = {};

    let hasMetaIntegration = false;
    if (!isRequestingAll) {
      hasMetaIntegration = !!(clientDoc && Array.isArray(clientDoc.metaAdAccountIds) && clientDoc.metaAdAccountIds.length > 0);
    } else {
      hasMetaIntegration = activeClients.some(c => Array.isArray(c.metaAdAccountIds) && c.metaAdAccountIds.length > 0);
    }

    metaSummary.forEach((row) => {
      const curr = row._id || 'ARS';
      const sMinor = row.spendMinor || 0;
      spendByCurrency[curr] = {
        spendMinor: sMinor,
        spendFormatted: (sMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      };

      // ROAS per currency
      const revMinor = (revenueByCurrency && revenueByCurrency[curr]?.collectedMinor) || 0;
      if (sMinor > 0 && revMinor > 0) {
        roasByCurrency[curr] = Number((revMinor / sMinor).toFixed(2));
      } else {
        roasByCurrency[curr] = null;
      }

      // CPL and CPA per currency
      if (sMinor > 0 && totalLeadsCount > 0) {
        cplByCurrency[curr] = Number(((sMinor / 100) / totalLeadsCount).toFixed(2));
      } else {
        cplByCurrency[curr] = null;
      }

      if (sMinor > 0 && wonLeadsCount > 0) {
        cpaByCurrency[curr] = Number(((sMinor / 100) / wonLeadsCount).toFixed(2));
      } else {
        cpaByCurrency[curr] = null;
      }
    });

    // Format outputs
    let adSpendFormatted = 'Sin datos de Meta';
    if (hasMetaIntegration) {
      adSpendFormatted = '0,00';
    }
    const spendKeys = Object.keys(spendByCurrency);
    if (spendKeys.length === 1) {
      const curr = spendKeys[0];
      adSpendFormatted = spendByCurrency[curr].spendFormatted;
    } else if (spendKeys.length > 1) {
      adSpendFormatted = spendKeys.map(curr => {
        return `${spendByCurrency[curr].spendFormatted} ${curr}`;
      }).join(' / ');
    }

    let roasFormatted = '—';
    let hasRoas = false;
    const roasKeys = Object.keys(roasByCurrency).filter(k => roasByCurrency[k] !== null);
    if (roasKeys.length === 1) {
      roasFormatted = `${roasByCurrency[roasKeys[0]]}x`;
      hasRoas = true;
    } else if (roasKeys.length > 1) {
      roasFormatted = roasKeys.map(curr => `${roasByCurrency[curr]}x ${curr}`).join(' / ');
      hasRoas = true;
    }

    let cplFormatted = '—';
    let hasCpl = false;
    const cplKeys = Object.keys(cplByCurrency).filter(k => cplByCurrency[k] !== null);
    if (cplKeys.length === 1) {
      const curr = cplKeys[0];
      cplFormatted = cplByCurrency[curr].toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      hasCpl = true;
    } else if (cplKeys.length > 1) {
      cplFormatted = cplKeys.map(curr => {
        return `${cplByCurrency[curr].toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
      }).join(' / ');
      hasCpl = true;
    }

    let cpaFormatted = '—';
    let hasCpa = false;
    const cpaKeys = Object.keys(cpaByCurrency).filter(k => cpaByCurrency[k] !== null);
    if (cpaKeys.length === 1) {
      const curr = cpaKeys[0];
      cpaFormatted = cpaByCurrency[curr].toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      hasCpa = true;
    } else if (cpaKeys.length > 1) {
      cpaFormatted = cpaKeys.map(curr => {
        return `${cpaByCurrency[curr].toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
      }).join(' / ');
      hasCpa = true;
    }

    let totalCollectedFormatted = '0,00';
    const revKeys = Object.keys(revenueByCurrency);
    if (revKeys.length === 1) {
      const curr = revKeys[0];
      totalCollectedFormatted = (revenueByCurrency[curr].collectedMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (revKeys.length > 1) {
      totalCollectedFormatted = revKeys.map(curr => {
        return `${(revenueByCurrency[curr].collectedMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
      }).join(' / ');
    }

    const defaultCurrency = clientDoc?.defaultCurrency || 'ARS';

    const amountsByCurrency = {};
    if (Object.keys(revenueByCurrency).length === 0) {
      if (!isRequestingAll) {
        amountsByCurrency[defaultCurrency] = 0;
      }
    } else {
      Object.keys(revenueByCurrency).forEach(curr => {
        amountsByCurrency[curr] = Number((revenueByCurrency[curr].collectedMinor / 100).toFixed(2));
      });
    }

    const spendAmountsByCurrency = {};
    const cplAmountsByCurrency = {};
    const cpaAmountsByCurrency = {};

    Object.keys(spendByCurrency).forEach(curr => {
      spendAmountsByCurrency[curr] = Number((spendByCurrency[curr].spendMinor / 100).toFixed(2));
    });
    if (hasMetaIntegration && spendKeys.length === 0 && !isRequestingAll) {
      spendAmountsByCurrency[defaultCurrency] = 0;
    }

    Object.keys(cplByCurrency).forEach(curr => {
      if (cplByCurrency[curr] !== null) {
        cplAmountsByCurrency[curr] = Number(cplByCurrency[curr].toFixed(2));
      }
    });
    Object.keys(cpaByCurrency).forEach(curr => {
      if (cpaByCurrency[curr] !== null) {
        cpaAmountsByCurrency[curr] = Number(cpaByCurrency[curr].toFixed(2));
      }
    });

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
        totalCollectedFormatted,
        amountsByCurrency,
        defaultCurrency,
        metaMetrics: {
          hasMetaIntegration,
          adSpend: hasMetaIntegration ? 1 : null,
          adSpendFormatted,
          spendByCurrency,
          spendAmountsByCurrency,
          roasByCurrency,
          cplByCurrency,
          cplAmountsByCurrency,
          cpaByCurrency,
          cpaAmountsByCurrency,
          cplFormatted,
          hasCpl,
          cpaFormatted,
          hasCpa,
          roasFormatted,
          hasRoas,
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
