import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { validateGoogleCompetitor, createGoogleCompetitorDocument } from '../../models/GoogleCompetitor.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const competitorsCollection = db.collection('google_competitors');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-google-competitors/, '')
    .replace(/^\/api\/google\/competitors/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // GET /api/google/competitors?clientId=...
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      const params = event.queryStringParameters || {};
      const rawClientId = params.clientId;
      const cleanClientId = (rawClientId && rawClientId !== 'undefined' && rawClientId !== 'null' && rawClientId !== 'all')
        ? rawClientId.trim()
        : null;

      const targetClientId = isGlobal ? cleanClientId : clientScope;

      if (!targetClientId && !isGlobal) {
        return jsonResponse(200, { ok: true, competitors: [] });
      }

      let query = {};
      if (targetClientId) {
        const clientQuery = ObjectId.isValid(targetClientId)
          ? { $or: [{ clientId: new ObjectId(targetClientId) }, { clientId: targetClientId }] }
          : { clientId: targetClientId };
        query = { ...clientQuery };
      }

      const competitors = await competitorsCollection
        .find(query)
        .sort({ rating: -1, userRatingsTotal: -1 })
        .toArray();

      const sanitized = (competitors || []).map(c => ({
        id: c._id ? c._id.toString() : '',
        clientId: c.clientId ? c.clientId.toString() : '',
        name: c.name || '',
        category: c.category || 'General',
        city: c.city || '',
        address: c.address || '',
        rating: c.rating || 0,
        userRatingsTotal: c.userRatingsTotal || 0,
        websiteUrl: c.websiteUrl || '',
        phone: c.phone || '',
        businessStatus: c.businessStatus || 'OPERATIONAL',
        strengths: c.strengths || [],
        weaknesses: c.weaknesses || [],
        source: c.source || 'manual',
        confidenceScore: c.confidenceScore || 90,
        capturedAt: c.capturedAt || null,
        createdAt: c.createdAt || null,
      }));

      return jsonResponse(200, { ok: true, competitors: sanitized });
    }

    // ----------------------------------------------------
    // POST /api/google/competitors (Add competitor)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'El cuerpo de la solicitud no es un JSON válido.', 'INVALID_JSON');
      }

      const targetClientId = isGlobal ? (body.clientId || clientScope) : clientScope;
      if (!targetClientId) {
        return errorResponse(400, 'El campo clientId es requerido.', 'MISSING_CLIENT_ID');
      }

      const compData = {
        ...body,
        clientId: targetClientId,
      };

      const validation = validateGoogleCompetitor(compData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const doc = createGoogleCompetitorDocument(compData, user._id);
      const insertRes = await competitorsCollection.insertOne(doc);

      return jsonResponse(201, {
        ok: true,
        competitorId: insertRes.insertedId.toString(),
        competitor: {
          id: insertRes.insertedId.toString(),
          ...doc,
          _id: undefined,
          clientId: doc.clientId.toString(),
        },
      });
    }

    // ----------------------------------------------------
    // DELETE /api/google/competitors/:id (Remove competitor)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'DELETE') {
      const compIdStr = segments[0];
      if (!ObjectId.isValid(compIdStr)) {
        return errorResponse(400, 'ID de competidor inválido.', 'INVALID_ID');
      }

      const compId = new ObjectId(compIdStr);
      const existing = await competitorsCollection.findOne({ _id: compId });
      if (!existing) {
        return errorResponse(404, 'Competidor no encontrado.', 'NOT_FOUND');
      }

      if (!isGlobal && existing.clientId?.toString() !== clientScope?.toString()) {
        return errorResponse(403, 'No tienes permisos para eliminar este competidor.', 'FORBIDDEN_TENANT');
      }

      await competitorsCollection.deleteOne({ _id: compId });

      return jsonResponse(200, {
        ok: true,
        message: 'Competidor eliminado correctamente.',
      });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_GOOGLE_COMPETITORS_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando competidores.', 'INTERNAL_ERROR');
  }
}
