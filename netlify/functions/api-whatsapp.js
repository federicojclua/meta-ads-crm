import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { checkRateLimit, getClientIp } from './_shared/rateLimiter.js';
import { sanitizeMetaLog } from './_shared/metaConfig.js';
import {
  validateWaLine,
  sanitizeWaLine,
  validateWaChat,
  sanitizeWaChat,
  validateWaMessage,
  sanitizeWaMessage,
  normalizePhoneNumber,
} from '../../models/WhatsApp.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const isSalesperson = user.role === 'salesperson';

  // Apply Rate Limiting on WhatsApp endpoints (30 req/min)
  const clientIp = getClientIp(event);
  const rateKey = `wa-rate-${user._id?.toString() || clientIp}`;
  const isAllowed = await checkRateLimit(rateKey, 'whatsapp-api', 30, 60000);
  if (!isAllowed) {
    return errorResponse(429, 'Límite de solicitudes de WhatsApp excedido. Espere un minuto.', 'RATE_LIMIT_EXCEEDED');
  }

  const linesCollection = db.collection('wa_lines');
  const chatsCollection = db.collection('wa_chats');
  const messagesCollection = db.collection('wa_messages');
  const leadsCollection = db.collection('leads');
  const usersCollection = db.collection('users');
  const activitiesCollection = db.collection('lead_activities');

  const method = event.httpMethod;
  const now = new Date();

  // Normalize path segments
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-whatsapp/, '')
    .replace(/^\/api\/whatsapp/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  // Helper: Build tenant query filter
  const buildTenantFilter = (baseQuery = {}) => {
    const query = { ...baseQuery };
    if (!isGlobal) {
      if (ObjectId.isValid(clientScope)) {
        query.clientId = new ObjectId(clientScope);
      } else {
        query.clientId = clientScope;
      }
    } else {
      const params = event.queryStringParameters || {};
      if (params.clientId && params.clientId.trim() !== '' && params.clientId.trim() !== 'all') {
        const rawId = params.clientId.trim();
        query.clientId = ObjectId.isValid(rawId) ? new ObjectId(rawId) : rawId;
      }
    }
    if (isSalesperson) {
      query.assignedToUserId = user._id;
    }
    return query;
  };

  try {
    // ----------------------------------------------------
    // ROUTE 1: /api/whatsapp/lines (GET, POST)
    // ----------------------------------------------------
    if (segments[0] === 'lines') {
      if (method === 'GET') {
        const filter = buildTenantFilter({});
        let lines = await linesCollection.find(filter).toArray();

        // Seed a default demo line if collection is fresh for this tenant
        if (lines.length === 0 && (filter.clientId || clientScope)) {
          const targetClientId = filter.clientId || clientScope;
          const defaultLine = {
            clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
            phoneNumberId: '105938472910394',
            wabaId: '204958192837465',
            displayPhoneNumber: '+54 9 11 5829-4400',
            name: 'Línea Ventas Principal',
            status: 'active',
            qualityRating: 'GREEN',
            isDefault: true,
            createdAt: now,
            updatedAt: now,
          };
          const insertRes = await linesCollection.insertOne(defaultLine);
          lines = [{ _id: insertRes.insertedId, ...defaultLine }];
        }

        return jsonResponse(200, {
          ok: true,
          lines: lines.map(sanitizeWaLine),
        });
      }

      if (method === 'POST') {
        let body = {};
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
        }

        const targetClientId = isGlobal ? (body.clientId || clientScope) : clientScope;
        if (!targetClientId) {
          return errorResponse(400, 'clientId es requerido para registrar una línea.', 'CLIENT_ID_REQUIRED');
        }

        const lineData = {
          clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
          phoneNumberId: (body.phoneNumberId || '').trim(),
          wabaId: (body.wabaId || '').trim() || null,
          displayPhoneNumber: normalizePhoneNumber(body.displayPhoneNumber || ''),
          name: (body.name || body.displayPhoneNumber || '').trim(),
          status: 'active',
          qualityRating: 'GREEN',
          isDefault: Boolean(body.isDefault),
          createdAt: now,
          updatedAt: now,
        };

        const validation = validateWaLine(lineData);
        if (!validation.isValid) {
          return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR');
        }

        const result = await linesCollection.insertOne(lineData);
        return jsonResponse(201, {
          ok: true,
          line: sanitizeWaLine({ _id: result.insertedId, ...lineData }),
        });
      }
    }

    // ----------------------------------------------------
    // ROUTE 2: /api/whatsapp/chats (GET)
    // ----------------------------------------------------
    if (segments[0] === 'chats' && segments.length === 1 && method === 'GET') {
      const params = event.queryStringParameters || {};
      const baseFilter = {};

      if (params.lineId && ObjectId.isValid(params.lineId)) {
        baseFilter.lineId = new ObjectId(params.lineId);
      }

      if (params.status === 'archived') {
        baseFilter.status = 'archived';
      } else if (params.status === 'unread') {
        baseFilter.unreadCount = { $gt: 0 };
        baseFilter.status = { $ne: 'archived' };
      } else if (params.status !== 'all') {
        baseFilter.status = { $ne: 'archived' };
      }

      if (params.assignedToUserId && ObjectId.isValid(params.assignedToUserId)) {
        baseFilter.assignedToUserId = new ObjectId(params.assignedToUserId);
      }

      if (params.tag && params.tag.trim() !== '') {
        baseFilter.tags = params.tag.trim();
      }

      if (params.search && params.search.trim() !== '') {
        const term = params.search.trim();
        baseFilter.$or = [
          { contactName: { $regex: term, $options: 'i' } },
          { contactPhone: { $regex: term, $options: 'i' } },
          { 'lastMessage.text': { $regex: term, $options: 'i' } },
        ];
      }

      const query = buildTenantFilter(baseFilter);
      let rawChats = await chatsCollection.find(query).sort({ lastMessageAt: -1 }).toArray();

      // Seed mock chats if empty for testing
      if (rawChats.length === 0 && !params.search) {
        const targetClientId = query.clientId || clientScope;
        if (targetClientId) {
          const sampleChat1 = {
            clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
            lineDisplayNumber: '+54 9 11 5829-4400',
            contactPhone: '+5491144556677',
            contactName: 'Lucía Fernández',
            unreadCount: 2,
            lastMessage: {
              text: 'Hola, me interesó el anuncio de perfumes. ¿Tienen stock del Sauvage?',
              type: 'text',
              direction: 'inbound',
              status: 'received',
              timestamp: new Date(Date.now() - 1000 * 60 * 12),
            },
            lastMessageAt: new Date(Date.now() - 1000 * 60 * 12),
            tags: ['Meta Ads', 'Perfumería'],
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 3600 * 24),
            updatedAt: new Date(Date.now() - 1000 * 60 * 12),
          };

          const sampleChat2 = {
            clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
            lineDisplayNumber: '+54 9 11 5829-4400',
            contactPhone: '+5491199887766',
            contactName: 'Martín Gómez',
            unreadCount: 0,
            lastMessage: {
              text: 'Perfecto, les confirmo el pedido para entrega el viernes.',
              type: 'text',
              direction: 'outbound',
              status: 'read',
              timestamp: new Date(Date.now() - 1000 * 3600 * 3),
            },
            lastMessageAt: new Date(Date.now() - 1000 * 3600 * 3),
            tags: ['Venta Cerrada'],
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 3600 * 48),
            updatedAt: new Date(Date.now() - 1000 * 3600 * 3),
          };

          const ins1 = await chatsCollection.insertOne(sampleChat1);
          const ins2 = await chatsCollection.insertOne(sampleChat2);
          rawChats = [
            { _id: ins1.insertedId, ...sampleChat1 },
            { _id: ins2.insertedId, ...sampleChat2 },
          ];

          // Seed messages for sampleChat1
          await messagesCollection.insertMany([
            {
              clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
              chatId: ins1.insertedId,
              wamid: 'wamid.HBgL1234567890',
              direction: 'inbound',
              type: 'text',
              text: 'Hola, buenas tardes! Vi la publicidad en Instagram.',
              status: 'read',
              timestamp: new Date(Date.now() - 1000 * 60 * 20),
              createdAt: new Date(Date.now() - 1000 * 60 * 20),
            },
            {
              clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
              chatId: ins1.insertedId,
              wamid: 'wamid.HBgL0987654321',
              direction: 'outbound',
              text: '¡Hola Lucía! Qué gusto saludarte. Sí, tenemos toda la línea disponible.',
              status: 'read',
              timestamp: new Date(Date.now() - 1000 * 60 * 15),
              createdAt: new Date(Date.now() - 1000 * 60 * 15),
            },
            {
              clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
              chatId: ins1.insertedId,
              wamid: 'wamid.HBgL5566778899',
              direction: 'inbound',
              text: 'Hola, me interesó el anuncio de perfumes. ¿Tienen stock del Sauvage?',
              status: 'received',
              timestamp: new Date(Date.now() - 1000 * 60 * 12),
              createdAt: new Date(Date.now() - 1000 * 60 * 12),
            },
          ]);
        }
      }

      // Populate Lead and Assignee
      const leadIds = rawChats.map((c) => c.leadId).filter((id) => id && ObjectId.isValid(id));
      const leads = leadIds.length > 0
        ? await leadsCollection.find({ _id: { $in: leadIds } }).toArray()
        : [];
      const leadMap = new Map(leads.map((l) => [l._id.toString(), l]));

      const userIds = rawChats.map((c) => c.assignedToUserId).filter((id) => id && ObjectId.isValid(id));
      const users = userIds.length > 0
        ? await usersCollection.find({ _id: { $in: userIds } }).toArray()
        : [];
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      const enriched = rawChats.map((c) => {
        const lead = c.leadId ? leadMap.get(c.leadId.toString()) : null;
        const assignee = c.assignedToUserId ? userMap.get(c.assignedToUserId.toString()) : null;
        return sanitizeWaChat({
          ...c,
          lead,
          assignedToUser: assignee,
        });
      });

      return jsonResponse(200, {
        ok: true,
        chats: enriched,
      });
    }

    // ----------------------------------------------------
    // ROUTE 3: /api/whatsapp/chats/:chatId/messages (GET)
    // ----------------------------------------------------
    if (segments[0] === 'chats' && segments[2] === 'messages' && method === 'GET') {
      const chatIdRaw = segments[1];
      if (!ObjectId.isValid(chatIdRaw)) {
        return errorResponse(400, 'ID de chat inválido.', 'INVALID_CHAT_ID');
      }

      const chatId = new ObjectId(chatIdRaw);
      const chatQuery = buildTenantFilter({ _id: chatId });
      const chat = await chatsCollection.findOne(chatQuery);

      if (!chat) {
        return errorResponse(404, 'Chat no encontrado o acceso no autorizado.', 'CHAT_NOT_FOUND');
      }

      // Reset unread count when messages are fetched
      await chatsCollection.updateOne({ _id: chatId }, { $set: { unreadCount: 0, updatedAt: now } });

      const messages = await messagesCollection
        .find({ chatId })
        .sort({ timestamp: 1 })
        .limit(200)
        .toArray();

      return jsonResponse(200, {
        ok: true,
        messages: messages.map(sanitizeWaMessage),
      });
    }

    // ----------------------------------------------------
    // ROUTE 4: /api/whatsapp/send (POST)
    // ----------------------------------------------------
    if (segments[0] === 'send' && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const { chatId: rawChatId, text, type = 'text', mediaUrl = null, templateName = null } = body;

      if (!rawChatId || !ObjectId.isValid(rawChatId)) {
        return errorResponse(400, 'chatId válido es requerido.', 'INVALID_CHAT_ID');
      }

      const chatId = new ObjectId(rawChatId);
      const chatQuery = buildTenantFilter({ _id: chatId });
      const chat = await chatsCollection.findOne(chatQuery);

      if (!chat) {
        return errorResponse(404, 'Chat no encontrado o sin permisos.', 'CHAT_NOT_FOUND');
      }

      if (!text && !mediaUrl && !templateName) {
        return errorResponse(400, 'El texto del mensaje no puede estar vacío.', 'EMPTY_MESSAGE');
      }

      const cleanText = (text || '').trim();
      const wamid = `wamid.HBgL${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

      // 4.1 Mock / Dispatch to Meta WhatsApp Cloud API
      const metaApiKey = process.env.WHATSAPP_API_TOKEN;
      const phoneNumberId = chat.lineId
        ? (await linesCollection.findOne({ _id: chat.lineId }))?.phoneNumberId
        : process.env.WHATSAPP_PHONE_NUMBER_ID;

      let metaDeliveryStatus = 'sent';

      if (metaApiKey && phoneNumberId && !process.env.VITEST) {
        try {
          const metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: chat.contactPhone,
            type: 'text',
            text: { preview_url: false, body: cleanText },
          };

          const metaRes = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${metaApiKey}`,
            },
            body: JSON.stringify(metaPayload),
          });

          if (!metaRes.ok) {
            const metaErr = await metaRes.json();
            console.warn('[WHATSAPP_META_API_SEND_WARNING]', sanitizeMetaLog(metaErr));
          }
        } catch (dispatchErr) {
          console.warn('[WHATSAPP_META_DISPATCH_ERROR]', dispatchErr.message);
        }
      }

      // 4.2 Persist Outbound Message
      const messageDoc = {
        clientId: chat.clientId,
        chatId: chat._id,
        wamid,
        direction: 'outbound',
        type,
        text: cleanText,
        mediaUrl,
        status: metaDeliveryStatus,
        timestamp: now,
        senderName: user.displayName || user.email || 'Agente',
        createdAt: now,
      };

      const msgInsert = await messagesCollection.insertOne(messageDoc);

      // 4.3 Update Chat Thread
      await chatsCollection.updateOne(
        { _id: chat._id },
        {
          $set: {
            lastMessage: {
              text: cleanText,
              type,
              direction: 'outbound',
              status: metaDeliveryStatus,
              timestamp: now,
            },
            lastMessageAt: now,
            updatedAt: now,
          },
        }
      );

      // 4.4 Log Activity on Lead in CRM Pipeline if linked
      if (chat.leadId) {
        await activitiesCollection.insertOne({
          clientId: chat.clientId,
          leadId: chat.leadId,
          type: 'whatsapp_outbound',
          description: `Respuesta de WhatsApp enviada: "${cleanText.slice(0, 100)}"`,
          performedBy: {
            id: user._id.toString(),
            displayName: user.displayName || user.email,
            email: user.email,
          },
          data: {
            text: cleanText,
            wamid,
          },
          createdAt: now,
        });
      }

      return jsonResponse(201, {
        ok: true,
        message: sanitizeWaMessage({ _id: msgInsert.insertedId, ...messageDoc }),
      });
    }

    // ----------------------------------------------------
    // ROUTE 5: /api/whatsapp/chats/:chatId (PATCH)
    // ----------------------------------------------------
    if (segments[0] === 'chats' && segments.length === 2 && method === 'PATCH') {
      const chatIdRaw = segments[1];
      if (!ObjectId.isValid(chatIdRaw)) {
        return errorResponse(400, 'ID de chat inválido.', 'INVALID_CHAT_ID');
      }

      const chatId = new ObjectId(chatIdRaw);
      const chatQuery = buildTenantFilter({ _id: chatId });
      const chat = await chatsCollection.findOne(chatQuery);

      if (!chat) {
        return errorResponse(404, 'Chat no encontrado.', 'CHAT_NOT_FOUND');
      }

      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const updates = { updatedAt: now };

      if (body.status && ['active', 'archived'].includes(body.status)) {
        updates.status = body.status;
      }

      if (Array.isArray(body.tags)) {
        updates.tags = body.tags;
      }

      if (body.assignedToUserId !== undefined) {
        updates.assignedToUserId = body.assignedToUserId && ObjectId.isValid(body.assignedToUserId)
          ? new ObjectId(body.assignedToUserId)
          : null;
      }

      // Sinergia con Pipeline: Si se actualiza la etapa desde el panel derecho
      if (body.leadStage && chat.leadId) {
        await leadsCollection.updateOne(
          { _id: chat.leadId },
          {
            $set: {
              stage: body.leadStage,
              updatedAt: now,
            },
          }
        );

        await activitiesCollection.insertOne({
          clientId: chat.clientId,
          leadId: chat.leadId,
          type: 'stage_change',
          description: `Etapa del prospecto actualizada a "${body.leadStage}" desde el Inbox de WhatsApp.`,
          performedBy: {
            id: user._id.toString(),
            displayName: user.displayName || user.email,
            email: user.email,
          },
          data: { newStage: body.leadStage },
          createdAt: now,
        });
      }

      await chatsCollection.updateOne({ _id: chatId }, { $set: updates });
      const updatedChat = await chatsCollection.findOne({ _id: chatId });

      return jsonResponse(200, {
        ok: true,
        chat: sanitizeWaChat(updatedChat),
      });
    }

    // ----------------------------------------------------
    // ROUTE 6: /api/whatsapp/chats/:chatId/toggle-bot (POST)
    // ----------------------------------------------------
    if (segments[0] === 'chats' && segments[2] === 'toggle-bot' && method === 'POST') {
      const chatIdRaw = segments[1];
      if (!ObjectId.isValid(chatIdRaw)) {
        return errorResponse(400, 'ID de chat inválido.', 'INVALID_CHAT_ID');
      }

      const chatId = new ObjectId(chatIdRaw);
      const chatQuery = buildTenantFilter({ _id: chatId });
      const chat = await chatsCollection.findOne(chatQuery);

      if (!chat) {
        return errorResponse(404, 'Chat no encontrado.', 'CHAT_NOT_FOUND');
      }

      const newMutedState = !Boolean(chat.isBotMuted);
      await chatsCollection.updateOne(
        { _id: chatId },
        { $set: { isBotMuted: newMutedState, updatedAt: now } }
      );

      return jsonResponse(200, {
        ok: true,
        isBotMuted: newMutedState,
        message: newMutedState ? 'Bot IA silenciado para este chat.' : 'Bot IA reactivado para este chat.',
      });
    }

    // ----------------------------------------------------
    // ROUTE 7: /api/whatsapp/brain (GET, PUT)
    // ----------------------------------------------------
    if (segments[0] === 'brain') {
      const brainCollection = db.collection('ai_brain');
      const targetClientId = isGlobal
        ? ((event.queryStringParameters || {}).clientId || clientScope)
        : clientScope;

      if (!targetClientId) {
        return errorResponse(400, 'clientId es requerido para acceder al Cerebro IA.', 'CLIENT_ID_REQUIRED');
      }

      const clientIdObj = ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId;

      if (method === 'GET') {
        let brain = await brainCollection.findOne({ clientId: clientIdObj });
        if (!brain) {
          const defaultBrainDoc = {
            clientId: clientIdObj,
            industryAndTone: 'Agencia de Marketing Digital y Publicidad. Personalidad: Amable, consultiva y orientada a resultados.',
            knowledgeBase: 'Servicios: Meta Ads, Google Ads, SEO Local y Analítica de Ventas.\nPresupuesto base: $150.000 ARS/mes.',
            qualificationRules: 'Extraer objetivo de negocio, presupuesto disponible y teléfono/email de contacto.',
            autoQualifyEnabled: true,
            autoSetterEnabled: true,
            createdAt: now,
            updatedAt: now,
          };
          const ins = await brainCollection.insertOne(defaultBrainDoc);
          brain = { _id: ins.insertedId, ...defaultBrainDoc };
        }

        return jsonResponse(200, {
          ok: true,
          brain: {
            id: brain._id?.toString(),
            clientId: brain.clientId?.toString(),
            industryAndTone: brain.industryAndTone,
            knowledgeBase: brain.knowledgeBase,
            qualificationRules: brain.qualificationRules,
            autoQualifyEnabled: Boolean(brain.autoQualifyEnabled),
            autoSetterEnabled: Boolean(brain.autoSetterEnabled),
            idealCustomerProfile: brain.idealCustomerProfile || null,
            updatedAt: brain.updatedAt,
          },
        });
      }

      if (method === 'PUT') {
        let body = {};
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
        }

        const updateData = {
          industryAndTone: (body.industryAndTone || '').trim(),
          knowledgeBase: (body.knowledgeBase || '').trim(),
          qualificationRules: (body.qualificationRules || '').trim(),
          autoQualifyEnabled: body.autoQualifyEnabled !== undefined ? Boolean(body.autoQualifyEnabled) : true,
          autoSetterEnabled: body.autoSetterEnabled !== undefined ? Boolean(body.autoSetterEnabled) : true,
          updatedAt: now,
        };

        await brainCollection.updateOne(
          { clientId: clientIdObj },
          { $set: updateData },
          { upsert: true }
        );

        const updatedBrain = await brainCollection.findOne({ clientId: clientIdObj });
        return jsonResponse(200, {
          ok: true,
          brain: {
            id: updatedBrain._id?.toString(),
            clientId: updatedBrain.clientId?.toString(),
            ...updateData,
          },
        });
      }
    }

    return errorResponse(404, 'Ruta de WhatsApp/Omnicanal no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_WHATSAPP_ERROR]', err.message);
    return errorResponse(500, 'Error interno procesando solicitud de WhatsApp.', 'INTERNAL_SERVER_ERROR');
  }
}
