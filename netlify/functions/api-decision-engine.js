import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { checkRateLimit, getClientIp } from './_shared/rateLimiter.js';
import {
  scanTenantAnomaliesService,
} from './_shared/decisionEngine/alertEngineService.js';
import {
  listExperimentsService,
  createExperimentService,
  calculateABStatistics,
} from './_shared/decisionEngine/experimentationService.js';
import {
  executeDecisionActionService,
} from './_shared/decisionEngine/decisionEngineService.js';

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
  const rawPath = event.path || '';
  const subPath = rawPath
    .replace(/^\/?\.netlify\/functions\/api-decision-engine\/?/, '')
    .replace(/^\/?api\/decision-engine\/?/, '');
  const method = event.httpMethod;

  try {
    // GET /api/decision-engine/alerts
    if (method === 'GET' && subPath === 'alerts') {
      const alerts = await scanTenantAnomaliesService({
        clientId: clientScope,
        db,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, alerts }),
      };
    }

    // POST /api/decision-engine/execute-action (Rate limited: 10 req/min)
    if (method === 'POST' && subPath === 'execute-action') {
      const clientIp = getClientIp(event);
      const isAllowed = await checkRateLimit(clientIp, 'decision-execute-action', 10, 60000);
      if (!isAllowed) {
        return {
          statusCode: 429,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Límite de ejecución de acciones excedido (10/min).', code: 'RATE_LIMIT_EXCEEDED' }),
        };
      }
      const body = JSON.parse(event.body || '{}');
      const { alertId, actionType, targetId, payload } = body;

      const result = await executeDecisionActionService({
        alertId,
        actionType,
        targetId,
        payload,
        clientId: clientScope,
        user,
        db,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // GET /api/decision-engine/experiments
    if (method === 'GET' && subPath === 'experiments') {
      const experiments = await listExperimentsService({
        clientId: clientScope,
        db,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, experiments }),
      };
    }

    // POST /api/decision-engine/experiments/create (Rate limited: 10 req/min)
    if (method === 'POST' && (subPath === 'experiments/create' || subPath === 'experiments')) {
      const clientIp = getClientIp(event);
      const isAllowed = await checkRateLimit(clientIp, 'decision-experiment-create', 10, 60000);
      if (!isAllowed) {
        return {
          statusCode: 429,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Límite de creación de experimentos excedido (10/min).', code: 'RATE_LIMIT_EXCEEDED' }),
        };
      }
      const body = JSON.parse(event.body || '{}');
      const created = await createExperimentService({
        clientId: clientScope,
        experimentData: body,
        db,
      });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, experiment: created }),
      };
    }

    // POST /api/decision-engine/experiments/evaluate (Rate limited: 20 req/min)
    if (method === 'POST' && subPath === 'experiments/evaluate') {
      const clientIp = getClientIp(event);
      const isAllowed = await checkRateLimit(clientIp, 'decision-experiment-evaluate', 20, 60000);
      if (!isAllowed) {
        return {
          statusCode: 429,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Límite de evaluación estadística excedido (20/min).', code: 'RATE_LIMIT_EXCEEDED' }),
        };
      }
      const body = JSON.parse(event.body || '{}');
      const stats = calculateABStatistics(body);

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, stats }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Decision Engine API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
