import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  computeSalesIntelligenceService,
  computeWhatsAppAttributionService,
} from '../../netlify/functions/_shared/aiSalesEngine/salesIntelligenceService.js';
import { handler as salesEngineHandler } from '../../netlify/functions/api-sales-engine.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 14 — Sales Intelligence & Closed-Loop WhatsApp Attribution Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. computeSalesIntelligenceService compara métricas de vendedores humanos vs escuadrón IA', async () => {
    const res = await computeSalesIntelligenceService({ clientId: mockTenantId });

    expect(res.success).toBe(true);
    expect(res.humanReps.length).toBeGreaterThanOrEqual(2);
    expect(res.aiAgents.length).toBeGreaterThanOrEqual(3);

    // Verify AI response time is dramatically faster
    expect(res.aggregateSummary.aiAvgTtfrSeconds).toBeLessThan(10);
    expect(res.aggregateSummary.humanAvgTtfrSeconds).toBeGreaterThan(60);
    expect(res.aggregateSummary.aiContributionPct).toBeGreaterThan(50);
  });

  it('2. computeWhatsAppAttributionService traza el recorrido completo de Meta Ads a WhatsApp y Ventas', async () => {
    const res = await computeWhatsAppAttributionService({ clientId: mockTenantId });

    expect(res.success).toBe(true);
    expect(res.totalAttributedRevenue).toBeGreaterThan(0);
    expect(res.records.length).toBeGreaterThanOrEqual(2);

    const record01 = res.records[0];
    expect(record01.metaCampaign.id).toBeDefined();
    expect(record01.metaAd.name).toContain('Avatar Martina');
    expect(record01.sale.amount).toBe(1299999);
    expect(record01.attributionStatus).toBe('CLOSED_WON');
  });

  it('3. GET /api/sales-engine/sales-intelligence responde con métricas de inteligencia comercial', async () => {
    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: { collection: vi.fn() },
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/sales-engine/sales-intelligence',
    };

    const res = await salesEngineHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.humanReps).toBeDefined();
    expect(body.aiAgents).toBeDefined();
  });
});
