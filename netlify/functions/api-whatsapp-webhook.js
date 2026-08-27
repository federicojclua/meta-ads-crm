import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { normalizePhoneNumber } from '../../models/WhatsApp.js';

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
      console.log('[WHATSAPP_WEBHOOK] Handshake verified successfully.');
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge,
      };
    }

    console.warn('[WHATSAPP_WEBHOOK] Handshake verification failed:', { mode, tokenProvided: Boolean(token) });
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Verification token mismatch.' }),
    };
  }

  // ----------------------------------------------------
  // 2. POST: Ingest Messages and Delivery Statuses from Meta
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

    // Verify WhatsApp object presence
    if (payload?.object !== 'whatsapp_business_account' && !payload?.entry) {
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'IGNORED_NON_WHATSAPP' }),
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

      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field !== 'messages') continue;
          const value = change.value;
          if (!value) continue;

          const metadata = value.metadata || {};
          const receptorPhoneNumberId = metadata.phone_number_id;
          const receptorDisplayNumber = metadata.display_phone_number;

          // 2.1 Identify Tenant (clientId) by Receptor Line
          let line = null;
          if (receptorPhoneNumberId) {
            line = await linesCollection.findOne({ phoneNumberId: receptorPhoneNumberId });
          }

          // Fallback: If line not registered yet, attempt lookup by display number or use first active tenant
          if (!line) {
            line = await linesCollection.findOne({
              $or: [
                { displayPhoneNumber: receptorDisplayNumber },
                { status: 'active' },
              ],
            });
          }

          const clientId = line?.clientId || new ObjectId('65df00000000000000000001');

          // 2.2 Process Status Updates (sent, delivered, read, failed)
          if (Array.isArray(value.statuses)) {
            for (const st of value.statuses) {
              if (st.id) {
                await messagesCollection.updateOne(
                  { wamid: st.id },
                  {
                    $set: {
                      status: st.status,
                      updatedAt: now,
                    },
                  }
                );
              }
            }
          }

          // 2.3 Process Inbound Messages
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

              if (msgType === 'text') {
                messageText = msg.text?.body || '';
              } else if (msgType === 'image') {
                messageText = msg.image?.caption || '📷 [Imagen recibida]';
                mediaUrl = msg.image?.id || null;
              } else if (msgType === 'document') {
                messageText = msg.document?.caption || `📄 [Documento: ${msg.document?.filename || 'archivo'}]`;
                mediaUrl = msg.document?.id || null;
              } else if (msgType === 'audio') {
                messageText = '🎵 [Mensaje de voz / Audio]';
              } else if (msgType === 'video') {
                messageText = msg.video?.caption || '🎥 [Video recibido]';
              } else {
                messageText = `[Mensaje ${msgType}]`;
              }

              // Check if chat already exists
              let chat = await chatsCollection.findOne({
                clientId,
                contactPhone: senderPhone,
              });

              let leadId = chat?.leadId || null;

              // Rule 1: Pipeline Synergy — If no lead exists, automatically create a new Lead in stage 'new'
              if (!leadId) {
                const existingLead = await leadsCollection.findOne({
                  clientId,
                  $or: [
                    { phone: senderPhone },
                    { phone: rawSenderPhone },
                  ],
                });

                if (existingLead) {
                  leadId = existingLead._id;
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

                  // Log Lead Activity
                  await activitiesCollection.insertOne({
                    clientId,
                    leadId,
                    type: 'whatsapp_created',
                    description: `Nuevo prospecto generado automáticamente desde WhatsApp (${senderPhone}).`,
                    performedBy: {
                      id: 'system_webhook',
                      email: 'system@animamkt.com',
                      displayName: 'WhatsApp Cloud Webhook',
                    },
                    data: {
                      initialMessage: messageText,
                      receptorLine: receptorDisplayNumber,
                    },
                    createdAt: now,
                  });
                }
              }

              // Create or Update Chat Thread
              if (!chat) {
                const newChatDoc = {
                  clientId,
                  lineId: line?._id || null,
                  lineDisplayNumber: receptorDisplayNumber || line?.displayPhoneNumber || senderPhone,
                  contactPhone: senderPhone,
                  contactName: contactProfile || senderPhone,
                  unreadCount: 1,
                  lastMessage: {
                    text: messageText,
                    type: msgType,
                    direction: 'inbound',
                    status: 'received',
                    timestamp: now,
                  },
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
                      lastMessage: {
                        text: messageText,
                        type: msgType,
                        direction: 'inbound',
                        status: 'received',
                        timestamp: now,
                      },
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
                direction: 'inbound',
                type: msgType,
                text: messageText,
                mediaUrl,
                status: 'received',
                timestamp: now,
                senderName: contactProfile || senderPhone,
                createdAt: now,
              });

              // Also log conversation activity on the CRM lead
              if (leadId) {
                await activitiesCollection.insertOne({
                  clientId,
                  leadId,
                  type: 'whatsapp_inbound',
                  description: `Mensaje de WhatsApp recibido: "${messageText.slice(0, 100)}"`,
                  performedBy: {
                    id: 'contact',
                    displayName: contactProfile || senderPhone,
                    email: null,
                  },
                  data: {
                    text: messageText,
                    wamid: messageId,
                  },
                  createdAt: now,
                });
              }
            }
          }
        }
      }
    } catch (dbErr) {
      console.error('[WHATSAPP_WEBHOOK_PROCESSING_ERROR]', dbErr);
    }

    // Always respond 200 immediately to Meta
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
