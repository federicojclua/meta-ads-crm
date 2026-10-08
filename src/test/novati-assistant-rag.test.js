import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  loadKnowledgeBase,
  searchKnowledge,
  buildRAGContext,
  getCommercialPlan,
  formatCommercialPlan,
} from '../../netlify/functions/_shared/knowledgeBase.js';
import {
  formatGroupNotification,
  notifyGroup,
} from '../../netlify/functions/_shared/whatsappGroupNotifier.js';
import { evaluateAutonomousAgent } from '../../netlify/functions/_shared/agentEngine.js';
import { DEFAULT_AI_BRAIN } from '../../models/AiBrain.js';
import { handler as webhookHandler } from '../../netlify/functions/api-whatsapp-webhook.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';

describe('Fase 1 — Novati Assistant, Inline RAG & Operational Group Alerts Tests', () => {
  // ----------------------------------------------------
  // 1. Knowledge Base RAG Engine
  // ----------------------------------------------------
  describe('1. Knowledge Base RAG Engine', () => {
    it('carga los documentos de la base de conocimiento y omite el dump pesado de 530KB', () => {
      const docs = loadKnowledgeBase();
      expect(docs.length).toBeGreaterThanOrEqual(20);

      const articulosDoc = docs.find((d) => d.filename === 'posberry_kb_articulos.md');
      expect(articulosDoc).toBeDefined();
      expect(articulosDoc.content).toContain('371 artículos de ayuda técnica');
      expect(articulosDoc.content.length).toBeLessThan(1000);
    });

    it('busca y ranquea correctamente fragmentos relevantes por palabras clave', () => {
      const resultsClover = searchKnowledge('¿Qué terminal Clover me recomiendan para mostrador?');
      expect(resultsClover.length).toBeGreaterThan(0);
      const topTitle = resultsClover.map((r) => r.title.toLowerCase()).join(' ');
      expect(topTitle).toMatch(/clover|mini|dispositivos/);

      const resultsPC = searchKnowledge('Necesito comprar una PC con monitor para el negocio');
      expect(resultsPC.length).toBeGreaterThan(0);
      const pcTitles = resultsPC.map((r) => r.title.toLowerCase()).join(' ');
      expect(pcTitles).toMatch(/equipamiento|pc/);
    });

    it('construye el bloque de contexto RAG formateado para inyección en el prompt', () => {
      const ragContext = buildRAGContext('¿Cómo se cobra con QR en Clover?');
      expect(ragContext).toContain('###');
      expect(ragContext.toLowerCase()).toMatch(/qr|clover|fiserv/);
    });
  });

  // ----------------------------------------------------
  // 2. Commercial Plan Matrix
  // ----------------------------------------------------
  describe('2. Commercial Plan Matrix', () => {
    it('obtiene las ofertas activas ordenadas por prioridad', () => {
      const plan = getCommercialPlan();
      expect(plan.length).toBeGreaterThanOrEqual(2);
      expect(plan[0].id).toBe('monotributista_nuevo');
      expect(plan[1].id).toBe('reactivacion_posnet_clover');
    });

    it('formatea el Plan Comercial con preguntas de calificación, exclusiones y beneficios', () => {
      const formatted = formatCommercialPlan(DEFAULT_AI_BRAIN.commercialPlan);
      expect(formatted).toContain('Propuesta Monotributista');
      expect(formatted).toContain('¿Hoy ya trabajás con Fiserv');
      expect(formatted).toContain('QR: $0 los primeros 3 meses');
      expect(formatted).toContain('Promo Reactivación PosNet/Clover');
    });
  });

  // ----------------------------------------------------
  // 3. WhatsApp Group Operational Notifier (5 Avisos)
  // ----------------------------------------------------
  describe('3. WhatsApp Group Operational Notifier', () => {
    it('formatea correctamente los 5 tipos de avisos operativos', () => {
      // 1. New Lead
      const leadNotice = formatGroupNotification('new_lead', {
        name: 'Panadería San Martín',
        phone: '+5493816112233',
        rubro: 'Panadería',
        ubicacion: 'San Miguel de Tucumán',
        interes: 'Clover Mini y POSBerry',
        tamano: 'chico',
      });
      expect(leadNotice).toContain('NUEVO LEAD DETECTADO');
      expect(leadNotice).toContain('Panadería San Martín');
      expect(leadNotice).toContain('Clover Mini y POSBerry');

      // 2. Escalation
      const escalationNotice = formatGroupNotification('escalation', {
        name: 'Carlos Gómez',
        phone: '+5493816998877',
        motivo: 'Solicitud de presupuesto mayorista',
        resumen: 'Tiene 6 sucursales y quiere hablar con un ejecutivo.',
      });
      expect(escalationNotice).toContain('CONVERSACIÓN ESCALADA');
      expect(escalationNotice).toContain('Carlos Gómez');
      expect(escalationNotice).toContain('Solicitud de presupuesto mayorista');

      // 3. New Case
      const caseNotice = formatGroupNotification('new_case', {
        caseNumber: '1042',
        clientName: 'Restaurante Central',
        caseType: 'Soporte técnico',
        detail: 'Impresora de Clover Flex no corta el papel.',
      });
      expect(caseNotice).toContain('NUEVO CASO DE SOPORTE');
      expect(caseNotice).toContain('#1042');
      expect(caseNotice).toContain('Restaurante Central');

      // 4. Safety Net / Unregistered Promise
      const promiseNotice = formatGroupNotification('unregistered_promise', {
        phone: '+5493816443322',
        promise: 'Un asesor comercial te va a llamar hoy',
        chatId: 'chat_abc_123',
      });
      expect(promiseNotice).toContain('ALERTA: PROMESA DE CONTACTO PENDIENTE');
      expect(promiseNotice).toContain('Un asesor comercial te va a llamar hoy');

      // 5. Campaign Stopped
      const campaignNotice = formatGroupNotification('campaign_stopped', {
        campaignName: 'Difusión Octubre Gastronomía',
      });
      expect(campaignNotice).toContain('CAMPAÑA DE DIFUSIÓN DETENIDA');
      expect(campaignNotice).toContain('3 fallos consecutivos');
    });

    it('notifyGroup despacha en modo simulado de forma segura sin credenciales en tests', async () => {
      const res = await notifyGroup('new_lead', {
        name: 'Kiosco 24hs',
        phone: '+5493816554433',
        interes: 'Clover Flex',
      });
      expect(res.ok).toBe(true);
      expect(res.simulated).toBe(true);
    });
  });

  // ----------------------------------------------------
  // 4. Autonomous Agent Engine & Grounding
  // ----------------------------------------------------
  describe('4. Autonomous Agent Engine Grounding', () => {
    it('un saludo básico NO registra lead pero responde cordialmente', async () => {
      const decision = await evaluateAutonomousAgent({
        messageText: 'Hola, buenos días',
        brain: DEFAULT_AI_BRAIN,
        channel: 'whatsapp',
      });

      expect(decision.shouldRegisterLead).toBe(false);
      expect(decision.shouldHandOff).toBe(false);
      expect(decision.replyText).toContain('Grupo Novati');
    });

    it('una consulta de precios/terminales activa detección de lead comercial', async () => {
      const decision = await evaluateAutonomousAgent({
        messageText: 'Hola, tengo una verdulería y quería saber el precio de la Clover Mini o PosNet para cobrar con tarjeta.',
        brain: DEFAULT_AI_BRAIN,
        channel: 'whatsapp',
      });

      expect(decision.shouldRegisterLead).toBe(true);
      expect(decision.shouldQualify).toBe(true);
      expect(decision.shouldHandOff).toBe(false);
      expect(decision.leadData).toBeDefined();
    });

    it('una solicitud de hablar con una persona activa Hand-off y red de seguridad', async () => {
      const decision = await evaluateAutonomousAgent({
        messageText: 'Hola, por favor comunicame con un vendedor humano que necesito consultar un caso urgente.',
        brain: DEFAULT_AI_BRAIN,
        channel: 'whatsapp',
      });

      expect(decision.shouldHandOff).toBe(true);
      expect(decision.shouldPromiseContact).toBe(true);
      expect(decision.promiseData).toBeDefined();
    });
  });

  // ----------------------------------------------------
  // 5. Webhook Integration: Deduplication & Mutual Exclusion
  // ----------------------------------------------------
  describe('5. Webhook Integration: Deduplication & Mutual Exclusion', () => {
    const mockTenantId = new ObjectId('65df11111111111111111111');
    let mockLinesCollection;
    let mockChatsCollection;
    let mockMessagesCollection;
    let mockLeadsCollection;
    let mockActivitiesCollection;
    let mockDb;

    beforeEach(() => {
      vi.clearAllMocks();
      process.env.WHATSAPP_VERIFY_TOKEN = 'test_token';

      mockLinesCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: new ObjectId(),
          clientId: mockTenantId,
          phoneNumberId: '105938472910394',
          displayPhoneNumber: '+54 9 381 604-5390',
          status: 'active',
        }),
      };

      mockChatsCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
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

    it('un simple "hola" responde pero NO crea un lead en la base de datos', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          object: 'whatsapp_business_account',
          entry: [
            {
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: { phone_number_id: '105938472910394' },
                    contacts: [{ profile: { name: 'Mariano' }, wa_id: '5493814001122' }],
                    messages: [
                      { from: '5493814001122', id: 'wamid.hola123', type: 'text', text: { body: 'Hola buenas tardes' } },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      };

      const res = await webhookHandler(event);
      expect(res.statusCode).toBe(200);

      // Verify NO lead created for a simple greeting
      expect(mockLeadsCollection.insertOne).not.toHaveBeenCalled();

      // But chat and messages ARE created
      expect(mockChatsCollection.insertOne).toHaveBeenCalled();
      expect(mockMessagesCollection.insertOne).toHaveBeenCalled();
    });

    it('una consulta de Clover o PosNet crea el lead y responde', async () => {
      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          object: 'whatsapp_business_account',
          entry: [
            {
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: { phone_number_id: '105938472910394' },
                    contacts: [{ profile: { name: 'Farmacia Norte' }, wa_id: '5493814998877' }],
                    messages: [
                      { from: '5493814998877', id: 'wamid.lead123', type: 'text', text: { body: 'Hola, cuánto sale la terminal Clover Mini?' } },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      };

      const res = await webhookHandler(event);
      expect(res.statusCode).toBe(200);

      // Verify lead IS created for commercial interest
      expect(mockLeadsCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'new',
          source: 'whatsapp',
          phone: '+5493814998877',
        })
      );
    });

    it('si el chat está silenciado (isBotMuted: true), el bot no responde', async () => {
      mockChatsCollection.findOne.mockResolvedValue({
        _id: new ObjectId(),
        clientId: mockTenantId,
        contactPhone: '+5493814998877',
        isBotMuted: true,
        assignedToUserId: null,
      });

      const event = {
        httpMethod: 'POST',
        body: JSON.stringify({
          object: 'whatsapp_business_account',
          entry: [
            {
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: { phone_number_id: '105938472910394' },
                    messages: [
                      { from: '5493814998877', id: 'wamid.muted123', type: 'text', text: { body: 'Hola, sigue alguien ahí?' } },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      };

      const res = await webhookHandler(event);
      expect(res.statusCode).toBe(200);

      // Only inbound message is stored, NO outbound bot response
      expect(mockMessagesCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockMessagesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({ direction: 'inbound' })
      );
    });
  });
});
