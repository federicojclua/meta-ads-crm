import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as whatsappHandler } from '../../netlify/functions/api-whatsapp.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 13 — Backend WhatsApp API Endpoint Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  const mockChatId = new ObjectId('65df22222222222222222222');
  const mockLeadId = new ObjectId('65df33333333333333333333');

  const mockAdminUser = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'admin@animamkt.com',
    role: 'super_admin',
    displayName: 'Admin Anima',
  };

  let mockLinesCollection;
  let mockChatsCollection;
  let mockMessagesCollection;
  let mockLeadsCollection;
  let mockUsersCollection;
  let mockActivitiesCollection;
  let mockRateLimitsCollection;
  let mockDb;

  beforeEach(() => {
    vi.clearAllMocks();

    mockLinesCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            clientId: mockTenantId,
            phoneNumberId: '105938472910394',
            displayPhoneNumber: '+54 9 11 5829-4400',
            name: 'Línea Ventas Principal',
            status: 'active',
          },
        ]),
      }),
      findOne: vi.fn().mockResolvedValue({
        _id: new ObjectId(),
        clientId: mockTenantId,
        phoneNumberId: '105938472910394',
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockChatsCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            {
              _id: mockChatId,
              clientId: mockTenantId,
              contactPhone: '+5491144556677',
              contactName: 'Lucía Fernández',
              unreadCount: 1,
              lastMessage: { text: 'Hola!', direction: 'inbound', status: 'received' },
              leadId: mockLeadId,
              tags: ['Meta Ads'],
              status: 'active',
            },
          ]),
        }),
      }),
      findOne: vi.fn().mockResolvedValue({
        _id: mockChatId,
        clientId: mockTenantId,
        contactPhone: '+5491144556677',
        contactName: 'Lucía Fernández',
        leadId: mockLeadId,
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockMessagesCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([
              {
                _id: new ObjectId(),
                clientId: mockTenantId,
                chatId: mockChatId,
                wamid: 'wamid.12345',
                direction: 'inbound',
                text: 'Hola!',
                status: 'read',
              },
            ]),
          }),
        }),
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockLeadsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: mockLeadId, clientId: mockTenantId, name: 'Lucía Fernández', stage: 'new' },
        ]),
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockUsersCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    };

    mockActivitiesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockRateLimitsCollection = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ count: 1 }),
      createIndex: vi.fn().mockResolvedValue('ok'),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'wa_lines') return mockLinesCollection;
        if (name === 'wa_chats') return mockChatsCollection;
        if (name === 'wa_messages') return mockMessagesCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'users') return mockUsersCollection;
        if (name === 'lead_activities') return mockActivitiesCollection;
        if (name === 'rate_limits') return mockRateLimitsCollection;
        return { find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }), findOne: vi.fn().mockResolvedValue(null) };
      }),
    };
  });

  it('1. GET /api/whatsapp/lines retorna las líneas conectadas del inquilino', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: mockTenantId,
      isGlobal: true,
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/whatsapp/lines',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await whatsappHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.lines)).toBe(true);
    expect(body.lines.length).toBeGreaterThanOrEqual(1);
  });

  it('2. GET /api/whatsapp/chats retorna la lista de chats enriquecida con datos de leads', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: mockTenantId,
      isGlobal: true,
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/whatsapp/chats',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await whatsappHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.chats[0].contactName).toBe('Lucía Fernández');
    expect(body.chats[0].lead.stage).toBe('new');
  });

  it('3. GET /api/whatsapp/chats/:chatId/messages retorna el historial y resetea unreadCount', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: mockTenantId,
      isGlobal: true,
    });

    const event = {
      httpMethod: 'GET',
      path: `/api/whatsapp/chats/${mockChatId}/messages`,
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await whatsappHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.messages.length).toBe(1);
    expect(mockChatsCollection.updateOne).toHaveBeenCalledWith(
      { _id: mockChatId },
      expect.objectContaining({ $set: expect.objectContaining({ unreadCount: 0 }) })
    );
  });

  it('4. POST /api/whatsapp/send almacena el mensaje saliente y registra actividad en el Lead', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: mockTenantId,
      isGlobal: true,
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/whatsapp/send',
      body: JSON.stringify({
        chatId: mockChatId.toString(),
        text: '¡Hola Lucía! Te enviamos la propuesta comercial.',
      }),
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await whatsappHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.message.text).toContain('propuesta comercial');
    expect(mockMessagesCollection.insertOne).toHaveBeenCalled();
    expect(mockActivitiesCollection.insertOne).toHaveBeenCalled();
  });

  it('5. PATCH /api/whatsapp/chats/:chatId actualiza la etapa del lead en el pipeline comercial', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: mockTenantId,
      isGlobal: true,
    });

    const event = {
      httpMethod: 'PATCH',
      path: `/api/whatsapp/chats/${mockChatId}`,
      body: JSON.stringify({
        leadStage: 'qualified',
      }),
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await whatsappHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(mockLeadsCollection.updateOne).toHaveBeenCalledWith(
      { _id: mockLeadId },
      expect.objectContaining({ $set: expect.objectContaining({ stage: 'qualified' }) })
    );
  });
});
