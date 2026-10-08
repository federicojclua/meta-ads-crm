import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  DEFAULT_AI_BRAIN,
  BUSINESS_PRESETS,
  validateAiBrain,
  sanitizeAiBrain,
} from '../../models/AiBrain.js';
import {
  CHANNELS,
  validateWaLine,
  validateWaChat,
} from '../../models/WhatsApp.js';
import { evaluateAutonomousAgent } from '../../netlify/functions/_shared/agentEngine.js';
import { handler as assistantHandler } from '../../netlify/functions/api-assistant.js';
import { handler as whatsappHandler } from '../../netlify/functions/api-whatsapp.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Fase 6 — Modelo Comercial Universal y Hub Omnicanal (6 Redes)', () => {
  const tenantId = new ObjectId('65df11111111111111111111');
  const userId = new ObjectId('65df22222222222222222222');

  const mockUser = {
    _id: userId,
    email: 'admin@negocio.com',
    role: 'admin',
    clientId: tenantId,
  };

  // Helper for authorized event
  const createAuthEvent = (options = {}) => ({
    httpMethod: options.method || 'GET',
    path: options.path || '/api/whatsapp/channels',
    queryStringParameters: options.query || null,
    headers: {
      authorization: 'Bearer valid-token',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : null,
  });

  describe('1. Modelo Universal de Negocio y Presets Replicables', () => {
    it('BUSINESS_PRESETS contiene la plantilla Novati/Clover y la plantilla ElectroHogar/Lavarropas', () => {
      expect(BUSINESS_PRESETS).toHaveProperty('novati_posberry');
      expect(BUSINESS_PRESETS).toHaveProperty('electro_lavarropas');

      const electro = BUSINESS_PRESETS.electro_lavarropas;
      expect(electro.businessName).toBe('ElectroHogar');
      expect(electro.productsCatalog.length).toBeGreaterThanOrEqual(2);
      expect(electro.objectionPlaybook.length).toBeGreaterThanOrEqual(2);

      // Verify Lavarropas product
      const lavarropas = electro.productsCatalog.find((p) => p.id === 'lavarropas_carga_frontal_8kg');
      expect(lavarropas).toBeDefined();
      expect(lavarropas.name).toContain('8kg Inverter');
      expect(lavarropas.price).toContain('12 cuotas');

      // Verify Objection Playbook
      const objPrecio = electro.objectionPlaybook.find((o) => o.trigger === 'precio_alto');
      expect(objPrecio).toBeDefined();
      expect(objPrecio.strategy).toContain('12 cuotas fijas');
    });

    it('validateAiBrain y sanitizeAiBrain admiten productsCatalog y objectionPlaybook', () => {
      const customBrain = {
        clientId: tenantId,
        businessName: 'Lavarropas & Hogar Express',
        productsCatalog: [
          { id: 'p1', name: 'Lavarropas Eco', price: '$500.000', highlights: 'Ahorro agua' },
        ],
        objectionPlaybook: [
          { id: 'o1', trigger: 'precio_alto', objection: 'Muy caro', strategy: 'Ofrecer cuotas', recommendedResponse: 'Tenemos 12 cuotas sin interés' },
        ],
      };

      const validation = validateAiBrain(customBrain);
      expect(validation.isValid).toBe(true);

      const sanitized = sanitizeAiBrain(customBrain);
      expect(sanitized.productsCatalog).toHaveLength(1);
      expect(sanitized.objectionPlaybook).toHaveLength(1);
      expect(sanitized.businessName).toBe('Lavarropas & Hogar Express');
    });
  });

  describe('2. Astucia Comercial del Asistente en Rubro Lavarropas', () => {
    it('evaluateAutonomousAgent responde a consulta de lavarropas con indagación previa y detección de lead', async () => {
      const electroBrain = BUSINESS_PRESETS.electro_lavarropas;

      const result = await evaluateAutonomousAgent({
        lead: { name: 'Mariana López', phone: '+5491122334455', stage: 'new' },
        chat: { lineDisplayName: 'Ventas ElectroHogar' },
        chatHistory: [],
        inboundMessage: 'Hola buenas tardes! ¿Qué precio tiene el lavarropas automático y qué opciones de cuotas tienen?',
        aiBrain: electroBrain,
      });

      expect(result.shouldRegisterLead).toBe(true);
      expect(result.leadData.interes).toContain('Lavarropas');
      // Astucia comercial: respuesta consultiva que no tira precio a secas sin preguntar necesidad familiar
      expect(result.replyText).toContain('12 cuotas sin interés');
      expect(result.replyText).toContain('cuántas personas son en tu familia');
    });
  });

  describe('3. Hub Omnicanal — 6 Redes Sociales (WhatsApp, IG, TG, FB, TT, X)', () => {
    it('CHANNELS contiene las 6 redes sociales solicitadas', () => {
      expect(CHANNELS).toContain('whatsapp');
      expect(CHANNELS).toContain('instagram');
      expect(CHANNELS).toContain('facebook');
      expect(CHANNELS).toContain('telegram');
      expect(CHANNELS).toContain('tiktok');
      expect(CHANNELS).toContain('twitter');
      expect(CHANNELS).toHaveLength(6);
    });

    it('validateWaLine valida correctamente líneas de Telegram, TikTok y Twitter', () => {
      ['telegram', 'tiktok', 'twitter', 'instagram', 'facebook', 'whatsapp'].forEach((ch) => {
        const line = {
          clientId: tenantId,
          phoneNumberId: `acc_${ch}_123`,
          displayPhoneNumber: `@cuenta_${ch}`,
          channel: ch,
          status: 'active',
        };
        const val = validateWaLine(line);
        expect(val.isValid).toBe(true);
      });
    });

    it('GET /api/whatsapp/channels retorna el estado de los 6 canales omnicanal', async () => {
      // Mock db
      const mockDb = {
        collection: (colName) => ({
          find: () => ({
            toArray: async () => [],
          }),
        }),
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: tenantId,
        isGlobal: true,
      });

      const event = createAuthEvent({ path: '/api/whatsapp/channels', method: 'GET' });
      const response = await whatsappHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.channels).toHaveLength(6);

      const types = body.channels.map((c) => c.channel);
      expect(types).toContain('whatsapp');
      expect(types).toContain('instagram');
      expect(types).toContain('telegram');
      expect(types).toContain('facebook');
      expect(types).toContain('tiktok');
      expect(types).toContain('twitter');
    });

    it('PUT /api/whatsapp/channels actualiza las credenciales de un canal omnicanal', async () => {
      let updatedDoc = null;
      const mockDb = {
        collection: () => ({
          updateOne: async (filter, update) => {
            updatedDoc = update.$set;
            return { acknowledged: true };
          },
        }),
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: tenantId,
        isGlobal: true,
      });

      const event = createAuthEvent({
        path: '/api/whatsapp/channels',
        method: 'PUT',
        body: {
          channel: 'telegram',
          name: 'Telegram Bot Ventas',
          identifier: '@ElectroHogarBot',
          status: 'connected',
        },
      });

      const response = await whatsappHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.channel.channel).toBe('telegram');
      expect(body.channel.identifier).toBe('@ElectroHogarBot');
    });
  });

  describe('4. Simulador con Override de Preset en Tiempo Real', () => {
    it('POST /api/assistant/test evalúa con brainOverride sin necesidad de guardar en BD', async () => {
      const mockDb = {
        collection: () => ({
          findOne: async () => DEFAULT_AI_BRAIN,
        }),
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: tenantId,
        isGlobal: true,
      });

      const electroBrain = BUSINESS_PRESETS.electro_lavarropas;

      const event = createAuthEvent({
        path: '/api/assistant/test',
        method: 'POST',
        body: {
          message: 'Hola! Quiero comprar un lavarropas de 8kg en cuotas, ¿cuánto sale?',
          brainOverride: electroBrain,
        },
      });

      const response = await assistantHandler(event);
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.ok).toBe(true);
      expect(body.reply).toBeDefined();
      expect(body.decision.shouldRegisterLead).toBe(true);
      expect(body.decision.leadData.interes).toContain('Lavarropas');
    });
  });
});
