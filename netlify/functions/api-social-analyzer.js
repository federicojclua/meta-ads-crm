import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { getClientIp, checkRateLimit } from './_shared/rateLimiter.js';
import { calculateSocialMetrics } from './_shared/socialMetrics.js';
import { generateSocialDiagnostic } from './_shared/ai.js';
import { validateSocialAnalysis, createSocialAnalysisDocument } from '../../models/SocialAnalysis.js';

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
    .replace(/^\/\.netlify\/functions\/api-social-analyzer/, '')
    .replace(/^\/api\/social\/analyze/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // POST /api/social/analyze (Run diagnostic)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'POST') {
      // Rate limiting: 10 AI diagnostics per IP per minute
      const ip = getClientIp(event);
      const isAllowed = await checkRateLimit(ip, 'social-ai-analyze', 10, 60000);
      if (!isAllowed) {
        return errorResponse(
          429,
          'Límite de solicitudes de análisis con IA superado. Por favor, reintenta en unos momentos.',
          'RATE_LIMIT_EXCEEDED'
        );
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'El cuerpo de la solicitud no es un JSON válido.', 'INVALID_JSON');
      }

      const { sourceId, snapshotId } = body;
      if (!sourceId || !ObjectId.isValid(sourceId)) {
        return errorResponse(400, 'El campo sourceId es obligatorio.', 'INVALID_SOURCE_ID');
      }

      const source = await sourcesCollection.findOne({ _id: new ObjectId(sourceId) });
      if (!source) {
        return errorResponse(404, 'Perfil social no encontrado.', 'SOURCE_NOT_FOUND');
      }

      // Multi-tenant check
      if (!isGlobal && source.clientId.toString() !== clientScope.toString()) {
        return errorResponse(403, 'No tienes permiso para analizar datos de esta empresa.', 'FORBIDDEN_TENANT');
      }

      // Fetch snapshot (either by ID or latest snapshot for this source)
      let snapshot;
      if (snapshotId && ObjectId.isValid(snapshotId)) {
        snapshot = await snapshotsCollection.findOne({ _id: new ObjectId(snapshotId) });
      } else {
        snapshot = await snapshotsCollection.findOne(
          { sourceId: source._id },
          { sort: { createdAt: -1 } }
        );
      }

      if (!snapshot || !Array.isArray(snapshot.posts) || snapshot.posts.length === 0) {
        return errorResponse(
          400,
          'No se encontraron publicaciones guardadas para este perfil. Por favor, carga publicaciones (CSV o manual) antes de ejecutar el análisis.',
          'NO_SNAPSHOT_DATA'
        );
      }

      // 1. Calculate deterministic metrics
      const deterministicMetrics = calculateSocialMetrics(snapshot, {
        followersCount: source.followersCount,
        followsCount: source.followsCount,
      });

      // 2. Generate AI diagnostic with prompt injection defense
      const { report, aiProvider, aiModel, tokenUsage } = await generateSocialDiagnostic({
        profile: {
          platform: source.platform,
          accountUsername: source.accountUsername,
          accountName: source.accountName,
          biography: source.biography,
        },
        deterministicMetrics,
        recentPosts: snapshot.posts,
      });

      // 3. Persist analysis
      const analysisData = {
        clientId: source.clientId,
        sourceId: source._id,
        snapshotId: snapshot._id,
        platform: source.platform,
        accountUsername: source.accountUsername,
        deterministicMetrics,
        aiReport: report,
        aiProvider,
        aiModel,
        tokenUsage,
      };

      const validation = validateSocialAnalysis(analysisData);
      if (!validation.isValid) {
        return errorResponse(500, 'Error estructurando reporte de análisis.', 'AI_SCHEMA_ERROR');
      }

      const doc = createSocialAnalysisDocument(analysisData, user._id);
      const insertRes = await analysesCollection.insertOne(doc);

      return jsonResponse(201, {
        ok: true,
        analysisId: insertRes.insertedId.toString(),
        analysis: {
          id: insertRes.insertedId.toString(),
          clientId: doc.clientId.toString(),
          sourceId: doc.sourceId.toString(),
          snapshotId: doc.snapshotId.toString(),
          platform: doc.platform,
          accountUsername: doc.accountUsername,
          deterministicMetrics: doc.deterministicMetrics,
          aiReport: doc.aiReport,
          aiProvider: doc.aiProvider,
          aiModel: doc.aiModel,
          tokenUsage: doc.tokenUsage,
          createdAt: doc.createdAt,
        },
      });
    }

    // ----------------------------------------------------
    // GET /api/social/analyze/history?sourceId=... or ?clientId=...
    // ----------------------------------------------------
    if ((segments.length === 1 && segments[0] === 'history') || (segments.length === 0 && method === 'GET')) {
      const params = event.queryStringParameters || {};
      let query = {};

      if (params.sourceId && ObjectId.isValid(params.sourceId)) {
        query.sourceId = new ObjectId(params.sourceId);
      }

      const targetClientId = isGlobal ? (params.clientId || null) : clientScope;
      if (targetClientId && targetClientId !== 'all') {
        const clientQuery = ObjectId.isValid(targetClientId)
          ? { $or: [{ clientId: new ObjectId(targetClientId) }, { clientId: targetClientId }] }
          : { clientId: targetClientId };
        query = { ...query, ...clientQuery };
      }

      const analyses = await analysesCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

      const sanitized = analyses.map(a => ({
        id: a._id.toString(),
        clientId: a.clientId.toString(),
        sourceId: a.sourceId.toString(),
        snapshotId: a.snapshotId.toString(),
        platform: a.platform,
        accountUsername: a.accountUsername,
        deterministicMetrics: a.deterministicMetrics,
        aiReport: a.aiReport,
        aiProvider: a.aiProvider,
        aiModel: a.aiModel,
        createdAt: a.createdAt,
      }));

      return jsonResponse(200, { ok: true, analyses: sanitized });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_SOCIAL_ANALYZER_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando análisis social con IA.', 'INTERNAL_ERROR');
  }
}
