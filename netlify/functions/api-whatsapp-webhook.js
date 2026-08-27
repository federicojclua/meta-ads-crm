import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { normalizePhoneNumber } from '../../models/WhatsApp.js';
import { evaluateAutonomousAgent } from './_shared/agentEngine.js';
import { DEFAULT_AI_BRAIN } from '../../models/AiBrain.js';

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

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'anima_mkt_crm_wa_token';

    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[OMNICHANNEL_WEBHOOK] Handshake verified successfully.');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge,
      };
    }

    console.warn('[OMNICHANNEL_WEBHOOK] Handshake verification failed:', { mode, tokenProvided: Boolean(token) });
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Verification token mismatch.' }),
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

                let chat = await chatsCollection.findOne({
                  clientId,
                  contactPhone: senderPhone,
                });

                let leadId = chat?.leadId || null;
                let currentLead = null;

                if (!leadId) {
                  const existingLead = await leadsCollection.findOne({
                    clientId,
                    $or: [{ phone: senderPhone }, { phone: rawSenderPhone }],
                  });

                  if (existingLead) {
                    leadId = existingLead._id;
                    currentLead = existingLead;
                  } else {
                    const newLeadDoc = {
                      clientId,
                      name: contactProfile || `WhatsApp ${senderPhone}`,
                      email: null,
                      phone: senderPhone,
                      stage: 'new',
                      source: 'whatsapp',
                      status: 'active',
                      tags: ['WhatsApp Inbound'],
                      valueEstimateMinor: 0,
                      currency: 'ARS',
                      notes: `Lead creado automáticamente desde WhatsApp Inbound (${new Date().toLocaleString()}). Mensaje inicial: "${messageText.slice(0, 150)}"`,
                      acquiredAt: now,
                      createdAt: now,
                      updatedAt: now,
                    };

                    const leadInsert = await leadsCollection.insertOne(newLeadDoc);
                    leadId = leadInsert.insertedId;
                    currentLead = { _id: leadId, ...newLeadDoc };

                    await activitiesCollection.insertOne({
                      clientId,
                      leadId,
                      type: 'whatsapp_created',
                      description: `Nuevo prospecto generado automáticamente desde WhatsApp (${senderPhone}).`,
                      performedBy: { id: 'system_webhook', email: 'system@animamkt.com', displayName: 'WhatsApp Cloud Webhook' },
                      data: { initialMessage: messageText, receptorLine: receptorDisplayNumber },
                      createdAt: now,
                    });
                  }
                } else {
                  currentLead = await leadsCollection.findOne({ _id: leadId });
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
                        leadId,
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
                // Subetapa 14.2: Autonomous AI Agent Qualification
                // ----------------------------------------------------
                const brainDoc = await brainCollection.findOne({ clientId });
                const brain = brainDoc || DEFAULT_AI_BRAIN;

                if (brain.autoQualifyEnabled && !chat.isBotMuted && currentLead?.stage === 'new') {
                  const decision = await evaluateAutonomousAgent({
                    messageText,
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
                      senderName: 'IA Comercial (Calificador)',
                      createdAt: now,
                    };
                    await messagesCollection.insertOne(botMsgDoc);

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

                  // Mutate Pipeline: Promote to 'qualified' if criteria met
                  if (decision.shouldQualify) {
                    await leadsCollection.updateOne(
                      { _id: leadId },
                      { $set: { stage: 'qualified', updatedAt: now } }
                    );

                    await activitiesCollection.insertOne({
                      clientId,
                      leadId,
                      type: 'stage_change',
                      description: 'Prospecto calificado automáticamente por el Agente de IA comercial.',
                      performedBy: { id: 'ai_qualifier', displayName: 'Agente Calificador IA', email: 'bot@animamkt.com' },
                      data: { newStage: 'qualified', reason: decision.reason },
                      createdAt: now,
                    });
                  }

                  // If Hand-off triggered, log alert for human team
                  if (decision.shouldHandOff) {
                    await activitiesCollection.insertOne({
                      clientId,
                      leadId,
                      type: 'bot_handoff',
                      description: `Pase a humano solicitado por el bot: ${decision.reason}`,
                      performedBy: { id: 'ai_bot', displayName: 'Agente IA', email: 'bot@animamkt.com' },
                      data: { reason: decision.reason },
                      createdAt: now,
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
      console.error('[OMNICHANNEL_WEBHOOK_PROCESSING_ERROR]', dbErr);
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
