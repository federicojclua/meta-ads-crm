import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { normalizePhoneNumber } from '../../models/WhatsApp.js';
import { evaluateAutonomousAgent } from './_shared/agentEngine.js';
import { DEFAULT_AI_BRAIN } from '../../models/AiBrain.js';
import { notifyGroup } from './_shared/whatsappGroupNotifier.js';

export async function handler(event) {
  const method = event.httpMethod;

  // ----------------------------------------------------
  // 1. GET: Meta Cloud API Webhook Handshake Verification
  // ----------------------------------------------------
  if (method === 'GET') {
    const params = event.queryStringParameters || {};
    const mode = params['hub.mode'];
    const token = params['hub.verify_token'];
    const challenge = params['hub.challenge'];

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && expectedToken && token === expectedToken) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge,
      };
    }

    console.warn('[OMNICHANNEL_WEBHOOK] Handshake verification failed:', { mode, tokenProvided: Boolean(token) });
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Verification token mismatch or not configured.' }),
    };
  }

  // ----------------------------------------------------
  // 2. POST: Ingest Messages and Statuses (WA, IG, FB)
  // ----------------------------------------------------
  if (method === 'POST') {
    let payload = null;
    try {
      payload = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      // Respond 200 to acknowledge invalid payload and avoid Meta retry storms
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'INVALID_PAYLOAD' }),
      };
    }

    // Verify presence of Meta object
    const metaObject = payload?.object;
    const isSupportedObject = ['whatsapp_business_account', 'instagram', 'page'].includes(metaObject);

    if (!isSupportedObject && !payload?.entry) {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'IGNORED_NON_META_OBJECT' }),
      };
    }

    const now = new Date();

    try {
      const db = await getDb();
      const linesCollection = db.collection('wa_lines');
      const chatsCollection = db.collection('wa_chats');
      const messagesCollection = db.collection('wa_messages');
      const leadsCollection = db.collection('leads');
      const activitiesCollection = db.collection('lead_activities');
      const brainCollection = db.collection('ai_brain');

      for (const entry of payload.entry || []) {
        // =========================================================================
        // A. Process WhatsApp Ingestion (`entry.changes[].value`)
        // =========================================================================
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field !== 'messages') continue;
            const value = change.value;
            if (!value) continue;

            const metadata = value.metadata || {};
            const receptorPhoneNumberId = metadata.phone_number_id;
            const receptorDisplayNumber = metadata.display_phone_number;

            let line = null;
            if (receptorPhoneNumberId) {
              line = await linesCollection.findOne({ phoneNumberId: receptorPhoneNumberId });
            }
            if (!line) {
              line = await linesCollection.findOne({
                $or: [
                  { displayPhoneNumber: receptorDisplayNumber },
                  { status: 'active' },
                ],
              });
            }

            const clientId = line?.clientId || new ObjectId('65df00000000000000000001');

            // Process Status Updates
            if (Array.isArray(value.statuses)) {
              for (const st of value.statuses) {
                if (st.id) {
                  await messagesCollection.updateOne(
                    { wamid: st.id },
                    { $set: { status: st.status, updatedAt: now } }
                  );
                }
              }
            }

            // Process Inbound Messages
            if (Array.isArray(value.messages)) {
              const contacts = value.contacts || [];
              const contactProfile = contacts[0]?.profile?.name || null;

              for (const msg of value.messages) {
                const rawSenderPhone = msg.from;
                const senderPhone = normalizePhoneNumber(rawSenderPhone);
                const messageId = msg.id;
                const msgType = msg.type || 'text';

                let messageText = '';
                let mediaUrl = null;

                if (msgType === 'text') messageText = msg.text?.body || '';
                else if (msgType === 'image') {
                  messageText = msg.image?.caption || '📷 [Imagen recibida]';
                  mediaUrl = msg.image?.id || null;
                } else if (msgType === 'document') {
                  messageText = msg.document?.caption || `📄 [Documento: ${msg.document?.filename || 'archivo'}]`;
                  mediaUrl = msg.document?.id || null;
                } else if (msgType === 'audio') messageText = '🎵 [Mensaje de voz / Audio]';
                else if (msgType === 'video') messageText = msg.video?.caption || '🎥 [Video recibido]';
                else messageText = `[Mensaje ${msgType}]`;

                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                let chat = await chatsCollection.findOne({
                  clientId,
                  contactPhone: senderPhone,
                });

                let leadId = chat?.leadId || null;
                let currentLead = null;

                if (leadId) {
                  currentLead = await leadsCollection.findOne({ _id: leadId });
                }

                // 30-day deduplication window: look for existing lead for this phone
                if (!currentLead) {
                  const existingLead = await leadsCollection.findOne({
                    clientId,
                    $or: [{ phone: senderPhone }, { phone: rawSenderPhone }],
                    $or: [
                      { updatedAt: { $gte: thirtyDaysAgo } },
                      { createdAt: { $gte: thirtyDaysAgo } },
                      { status: 'active' },
                    ],
                  });
                  if (existingLead) {
                    leadId = existingLead._id;
                    currentLead = existingLead;
                  }
                }

                // Create or Update Chat Thread
                if (!chat) {
                  const newChatDoc = {
                    clientId,
                    lineId: line?._id || null,
                    lineDisplayNumber: receptorDisplayNumber || line?.displayPhoneNumber || senderPhone,
                    channel: 'whatsapp',
                    contactPhone: senderPhone,
                    contactName: contactProfile || senderPhone,
                    unreadCount: 1,
                    isBotMuted: false,
                    lastMessage: { text: messageText, type: msgType, direction: 'inbound', status: 'received', timestamp: now },
                    lastMessageAt: now,
                    leadId,
                    assignedToUserId: null,
                    tags: ['WhatsApp'],
                    status: 'active',
                    createdAt: now,
                    updatedAt: now,
                  };
                  const chatInsert = await chatsCollection.insertOne(newChatDoc);
                  chat = { _id: chatInsert.insertedId, ...newChatDoc };
                } else {
                  await chatsCollection.updateOne(
                    { _id: chat._id },
                    {
                      $set: {
                        contactName: chat.contactName || contactProfile || senderPhone,
                        leadId: leadId || chat.leadId,
                        channel: 'whatsapp',
                        lastMessage: { text: messageText, type: msgType, direction: 'inbound', status: 'received', timestamp: now },
                        lastMessageAt: now,
                        status: 'active',
                        updatedAt: now,
                      },
                      $inc: { unreadCount: 1 },
                    }
                  );
                }

                // Persist Message Document
                await messagesCollection.insertOne({
                  clientId,
                  chatId: chat._id,
                  wamid: messageId,
                  channel: 'whatsapp',
                  direction: 'inbound',
                  type: msgType,
                  text: messageText,
                  mediaUrl,
                  status: 'received',
                  timestamp: now,
                  senderName: contactProfile || senderPhone,
                  createdAt: now,
                });

                // ----------------------------------------------------
                // Autonomous AI Agent Evaluation & Mutual Exclusion
                // ----------------------------------------------------
                const brainDoc = brainCollection ? await brainCollection.findOne({ clientId }) : null;
                const brain = brainDoc || DEFAULT_AI_BRAIN;

                // Mutual exclusion: bot does not reply if muted or assigned to human agent
                const isBotEligible = Boolean(brain.autoQualifyEnabled && !chat.isBotMuted && !chat.assignedToUserId);

                if (isBotEligible) {
                  // Retrieve last 10 messages for conversation context
                  let chatHistory = [];
                  if (typeof messagesCollection?.find === 'function') {
                    try {
                      const recentMsgs = await messagesCollection
                        .find({ chatId: chat._id })
                        .sort({ timestamp: -1 })
                        .limit(10)
                        .toArray();
                      chatHistory = recentMsgs.reverse().map((m) => ({
                        direction: m.direction,
                        text: m.text || '',
                      }));
                    } catch (histErr) {
                      console.warn('[WEBHOOK] Could not load chat history:', histErr.message);
                    }
                  }

                  const decision = await evaluateAutonomousAgent({
                    messageText,
                    chatHistory,
                    brain,
                    lead: currentLead,
                    channel: 'whatsapp',
                  });

                  if (decision.replyText) {
                    // Send & store bot response
                    const botMsgDoc = {
                      clientId,
                      chatId: chat._id,
                      wamid: `bot.${Date.now()}`,
                      channel: 'whatsapp',
                      direction: 'outbound',
                      type: 'text',
                      text: decision.replyText,
                      status: 'sent',
                      timestamp: new Date(Date.now() + 1000),
                      senderName: 'Asistente Grupo Novati',
                      createdAt: now,
                    };
                    await messagesCollection.insertOne(botMsgDoc);

                    // Dispatch to Meta WhatsApp Cloud API if configured
                    const metaApiKey = process.env.WHATSAPP_API_TOKEN;
                    const outgoingPhoneId = receptorPhoneNumberId || line?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

                    if (metaApiKey && outgoingPhoneId && !process.env.VITEST) {
                      try {
                        await fetch(`https://graph.facebook.com/v19.0/${outgoingPhoneId}/messages`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${metaApiKey}`,
                          },
                          body: JSON.stringify({
                            messaging_product: 'whatsapp',
                            recipient_type: 'individual',
                            to: senderPhone,
                            type: 'text',
                            text: { preview_url: false, body: decision.replyText },
                          }),
                        });
                      } catch (sendErr) {
                        console.warn('[WEBHOOK] WhatsApp outbound dispatch failed:', sendErr.message);
                      }
                    }

                    await chatsCollection.updateOne(
                      { _id: chat._id },
                      {
                        $set: {
                          lastMessage: {
                            text: decision.replyText,
                            type: 'text',
                            direction: 'outbound',
                            status: 'sent',
                            timestamp: new Date(),
                          },
                          lastMessageAt: new Date(),
                          botLastIntervenedAt: now,
                          isBotMuted: Boolean(decision.shouldHandOff),
                          updatedAt: now,
                        },
                      }
                    );
                  }

                  // 1. Lead Detection: Create or update lead only when commercial interest is detected
                  if (decision.shouldRegisterLead) {
                    if (currentLead) {
                      // Update existing lead
                      const updateDoc = { updatedAt: now };
                      if (decision.leadData?.rubro) updateDoc.rubro = decision.leadData.rubro;
                      if (decision.leadData?.interes) updateDoc.interes = decision.leadData.interes;
                      if (decision.leadData?.tamano) updateDoc.tamano = decision.leadData.tamano;
                      if (decision.leadData?.condicionFiscal && decision.leadData.condicionFiscal !== 'desconocido') {
                        updateDoc.condicionFiscal = decision.leadData.condicionFiscal;
                      }
                      if (decision.leadData?.esClienteFiserv && decision.leadData.esClienteFiserv !== 'desconocido') {
                        updateDoc.esClienteFiserv = decision.leadData.esClienteFiserv;
                      }
                      await leadsCollection.updateOne({ _id: currentLead._id }, { $set: updateDoc });
                    } else {
                      // Create new lead in CRM
                      const newLeadDoc = {
                        clientId,
                        name: decision.leadData?.name || contactProfile || `WhatsApp ${senderPhone}`,
                        email: null,
                        phone: senderPhone,
                        stage: 'new',
                        source: 'whatsapp',
                        status: 'active',
                        tags: ['WhatsApp Inbound', 'Lead Detectado IA'],
                        valueEstimateMinor: 0,
                        currency: 'ARS',
                        rubro: decision.leadData?.rubro || null,
                        interes: decision.leadData?.interes || null,
                        tamano: decision.leadData?.tamano || 'chico',
                        condicionFiscal: decision.leadData?.condicionFiscal || 'desconocido',
                        esClienteFiserv: decision.leadData?.esClienteFiserv || 'desconocido',
                        notes: `Lead detectado automáticamente desde WhatsApp Inbound (${new Date().toLocaleString()}). ${decision.leadData?.notas || ''}`.trim(),
                        acquiredAt: now,
                        createdAt: now,
                        updatedAt: now,
                      };

                      const leadInsert = await leadsCollection.insertOne(newLeadDoc);
                      leadId = leadInsert.insertedId;
                      currentLead = { _id: leadId, ...newLeadDoc };

                      // Link lead to chat
                      await chatsCollection.updateOne({ _id: chat._id }, { $set: { leadId } });

                      if (typeof activitiesCollection?.insertOne === 'function') {
                        await activitiesCollection.insertOne({
                          clientId,
                          leadId,
                          type: 'whatsapp_created',
                          description: `Nuevo prospecto detectado con interés comercial desde WhatsApp (${senderPhone}).`,
                          performedBy: { id: 'assistant_ai', displayName: 'Asistente Grupo Novati', email: 'asistente@novati.com' },
                          data: { initialMessage: messageText, leadData: decision.leadData },
                          createdAt: now,
                        });
                      }

                      // Dispatch guaranteed notification to WhatsApp group
                      await notifyGroup('new_lead', {
                        name: currentLead.name,
                        phone: senderPhone,
                        rubro: decision.leadData?.rubro,
                        ubicacion: decision.leadData?.ubicacion || 'Tucumán',
                        interes: decision.leadData?.interes,
                        tamano: decision.leadData?.tamano,
                        condicionFiscal: decision.leadData?.condicionFiscal,
                        esClienteFiserv: decision.leadData?.esClienteFiserv,
                        notas: decision.leadData?.notas,
                      });
                    }
                  }

                  // 2. Escalation / Human Hand-off
                  if (decision.shouldHandOff) {
                    await chatsCollection.updateOne(
                      { _id: chat._id },
                      {
                        $set: {
                          isBotMuted: true,
                          handOffReason: decision.handOffData?.motivo || 'Solicitud de atención humana',
                          updatedAt: now,
                        },
                      }
                    );

                    if (leadId && typeof activitiesCollection?.insertOne === 'function') {
                      await activitiesCollection.insertOne({
                        clientId,
                        leadId,
                        type: 'handoff_triggered',
                        description: 'Asistente derivó la conversación a un asesor humano.',
                        performedBy: { id: 'assistant_ai', displayName: 'Asistente Grupo Novati', email: 'asistente@novati.com' },
                        data: { reason: decision.handOffData?.motivo, resumen: decision.handOffData?.resumen },
                        createdAt: now,
                      });
                    }

                    // Dispatch guaranteed notification to WhatsApp group
                    await notifyGroup('escalation', {
                      name: chat.contactName || contactProfile || senderPhone,
                      phone: senderPhone,
                      motivo: decision.handOffData?.motivo,
                      resumen: decision.handOffData?.resumen || messageText,
                    });
                  }

                  // 3. Safety Net — Promise of Contact
                  if (decision.shouldPromiseContact) {
                    await chatsCollection.updateOne(
                      { _id: chat._id },
                      {
                        $set: {
                          pendingContactPromise: true,
                          contactPromiseAt: now,
                          contactPromiseDetails: decision.promiseData,
                          updatedAt: now,
                        },
                      }
                    );

                    // Dispatch guaranteed Safety Net notification to WhatsApp group
                    await notifyGroup('unregistered_promise', {
                      phone: senderPhone,
                      promise: decision.promiseData?.promesa,
                      chatId: chat._id?.toString(),
                    });
                  }
                }
              }
            }
          }
        }

        // =========================================================================
        // B. Process Instagram Direct & Facebook Messenger (`entry.messaging[]`)
        // =========================================================================
        if (Array.isArray(entry.messaging)) {
          const channel = metaObject === 'instagram' ? 'instagram' : 'facebook';

          for (const item of entry.messaging) {
            const senderId = item.sender?.id;
            const recipientId = item.recipient?.id;
            const message = item.message;
            if (!senderId || !message) continue;

            const messageText = message.text || (message.attachments ? `📷 [Adjunto ${channel}]` : '[Mensaje]');
            const messageId = message.mid || `mid.${Date.now()}`;

            // Resolve Line and Tenant
            let line = await linesCollection.findOne({
              $or: [{ phoneNumberId: recipientId }, { channel }],
            });

            if (!line) {
              line = await linesCollection.findOne({ status: 'active' });
            }

            const clientId = line?.clientId || new ObjectId('65df00000000000000000001');
            const contactIdentifier = `${channel === 'instagram' ? 'ig_' : 'fb_'}${senderId}`;

            let chat = await chatsCollection.findOne({
              clientId,
              contactPhone: contactIdentifier,
            });

            let leadId = chat?.leadId || null;
            let currentLead = null;

            if (!leadId) {
              const newLeadDoc = {
                clientId,
                name: `${channel === 'instagram' ? 'Instagram Lead' : 'Facebook Lead'} @${senderId.slice(-6)}`,
                email: null,
                phone: contactIdentifier,
                stage: 'new',
                source: channel,
                status: 'active',
                tags: [`${channel === 'instagram' ? 'Instagram Direct' : 'Facebook Messenger'}`],
                valueEstimateMinor: 0,
                currency: 'ARS',
                notes: `Lead creado automáticamente desde ${channel.toUpperCase()} (${new Date().toLocaleString()}).`,
                acquiredAt: now,
                createdAt: now,
                updatedAt: now,
              };

              const leadInsert = await leadsCollection.insertOne(newLeadDoc);
              leadId = leadInsert.insertedId;
              currentLead = { _id: leadId, ...newLeadDoc };
            } else {
              currentLead = await leadsCollection.findOne({ _id: leadId });
            }

            if (!chat) {
              const newChatDoc = {
                clientId,
                lineId: line?._id || null,
                lineDisplayNumber: channel.toUpperCase(),
                channel,
                contactPhone: contactIdentifier,
                contactName: `${channel === 'instagram' ? 'Instagram User' : 'Facebook User'} (${senderId.slice(-4)})`,
                unreadCount: 1,
                isBotMuted: false,
                lastMessage: { text: messageText, type: 'text', direction: 'inbound', status: 'received', timestamp: now },
                lastMessageAt: now,
                leadId,
                assignedToUserId: null,
                tags: [channel === 'instagram' ? 'Instagram' : 'Facebook'],
                status: 'active',
                createdAt: now,
                updatedAt: now,
              };
              const chatInsert = await chatsCollection.insertOne(newChatDoc);
              chat = { _id: chatInsert.insertedId, ...newChatDoc };
            } else {
              await chatsCollection.updateOne(
                { _id: chat._id },
                {
                  $set: {
                    lastMessage: { text: messageText, type: 'text', direction: 'inbound', status: 'received', timestamp: now },
                    lastMessageAt: now,
                    status: 'active',
                    updatedAt: now,
                  },
                  $inc: { unreadCount: 1 },
                }
              );
            }

            // Persist Message
            await messagesCollection.insertOne({
              clientId,
              chatId: chat._id,
              wamid: messageId,
              channel,
              direction: 'inbound',
              type: 'text',
              text: messageText,
              status: 'received',
              timestamp: now,
              senderName: chat.contactName,
              createdAt: now,
            });
          }
        }
      }
    } catch (dbErr) {
      console.error('[OMNICHANNEL_WEBHOOK_PROCESSING_ERROR]', dbErr.message);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'EVENT_RECEIVED' }),
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method Not Allowed' }),
  };
}
