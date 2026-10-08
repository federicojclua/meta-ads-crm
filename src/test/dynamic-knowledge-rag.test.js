import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  MASTER_SALES_DOC_TEMPLATE,
  validateKnowledgeFormat,
  parseDocumentMetadata,
  searchKnowledge,
  buildRAGContext,
} from '../../netlify/functions/_shared/knowledgeBase.js';
import { evaluateAutonomousAgent } from '../../netlify/functions/_shared/agentEngine.js';
import { handler as assistantHandler } from '../../netlify/functions/api-assistant.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Fase 7 — Motor Dinámico de Base de Conocimiento Multi-Tenant y Formato Maestro de Venta', () => {
  const tenantId = new ObjectId('65df11111111111111111111');
  const userId = new ObjectId('65df22222222222222222222');

  const mockUser = {
    _id: userId,
    email: 'admin@negocio.com',
    role: 'admin',
    clientId: tenantId,
  };

  const createAuthEvent = (options = {}) => ({
    httpMethod: options.method || 'GET',
    path: options.path || '/api/assistant/documents',
    queryStringParameters: options.query || null,
    headers: {
      authorization: 'Bearer valid-token',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : null,
  });

  describe('1. Plantilla Maestra y Validador Sintáctico/Comercial', () => {
    it('MASTER_SALES_DOC_TEMPLATE posee formato óptimo con puntuación perfecta (100%)', () => {
      const audit = validateKnowledgeFormat(MASTER_SALES_DOC_TEMPLATE);
      expect(audit.isValid).toBe(true);
      expect(audit.score).toBe(100);
      expect(audit.statusText).toBe('Formato Comercial Óptimo');
      expect(audit.checks.hasH1).toBe(true);
      expect(audit.checks.hasMetadata).toBe(true);
      expect(audit.checks.hasBenefits).toBe(true);
      expect(audit.checks.hasObjections).toBe(true);
      expect(audit.checks.hasIndagacion).toBe(true);
    });

    it('validateKnowledgeFormat penaliza documentos sin estructura comercial completa', () => {
      // Documento simple sin metadata ni objeciones
      const plainText = '# Lavarropas Turbo\nVendemos lavarropas nuevos con garantía oficial.';
      const audit = validateKnowledgeFormat(plainText);

      expect(audit.checks.hasH1).toBe(true);
      expect(audit.checks.hasMetadata).toBe(false);
      expect(audit.checks.hasObjections).toBe(false);
      expect(audit.checks.hasIndagacion).toBe(false);
      expect(audit.score).toBeLessThan(70);
      expect(audit.recommendations.length).toBeGreaterThan(0);
    });

    it('parseDocumentMetadata extrae correctamente los metadatos YAML y título H1', () => {
      const docMarkdown = `> **Metadata**
> category: electrodomesticos
> allowed_for: [sales, bot]
> priority: 95
> tags: [lavarropas, inverter, cuotas]

# Lavarropas Automático 10kg Inverter
Detalle del equipo comercial.`;

      const meta = parseDocumentMetadata(docMarkdown, 'lavarropas_10kg.md');
      expect(meta.title).toBe('Lavarropas Automático 10kg Inverter');
      expect(meta.category).toBe('electrodomesticos');
      expect(meta.priority).toBe(95);
      expect(meta.tags).toContain('lavarropas');
      expect(meta.tags).toContain('cuotas');
      expect(meta.allowedFor).toContain('sales');
    });
  });

  describe('2. Búsqueda RAG Dinámica con Documentos Propios de Tenant', () => {
    const customTenantDocs = [
      {
        id: 'doc_lavarropas_01',
        title: 'Guía Comercial Lavarropas Inverter',
        filename: 'lavarropas_inverter.md',
        category: 'electrodomesticos',
        priority: 90,
        content: `# Lavarropas Smart Inverter 8.5kg
> **Metadata**
> category: electrodomesticos
> allowed_for: [sales]
> priority: 90
> tags: [lavarropas, 12 cuotas, inverter]

## Beneficios Concretos
- Ahorro de 60% de energía y agua con motor Direct Drive.
- Financiación en 12 cuotas fijas sin recargo con tarjeta bancaria.

## Objeciones Frecuentes
- "Es muy caro": Demostrar que el consumo eléctrico se amortiza en 6 meses y las 12 cuotas fijas protegen contra inflación.

## Flujo de Venta e Indagación
- Preguntar cuántas personas viven en el hogar antes de pasar precio final.`,
      },
      {
        id: 'doc_curso_ia',
        title: 'Masterclass Inteligencia Artificial para Empresas',
        filename: 'curso_ia.md',
        category: 'servicios_educativos',
        priority: 85,
        content: `# Programa Ejecutivo en IA Generativa
> **Metadata**
> category: servicios_educativos
> allowed_for: [sales]
> priority: 85

## Beneficios Concretos
- Implementación práctica de agentes autónomos y automatización comercial.
- Acceso de por vida a la comunidad y tutorías 1 a 1.`,
      },
    ];

    it('searchKnowledge prioriza y encuentra coincidencias en los tenantDocuments', () => {
      const results = searchKnowledge('precio del lavarropas y cuotas', {
        tenantDocuments: customTenantDocs,
        limit: 3,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      const topMatch = results[0];
      expect(topMatch.title).toContain('Lavarropas');
      expect(topMatch.category).toBe('electrodomesticos');
      expect(topMatch.score).toBeGreaterThan(0.3);
      expect(topMatch.isTenantDoc).toBe(true);
    });

    it('buildRAGContext construye el bloque de contexto inyectable para el LLM con metadata estructurada', () => {
      const ragBlock = buildRAGContext('quiero saber sobre el lavarropas inverter', {
        tenantDocuments: customTenantDocs,
        maxTokens: 1000,
      });

      expect(ragBlock).toContain('Documento del Negocio');
      expect(ragBlock).toContain('Lavarropas');
      expect(ragBlock).toContain('Direct Drive');
      expect(ragBlock).toContain('12 cuotas fijas');
    });
  });

  describe('3. Astucia Comercial en Rubro Nuevo e Inédito', () => {
    it('evaluateAutonomousAgent responde a consulta de un producto dinámico cargado en tenantDocuments formulando indagación y detección de lead', async () => {
      const dynamicBrain = {
        businessName: 'Academia Tech Pro',
        businessDescription: 'Capacitación ejecutiva en Inteligencia Artificial aplicada a negocios.',
        coverageZone: 'Online / Toda Latinoamérica',
        tone: 'cercano_de_vos',
        knowledgeDocuments: [
          {
            id: 'doc_ia_academy',
            title: 'Masterclass Agentes IA',
            category: 'educacion',
            priority: 95,
            content: `# Masterclass Agentes IA para Negocios
> **Metadata**
> category: educacion
> allowed_for: [sales]
> priority: 95

## Beneficios Concretos
- Automatización del 80% de consultas comerciales en WhatsApp.
- Financiación en 3 y 6 cuotas fijas con tarjeta de crédito.

## Objeciones Frecuentes
- "No sé programar": El programa está diseñado para dueños de negocios y perfiles comerciales, 100% no-code.

## Flujo de Venta e Indagación
- Antes de confirmar inscripción, preguntar cuál es el rubro o rubro principal del negocio para personalizar el plan.`,
          },
        ],
      };

      const result = await evaluateAutonomousAgent({
        lead: { name: 'Facundo Gómez', phone: '+5491155667788', stage: 'new' },
        chat: { lineDisplayName: 'Ventas Academia Tech' },
        chatHistory: [],
        inboundMessage: 'Hola, me interesa el programa de Masterclass de Agentes de IA, ¿qué costo tiene y cómo es?',
        aiBrain: dynamicBrain,
      });

      expect(result.shouldRegisterLead).toBe(true);
      expect(result.reply).toBeDefined();
      expect(result.reply.length).toBeGreaterThan(20);
      // Astucia vendedora: indaga sobre la necesidad del cliente y no tira el precio frío sin contexto
      expect(
        result.reply.toLowerCase().includes('negocio') ||
        result.reply.toLowerCase().includes('objetivo') ||
        result.reply.toLowerCase().includes('necesidad') ||
        result.reply.toLowerCase().includes('cuotas')
      ).toBe(true);
    });
  });

  describe('4. Endpoints Backend /api/assistant/documents', () => {
    let mockDb;
    let mockBrainsCollection;

    beforeEach(() => {
      mockBrainsCollection = {
        findOne: vi.fn().mockResolvedValue({
          clientId: tenantId,
          businessName: 'ElectroHogar',
          knowledgeDocuments: [],
        }),
        updateOne: vi.fn().mockResolvedValue({ acknowledged: true, modifiedCount: 1 }),
      };

      mockDb = {
        collection: vi.fn((colName) => {
          if (colName === 'ai_brains') return mockBrainsCollection;
          return {};
        }),
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: tenantId.toString(),
        isGlobal: false,
      });
    });

    it('POST /api/assistant/documents/validate audita un texto y devuelve score y checks', async () => {
      const validDocText = MASTER_SALES_DOC_TEMPLATE;
      const event = createAuthEvent({
        method: 'POST',
        path: '/api/assistant/documents/validate',
        body: { content: validDocText },
      });

      const response = await assistantHandler(event);
      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data.audit).toBeDefined();
      expect(data.audit.score).toBe(100);
      expect(data.audit.isValid).toBe(true);
    });

    it('POST /api/assistant/documents crea o actualiza un documento en la base del tenant', async () => {
      const newDoc = {
        title: 'Servicio de Climatización y Heladeras',
        category: 'servicios',
        priority: 70,
        content: `# Servicio Técnico Especializado
> **Metadata**
> category: servicios
> allowed_for: [sales, bot]
> priority: 70

## Beneficios Concretos
- Técnicos matriculados en 24 horas.
- Garantía escrita por 6 meses.`,
      };

      const event = createAuthEvent({
        method: 'POST',
        path: '/api/assistant/documents',
        body: newDoc,
      });

      const response = await assistantHandler(event);
      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data.success).toBe(true);
      expect(data.document).toBeDefined();
      expect(data.document.title).toBe('Servicio de Climatización y Heladeras');
      expect(data.document.formatScore).toBeDefined();
    });
  });
});
