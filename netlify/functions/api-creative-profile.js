import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  validateCreativeProfile,
  sanitizeCreativeProfile,
  DEFAULT_CREATIVE_PROFILE,
} from '../../models/CreativeProfile.js';
import { analyzeLogoVisuals } from './_shared/creativeEngine/aiDirectorProvider.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { db, clientScope, isGlobal } = auth;
  const path = event.path || '';
  const cleanPath = path
    .replace(/^\/?\.netlify\/functions\/api-creative-profile\/?/, '')
    .replace(/^\/?api\/creative-profile\/?/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const method = event.httpMethod;

  const targetClientId = isGlobal
    ? ((event.queryStringParameters || {}).clientId || clientScope)
    : clientScope;

  if (!targetClientId) {
    return errorResponse(400, 'clientId es requerido.', 'CLIENT_ID_REQUIRED');
  }

  const clientIdObj = ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId;
  const profileCollection = db.collection('creative_profiles');

  try {
    // ----------------------------------------------------
    // 1. GET /api/creative-profile
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      let doc = await profileCollection.findOne({ clientId: clientIdObj });

      if (!doc) {
        // Create initial default profile if not exists
        const initialDoc = {
          clientId: clientIdObj,
          ...DEFAULT_CREATIVE_PROFILE,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const insertRes = await profileCollection.insertOne(initialDoc);
        doc = { _id: insertRes.insertedId, ...initialDoc };
      }

      return jsonResponse(200, {
        ok: true,
        profile: sanitizeCreativeProfile(doc),
      });
    }

    // ----------------------------------------------------
    // 2. PUT /api/creative-profile
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'PUT') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const updatePayload = {
        brandIdentity: body.brandIdentity || DEFAULT_CREATIVE_PROFILE.brandIdentity,
        colorPalette: body.colorPalette || DEFAULT_CREATIVE_PROFILE.colorPalette,
        typography: body.typography || DEFAULT_CREATIVE_PROFILE.typography,
        brandDna: body.brandDna || DEFAULT_CREATIVE_PROFILE.brandDna,
        forbiddenElements: Array.isArray(body.forbiddenElements) ? body.forbiddenElements : DEFAULT_CREATIVE_PROFILE.forbiddenElements,
        brandAssets: Array.isArray(body.brandAssets) ? body.brandAssets : DEFAULT_CREATIVE_PROFILE.brandAssets,
        updatedAt: new Date(),
      };

      await profileCollection.updateOne(
        { clientId: clientIdObj },
        { $set: updatePayload, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );

      const updated = await profileCollection.findOne({ clientId: clientIdObj });

      return jsonResponse(200, {
        ok: true,
        profile: sanitizeCreativeProfile(updated),
      });
    }

    // ----------------------------------------------------
    // 3. POST /api/creative-profile/analyze-logo
    // ----------------------------------------------------
    if (segments[0] === 'analyze-logo' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        body = {};
      }

      const logoUrl = body.logoUrl || '';
      const commercialName = body.commercialName || 'Cliente';

      const analysis = await analyzeLogoVisuals({ logoUrl, commercialName });

      return jsonResponse(200, {
        ok: true,
        analysis,
      });
    }

    // ----------------------------------------------------
    // 4. POST /api/creative-profile/assets
    // ----------------------------------------------------
    if (segments[0] === 'assets' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const newAsset = {
        id: `asset_${Date.now()}`,
        name: (body.name || 'Nuevo Asset').trim(),
        type: body.type || 'product_image',
        url: (body.url || '').trim(),
        tags: Array.isArray(body.tags) ? body.tags : [],
        uploadedAt: new Date().toISOString(),
      };

      await profileCollection.updateOne(
        { clientId: clientIdObj },
        { $push: { brandAssets: newAsset }, $set: { updatedAt: new Date() } }
      );

      return jsonResponse(201, {
        ok: true,
        asset: newAsset,
      });
    }

    return errorResponse(404, 'Ruta de Creative Profile no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_CREATIVE_PROFILE_ERROR]', err);
    return errorResponse(500, 'Error interno procesando Creative Profile.', 'INTERNAL_SERVER_ERROR');
  }
}
