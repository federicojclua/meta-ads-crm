import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as slaHandler } from '../../netlify/functions/api-team-sla.js';
import { handler as audienceHandler } from '../../netlify/functions/api-audiences-export.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 14 — Team SLA & Remarketing Audiences Export Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  const mockSalespersonId = new ObjectId('65df22222222222222222222');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. GET /api/team/sla calcula TTFR, ratio de conversión y detecta leads calificados en fuga (>12h)', async () => {
    const now = Date.now();
    const fourteenHoursAgo = new Date(now - 14 * 60 * 60 * 1000);

    const mockLeads = [
      {
        _id: new ObjectId('65df33333333333333333331'),
        clientId: mockTenantId,
        stage: 'qualified',
        assignedTo: mockSalespersonId,
      },
      {
        _id: new ObjectId('65df33333333333333333332'),
        clientId: mockTenantId,
        stage: 'won',
        assignedTo: mockSalespersonId,
      },
    ];

    const mockChats = [
      {
        _id: new ObjectId('65df44444444444444444441'),
        clientId: mockTenantId,
        leadId: new ObjectId('65df33333333333333333331'),
        contactName: 'Prospecto Calificado en Fuga',
        contactPhone: '+5491155554444',
        channel: 'whatsapp',
        assignedToUserId: mockSalespersonId,
        lastMessage: {
          text: '¿Me confirman el presupuesto por favor?',
          direction: 'inbound',
          timestamp: fourteenHoursAgo,
        },
      },
    ];

    const mockUsers = [
      {
        _id: mockSalespersonId,
        clientId: mockTenantId,
        displayName: 'Vendedor Pro',
        email: 'vendedor@animamkt.com',
        role: 'salesperson',
      },
    ];

    const mockDb = {
      collection: vi.fn().mockImplementation((name) => ({
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(
            name === 'leads' ? mockLeads : name === 'wa_chats' ? mockChats : mockUsers
          ),
        }),
      })),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { _id: mockSalespersonId, role: 'salesperson' },
    });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: {},
    };

    const res = await slaHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.summary.totalQualified).toBe(1);
    expect(body.summary.totalWon).toBe(1);
    expect(body.summary.leakedLeadsTotal).toBe(1);
    expect(body.leakedLeads[0].contactName).toBe('Prospecto Calificado en Fuga');
    expect(body.teamMetrics[0].wonCount).toBe(1);
    expect(body.teamMetrics[0].conversionRate).toBe(50);
  });

  it('2. GET /api/audiences/export genera archivo CSV estructurado para Meta Ads Custom Audiences', async () => {
    const mockLeads = [
      {
        _id: new ObjectId(),
        clientId: mockTenantId,
        name: 'Carlos Ruiz',
        email: 'carlos@empresa.com',
        phone: '+54 9 11 4433-2211',
        stage: 'won',
        valueEstimateMinor: 25000000,
      },
    ];

    const mockDb = {
      collection: vi.fn().mockImplementation(() => ({
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockLeads),
        }),
      })),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { role: 'admin' },
    });

    const event = {
      httpMethod: 'GET',
      queryStringParameters: { stage: 'won' },
    };

    const res = await audienceHandler(event);
    expect(res.statusCode).toBe(200);
    expect(res.headers['Content-Type']).toContain('text/csv');
    expect(res.body).toContain('email,phone,fn,ln,country,value');
    expect(res.body).toContain('"carlos@empresa.com"');
    expect(res.body).toContain('"+5491144332211"');
    expect(res.body).toContain('"Carlos"');
    expect(res.body).toContain('"Ruiz"');
    expect(res.body).toContain('"250000"');
  });
});
