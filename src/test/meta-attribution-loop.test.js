import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  syncCampaignPerformanceService,
  refreshCreativeVariantsService,
} from '../../netlify/functions/_shared/creativeEngine/metaAdsLaunchService.js';
import { DEFAULT_CREATIVE_PROFILE } from '../../models/CreativeProfile.js';
import { handler as metaLaunchHandler } from '../../netlify/functions/api-meta-launch.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 18 — Closed-Loop Attribution & Creative Fatigue Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. syncCampaignPerformanceService calcula ROAS real y CPL cruzando datos de Meta y ventas CRM', async () => {
    const campaign = {
      _id: new ObjectId('65df44444444444444444444'),
      clientId: mockTenantId,
      dailyBudget: 20000,
    };

    const res = await syncCampaignPerformanceService({ campaign });
    expect(res.success).toBe(true);
    expect(res.performanceMetrics.spend).toBeGreaterThan(0);
    expect(res.performanceMetrics.leads).toBe(84);
    expect(res.performanceMetrics.closedSales).toBe(14);
    expect(res.performanceMetrics.roas).toBeGreaterThan(100);
    expect(res.performanceMetrics.realCpl).toBeGreaterThan(1000);
  });

  it('2. syncCampaignPerformanceService detecta fatiga creativa ante frecuencia alta (>2.2)', async () => {
    const campaign = {
      _id: new ObjectId('65df44444444444444444444'),
      clientId: mockTenantId,
      dailyBudget: 20000,
    };

    const res = await syncCampaignPerformanceService({ campaign });
    expect(res.creativeFatigue.detected).toBe(true);
    expect(res.creativeFatigue.recommendation).toContain('Fatiga Creativa detectada');
    expect(res.creativeFatigue.ctrDropPct).toBeGreaterThan(0);
  });

  it('3. refreshCreativeVariantsService genera 3 variantes frescas basadas en el patrón ganador', () => {
    const res = refreshCreativeVariantsService({
      campaign: { name: 'Campaña Notebooks' },
      brandProfile: DEFAULT_CREATIVE_PROFILE,
    });

    expect(res.success).toBe(true);
    expect(res.refreshedVariants).toHaveLength(3);
    expect(res.refreshedVariants[0].angle).toBeDefined();
    expect(res.refreshedVariants[0].headline).toBeDefined();
  });

  it('4. POST /api/meta-launch/:id/sync actualiza la base de datos con las métricas sincronizadas', async () => {
    const campaignId = new ObjectId('65df55555555555555555555');
    const existingCampaign = {
      _id: campaignId,
      clientId: mockTenantId,
      name: 'Campaña Activa',
      dailyBudget: 20000,
    };

    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(existingCampaign),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
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
      path: `/api/meta-launch/${campaignId.toString()}/sync`,
    };

    const res = await metaLaunchHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.performanceMetrics.roas).toBeDefined();
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: campaignId }),
      expect.objectContaining({
        $set: expect.objectContaining({
          performanceMetrics: expect.any(Object),
          creativeFatigue: expect.any(Object),
        }),
      })
    );
  });
});
