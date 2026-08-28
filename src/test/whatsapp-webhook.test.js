import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as webhookHandler } from '../../netlify/functions/api-whatsapp-webhook.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';

describe('Stage 13 — Meta WhatsApp Cloud API Webhook Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  const mockLineId = new ObjectId('65df22222222222222222222');

  let mockLinesCollection;
  let mockChatsCollection;
  let mockMessagesCollection;
  let mockLeadsCollection;
  let mockActivitiesCollection;
  let mockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WHATSAPP_VERIFY_TOKEN = 'anima_mkt_crm_wa_token';

    mockLinesCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: mockLineId,
        clientId: mockTenantId,
        phoneNumberId: '105938472910394',
        displayPhoneNumber: '+54 9 11 5829-4400',
        name: 'Línea Ventas Principal',
        status: 'active',
      }),
    };

    mockChatsCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockMessagesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockLeadsCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockActivitiesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'wa_lines') return mockLinesCollection;
        if (name === 'wa_chats') return mockChatsCollection;
        if (name === 'wa_messages') return mockMessagesCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'lead_activities') return mockActivitiesCollection;
        return null;
      }),
    };

    vi.spyOn(DbModule, 'getDb').mockResolvedValue(mockDb);
  });

  it('1. GET /api/whatsapp/webhook responde con hub.challenge ante handshake válido', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'anima_mkt_crm_wa_token',
        'hub.challenge': 'CHALLENGE_CODE_12345',
      },
    };

    const res = await webhookHandler(event);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('CHALLENGE_CODE_12345');
  });

  it('2. GET /api/whatsapp/webhook rechaza token de verificación incorrecto con 403', async () => {
    const event = {
      httpMethod: 'GET',
      queryStringParameters: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'INVALID_TOKEN_TEST',
        'hub.challenge': 'CHALLENGE_CODE_12345',
      },
    };

    const res = await webhookHandler(event);
    expect(res.statusCode).toBe(403);
  });

  it('3. POST /api/whatsapp/webhook ingesta mensaje entrante y crea Lead automático en etapa "new"', async () => {
    const metaPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_12345',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+54 9 11 5829-4400',
                  phone_number_id: '105938472910394',
                },
                contacts: [
                  {
                    profile: { name: 'Valentina Morales' },
                    wa_id: '5491133445566',
                  },
                ],
                messages: [
                  {
                    from: '5491133445566',
                    id: 'wamid.HBgL9988776655',
                    timestamp: '1724770000',
                    type: 'text',
                    text: { body: 'Hola! Quiero solicitar presupuesto para pauta en Meta Ads.' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(metaPayload),
    };

    const res = await webhookHandler(event);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: 'EVENT_RECEIVED' });

    // Verify automatic lead creation in stage "new"
    expect(mockLeadsCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: mockTenantId,
        name: 'Valentina Morales',
        phone: '+5491133445566',
        stage: 'new',
        source: 'whatsapp',
      })
    );

    // Verify chat creation and message storage
    expect(mockChatsCollection.insertOne).toHaveBeenCalled();
    expect(mockMessagesCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: mockTenantId,
        wamid: 'wamid.HBgL9988776655',
        direction: 'inbound',
        text: 'Hola! Quiero solicitar presupuesto para pauta en Meta Ads.',
      })
    );
  });

  it('4. POST /api/whatsapp/webhook procesa actualización de estados de lectura (delivered, read)', async () => {
    const metaStatusPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WABA_12345',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  phone_number_id: '105938472910394',
                },
                statuses: [
                  {
                    id: 'wamid.HBgL1122334455',
                    status: 'read',
                    recipient_id: '5491133445566',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(metaStatusPayload),
    };

    const res = await webhookHandler(event);
    expect(res.statusCode).toBe(200);
    expect(mockMessagesCollection.updateOne).toHaveBeenCalledWith(
      { wamid: 'wamid.HBgL1122334455' },
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'read' }),
      })
    );
  });
});
