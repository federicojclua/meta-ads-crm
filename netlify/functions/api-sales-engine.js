import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { sanitizeAIToolPermissionMatrix, DEFAULT_TOOL_PERMISSIONS } from '../../models/AIToolPermissionMatrix.js';
import { sanitizeAIActionLog } from '../../models/AIActionLog.js';
import { approveAIActionService, rejectAIActionService } from './_shared/aiSalesEngine/controlPlaneService.js';
import { executeFollowUpCadenceService } from './_shared/aiSalesEngine/followUpEngine.js';
import { computeSalesIntelligenceService, computeWhatsAppAttributionService } from './_shared/aiSalesEngine/salesIntelligenceService.js';

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
  const permCollection = db.collection('ai_tool_permissions');
  const actionLogsCollection = db.collection('ai_action_logs');
  const leadsCollection = db.collection('leads');

  const rawPath = event.path || '';
  const subPath = rawPath
    .replace(/^\/?\.netlify\/functions\/api-sales-engine\/?/, '')
    .replace(/^\/?api\/sales-engine\/?/, '');
  const method = event.httpMethod;

  try {
    const tenantFilter = isGlobal && !clientScope
      ? {}
      : { clientId: new ObjectId(clientScope) };

    // GET /api/sales-engine/permissions
    if (method === 'GET' && subPath === 'permissions') {
      const doc = await permCollection.findOne(tenantFilter);
      const matrix = doc ? sanitizeAIToolPermissionMatrix(doc) : sanitizeAIToolPermissionMatrix({ clientId: clientScope });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, matrix }),
      };
    }

    // PUT /api/sales-engine/permissions
    if (method === 'PUT' && subPath === 'permissions') {
      const body = JSON.parse(event.body || '{}');
      const targetClientId = clientScope || body.clientId;

      const updatedPermissions = {
        clientId: new ObjectId(targetClientId),
        permissions: body.permissions || DEFAULT_TOOL_PERMISSIONS,
        updatedAt: new Date().toISOString(),
      };

      await permCollection.updateOne(
        { clientId: new ObjectId(targetClientId) },
        { $set: updatedPermissions },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Matriz de permisos de herramientas actualizada exitosamente.',
          matrix: sanitizeAIToolPermissionMatrix(updatedPermissions),
        }),
      };
    }

    // GET /api/sales-engine/action-logs
    if (method === 'GET' && subPath === 'action-logs') {
      const params = event.queryStringParameters || {};
      const query = { ...tenantFilter };
      if (params.status) {
        query.status = params.status;
      }
      if (params.agentRole) {
        query.agentRole = params.agentRole;
      }

      const logs = await actionLogsCollection.find(query).sort({ timestamp: -1 }).limit(100).toArray();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, logs: logs.map(sanitizeAIActionLog) }),
      };
    }

    // POST /api/sales-engine/action-logs/:id/approve
    if (method === 'POST' && subPath.includes('/approve')) {
      const logId = subPath.split('/')[1] || subPath.split('/')[0];
      const result = await approveAIActionService({ logId, approverUser: user, db });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/sales-engine/action-logs/:id/reject
    if (method === 'POST' && subPath.includes('/reject')) {
      const logId = subPath.split('/')[1] || subPath.split('/')[0];
      const body = JSON.parse(event.body || '{}');
      const result = await rejectAIActionService({
        logId,
        approverUser: user,
        reason: body.reason || 'Rechazado por el operador.',
        db,
      });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...result }),
      };
    }

    // POST /api/sales-engine/follow-up/run
    if (method === 'POST' && subPath === 'follow-up/run') {
      const leads = await leadsCollection.find({ ...tenantFilter, stage: { $in: ['new', 'contacted'] } }).toArray();
      const result = await executeFollowUpCadenceService({
        leads,
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

    // GET /api/sales-engine/sales-intelligence
    if (method === 'GET' && subPath === 'sales-intelligence') {
      const intelligence = await computeSalesIntelligenceService({ clientId: clientScope, db });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...intelligence }),
      };
    }

    // GET /api/sales-engine/attribution
    if (method === 'GET' && subPath === 'attribution') {
      const attribution = await computeWhatsAppAttributionService({ clientId: clientScope, db });
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, ...attribution }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Sales Engine API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
