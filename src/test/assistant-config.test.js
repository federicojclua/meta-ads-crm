import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  validateFaqDocument,
  sanitizeFaq,
  sanitizeUnansweredQuery,
  FAQ_CATEGORIES,
} from '../../models/KnowledgeFaq.js';
import { handler as assistantHandler } from '../../netlify/functions/api-assistant.js';
import { handler as whatsappHandler } from '../../netlify/functions/api-whatsapp.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Fase 3 — Assistant Config, Knowledge FAQs, Unanswered Queries & Chat Suggestions', () => {
  // ----------------------------------------------------
  // 1. KnowledgeFaq Model Tests
  // ----------------------------------------------------
  describe('1. KnowledgeFaq Model Validation & Sanitization', () => {
    it('valida que question y answer sean obligatorios al crear una FAQ', () => {
      const resEmpty = validateFaqDocument({});
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.errors).toContain('El campo clientId es obligatorio para asociar la FAQ.');
      expect(resEmpty.errors).toContain('La pregunta es obligatoria.');
      expect(resEmpty.errors).toContain('La respuesta es obligatoria.');

      const resValid = validateFaqDocument({
        clientId: 'client_123',
        question: '¿Qué garantía tienen los equipos Clover?',
        answer: 'Tienen garantía oficial de Fiserv y reemplazo inmediato por falla técnica en Tucumán.',
        category: 'soporte_tecnico',
      });
      expect(resValid.isValid).toBe(true);
    });

    it('rechaza categorías inválidas', () => {
      const res = validateFaqDocument({
        clientId: 'client_123',
        question: 'Pregunta test',
        answer: 'Respuesta test',
        category: 'categoria_inexistente',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors[0]).toContain('Categoría inválida');
    });

    it('sanitiza documentos de FAQ y UnansweredQuery correctamente', () => {
      const rawFaq = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        clientId: new ObjectId('507f1f77bcf86cd799439022'),
        question: '¿Cómo funciona el cobro con Pix?',
        answer: 'Se genera QR en la terminal Clover y el turista brasilero paga en reales.',
        category: 'comercial',
      };
      const sanitizedFaq = sanitizeFaq(rawFaq);
      expect(sanitizedFaq.id).toBe('507f1f77bcf86cd799439011');
      expect(sanitizedFaq.categoryLabel).toBe('Comercial & Ventas');

      const rawQuery = {
        _id: new ObjectId('507f1f77bcf86cd799439033'),
        question: '¿Tienen soporte para balanzas Systel?',
        customerPhone: '+5493815559988',
        status: 'pendiente',
      };
      const sanitizedQuery = sanitizeUnansweredQuery(rawQuery);
      expect(sanitizedQuery.status).toBe('pendiente');
      expect(sanitizedQuery.question).toBe('¿Tienen soporte para balanzas Systel?');
    });
  });

  // ----------------------------------------------------
  // 2. Serverless API Assistant Handler Tests
  // ----------------------------------------------------
  describe('2. Serverless api-assistant Handler', () => {
    let mockDb;
    let mockBrainsCollection;
    let mockFaqsCollection;
    let mockUnansweredCollection;

    beforeEach(() => {
      mockBrainsCollection = {
        findOne: vi.fn(),
        updateOne: vi.fn(),
      };
      mockFaqsCollection = {
        find: vi.fn(),
        findOne: vi.fn(),
        insertOne: vi.fn(),
        deleteOne: vi.fn(),
      };
      mockUnansweredCollection = {
        find: vi.fn(),
        findOne: vi.fn(),
        updateOne: vi.fn(),
      };

      mockDb = {
        collection: vi.fn((name) => {
          if (name === 'ai_brains') return mockBrainsCollection;
          if (name === 'knowledge_faqs') return mockFaqsCollection;
          if (name === 'unanswered_queries') return mockUnansweredCollection;
          return {};
        }),
      };
    });

    it('GET /api/assistant devuelve la configuración de AiBrain y las FAQs activas', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'admin@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      mockBrainsCollection.findOne.mockResolvedValue({
        clientId,
        businessName: 'Grupo Novati',
        tone: 'cercano_de_vos',
      });

      const mockFaqs = [
        {
          _id: new ObjectId(),
          clientId,
          question: '¿Cobran mantenimiento?',
          answer: 'Las terminales PosNet cuentan con bonificación según volumen de cobro.',
          category: 'planes_promos',
        },
      ];

      const toArrayMock = vi.fn().mockResolvedValue(mockFaqs);
      const sortMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
      mockFaqsCollection.find.mockReturnValue({ sort: sortMock });

      const res = await assistantHandler({
        httpMethod: 'GET',
        path: '/api/assistant',
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.brain.businessName).toBe('Grupo Novati');
      expect(data.faqs).toHaveLength(1);
      expect(data.faqs[0].categoryLabel).toBe('Planes y Promociones');
    });

    it('PUT /api/assistant actualiza la configuración visual del cerebro', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'admin@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      mockBrainsCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });
      mockBrainsCollection.findOne.mockResolvedValue({
        clientId,
        businessName: 'Grupo Novati Oficial',
        coverageZone: 'Tucumán y Salta',
        tone: 'cercano_de_vos',
      });

      const res = await assistantHandler({
        httpMethod: 'PUT',
        path: '/api/assistant',
        body: JSON.stringify({
          businessName: 'Grupo Novati Oficial',
          coverageZone: 'Tucumán y Salta',
        }),
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.brain.businessName).toBe('Grupo Novati Oficial');
      expect(mockBrainsCollection.updateOne).toHaveBeenCalled();
    });

    it('GET /api/assistant/unanswered lista dudas de clientes sin responder', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'admin@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const mockQueries = [
        {
          _id: new ObjectId(),
          clientId,
          question: '¿Tienen entrega en Concepción?',
          customerPhone: '+5493865123456',
          status: 'pendiente',
        },
      ];

      const toArrayMock = vi.fn().mockResolvedValue(mockQueries);
      const limitMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
      const sortMock = vi.fn().mockReturnValue({ limit: limitMock });
      mockUnansweredCollection.find.mockReturnValue({ sort: sortMock });

      const res = await assistantHandler({
        httpMethod: 'GET',
        path: '/api/assistant/unanswered',
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.queries).toHaveLength(1);
      expect(data.queries[0].question).toBe('¿Tienen entrega en Concepción?');
    });

    it('POST /api/assistant/teach crea una FAQ y marca la consulta como aprendida', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      const queryId = new ObjectId('507f1f77bcf86cd799439088');

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'admin@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const insertedFaqId = new ObjectId();
      mockFaqsCollection.insertOne.mockResolvedValue({ insertedId: insertedFaqId });
      mockUnansweredCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const res = await assistantHandler({
        httpMethod: 'POST',
        path: '/api/assistant/teach',
        body: JSON.stringify({
          question: '¿Tienen entrega en Concepción?',
          answer: 'Sí, realizamos envíos y visitas comerciales a Concepción y todo el interior de Tucumán sin costo adicional.',
          category: 'comercial',
          unansweredQueryId: queryId.toString(),
        }),
      });

      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.faq.question).toBe('¿Tienen entrega en Concepción?');
      expect(mockUnansweredCollection.updateOne).toHaveBeenCalledWith(
        { _id: queryId },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'aprendido',
            learnedFaqId: insertedFaqId,
          }),
        })
      );
    });

    it('POST /api/assistant/test ejecuta el simulador y devuelve la respuesta del bot', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'admin@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      mockBrainsCollection.findOne.mockResolvedValue({
        clientId,
        businessName: 'Grupo Novati',
      });

      const res = await assistantHandler({
        httpMethod: 'POST',
        path: '/api/assistant/test',
        body: JSON.stringify({
          message: 'Hola, tengo una carnicería en San Miguel y quiero saber sobre Clover',
        }),
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.reply).toBeDefined();
      expect(typeof data.reply).toBe('string');
      expect(data.reply.length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------
  // 3. WhatsApp Chat Suggestions (/suggest) Tests
  // ----------------------------------------------------
  describe('3. WhatsApp Chat Response Suggestion Endpoint', () => {
    it('POST /api/whatsapp/chats/:id/suggest genera un borrador inteligente para el asesor', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      const chatId = new ObjectId('507f1f77bcf86cd799439055');

      const mockChatsCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: chatId,
          clientId,
          contactName: 'Martín Albornoz',
          contactPhone: '+5493814455667',
          lastMessage: { text: '¿Cuánto sale el rollo de papel para PosNet?' },
        }),
      };

      const mockMessagesCollection = {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              toArray: vi.fn().mockResolvedValue([
                {
                  direction: 'inbound',
                  text: '¿Cuánto sale el rollo de papel para PosNet?',
                  timestamp: new Date(),
                },
              ]),
            }),
          }),
        }),
      };

      const mockDb = {
        collection: vi.fn((col) => {
          if (col === 'wa_chats') return mockChatsCollection;
          if (col === 'wa_messages') return mockMessagesCollection;
          if (col === 'ai_brains' || col === 'ai_brain') {
            return { findOne: vi.fn().mockResolvedValue(null) };
          }
          if (col === 'leads') {
            return { findOne: vi.fn().mockResolvedValue(null) };
          }
          return {};
        }),
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'asesor@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const res = await whatsappHandler({
        httpMethod: 'POST',
        path: `/api/whatsapp/chats/${chatId.toString()}/suggest`,
        headers: {},
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.suggestion).toBeDefined();
      expect(typeof data.suggestion).toBe('string');
      expect(data.suggestion.length).toBeGreaterThan(0);
    });
  });
});
