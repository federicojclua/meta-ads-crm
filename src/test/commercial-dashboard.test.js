import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { isLeadUncontacted, sanitizeLeadResponse, LOST_REASONS, LOST_REASON_LABELS } from '../../models/Lead.js';
import { handler as leadsHandler } from '../../netlify/functions/api-leads.js';
import { handler as dashboardHandler } from '../../netlify/functions/api-dashboard.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Etapa 4: Embudo Comercial, Leads sin Contactar y Tablero Operativo', () => {
  describe('1. Model: Lead Helpers y Sanitización', () => {
    it('detecta correctamente un lead sin contactar (stage new y sin firstContactedAt)', () => {
      expect(isLeadUncontacted({ stage: 'new' })).toBe(true);
      expect(isLeadUncontacted({ stage: 'new', firstContactedAt: null })).toBe(true);
      expect(isLeadUncontacted({})).toBe(true);
      
      // Ya contactado con fecha
      expect(isLeadUncontacted({ stage: 'new', firstContactedAt: new Date() })).toBe(false);
      // Ya avanzado en el embudo
      expect(isLeadUncontacted({ stage: 'contacted' })).toBe(false);
      expect(isLeadUncontacted({ stage: 'won' })).toBe(false);
      expect(isLeadUncontacted({ stage: 'lost' })).toBe(false);
    });

    it('sanitiza lead incluyendo isUncontacted, lostReasonKey y metadatos de campaña', () => {
      const rawLead = {
        _id: new ObjectId('65df11111111111111111111'),
        clientId: new ObjectId('65df22222222222222222222'),
        name: 'Carlos Novati',
        stage: 'new',
        firstContactedAt: null,
        lostReasonKey: 'precio',
        lostReason: 'El cliente consideró alta la comisión',
        campaignName: 'Campaña Clover Flex Octubre',
        adName: 'Anuncio Video Beneficios',
      };

      const sanitized = sanitizeLeadResponse(rawLead);
      expect(sanitized.isUncontacted).toBe(true);
      expect(sanitized.lostReasonKey).toBe('precio');
      expect(sanitized.lostReason).toBe('El cliente consideró alta la comisión');
      expect(sanitized.campaignName).toBe('Campaña Clover Flex Octubre');
      expect(sanitized.adName).toBe('Anuncio Video Beneficios');
    });

    it('contiene los motivos de pérdida estructurados de Novati', () => {
      expect(LOST_REASONS).toContain('precio');
      expect(LOST_REASONS).toContain('competencia');
      expect(LOST_REASONS).toContain('comisiones');
      expect(LOST_REASONS).toContain('sin_monotributo');
      expect(LOST_REASON_LABELS.comisiones).toBe('Comisiones por cobro altas');
    });
  });

  describe('2. Leads API: Endpoint /api/leads/:id/contact y Motivos de Pérdida', () => {
    let mockLeadsCollection;
    let mockActivitiesCollection;
    let mockDb;
    const clientId = new ObjectId('65df11111111111111111111');
    const mockUser = {
      _id: new ObjectId('65df44444444444444444444'),
      email: 'asesor@novati.com',
      role: 'client',
      status: 'active',
      clientId,
      clientIds: [clientId],
    };

    beforeEach(() => {
      mockLeadsCollection = {
        find: vi.fn(),
        findOne: vi.fn(),
        updateOne: vi.fn(),
        countDocuments: vi.fn(),
      };
      mockActivitiesCollection = {
        insertOne: vi.fn(),
      };
      mockDb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'leads') return mockLeadsCollection;
          if (name === 'lead_activities') return mockActivitiesCollection;
          return null;
        }),
      };
    });

    it('POST /api/leads/:id/contact marca el primer contacto y avanza de new a contacted', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const leadId = new ObjectId('65df77777777777777777777');
      const existingLead = {
        _id: leadId,
        clientId,
        name: 'Comercio San Juan',
        stage: 'new',
        firstContactedAt: null,
      };

      mockLeadsCollection.findOne
        .mockResolvedValueOnce(existingLead) // lookup inicial
        .mockResolvedValueOnce({ ...existingLead, stage: 'contacted', firstContactedAt: new Date() }); // retorno actualizado

      mockLeadsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: `/api/leads/${leadId.toString()}/contact`,
        body: JSON.stringify({ channel: 'whatsapp', notes: 'Primer mensaje enviado' }),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.lead).toBeDefined();
      expect(body.lead.stage).toBe('contacted');
      expect(mockLeadsCollection.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: leadId }),
        expect.objectContaining({
          $set: expect.objectContaining({
            stage: 'contacted',
          }),
        })
      );
      expect(mockActivitiesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          leadId,
          type: 'stage_change',
        })
      );
    });

    it('POST /api/leads/:id/stage a lost guarda lostReasonKey y lostReason', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const leadId = new ObjectId('65df88888888888888888888');
      const existingLead = {
        _id: leadId,
        clientId,
        name: 'Kiosco Central',
        stage: 'contacted',
      };

      mockLeadsCollection.findOne
        .mockResolvedValueOnce(existingLead)
        .mockResolvedValueOnce({
          ...existingLead,
          stage: 'lost',
          lostReasonKey: 'sin_monotributo',
          lostReason: 'No tiene CUIT ni monotributo habilitado',
        });

      mockLeadsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: `/api/leads/${leadId.toString()}/stage`,
        body: JSON.stringify({
          stage: 'lost',
          lostReasonKey: 'sin_monotributo',
          lostReason: 'No tiene CUIT ni monotributo habilitado',
        }),
      });

      expect(res.statusCode).toBe(200);
      expect(mockLeadsCollection.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: leadId }),
        expect.objectContaining({
          $set: expect.objectContaining({
            stage: 'lost',
            lostReasonKey: 'sin_monotributo',
            lostReason: 'No tiene CUIT ni monotributo habilitado',
          }),
        })
      );
    });
  });

  describe('3. Dashboard API: Embudo, Motivos de Pérdida y Casos de Posventa', () => {
    let mockLeadsCollection;
    let mockSalesCollection;
    let mockCasesCollection;
    let mockRagLogsCollection;
    let mockUsersCollection;
    let mockClientsCollection;
    let mockDb;
    const clientId = new ObjectId('65df11111111111111111111');
    const mockUser = {
      _id: new ObjectId('65df44444444444444444444'),
      email: 'admin@novati.com',
      role: 'client',
      status: 'active',
      clientId,
      clientIds: [clientId],
    };

    beforeEach(() => {
      mockLeadsCollection = {
        find: vi.fn(),
        countDocuments: vi.fn(),
      };
      mockSalesCollection = {
        find: vi.fn(),
      };
      mockCasesCollection = {
        find: vi.fn(),
        countDocuments: vi.fn(),
      };
      mockRagLogsCollection = {
        countDocuments: vi.fn(),
      };
      mockUsersCollection = {
        find: vi.fn(),
      };
      mockClientsCollection = {
        findOne: vi.fn().mockResolvedValue({ _id: clientId, name: 'Grupo Novati' }),
      };

      mockDb = {
        collection: vi.fn().mockImplementation((name) => {
          if (name === 'leads') return mockLeadsCollection;
          if (name === 'sales') return mockSalesCollection;
          if (name === 'cases') return mockCasesCollection;
          if (name === 'unanswered_queries') return mockRagLogsCollection;
          if (name === 'users') return mockUsersCollection;
          if (name === 'clients') return mockClientsCollection;
          return null;
        }),
      };
    });

    it('GET /api/dashboard retorna funnelStages, lostReasonsBreakdown, casesSummary y uncontactedLeadsCount', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: mockUser,
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      // Mock de conteos de leads
      mockLeadsCollection.countDocuments
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(15) // new
        .mockResolvedValueOnce(10) // contacted
        .mockResolvedValueOnce(5)  // qualified
        .mockResolvedValueOnce(8)  // won
        .mockResolvedValueOnce(12) // lost
        .mockResolvedValueOnce(14); // uncontacted

      // Mock find para leads
      const sampleLeads = [
        { _id: new ObjectId(), stage: 'lost', lostReasonKey: 'precio', source: 'whatsapp', value: 1000 },
        { _id: new ObjectId(), stage: 'lost', lostReasonKey: 'precio', source: 'meta_ads', value: 2000 },
        { _id: new ObjectId(), stage: 'lost', lostReasonKey: 'sin_monotributo', source: 'meta_ads', value: 500 },
        { _id: new ObjectId(), stage: 'won', source: 'whatsapp', value: 5000 },
      ];
      mockLeadsCollection.find.mockReturnValue({
        project: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
        toArray: vi.fn().mockResolvedValue(sampleLeads),
      });

      // Mock find para ventas
      mockSalesCollection.find.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      });

      // Mock find para usuarios (comerciales)
      mockUsersCollection.find.mockReturnValue({
        project: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
        toArray: vi.fn().mockResolvedValue([]),
      });

      // Mock soporte y logs RAG
      mockCasesCollection.countDocuments
        .mockResolvedValueOnce(6) // total cases
        .mockResolvedValueOnce(2) // open
        .mockResolvedValueOnce(1) // in_progress
        .mockResolvedValueOnce(1) // waiting
        .mockResolvedValueOnce(2) // resolved
        .mockResolvedValueOnce(1); // urgent / high
      mockCasesCollection.find.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { type: 'support' },
          { type: 'supplies' },
        ]),
      });
      mockRagLogsCollection.countDocuments.mockResolvedValueOnce(3); // lo que no supo

      const res = await dashboardHandler({
        httpMethod: 'GET',
        path: '/api/dashboard',
        queryStringParameters: {},
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);

      // Verificación de datos de Etapa 4 dentro de kpis
      expect(data.kpis.uncontactedLeadsCount).toBe(14);
      expect(Array.isArray(data.kpis.funnelStages)).toBe(true);
      expect(data.kpis.funnelStages.length).toBeGreaterThanOrEqual(4);
      
      // Breakdown de motivos de pérdida
      expect(Array.isArray(data.kpis.lostReasonsBreakdown)).toBe(true);

      // Casos de posventa
      expect(data.kpis.casesSummary).toBeDefined();
      expect(data.kpis.casesSummary.total).toBe(6);
      expect(data.kpis.casesSummary.open).toBe(2);
      expect(data.kpis.casesSummary.urgentOrHigh).toBe(1);

      // Consultas sin responder del asistente
      expect(data.kpis.unansweredQueriesCount).toBe(3);
    });
  });
});
