import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { validateGoogleSource, createGoogleSourceDocument } from '../../models/GoogleSource.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const sourcesCollection = db.collection('google_sources');
  const snapshotsCollection = db.collection('google_snapshots');
  const reviewsCollection = db.collection('google_reviews');
  const analysesCollection = db.collection('google_analyses');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-google-sources/, '')
    .replace(/^\/api\/google\/sources/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // GET /api/google/sources (List entities)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      const params = event.queryStringParameters || {};
      const rawClientId = params.clientId;
      const cleanClientId = (rawClientId && rawClientId !== 'undefined' && rawClientId !== 'null' && rawClientId !== 'all')
        ? rawClientId.trim()
        : null;

      const targetClientId = isGlobal ? cleanClientId : clientScope;

      if (!targetClientId && !isGlobal) {
        return jsonResponse(200, { ok: true, sources: [] });
      }

      let query = {};
      if (targetClientId) {
        const clientQuery = ObjectId.isValid(targetClientId)
          ? { $or: [{ clientId: new ObjectId(targetClientId) }, { clientId: targetClientId }] }
          : { clientId: targetClientId };
        query = { ...clientQuery, status: { $ne: 'deleted' } };
      } else {
        query = { status: { $ne: 'deleted' } };
      }

      const sources = await sourcesCollection.find(query).sort({ createdAt: -1 }).toArray();
      const sanitized = (sources || []).map(s => ({
        id: s._id ? s._id.toString() : '',
        clientId: s.clientId ? s.clientId.toString() : '',
        sourceType: s.sourceType || 'manual',
        businessName: s.businessName || '',
        websiteUrl: s.websiteUrl || '',
        address: s.address || '',
        phone: s.phone || '',
        category: s.category || 'General',
        city: s.city || '',
        googleBusinessProfile: s.googleBusinessProfile || {},
        searchConsole: s.searchConsole || {},
        googleAnalytics4: s.googleAnalytics4 || {},
        googleAds: s.googleAds || {},
        status: s.status || 'active',
        lastSyncedAt: s.lastSyncedAt || null,
        createdAt: s.createdAt || null,
      }));

      return jsonResponse(200, { ok: true, sources: sanitized });
    }

    // ----------------------------------------------------
    // POST /api/google/sources (Create / Upsert configuration)
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

      const sourceData = {
        ...body,
        clientId: targetClientId,
      };

      const validation = validateGoogleSource(sourceData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const doc = createGoogleSourceDocument(sourceData, user._id);
      const insertRes = await sourcesCollection.insertOne(doc);

      return jsonResponse(201, {
        ok: true,
        sourceId: insertRes.insertedId.toString(),
        source: {
          id: insertRes.insertedId.toString(),
          ...doc,
          _id: undefined,
          clientId: doc.clientId.toString(),
        },
      });
    }

    // ----------------------------------------------------
    // DELETE /api/google/sources/:id (Disconnect & purge data)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'DELETE') {
      const sourceIdStr = segments[0];
      if (!ObjectId.isValid(sourceIdStr)) {
        return errorResponse(400, 'ID de fuente inválido.', 'INVALID_ID');
      }

      const sourceId = new ObjectId(sourceIdStr);
      const existing = await sourcesCollection.findOne({ _id: sourceId });
      if (!existing) {
        return errorResponse(404, 'Fuente de Google no encontrada.', 'NOT_FOUND');
      }

      if (!isGlobal && existing.clientId?.toString() !== clientScope?.toString()) {
        return errorResponse(403, 'No tienes permisos para eliminar esta fuente.', 'FORBIDDEN_TENANT');
      }

      await sourcesCollection.deleteOne({ _id: sourceId });
      await snapshotsCollection.deleteMany({ sourceId });
      await reviewsCollection.deleteMany({ sourceId });
      await analysesCollection.deleteMany({ sourceId });

      return jsonResponse(200, {
        ok: true,
        purged: true,
        message: 'Fuente de Google y sus datos asociados purgados correctamente.',
      });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_GOOGLE_SOURCES_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando fuentes de Google.', 'INTERNAL_ERROR');
  }
}
