import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { validateGoogleReview, createGoogleReviewDocument } from '../../models/GoogleReview.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const reviewsCollection = db.collection('google_reviews');
  const sourcesCollection = db.collection('google_sources');
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-google-reviews/, '')
    .replace(/^\/api\/google\/reviews/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // GET /api/google/reviews?sourceId=... or ?clientId=...
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

      if (params.rating) {
        query.rating = Number(params.rating);
      }
      if (params.replyStatus) {
        query.replyStatus = params.replyStatus;
      }

      const reviews = await reviewsCollection
        .find(query)
        .sort({ reviewDate: -1 })
        .limit(100)
        .toArray();

      const sanitized = (reviews || []).map(r => ({
        id: r._id ? r._id.toString() : '',
        clientId: r.clientId ? r.clientId.toString() : '',
        sourceId: r.sourceId ? r.sourceId.toString() : '',
        externalReviewId: r.externalReviewId || '',
        reviewerName: r.reviewerName || 'Cliente Anónimo',
        rating: r.rating || 5,
        comment: r.comment || '',
        reviewDate: r.reviewDate || null,
        replyText: r.replyText || '',
        replyDate: r.replyDate || null,
        replyStatus: r.replyStatus || 'unanswered',
        responseTimeHours: r.responseTimeHours,
        sentiment: r.sentiment || 'positive',
        topics: r.topics || [],
        aiSuggestedReply: r.aiSuggestedReply || '',
        createdAt: r.createdAt || null,
      }));

      return jsonResponse(200, { ok: true, reviews: sanitized });
    }

    // ----------------------------------------------------
    // POST /api/google/reviews (Ingest single review or batch)
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

      // Check if batch
      if (Array.isArray(body.reviews)) {
        const docs = [];
        for (const item of body.reviews) {
          const itemData = {
            ...item,
            clientId: targetClientId,
            sourceId: body.sourceId || item.sourceId,
          };
          const validation = validateGoogleReview(itemData);
          if (validation.isValid) {
            docs.push(createGoogleReviewDocument(itemData, user._id));
          }
        }

        if (docs.length > 0) {
          await reviewsCollection.insertMany(docs);
          // Update total reviews count on source
          if (body.sourceId && ObjectId.isValid(body.sourceId)) {
            const count = await reviewsCollection.countDocuments({ sourceId: new ObjectId(body.sourceId) });
            await sourcesCollection.updateOne(
              { _id: new ObjectId(body.sourceId) },
              { $set: { 'googleBusinessProfile.userRatingsTotal': count, lastSyncedAt: new Date() } }
            );
          }
        }

        return jsonResponse(201, { ok: true, count: docs.length, message: `${docs.length} reseñas importadas correctamente.` });
      }

      // Single review creation
      const reviewData = {
        ...body,
        clientId: targetClientId,
      };
      const validation = validateGoogleReview(reviewData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
      }

      const doc = createGoogleReviewDocument(reviewData, user._id);
      const insertRes = await reviewsCollection.insertOne(doc);

      return jsonResponse(201, {
        ok: true,
        reviewId: insertRes.insertedId.toString(),
        review: {
          id: insertRes.insertedId.toString(),
          ...doc,
          _id: undefined,
          clientId: doc.clientId.toString(),
        },
      });
    }

    // ----------------------------------------------------
    // POST /api/google/reviews/:id/reply (Save business response)
    // ----------------------------------------------------
    if (segments.length === 2 && segments[1] === 'reply' && method === 'POST') {
      const reviewIdStr = segments[0];
      if (!ObjectId.isValid(reviewIdStr)) {
        return errorResponse(400, 'ID de reseña inválido.', 'INVALID_ID');
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'JSON inválido.', 'INVALID_JSON');
      }

      const replyText = (body.replyText || '').trim();
      if (!replyText) {
        return errorResponse(400, 'El texto de la respuesta no puede estar vacío.', 'EMPTY_REPLY');
      }

      const reviewId = new ObjectId(reviewIdStr);
      const existing = await reviewsCollection.findOne({ _id: reviewId });
      if (!existing) {
        return errorResponse(404, 'Reseña no encontrada.', 'NOT_FOUND');
      }

      if (!isGlobal && existing.clientId?.toString() !== clientScope?.toString()) {
        return errorResponse(403, 'No tienes permisos para responder a esta reseña.', 'FORBIDDEN_TENANT');
      }

      const now = new Date();
      const reviewDate = existing.reviewDate ? new Date(existing.reviewDate) : existing.createdAt;
      const responseTimeHours = Math.max(0, Math.round((now.getTime() - new Date(reviewDate).getTime()) / (1000 * 60 * 60)));

      await reviewsCollection.updateOne(
        { _id: reviewId },
        {
          $set: {
            replyText,
            replyDate: now,
            replyStatus: 'replied',
            responseTimeHours,
            updatedAt: now,
          },
        }
      );

      return jsonResponse(200, {
        ok: true,
        message: 'Respuesta oficial guardada con éxito.',
        replyText,
        responseTimeHours,
      });
    }

    return errorResponse(405, 'Método HTTP no permitido.', 'METHOD_NOT_ALLOWED');
  } catch (err) {
    console.error('[API_GOOGLE_REVIEWS_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando reseñas.', 'INTERNAL_ERROR');
  }
}
