import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  WA_CONVERSATION_STATUSES,
  validateWaChat,
  sanitizeWaChat,
  sanitizeWaMessage,
} from '../../models/WhatsApp.js';
import { handler as whatsappHandler } from '../../netlify/functions/api-whatsapp.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';
import * as NotifierModule from '../../netlify/functions/_shared/whatsappGroupNotifier.js';

describe('Fase 5 — Conversaciones Operativas (Inbox para Trabajar)', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  const mockChatId = new ObjectId('65df22222222222222222222');
  const mockUserId = new ObjectId('65df44444444444444444444');

  const mockUser = {
    _id: mockUserId,
    email: 'asesor@novati.com',
    displayName: 'Carlos Asesor',
    role: 'client',
    clientId: mockTenantId,
    clientIds: [mockTenantId],
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
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      findOne: vi.fn().mockResolvedValue({
        _id: new ObjectId(),
        clientId: mockTenantId,
        phoneNumberId: '105938472910394',
      }),
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
              conversationStatus: 'en_curso',
              isBotMuted: true,
              assignedToUserId: mockUserId,
              internalNotesCount: 2,
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
        conversationStatus: 'abierta',
        isBotMuted: false,
        status: 'active',
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockMessagesCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            toArray: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockLeadsCollection = {
      find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      findOne: vi.fn().mockResolvedValue(null),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockUsersCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: mockUserId, displayName: 'Carlos Asesor', email: 'asesor@novati.com' },
        ]),
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
        return {
          find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
          findOne: vi.fn().mockResolvedValue(null),
        };
      }),
    };
  });

  describe('1. Modelos y Sanitización', () => {
    it('define y valida los cuatro estados de conversación de Octubre 2026', () => {
      expect(WA_CONVERSATION_STATUSES).toEqual(['abierta', 'en_curso', 'esperando', 'resuelta']);

      const validRes = validateWaChat({
        clientId: mockTenantId,
        contactPhone: '+5491144556677',
        conversationStatus: 'en_curso',
      });
      expect(validRes.isValid).toBe(true);

      const invalidRes = validateWaChat({
        clientId: mockTenantId,
        contactPhone: '+5491144556677',
        conversationStatus: 'estado_invalido',
      });
      expect(invalidRes.isValid).toBe(false);
      expect(invalidRes.errors[0]).toContain('Estado de conversación inválido');
    });

    it('sanitiza chats exponiendo conversationStatus, isBotMuted e internalNotesCount', () => {
      const sanitized = sanitizeWaChat({
        _id: mockChatId,
        clientId: mockTenantId,
        contactPhone: '+5491144556677',
        conversationStatus: 'esperando',
        isBotMuted: true,
        internalNotesCount: 4,
      });

      expect(sanitized.conversationStatus).toBe('esperando');
      expect(sanitized.isBotMuted).toBe(true);
      expect(sanitized.internalNotesCount).toBe(4);
    });

    it('sanitiza mensajes reconociendo notas internas y adjuntos de archivos', () => {
      const sanitizedNote = sanitizeWaMessage({
        _id: new ObjectId(),
        clientId: mockTenantId,
        chatId: mockChatId,
        type: 'internal_note',
        direction: 'internal',
        text: 'Llamar mañana por la mañana',
      });
      expect(sanitizedNote.isInternalNote).toBe(true);
      expect(sanitizedNote.direction).toBe('internal');

      const sanitizedDoc = sanitizeWaMessage({
        _id: new ObjectId(),
        clientId: mockTenantId,
        chatId: mockChatId,
        type: 'document',
        mediaUrl: 'https://example.com/propuesta.pdf',
        fileName: 'propuesta.pdf',
        fileSize: '1.2 MB',
      });
      expect(sanitizedDoc.fileName).toBe('propuesta.pdf');
      expect(sanitizedDoc.fileSize).toBe('1.2 MB');
      expect(sanitizedDoc.isInternalNote).toBe(false);
    });
  });

  describe('2. Endpoints Backend: Takeover, Notas y Envío', () => {
    it('POST /api/whatsapp/chats/:id/takeover (take) silencia al bot, asigna asesor y cambia a en_curso', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: mockTenantId.toString(),
        isGlobal: false,
      });

      mockChatsCollection.findOne
        .mockResolvedValueOnce({ _id: mockChatId, clientId: mockTenantId, isBotMuted: false })
        .mockResolvedValueOnce({
          _id: mockChatId,
          clientId: mockTenantId,
          isBotMuted: true,
          conversationStatus: 'en_curso',
          assignedToUserId: mockUserId,
        });

      const res = await whatsappHandler({
        httpMethod: 'POST',
        path: `/api/whatsapp/chats/${mockChatId.toString()}/takeover`,
        body: JSON.stringify({ action: 'take', reason: 'Asesor atendiendo' }),
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.action).toBe('take');
      expect(mockChatsCollection.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: mockChatId }),
        expect.objectContaining({
          $set: expect.objectContaining({
            isBotMuted: true,
            conversationStatus: 'en_curso',
            assignedToUserId: mockUserId,
          }),
        })
      );
      // Registra nota interna de auditoría
      expect(mockMessagesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'internal_note',
          direction: 'internal',
          text: expect.stringContaining('Conversación tomada por Carlos Asesor'),
        })
      );
    });

    it('POST /api/whatsapp/chats/:id/takeover (release) devuelve el control al Asistente IA', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: mockTenantId.toString(),
        isGlobal: false,
      });

      mockChatsCollection.findOne
        .mockResolvedValueOnce({ _id: mockChatId, clientId: mockTenantId, isBotMuted: true })
        .mockResolvedValueOnce({
          _id: mockChatId,
          clientId: mockTenantId,
          isBotMuted: false,
          conversationStatus: 'esperando',
        });

      const res = await whatsappHandler({
        httpMethod: 'POST',
        path: `/api/whatsapp/chats/${mockChatId.toString()}/takeover`,
        body: JSON.stringify({ action: 'release' }),
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.action).toBe('release');
      expect(mockChatsCollection.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: mockChatId }),
        expect.objectContaining({
          $set: expect.objectContaining({
            isBotMuted: false,
            conversationStatus: 'esperando',
          }),
        })
      );
    });

    it('POST /api/whatsapp/send con type: internal_note crea una nota privada sin disparar Meta', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: mockTenantId.toString(),
        isGlobal: false,
      });

      const noteText = 'Cliente solicitó contactar a su contador por el CUIT.';
      const res = await whatsappHandler({
        httpMethod: 'POST',
        path: '/api/whatsapp/send',
        body: JSON.stringify({
          chatId: mockChatId.toString(),
          type: 'internal_note',
          text: noteText,
        }),
      });

      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.message.isInternalNote).toBe(true);
      expect(data.message.text).toBe(noteText);
      expect(mockMessagesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'internal_note',
          direction: 'internal',
          text: noteText,
          authorId: mockUserId,
        })
      );
    });

    it('POST /api/whatsapp/chats/:id/notify-takeover despacha aviso de escalación al grupo de WhatsApp', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: mockTenantId.toString(),
        isGlobal: false,
      });

      const notifySpy = vi.spyOn(NotifierModule, 'notifyGroup').mockResolvedValueOnce({
        sent: true,
        dispatched: true,
      });

      const res = await whatsappHandler({
        httpMethod: 'POST',
        path: `/api/whatsapp/chats/${mockChatId.toString()}/notify-takeover`,
        body: JSON.stringify({ reason: 'Duda difícil sobre liquidación ARCA' }),
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(notifySpy).toHaveBeenCalledWith(
        'escalation',
        expect.objectContaining({
          motivo: 'Duda difícil sobre liquidación ARCA',
        })
      );
    });

    it('PATCH /api/whatsapp/chats/:id actualiza conversationStatus y asignación', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: mockTenantId.toString(),
        isGlobal: false,
      });

      mockChatsCollection.findOne
        .mockResolvedValueOnce({ _id: mockChatId, clientId: mockTenantId })
        .mockResolvedValueOnce({
          _id: mockChatId,
          clientId: mockTenantId,
          conversationStatus: 'resuelta',
          assignedToUserId: mockUserId,
        });

      const res = await whatsappHandler({
        httpMethod: 'PATCH',
        path: `/api/whatsapp/chats/${mockChatId.toString()}`,
        body: JSON.stringify({
          conversationStatus: 'resuelta',
          assignedToUserId: mockUserId.toString(),
        }),
      });

      expect(res.statusCode).toBe(200);
      expect(mockChatsCollection.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: mockChatId }),
        expect.objectContaining({
          $set: expect.objectContaining({
            conversationStatus: 'resuelta',
            assignedToUserId: mockUserId,
          }),
        })
      );
    });
  });
});
