import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { validateSocialSource, createSocialSourceDocument } from '../../models/SocialSource.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const sourcesCollection = db.collection('social_sources');
  const snapshotsCollection = db.collection('social_snapshots');
  const analysesCollection = db.collection('social_analyses');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-social-sources/, '')
    .replace(/^\/api\/social\/sources/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // GET /api/social/sources or /api/social/sources?clientId=...
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      const params = event.queryStringParameters || {};
      let targetClientId = isGlobal ? (params.clientId || null) : clientScope;

      if (!targetClientId && !isGlobal) {
        return errorResponse(403, 'No tienes una empresa asignada para consultar perfiles sociales.', 'TENANT_SCOPE_MISSING');
      }

      let query = {};
      if (targetClientId && targetClientId !== 'all') {
        const clientQuery = ObjectId.isValid(targetClientId)
          ? { $or: [{ clientId: new ObjectId(targetClientId) }, { clientId: targetClientId }] }
          : { clientId: targetClientId };
        query = { ...clientQuery, status: { $ne: 'deleted' } };
      } else {
        query = { status: { $ne: 'deleted' } };
      }

      const sources = await sourcesCollection.find(query).sort({ createdAt: -1 }).toArray();
      const sanitized = sources.map(s => ({
        id: s._id.toString(),
        clientId: s.clientId.toString(),
        platform: s.platform,
        sourceType: s.sourceType,
        accountUsername: s.accountUsername,
        accountName: s.accountName,
        biography: s.biography,
        website: s.website,
        profilePictureUrl: s.profilePictureUrl,
        followersCount: s.followersCount || 0,
        followsCount: s.followsCount || 0,
        mediaCount: s.mediaCount || 0,
        status: s.status,
        lastSyncedAt: s.lastSyncedAt,
        createdAt: s.createdAt,
      }));

      return jsonResponse(200, { ok: true, sources: sanitized });
    }

    // ----------------------------------------------------
    // POST /api/social/sources (Manual or OAuth registration)
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

      const validation = validateSocialSource(sourceData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const doc = createSocialSourceDocument(sourceData, user._id);

      // Check if this username is already registered for this client & platform
      const existing = await sourcesCollection.findOne({
        clientId: doc.clientId,
        platform: doc.platform,
        accountUsername: doc.accountUsername,
        status: { $ne: 'deleted' },
      });

      if (existing) {
        // Update existing source
        await sourcesCollection.updateOne(
          { _id: existing._id },
          {
            $set: {
              accountName: doc.accountName,
              biography: doc.biography,
              website: doc.website,
              followersCount: doc.followersCount,
              followsCount: doc.followsCount,
              mediaCount: doc.mediaCount,
              status: 'active',
              updatedAt: new Date(),
            },
          }
        );
        return jsonResponse(200, {
          ok: true,
          message: 'Perfil social actualizado exitosamente.',
          sourceId: existing._id.toString(),
        });
      }

      const result = await sourcesCollection.insertOne(doc);
      return jsonResponse(201, {
        ok: true,
        message: 'Perfil social registrado exitosamente.',
        sourceId: result.insertedId.toString(),
      });
    }

    // ----------------------------------------------------
    // DELETE /api/social/sources/:id (Disconnect & purge data)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'DELETE') {
      const sourceId = segments[0];
      if (!ObjectId.isValid(sourceId)) {
        return errorResponse(400, 'ID de fuente social inválido.', 'INVALID_ID');
      }

      const source = await sourcesCollection.findOne({ _id: new ObjectId(sourceId) });
      if (!source) {
        return errorResponse(404, 'Perfil social no encontrado.', 'SOURCE_NOT_FOUND');
      }

      // Check tenant authorization
      if (!isGlobal && source.clientId.toString() !== clientScope.toString()) {
        return errorResponse(403, 'No tienes permiso para desconectar este perfil.', 'FORBIDDEN_TENANT');
      }

      // Purge or soft delete
      await sourcesCollection.deleteOne({ _id: new ObjectId(sourceId) });
      await snapshotsCollection.deleteMany({ sourceId: new ObjectId(sourceId) });
      await analysesCollection.deleteMany({ sourceId: new ObjectId(sourceId) });

      return jsonResponse(200, {
        ok: true,
        message: 'Perfil social desconectado y datos históricos eliminados correctamente.',
      });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_SOCIAL_SOURCES_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando fuentes sociales.', 'INTERNAL_ERROR');
  }
}
