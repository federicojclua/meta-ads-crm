import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as webhookHandler } from '../../netlify/functions/api-whatsapp-webhook.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';

describe('Stage 14 — Omnichannel Hub (Instagram & Facebook) Webhook Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  let mockLinesCollection;
  let mockChatsCollection;
  let mockMessagesCollection;
  let mockLeadsCollection;
  let mockActivitiesCollection;
  let mockBrainCollection;
  let mockDb;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLinesCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: new ObjectId(),
        clientId: mockTenantId,
        phoneNumberId: 'ig_page_1001',
        displayPhoneNumber: 'Instagram Account',
        name: 'Instagram Direct',
        channel: 'instagram',
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
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockActivitiesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockBrainCollection = {
      findOne: vi.fn().mockResolvedValue({
        clientId: mockTenantId,
        autoQualifyEnabled: true,
        autoSetterEnabled: true,
      }),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'wa_lines') return mockLinesCollection;
        if (name === 'wa_chats') return mockChatsCollection;
        if (name === 'wa_messages') return mockMessagesCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'lead_activities') return mockActivitiesCollection;
        if (name === 'ai_brain') return mockBrainCollection;
        return null;
      }),
    };

    vi.spyOn(DbModule, 'getDb').mockResolvedValue(mockDb);
  });

  it('1. POST /api/whatsapp/webhook procesa mensaje de Instagram Direct y crea lead con source "instagram"', async () => {
    const igPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'IG_ACC_123',
          time: 1724770000,
          messaging: [
            {
              sender: { id: '987654321' },
              recipient: { id: 'ig_page_1001' },
              timestamp: 1724770000,
              message: {
                mid: 'm_ig_12345',
                text: 'Hola! Vi su reel de ecommerce y quiero información.',
              },
            },
          ],
        },
      ],
    };

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(igPayload),
    };

    const res = await webhookHandler(event);
    expect(res.statusCode).toBe(200);

    expect(mockLeadsCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: mockTenantId,
        source: 'instagram',
        stage: 'new',
      })
    );

    expect(mockChatsCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'instagram',
      })
    );
  });

  it('2. POST /api/whatsapp/webhook procesa Facebook Messenger y califica lead automáticamente', async () => {
    const fbPayload = {
      object: 'page',
      entry: [
        {
          id: 'PAGE_123',
          time: 1724770000,
          messaging: [
            {
              sender: { id: '5544332211' },
              recipient: { id: 'page_receiver_1' },
              timestamp: 1724770000,
              message: {
                mid: 'm_fb_9988',
                text: 'Tenemos un presupuesto de $200.000 para Meta Ads y buscamos generar clientes.',
              },
            },
          ],
        },
      ],
    };

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(fbPayload),
    };

    const res = await webhookHandler(event);
    expect(res.statusCode).toBe(200);

    expect(mockLeadsCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'facebook',
      })
    );
  });
});
