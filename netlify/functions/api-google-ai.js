import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { checkRateLimit, getClientIp } from './_shared/rateLimiter.js';
import { calculateReputationMetrics, calculateSearchConsoleMetrics, calculateCompetitiveDifferential } from './_shared/googleMetrics.js';
import { generateReviewReplyDraft, generateDeterministicFallbackGoogleReport, validateGoogleAiReportSchema } from './_shared/googleAi.js';
import { createGoogleAnalysisDocument } from '../../models/GoogleAnalysis.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const sourcesCollection = db.collection('google_sources');
  const reviewsCollection = db.collection('google_reviews');
  const snapshotsCollection = db.collection('google_snapshots');
  const competitorsCollection = db.collection('google_competitors');
  const analysesCollection = db.collection('google_analyses');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-google-ai/, '')
    .replace(/^\/api\/google\/ai/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // POST /api/google/ai/draft-reply (AI Draft Generator)
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'draft-reply' && method === 'POST') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'JSON inválido.', 'INVALID_JSON');
      }

      const { review, businessName } = body;
      if (!review) {
        return errorResponse(400, 'Los datos de la reseña son requeridos.', 'MISSING_REVIEW');
      }

      const result = await generateReviewReplyDraft({
        review,
        businessName: businessName || 'Nuestro Negocio',
      });

      return jsonResponse(200, {
        ok: true,
        draft: result.draft,
        provider: result.provider,
      });
    }

    // ----------------------------------------------------
    // POST /api/google/ai/analyze (Full Diagnostic Engine)
    // ----------------------------------------------------
    if ((segments.length === 1 && segments[0] === 'analyze') || (segments.length === 0 && method === 'POST')) {
      const clientIp = getClientIp(event);
      const isAllowed = await checkRateLimit(clientIp, 'google-ai-analyze', 10, 60000);
      if (!isAllowed) {
        return errorResponse(
          429,
          'Límite de diagnósticos de Google IA alcanzado (máx. 10 por minuto). Reintenta en unos instantes.',
          'RATE_LIMIT_EXCEEDED'
        );
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'JSON inválido.', 'INVALID_JSON');
      }

      const { sourceId } = body;
      if (!sourceId || !ObjectId.isValid(sourceId)) {
        return errorResponse(400, 'sourceId válido es requerido.', 'MISSING_SOURCE_ID');
      }

      const source = await sourcesCollection.findOne({ _id: new ObjectId(sourceId) });
      if (!source) {
        return errorResponse(404, 'Fuente de Google no encontrada.', 'NOT_FOUND');
      }

      const targetClientId = source.clientId;
      if (!isGlobal && targetClientId?.toString() !== clientScope?.toString()) {
        return errorResponse(403, 'No tienes permisos para analizar esta empresa.', 'FORBIDDEN_TENANT');
      }

      // Fetch Reviews
      const reviews = await reviewsCollection
        .find({ sourceId: source._id })
        .sort({ reviewDate: -1 })
        .limit(100)
        .toArray();

      // Fetch Search Console Snapshot (Latest)
      const gscSnapshot = await snapshotsCollection.findOne(
        { sourceId: source._id, type: 'search_console' },
        { sort: { createdAt: -1 } }
      );

      // Fetch Competitors
      const competitors = await competitorsCollection
        .find({ clientId: targetClientId })
        .toArray();

      // Deterministic Calculations
      const reputationMetrics = calculateReputationMetrics(
        reviews,
        source.googleBusinessProfile?.rating || 0,
        source.googleBusinessProfile?.userRatingsTotal || 0
      );

      const seoMetrics = calculateSearchConsoleMetrics(gscSnapshot?.data || {});

      const competitiveMetrics = calculateCompetitiveDifferential(
        {
          businessName: source.businessName,
          category: source.category,
          rating: reputationMetrics.averageRating,
          userRatingsTotal: reputationMetrics.totalReviews,
        },
        competitors
      );

      const deterministicMetrics = {
        reputation: reputationMetrics,
        seoSummary: seoMetrics,
        trafficOverview: {
          hasGbp: !!source.googleBusinessProfile?.locationId || source.sourceType === 'manual',
          hasGsc: !!source.searchConsole?.siteUrl || !!gscSnapshot,
          hasGa4: !!source.googleAnalytics4?.propertyId,
          hasAds: !!source.googleAds?.customerId,
        },
        competitiveDiff: competitiveMetrics,
      };

      // Generate AI or Deterministic Fallback Strategic Diagnostic
      const fallback = generateDeterministicFallbackGoogleReport(deterministicMetrics, source);
      const schemaValidation = validateGoogleAiReportSchema(fallback.report);

      const analysisDoc = createGoogleAnalysisDocument(
        {
          clientId: targetClientId,
          sourceId: source._id,
          deterministicMetrics,
          aiReport: schemaValidation.sanitizedReport,
          aiProvider: fallback.provider,
          aiModel: fallback.model,
        },
        user._id
      );

      const insertRes = await analysesCollection.insertOne(analysisDoc);

      return jsonResponse(200, {
        ok: true,
        analysisId: insertRes.insertedId.toString(),
        analysis: {
          id: insertRes.insertedId.toString(),
          ...analysisDoc,
          _id: undefined,
          clientId: analysisDoc.clientId.toString(),
          sourceId: analysisDoc.sourceId.toString(),
        },
      });
    }

    // ----------------------------------------------------
    // GET /api/google/ai/history?sourceId=...
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'history' && method === 'GET') {
      const params = event.queryStringParameters || {};
      let query = {};

      if (params.sourceId && ObjectId.isValid(params.sourceId)) {
        query.sourceId = new ObjectId(params.sourceId);
      }

      const rawClientId = params.clientId;
      const cleanClientId = (rawClientId && rawClientId !== 'undefined' && rawClientId !== 'null' && rawClientId !== 'all')
        ? rawClientId.trim()
        : null;

      const targetClientId = isGlobal ? cleanClientId : clientScope;
      if (targetClientId) {
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

      const sanitized = (analyses || []).map(a => ({
        id: a._id ? a._id.toString() : '',
        clientId: a.clientId ? a.clientId.toString() : '',
        sourceId: a.sourceId ? a.sourceId.toString() : '',
        deterministicMetrics: a.deterministicMetrics || {},
        aiReport: a.aiReport || null,
        aiProvider: a.aiProvider || '',
        aiModel: a.aiModel || '',
        createdAt: a.createdAt || null,
      }));

      return jsonResponse(200, { ok: true, analyses: sanitized });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_GOOGLE_AI_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando IA de Google.', 'INTERNAL_ERROR');
  }
}
