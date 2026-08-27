import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { validateGoogleSnapshot, createGoogleSnapshotDocument } from '../../models/GoogleSnapshot.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const snapshotsCollection = db.collection('google_snapshots');
  const sourcesCollection = db.collection('google_sources');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-google-snapshots/, '')
    .replace(/^\/api\/google\/snapshots/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // GET /api/google/snapshots?sourceId=... or ?type=...
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      const params = event.queryStringParameters || {};
      let query = {};

      if (params.sourceId && ObjectId.isValid(params.sourceId)) {
        query.sourceId = new ObjectId(params.sourceId);
      }

      const targetClientId = isGlobal ? (params.clientId || null) : clientScope;
      if (targetClientId && targetClientId !== 'all' && targetClientId !== 'undefined') {
        const clientQuery = ObjectId.isValid(targetClientId)
          ? { $or: [{ clientId: new ObjectId(targetClientId) }, { clientId: targetClientId }] }
          : { clientId: targetClientId };
        query = { ...query, ...clientQuery };
      }

      if (params.type) {
        query.type = params.type;
      }

      const snapshots = await snapshotsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

      const sanitized = (snapshots || []).map(s => ({
        id: s._id ? s._id.toString() : '',
        clientId: s.clientId ? s.clientId.toString() : '',
        sourceId: s.sourceId ? s.sourceId.toString() : '',
        type: s.type,
        startDate: s.startDate || null,
        endDate: s.endDate || null,
        data: s.data || {},
        source: s.source || 'manual',
        createdAt: s.createdAt || null,
      }));

      return jsonResponse(200, { ok: true, snapshots: sanitized });
    }

    // ----------------------------------------------------
    // POST /api/google/snapshots (Ingest snapshot)
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

      const snapshotData = {
        ...body,
        clientId: targetClientId,
      };

      const validation = validateGoogleSnapshot(snapshotData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const doc = createGoogleSnapshotDocument(snapshotData, user._id);
      const insertRes = await snapshotsCollection.insertOne(doc);

      if (body.sourceId && ObjectId.isValid(body.sourceId)) {
        await sourcesCollection.updateOne(
          { _id: new ObjectId(body.sourceId) },
          { $set: { lastSyncedAt: new Date() } }
        );
      }

      return jsonResponse(201, {
        ok: true,
        snapshotId: insertRes.insertedId.toString(),
        snapshot: {
          id: insertRes.insertedId.toString(),
          ...doc,
          _id: undefined,
          clientId: doc.clientId.toString(),
        },
      });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_GOOGLE_SNAPSHOTS_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando snapshots de Google.', 'INTERNAL_ERROR');
  }
}
