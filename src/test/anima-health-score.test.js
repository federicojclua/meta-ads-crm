import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { computeAnimaHealthScore } from '../../netlify/functions/_shared/memoryEngine.js';
import { DEFAULT_BUSINESS_MEMORY } from '../../models/BusinessMemory.js';
import { handler as biHandler } from '../../netlify/functions/api-business-intelligence.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 11 Evolution — Deterministic ANIMA Business Health Score Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. computeAnimaHealthScore calcula un puntaje determinista de 0 a 100 con desglose en 6 dimensiones', () => {
    const metrics = {
      currentCpl: 1482,
      avgCtr: 3.82,
      creativeFatigueDetected: false,
      closeRatePct: 16.6,
      slaCompliancePct: 94.5,
      actualRevenue: 18199986,
      revenueTarget: 20000000,
      netMarginPct: 28.4,
    };

    const res = computeAnimaHealthScore({ metrics, historicalMemory: DEFAULT_BUSINESS_MEMORY });

    expect(res.animaScore).toBeGreaterThanOrEqual(85);
    expect(res.status).toBe('EXCELENTE');
    expect(res.badgeVariant).toBe('green');
    expect(res.dimensions.acquisition.score).toBeGreaterThan(90);
    expect(res.dimensions.creative.score).toBeGreaterThan(90);
    expect(res.dimensions.sales.score).toBeGreaterThan(80);
    expect(res.dimensions.response.score).toBeGreaterThan(90);
    expect(res.dimensions.revenue.score).toBeGreaterThan(85);
    expect(res.dimensions.profitability.score).toBeGreaterThan(85);
  });

  it('2. computeAnimaHealthScore aplica penalización de 20 puntos a la dimensión creativa si hay fatiga detectada', () => {
    const freshMetrics = {
      avgCtr: 3.82,
      creativeFatigueDetected: false,
    };
    const fatiguedMetrics = {
      avgCtr: 3.82,
      creativeFatigueDetected: true,
    };

    const freshRes = computeAnimaHealthScore({ metrics: freshMetrics, historicalMemory: DEFAULT_BUSINESS_MEMORY });
    const fatiguedRes = computeAnimaHealthScore({ metrics: fatiguedMetrics, historicalMemory: DEFAULT_BUSINESS_MEMORY });

    expect(fatiguedRes.dimensions.creative.score).toBe(freshRes.dimensions.creative.score - 20);
    expect(fatiguedRes.dimensions.creative.fatigueDetected).toBe(true);
  });

  it('3. computeAnimaHealthScore clasifica correctamente estados críticos (<50)', () => {
    const criticalMetrics = {
      currentCpl: 4500, // Very high CPL
      avgCtr: 0.8, // Low CTR
      creativeFatigueDetected: true,
      closeRatePct: 3.2, // Low close rate
      slaCompliancePct: 40.0, // Low SLA
      actualRevenue: 3000000,
      revenueTarget: 20000000,
      netMarginPct: 5.0,
    };

    const res = computeAnimaHealthScore({ metrics: criticalMetrics, historicalMemory: DEFAULT_BUSINESS_MEMORY });
    expect(res.animaScore).toBeLessThan(50);
    expect(res.status).toBe('CRITICO');
    expect(res.badgeVariant).toBe('red');
  });

  it('4. GET /api/business-intelligence/health-score responde con la estructura completa del ANIMA Score', async () => {
    const mockCollection = {
      findOne: vi.fn().mockResolvedValue({
        clientId: mockTenantId,
        ...DEFAULT_BUSINESS_MEMORY,
      }),
    };

    const mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/business-intelligence/health-score',
    };

    const res = await biHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.healthScore.animaScore).toBeDefined();
    expect(body.healthScore.dimensions.acquisition).toBeDefined();
  });
});
