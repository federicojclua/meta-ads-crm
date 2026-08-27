import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { sanitizeMetaCampaignLaunch, validateMetaCampaignLaunch } from '../../models/MetaCampaignLaunch.js';
import { sanitizeCreativeProfile } from '../../models/CreativeProfile.js';
import {
  validatePreflightLaunch,
  createPausedCampaignService,
} from './_shared/creativeEngine/metaAdsLaunchService.js';

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  const authResult = await verifyAuthorizedUser(event);
  if (!authResult.authorized) {
    return {
      statusCode: authResult.statusCode || 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: authResult.error }),
    };
  }

  const { db, clientScope, isGlobal, user } = authResult;
  const launchCollection = db.collection('meta_campaign_launches');
  const profilesCollection = db.collection('creative_profiles');

  const rawPath = event.path || '';
  const subPath = rawPath.replace(/^\/?\.netlify\/functions\/api-meta-launch\/?/, '').replace(/^\/?api\/meta-launch\/?/, '');
  const method = event.httpMethod;

  try {
    const tenantFilter = isGlobal && !clientScope
      ? {}
      : { clientId: new ObjectId(clientScope) };

    // GET /api/meta-launch/campaigns or /api/meta-launch
    if (method === 'GET' && (subPath === 'campaigns' || subPath === '')) {
      const launches = await launchCollection.find(tenantFilter).sort({ createdAt: -1 }).toArray();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, campaigns: launches.map(sanitizeMetaCampaignLaunch) }),
      };
    }

    // POST /api/meta-launch/validate
    if (method === 'POST' && subPath === 'validate') {
      const body = JSON.parse(event.body || '{}');
      const targetClientId = clientScope || body.clientId;

      const profileDoc = await profilesCollection.findOne({ clientId: new ObjectId(targetClientId) });
      const clientProfile = profileDoc ? sanitizeCreativeProfile(profileDoc) : {};

      const validation = validatePreflightLaunch({
        launchConfig: body,
        clientProfile,
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, validation }),
      };
    }

    // POST /api/meta-launch/create-paused
    if (method === 'POST' && subPath === 'create-paused') {
      const body = JSON.parse(event.body || '{}');
      const targetClientId = clientScope || body.clientId;

      const validation = validateMetaCampaignLaunch({ ...body, clientId: targetClientId });
      if (!validation.isValid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, errors: validation.errors }),
        };
      }

      const profileDoc = await profilesCollection.findOne({ clientId: new ObjectId(targetClientId) });
      const clientProfile = profileDoc ? sanitizeCreativeProfile(profileDoc) : {};

      const result = await createPausedCampaignService({
        launchConfig: { ...body, clientId: new ObjectId(targetClientId) },
        clientProfile,
        user,
      });

      const insertRes = await launchCollection.insertOne(result.campaign);
      result.campaign._id = insertRes.insertedId;

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Campaña creada exitosamente en Meta Ads en estado PAUSED.',
          campaign: sanitizeMetaCampaignLaunch(result.campaign),
        }),
      };
    }

    // POST /api/meta-launch/:id/activate
    if (method === 'POST' && subPath.includes('/activate')) {
      const campaignId = subPath.split('/')[0];
      const campaign = await launchCollection.findOne({
        _id: new ObjectId(campaignId),
        ...tenantFilter,
      });

      if (!campaign) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Campaña no encontrada.' }),
        };
      }

      const updatedAudit = [
        ...(campaign.auditLog || []),
        {
          user: user.email || 'Admin',
          action: 'ACTIVATE_CAMPAIGN',
          timestamp: new Date().toISOString(),
          details: 'Activación explícita confirmada por el usuario.',
        },
      ];

      await launchCollection.updateOne(
        { _id: campaign._id },
        {
          $set: {
            status: 'active',
            auditLog: updatedAudit,
            updatedAt: new Date().toISOString(),
          },
        }
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ok: true,
          message: 'Campaña activada en Meta Ads. Comienza la entrega y generación de leads.',
          status: 'active',
        }),
      };
    }

    // GET /api/meta-launch/forms
    if (method === 'GET' && subPath === 'forms') {
      const templates = [
        {
          id: 'template_presupuesto',
          name: 'Solicitud de Presupuesto & Financiación (Recomendada)',
          fields: ['FULL_NAME', 'PHONE_NUMBER', 'EMAIL', 'CITY'],
          customQuestion: '¿Qué producto o equipamiento te interesa adquirir?',
        },
        {
          id: 'template_catalogo',
          name: 'Descarga de Catálogo & Lista Mayorista',
          fields: ['FULL_NAME', 'PHONE_NUMBER', 'COMPANY_NAME'],
          customQuestion: '¿Cuál es el volumen de compra estimado?',
        },
        {
          id: 'template_asesor',
          name: 'Contacto Directo con Asesor Comercial',
          fields: ['FULL_NAME', 'PHONE_NUMBER'],
          customQuestion: '¿En qué horario preferís que te contactemos por WhatsApp?',
        },
      ];

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ok: true, templates }),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Ruta no encontrada en Meta Launch API.' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
}
