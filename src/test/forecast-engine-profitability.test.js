import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  computeGoalsAndForecast,
  computeAgencyProfitability,
} from '../../netlify/functions/_shared/memoryEngine.js';
import { DEFAULT_BUSINESS_GOALS } from '../../models/BusinessGoals.js';
import { handler as biHandler } from '../../netlify/functions/api-business-intelligence.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 11 Evolution — Goals, Forecast Engine & Agency Profitability Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. computeGoalsAndForecast calcula run rate diario, proyección a fin de mes y required pace', () => {
    // Simulate day 20 of a 30-day month
    const mockDate = new Date(2026, 7, 20); // 20th of August
    const actuals = {
      revenue: 14000000, // 14M on day 20 -> 700k/day
      sales: 10,
      leads: 60,
    };
    const goals = {
      revenueTarget: 20000000,
      salesTarget: 15,
      leadTarget: 90,
    };

    const res = computeGoalsAndForecast({ actuals, goals, currentDate: mockDate });

    expect(res.progressDays.elapsed).toBe(20);
    expect(res.metrics.revenue.dailyRunRate).toBe(700000);
    // 14M + 700k * 11 days remaining (August has 31 days) = 21.7M
    expect(res.metrics.revenue.projectedForecast).toBeGreaterThanOrEqual(20000000);
    expect(res.metrics.revenue.status).toBe('ON_TRACK');
    expect(res.metrics.revenue.requiredDailyPace).toBeGreaterThan(0);
  });

  it('2. computeAgencyProfitability deduce Meta Spend, costos de IA (APIs), pasarela (3.5%), infra y ops', () => {
    const res = computeAgencyProfitability({
      clientRevenue: 18199986,
      metaSpend: 124500,
      aiUsageCostUsd: 12.50,
      usdExchangeRate: 1350,
      paymentGatewayRate: 0.035, // 3.5%
      infrastructureCostArs: 25000,
      humanOpsCostArs: 85000,
    });

    expect(res.costBreakdown.metaSpend).toBe(124500);
    expect(res.costBreakdown.aiCostArs).toBe(16875);
    expect(res.costBreakdown.paymentGatewayFees).toBe(637000);
    expect(res.costBreakdown.infrastructureCostArs).toBe(25000);
    expect(res.costBreakdown.humanOpsCostArs).toBe(85000);
    expect(res.trueAgencyMarginArs).toBe(18199986 - res.costBreakdown.totalDirectCosts);
    expect(res.trueAgencyMarginPct).toBeGreaterThan(90);
    expect(res.isProfitable).toBe(true);
  });

  it('3. POST /api/business-intelligence/goals guarda las metas del periodo para el inquilino', async () => {
    const mockCollection = {
      updateOne: vi.fn().mockResolvedValue({ acknowledged: true }),
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
      httpMethod: 'POST',
      path: '/api/business-intelligence/goals',
      body: JSON.stringify({
        revenueTarget: 25000000,
        salesTarget: 20,
        leadTarget: 120,
      }),
    };

    const res = await biHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.goals.targets.revenueTarget).toBe(25000000);
    expect(mockCollection.updateOne).toHaveBeenCalled();
  });

  it('4. GET /api/business-intelligence/agency-profitability restringe acceso a no-administradores', async () => {
    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: { collection: vi.fn() },
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'client@client.com', role: 'client_user' }, // Non-admin
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/business-intelligence/agency-profitability',
    };

    const res = await biHandler(event);
    expect(res.statusCode).toBe(403);
  });
});
