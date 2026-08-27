import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { validateSocialSnapshot, createSocialSnapshotDocument } from '../../models/SocialSnapshot.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const sourcesCollection = db.collection('social_sources');
  const snapshotsCollection = db.collection('social_snapshots');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-social-snapshot/, '')
    .replace(/^\/api\/social\/snapshot/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // POST /api/social/snapshot (Ingest batch of posts)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'El cuerpo de la solicitud no es un JSON válido.', 'INVALID_JSON');
      }

      const { sourceId, posts, profileMetrics, ingestionType } = body;
      if (!sourceId || !ObjectId.isValid(sourceId)) {
        return errorResponse(400, 'El campo sourceId es obligatorio y debe ser un ID válido.', 'INVALID_SOURCE_ID');
      }

      const source = await sourcesCollection.findOne({ _id: new ObjectId(sourceId) });
      if (!source) {
        return errorResponse(404, 'La fuente social especificada no existe.', 'SOURCE_NOT_FOUND');
      }

      // Check tenant isolation
      if (!isGlobal && source.clientId.toString() !== clientScope.toString()) {
        return errorResponse(403, 'No tienes permiso para cargar datos en esta empresa.', 'FORBIDDEN_TENANT');
      }

      if (!Array.isArray(posts) || posts.length === 0) {
        return errorResponse(400, 'Debes proporcionar al menos una publicación para generar el snapshot.', 'EMPTY_POSTS');
      }

      const snapshotData = {
        clientId: source.clientId,
        sourceId: source._id,
        platform: source.platform,
        ingestionType: ingestionType || 'manual_upload',
        profileMetrics: profileMetrics || {
          followersCount: source.followersCount,
          followsCount: source.followsCount,
        },
        posts,
      };

      const validation = validateSocialSnapshot(snapshotData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const doc = createSocialSnapshotDocument(snapshotData, user._id);
      const result = await snapshotsCollection.insertOne(doc);

      // Update source lastSyncedAt and mediaCount
      await sourcesCollection.updateOne(
        { _id: source._id },
        {
          $set: {
            lastSyncedAt: new Date(),
            mediaCount: doc.postsCount,
            updatedAt: new Date(),
          },
        }
      );

      return jsonResponse(201, {
        ok: true,
        message: 'Snapshot de publicaciones guardado correctamente.',
        snapshotId: result.insertedId.toString(),
        postsCount: doc.postsCount,
        periodStart: doc.periodStart,
        periodEnd: doc.periodEnd,
      });
    }

    // ----------------------------------------------------
    // GET /api/social/snapshot/:id (Retrieve snapshot)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'GET') {
      const snapshotId = segments[0];
      if (!ObjectId.isValid(snapshotId)) {
        return errorResponse(400, 'ID de snapshot inválido.', 'INVALID_ID');
      }

      const snapshot = await snapshotsCollection.findOne({ _id: new ObjectId(snapshotId) });
      if (!snapshot) {
        return errorResponse(404, 'Snapshot no encontrado.', 'SNAPSHOT_NOT_FOUND');
      }

      if (!isGlobal && snapshot.clientId.toString() !== clientScope.toString()) {
        return errorResponse(403, 'No tienes permiso para acceder a este snapshot.', 'FORBIDDEN_TENANT');
      }

      return jsonResponse(200, {
        ok: true,
        snapshot: {
          id: snapshot._id.toString(),
          clientId: snapshot.clientId.toString(),
          sourceId: snapshot.sourceId.toString(),
          platform: snapshot.platform,
          ingestionType: snapshot.ingestionType,
          periodStart: snapshot.periodStart,
          periodEnd: snapshot.periodEnd,
          profileMetrics: snapshot.profileMetrics,
          postsCount: snapshot.postsCount,
          posts: snapshot.posts,
          createdAt: snapshot.createdAt,
        },
      });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_SOCIAL_SNAPSHOT_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando snapshot social.', 'INTERNAL_ERROR');
  }
}
