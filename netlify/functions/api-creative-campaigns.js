import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  validateCampaignCreative,
  sanitizeCampaignCreative,
  FORMAT_DIMENSIONS,
} from '../../models/CampaignCreative.js';
import {
  generateCampaignBriefAndConcepts,
  generateLayoutSpecification,
  auditQualityScore,
} from './_shared/creativeEngine/aiDirectorProvider.js';
import { compileLayoutToSvg } from './_shared/creativeEngine/programmaticRenderer.js';
import { sanitizeCreativeProfile, DEFAULT_CREATIVE_PROFILE } from '../../models/CreativeProfile.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { db, clientScope, isGlobal } = auth;
  const path = event.path || '';
  const cleanPath = path
    .replace(/^\/?\.netlify\/functions\/api-creative-campaigns\/?/, '')
    .replace(/^\/?api\/creative-campaigns\/?/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  const method = event.httpMethod;

  const targetClientId = isGlobal
    ? ((event.queryStringParameters || {}).clientId || clientScope)
    : clientScope;

  if (!targetClientId) {
    return errorResponse(400, 'clientId es requerido.', 'CLIENT_ID_REQUIRED');
  }

  const clientIdObj = ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId;
  const campaignsCollection = db.collection('creative_campaigns');
  const profileCollection = db.collection('creative_profiles');
  const productsCollection = db.collection('products');

  try {
    // ----------------------------------------------------
    // 1. GET /api/creative-campaigns (List Campaigns)
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      const campaigns = await campaignsCollection
        .find({ clientId: clientIdObj })
        .sort({ updatedAt: -1 })
        .toArray();

      return jsonResponse(200, {
        ok: true,
        campaigns: campaigns.map(sanitizeCampaignCreative),
      });
    }

    // ----------------------------------------------------
    // 2. POST /api/creative-campaigns/brief (Generate Concepts)
    // ----------------------------------------------------
    if (segments[0] === 'brief' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const rawProfile = await profileCollection.findOne({ clientId: clientIdObj });
      const brandProfile = sanitizeCreativeProfile(rawProfile || {});

      const productIds = Array.isArray(body.productIds) ? body.productIds : [];
      let products = [];
      if (productIds.length > 0) {
        const objIds = productIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
        products = await productsCollection.find({ clientId: clientIdObj, _id: { $in: objIds } }).toArray();
      }

      if (products.length === 0) {
        products = await productsCollection.find({ clientId: clientIdObj, active: { $ne: false } }).limit(3).toArray();
      }

      const result = await generateCampaignBriefAndConcepts({
        brandProfile,
        products,
        objective: body.objective || 'vender',
        industry: brandProfile.brandDna?.industry || 'electronics',
        customPrompt: body.customPrompt || '',
      });

      return jsonResponse(200, {
        ok: true,
        brief: result.brief,
        concepts: result.concepts,
        products,
      });
    }

    // ----------------------------------------------------
    // 3. POST /api/creative-campaigns/generate (Complete Pipeline)
    // ----------------------------------------------------
    if (segments[0] === 'generate' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const rawProfile = await profileCollection.findOne({ clientId: clientIdObj });
      const brandProfile = sanitizeCreativeProfile(rawProfile || {});

      const selectedProductIds = Array.isArray(body.productIds) ? body.productIds : [];
      let products = [];
      if (selectedProductIds.length > 0) {
        const objIds = selectedProductIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
        products = await productsCollection.find({ clientId: clientIdObj, _id: { $in: objIds } }).toArray();
      }

      const selectedConcept = body.concept || {
        id: 'A',
        name: 'Hero Protagonista',
        visualTheme: 'hero_single_focus',
        headline: body.headline || 'OFERTAS EXCLUSIVAS',
        subtitle: body.subtitle || 'Financiación en cuotas fijas',
        cta: body.cta || 'CONSULTAR POR WHATSAPP',
      };

      const formats = Array.isArray(body.formats) && body.formats.length > 0 ? body.formats : ['1:1', '9:16'];
      const layoutSpec = generateLayoutSpecification({
        concept: selectedConcept,
        products,
        brandProfile,
        format: formats[0] || '1:1',
      });

      const qualityScore = auditQualityScore({ layoutSpec, brandProfile, copy: selectedConcept });

      // Compile multi-format SVG renders
      const renderedAssets = formats.map((fmt) => {
        const spec = generateLayoutSpecification({
          concept: selectedConcept,
          products,
          brandProfile,
          format: fmt,
        });
        const svgString = compileLayoutToSvg({ layoutSpec: spec, brandProfile });
        return {
          format: fmt,
          dimensions: FORMAT_DIMENSIONS[fmt] || { width: 1080, height: 1080 },
          svg: svgString,
        };
      });

      const newCampaignData = {
        clientId: clientIdObj,
        campaignName: (body.campaignName || `Campaña ${selectedConcept.name}`).trim(),
        objective: body.objective || 'vender',
        status: 'ai_generated',
        version: 1,
        parentCampaignId: null,
        selectedProductIds,
        productSnapshots: products,
        brief: body.brief || {},
        concept: selectedConcept,
        copy: {
          headline: selectedConcept.headline || 'OFERTAS EXCLUSIVAS',
          subtitle: selectedConcept.subtitle || 'Financiación en cuotas fijas',
          cta: selectedConcept.cta || 'CONSULTAR POR WHATSAPP',
          instagramCaption: `🔥 ${selectedConcept.headline} 🔥\n\n${selectedConcept.subtitle}\n\n👉 Escribinos por WhatsApp para más info.`,
          whatsappCopy: `¡Hola! Quiero aprovechar la promoción de ${selectedConcept.headline}.`,
        },
        layoutSpec,
        qualityScore,
        formats,
        renderedAssets,
        audit: {
          generatedBy: 'Gemini 2.0 Flash / AI Design Director',
          generationTimestamp: new Date().toISOString(),
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertRes = await campaignsCollection.insertOne(newCampaignData);

      return jsonResponse(201, {
        ok: true,
        campaign: sanitizeCampaignCreative({ _id: insertRes.insertedId, ...newCampaignData }),
      });
    }

    // ----------------------------------------------------
    // 4. POST /api/creative-campaigns/:id/improve (AI Refinement)
    // ----------------------------------------------------
    if (segments.length === 2 && segments[1] === 'improve' && method === 'POST') {
      const campaignId = segments[0];
      const campQuery = {
        clientId: clientIdObj,
        ...(ObjectId.isValid(campaignId) ? { _id: new ObjectId(campaignId) } : { id: campaignId }),
      };

      const campaign = await campaignsCollection.findOne(campQuery);
      if (!campaign) return errorResponse(404, 'Campaña no encontrada.', 'CAMPAIGN_NOT_FOUND');

      const rawProfile = await profileCollection.findOne({ clientId: clientIdObj });
      const brandProfile = sanitizeCreativeProfile(rawProfile || {});

      // Apply improved hierarchy and updated score
      const improvedSpec = {
        ...campaign.layoutSpec,
        elements: (campaign.layoutSpec.elements || []).map((el) => {
          if (el.type === 'headline') return { ...el, fontSize: (el.fontSize || 48) + 4, fontWeight: '900' };
          if (el.type === 'cta_button') return { ...el, backgroundColor: brandProfile.colorPalette?.accent || '#F59E0B' };
          return el;
        }),
      };

      const newQualityScore = auditQualityScore({ layoutSpec: improvedSpec, brandProfile, copy: campaign.copy });
      const updatedSvg = compileLayoutToSvg({ layoutSpec: improvedSpec, brandProfile });

      const updatedAssets = (campaign.renderedAssets || []).map((a) => {
        if (a.format === (campaign.formats[0] || '1:1')) return { ...a, svg: updatedSvg };
        return a;
      });

      await campaignsCollection.updateOne(campQuery, {
        $set: {
          layoutSpec: improvedSpec,
          qualityScore: newQualityScore,
          renderedAssets: updatedAssets,
          updatedAt: new Date(),
        },
      });

      const updated = await campaignsCollection.findOne(campQuery);

      return jsonResponse(200, {
        ok: true,
        campaign: sanitizeCampaignCreative(updated),
        message: 'Diseño optimizado por el Director de Arte IA.',
      });
    }

    // ----------------------------------------------------
    // 5. POST /api/creative-campaigns/:id/variants (A/B Variants)
    // ----------------------------------------------------
    if (segments.length === 2 && segments[1] === 'variants' && method === 'POST') {
      const campaignId = segments[0];
      const campQuery = {
        clientId: clientIdObj,
        ...(ObjectId.isValid(campaignId) ? { _id: new ObjectId(campaignId) } : { id: campaignId }),
      };

      const campaign = await campaignsCollection.findOne(campQuery);
      if (!campaign) return errorResponse(404, 'Campaña no encontrada.', 'CAMPAIGN_NOT_FOUND');

      const variants = [
        {
          id: 'var_1',
          name: 'Variante A: CTA de Urgencia',
          copy: { ...campaign.copy, cta: '¡ÚLTIMOS CUPOS DISPONIBLES!' },
        },
        {
          id: 'var_2',
          name: 'Variante B: Titular Directo de Precio',
          copy: { ...campaign.copy, headline: 'DESCUENTOS HASTA 25% OFF', cta: 'COMPRAR EN CUOTAS' },
        },
      ];

      await campaignsCollection.updateOne(campQuery, {
        $set: { variants, updatedAt: new Date() },
      });

      const updated = await campaignsCollection.findOne(campQuery);

      return jsonResponse(200, {
        ok: true,
        variants,
        campaign: sanitizeCampaignCreative(updated),
      });
    }

    // ----------------------------------------------------
    // 6. POST /api/creative-campaigns/:id/reuse (Clone/Reuse)
    // ----------------------------------------------------
    if (segments.length === 2 && segments[1] === 'reuse' && method === 'POST') {
      const campaignId = segments[0];
      const campQuery = {
        clientId: clientIdObj,
        ...(ObjectId.isValid(campaignId) ? { _id: new ObjectId(campaignId) } : { id: campaignId }),
      };

      const campaign = await campaignsCollection.findOne(campQuery);
      if (!campaign) return errorResponse(404, 'Campaña no encontrada.', 'CAMPAIGN_NOT_FOUND');

      const reusedCampaign = {
        ...campaign,
        _id: new ObjectId(),
        campaignName: `${campaign.campaignName} (Reutilizada v${(campaign.version || 1) + 1})`,
        version: (campaign.version || 1) + 1,
        parentCampaignId: campaign._id,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await campaignsCollection.insertOne(reusedCampaign);

      return jsonResponse(201, {
        ok: true,
        campaign: sanitizeCampaignCreative(reusedCampaign),
        message: 'Campaña reutilizada exitosamente manteniendo la identidad visual.',
      });
    }

    // ----------------------------------------------------
    // 7. PUT /api/creative-campaigns/:id/approve (Approve)
    // ----------------------------------------------------
    if (segments.length === 2 && segments[1] === 'approve' && method === 'PUT') {
      const campaignId = segments[0];
      const campQuery = {
        clientId: clientIdObj,
        ...(ObjectId.isValid(campaignId) ? { _id: new ObjectId(campaignId) } : { id: campaignId }),
      };

      await campaignsCollection.updateOne(campQuery, {
        $set: { status: 'approved', approvedAt: new Date(), updatedAt: new Date() },
      });

      const updated = await campaignsCollection.findOne(campQuery);

      return jsonResponse(200, {
        ok: true,
        campaign: sanitizeCampaignCreative(updated),
        message: 'Campaña aprobada exitosamente y lista para pauta.',
      });
    }

    return errorResponse(404, 'Ruta de Campañas Creativas no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_CREATIVE_CAMPAIGNS_ERROR]', err);
    return errorResponse(500, 'Error interno procesando campañas creativas.', 'INTERNAL_SERVER_ERROR');
  }
}
