import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { DEFAULT_AI_BRAIN, validateAiBrain, sanitizeAiBrain } from '../../models/AiBrain.js';
import {
  validateFaqDocument,
  sanitizeFaq,
  sanitizeUnansweredQuery,
} from '../../models/KnowledgeFaq.js';
import { evaluateAutonomousAgent } from './_shared/agentEngine.js';
import { buildRAGContext } from './_shared/knowledgeBase.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const brainsCollection = db.collection('ai_brains');
  const faqsCollection = db.collection('knowledge_faqs');
  const unansweredCollection = db.collection('unanswered_queries');
  const method = event.httpMethod;
  const now = new Date();

  // Normalize path
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-assistant/, '')
    .replace(/^\/api\/assistant/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  // Helper: Get target clientId
  const getTargetClientId = () => {
    if (!isGlobal) return clientScope;
    const params = event.queryStringParameters || {};
    return params.clientId || clientScope;
  };

  const targetClientId = getTargetClientId();
  const tenantFilter = ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId;

  try {
    // ----------------------------------------------------
    // 1. GET /api/assistant — Get Brain Config & Active FAQs
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      let brainDoc = await brainsCollection.findOne({ clientId: tenantFilter });

      if (!brainDoc) {
        brainDoc = {
          clientId: tenantFilter,
          ...DEFAULT_AI_BRAIN,
          createdAt: now,
          updatedAt: now,
        };
      }

      const faqs = await faqsCollection
        .find({ clientId: tenantFilter, isActive: { $ne: false } })
        .sort({ updatedAt: -1 })
        .toArray();

      return jsonResponse(200, {
        ok: true,
        brain: sanitizeAiBrain(brainDoc),
        faqs: faqs.map(sanitizeFaq),
        totalFaqs: faqs.length,
      });
    }

    // ----------------------------------------------------
    // 2. PUT /api/assistant — Update Brain Visual Configuration
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'PUT') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const updateData = {
        ...body,
        clientId: targetClientId,
      };

      const validation = validateAiBrain(updateData);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_FAILED');
      }

      const fieldsToSet = {
        businessName: (body.businessName || DEFAULT_AI_BRAIN.businessName).trim(),
        businessDescription: (body.businessDescription || DEFAULT_AI_BRAIN.businessDescription).trim(),
        tone: body.tone || DEFAULT_AI_BRAIN.tone,
        industryAndTone: (body.industryAndTone || DEFAULT_AI_BRAIN.industryAndTone).trim(),
        coverageZone: (body.coverageZone || DEFAULT_AI_BRAIN.coverageZone).trim(),
        contactInfo: body.contactInfo || DEFAULT_AI_BRAIN.contactInfo,
        knowledgeBase: body.knowledgeBase !== undefined ? body.knowledgeBase : DEFAULT_AI_BRAIN.knowledgeBase,
        qualificationRules: body.qualificationRules || DEFAULT_AI_BRAIN.qualificationRules,
        commercialPlan: Array.isArray(body.commercialPlan) ? body.commercialPlan : DEFAULT_AI_BRAIN.commercialPlan,
        rules: Array.isArray(body.rules) ? body.rules : DEFAULT_AI_BRAIN.rules,
        productsCatalog: Array.isArray(body.productsCatalog) ? body.productsCatalog : (DEFAULT_AI_BRAIN.productsCatalog || []),
        objectionPlaybook: Array.isArray(body.objectionPlaybook) ? body.objectionPlaybook : (DEFAULT_AI_BRAIN.objectionPlaybook || []),
        activePreset: body.activePreset || 'custom',
        autoQualifyEnabled: body.autoQualifyEnabled !== undefined ? Boolean(body.autoQualifyEnabled) : true,
        autoSetterEnabled: body.autoSetterEnabled !== undefined ? Boolean(body.autoSetterEnabled) : true,
        followUpEnabled: body.followUpEnabled !== undefined ? Boolean(body.followUpEnabled) : false,
        followUpSchedule: body.followUpSchedule || DEFAULT_AI_BRAIN.followUpSchedule,
        updatedAt: now,
      };

      await brainsCollection.updateOne(
        { clientId: tenantFilter },
        {
          $set: fieldsToSet,
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );

      const savedBrain = await brainsCollection.findOne({ clientId: tenantFilter });

      return jsonResponse(200, {
        ok: true,
        brain: sanitizeAiBrain(savedBrain),
      });
    }

    // ----------------------------------------------------
    // 3. GET /api/assistant/unanswered — List "Lo que no supo"
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'unanswered' && method === 'GET') {
      const queryFilter = { clientId: tenantFilter };
      const statusParam = event.queryStringParameters?.status;
      if (statusParam && statusParam !== 'all') {
        queryFilter.status = statusParam;
      }

      const list = await unansweredCollection
        .find(queryFilter)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return jsonResponse(200, {
        ok: true,
        queries: list.map(sanitizeUnansweredQuery),
        total: list.length,
      });
    }

    // ----------------------------------------------------
    // 4. POST /api/assistant/teach — Add FAQ & Resolve Unanswered Query
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'teach' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const faqPayload = {
        clientId: targetClientId,
        question: (body.question || '').trim(),
        answer: (body.answer || '').trim(),
        category: body.category || 'general',
        keywords: Array.isArray(body.keywords) ? body.keywords : [],
        isActive: true,
      };

      const validation = validateFaqDocument(faqPayload);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_FAILED');
      }

      const faqDoc = {
        ...faqPayload,
        clientId: tenantFilter,
        timesQueried: 0,
        createdAt: now,
        updatedAt: now,
      };

      const insertRes = await faqsCollection.insertOne(faqDoc);
      const createdFaq = { _id: insertRes.insertedId, ...faqDoc };

      // If tied to an unanswered query, mark it as learned
      if (body.unansweredQueryId && ObjectId.isValid(body.unansweredQueryId)) {
        await unansweredCollection.updateOne(
          { _id: new ObjectId(body.unansweredQueryId) },
          {
            $set: {
              status: 'aprendido',
              learnedFaqId: insertRes.insertedId,
              learnedAt: now,
            },
          }
        );
      }

      return jsonResponse(201, {
        ok: true,
        faq: sanitizeFaq(createdFaq),
      });
    }

    // ----------------------------------------------------
    // 5. DELETE /api/assistant/faqs/:id — Delete FAQ
    // ----------------------------------------------------
    if (segments.length === 2 && segments[0] === 'faqs' && method === 'DELETE') {
      const faqId = segments[1];
      if (!ObjectId.isValid(faqId)) {
        return errorResponse(400, 'ID de FAQ inválido.', 'INVALID_FAQ_ID');
      }

      await faqsCollection.deleteOne({
        _id: new ObjectId(faqId),
        clientId: tenantFilter,
      });

      return jsonResponse(200, {
        ok: true,
        message: 'FAQ eliminada exitosamente.',
      });
    }

    // ----------------------------------------------------
    // 6. POST /api/assistant/test — Live Simulator / Tester
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'test' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const userMessage = (body.message || '').trim();
      if (!userMessage) {
        return errorResponse(400, 'El mensaje para el simulador no puede estar vacío.', 'EMPTY_MESSAGE');
      }

      const brainDoc = body.brainOverride || (await brainsCollection.findOne({ clientId: tenantFilter })) || DEFAULT_AI_BRAIN;
      const chatHistory = Array.isArray(body.chatHistory) ? body.chatHistory : [];

      const decision = await evaluateAutonomousAgent({
        lead: body.lead || { name: 'Cliente Simulador', phone: '+5491122334455', stage: 'new' },
        chat: { lineDisplayName: brainDoc.businessName ? `Simulador ${brainDoc.businessName}` : 'Simulador Comercial' },
        chatHistory,
        inboundMessage: userMessage,
        aiBrain: brainDoc,
      });

      return jsonResponse(200, {
        ok: true,
        reply: decision.replyText || decision.responseMessage || '',
        decision,
      });
    }

    return errorResponse(404, 'Ruta de asistente no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_ASSISTANT_ERROR]', err.message);
    return errorResponse(500, 'Error interno del servidor en el asistente.', 'INTERNAL_ERROR');
  }
}
