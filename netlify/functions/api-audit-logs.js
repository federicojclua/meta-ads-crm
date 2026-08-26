import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';

export const handler = async (event) => {
  try {
    const auth = await verifyAuthorizedUser(event);
    if (!auth.authorized) {
      return errorResponse(auth.status || 401, auth.error || 'No autorizado.', auth.code || 'UNAUTHORIZED');
    }

    const { user } = auth;
    if (user.role !== 'super_admin') {
      return errorResponse(403, 'Acceso denegado. Solo el super_admin puede ver logs de auditoría.', 'FORBIDDEN');
    }

    const method = event.httpMethod;
    if (method !== 'GET') {
      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    const db = await getDb();
    const auditLogsCollection = db.collection('audit_logs');

    const params = event.queryStringParameters || {};
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '50', 10)));

    const logs = await auditLogsCollection
      .find({})
      .sort({ performedAt: -1 })
      .limit(limit)
      .toArray();

    return jsonResponse(200, {
      ok: true,
      logs: logs.map((l) => ({
        id: l._id.toString(),
        action: l.action,
        performedByUserId: l.performedByUserId ? l.performedByUserId.toString() : 'system',
        performedAt: l.performedAt ? l.performedAt.toISOString() : null,
        details: l.details || {},
      })),
    });
  } catch (err) {
    console.error('[API-AUDIT-LOGS] Error:', err.message);
    return errorResponse(500, 'Error interno del servidor al obtener logs de auditoría.', 'INTERNAL_SERVER_ERROR');
  }
};
