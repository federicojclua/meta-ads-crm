import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { sanitizeBusinessMemory, DEFAULT_BUSINESS_MEMORY } from '../../models/BusinessMemory.js';
import { sanitizeBusinessGoals, DEFAULT_BUSINESS_GOALS } from '../../models/BusinessGoals.js';
import {
  computeAnimaHealthScore,
  computeGoalsAndForecast,
  computeAgencyProfitability,
} from './_shared/memoryEngine.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  const authResult = await verifyAuthorizedUser(event);
  if (!authResult.authorized) {
    return {
      statusCode: authResult.statusCode || 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: authResult.error }),
    };
  }

  const { db, clientScope, isGlobal, user } = authResult;
  const memoryCollection = db.collection('business_memories');
  const goalsCollection = db.collection('business_goals');
  const usageCollection = db.collection('usage_events');

  const rawPath = event.path || '';
  const subPath = rawPath
    .replace(/^\/?\.netlify\/functions\/api-business-intelligence\/?/, '')
    .replace(/^\/?api\/business-intelligence\/?/, '');
  const method = event.httpMethod;

  try {
    const tenantFilter = isGlobal && !clientScope
      ? {}
      : { clientId: new ObjectId(clientScope) };

    // GET /api/business-intelligence/health-score
    if (method === 'GET' && (subPath === 'health-score' || subPath === '')) {
      const memoryDoc = await memoryCollection.findOne(tenantFilter);
      const memory = memoryDoc ? sanitizeBusinessMemory(memoryDoc) : sanitizeBusinessMemory({ clientId: clientScope });

      const healthScore = computeAnimaHealthScore({
        metrics: {
          currentCpl: 1482,
          avgCtr: 3.82,
          creativeFatigueDetected: false,
          closeRatePct: 16.6,
          slaCompliancePct: 94.5,
          actualRevenue: 18199986,
          revenueTarget: 20000000,
          netMarginPct: 28.4,
        },
        historicalMemory: memory,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, healthScore }),
      };
    }

    // GET /api/business-intelligence/forecast
    if (method === 'GET' && subPath === 'forecast') {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const goalDoc = await goalsCollection.findOne({ ...tenantFilter, period: currentPeriod });
      const goals = goalDoc ? sanitizeBusinessGoals(goalDoc) : sanitizeBusinessGoals({ clientId: clientScope });

      const forecast = computeGoalsAndForecast({
        actuals: {
          revenue: 18199986,
          sales: 14,
          leads: 84,
          cpa: 8892,
          roas: 146.18,
          profit: 5168796,
        },
        goals: goals.targets,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, forecast, goals }),
      };
    }

    // POST /api/business-intelligence/goals
    if (method === 'POST' && subPath === 'goals') {
      const body = JSON.parse(event.body || '{}');
      const currentPeriod = body.period || new Date().toISOString().slice(0, 7);
      const targetClientId = clientScope || body.clientId;

      const goalsData = {
        clientId: new ObjectId(targetClientId),
        period: currentPeriod,
        targets: {
          revenueTarget: Number(body.revenueTarget) || DEFAULT_BUSINESS_GOALS.revenueTarget,
          salesTarget: Number(body.salesTarget) || DEFAULT_BUSINESS_GOALS.salesTarget,
          leadTarget: Number(body.leadTarget) || DEFAULT_BUSINESS_GOALS.leadTarget,
          cpaTarget: Number(body.cpaTarget) || DEFAULT_BUSINESS_GOALS.cpaTarget,
          roasTarget: Number(body.roasTarget) || DEFAULT_BUSINESS_GOALS.roasTarget,
          profitTarget: Number(body.profitTarget) || DEFAULT_BUSINESS_GOALS.profitTarget,
        },
        notes: body.notes || '',
        updatedAt: new Date().toISOString(),
      };

      await goalsCollection.updateOne(
        { clientId: new ObjectId(targetClientId), period: currentPeriod },
        { $set: goalsData },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Metas mensuales actualizadas exitosamente.',
          goals: sanitizeBusinessGoals(goalsData),
        }),
      };
    }

    // GET /api/business-intelligence/agency-profitability (Super Admin / Admin view)
    if (method === 'GET' && subPath === 'agency-profitability') {
      if (user.role !== 'admin' && user.role !== 'superadmin' && !isGlobal) {
        return {
          statusCode: 403,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Acceso restringido a administradores de agencia.' }),
        };
      }

      const profitability = computeAgencyProfitability({
        clientRevenue: 18199986,
        metaSpend: 124500,
        aiUsageCostUsd: 12.50,
        usdExchangeRate: 1350,
        paymentGatewayRate: 0.035,
        infrastructureCostArs: 25000,
        humanOpsCostArs: 85000,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, profitability }),
      };
    }

    // GET /api/business-intelligence/memory-snapshots
    if (method === 'GET' && subPath === 'memory-snapshots') {
      const memoryDoc = await memoryCollection.findOne(tenantFilter);
      const memory = memoryDoc ? sanitizeBusinessMemory(memoryDoc) : sanitizeBusinessMemory({ clientId: clientScope });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, memory }),
      };
    }

    // GET /api/business-intelligence/performance-dna
    if (method === 'GET' && subPath === 'performance-dna') {
      const memoryDoc = await memoryCollection.findOne(tenantFilter);
      const memory = memoryDoc ? sanitizeBusinessMemory(memoryDoc) : sanitizeBusinessMemory({ clientId: clientScope });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          performanceDna: memory.performanceDna,
          winningPatterns: memory.winningPatterns,
          losingPatterns: memory.losingPatterns,
        }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Business Intelligence API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
