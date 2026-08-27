import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  discoverMetaCapabilities,
  recommendAIStrategy,
  executeTransactionalLaunchPipeline,
} from '../../netlify/functions/_shared/creativeEngine/metaAdsLaunchService.js';
import { DEFAULT_CREATIVE_PROFILE } from '../../models/CreativeProfile.js';
import { handler as metaLaunchHandler } from '../../netlify/functions/api-meta-launch.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 18 — Meta Launch Engine Transactional Pipeline & Idempotency Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. discoverMetaCapabilities retorna las capacidades dinámicas de la cuenta publicitaria', () => {
    const res = discoverMetaCapabilities({ adAccountId: 'act_983748291' });
    expect(res.success).toBe(true);
    expect(res.capabilities.supportedObjectives).toContain('OUTCOME_LEADS');
    expect(res.capabilities.advantagePlusSupported).toBe(true);
    expect(res.capabilities.supportedLeadDestinations).toContain('instant_form');
  });

  it('2. recommendAIStrategy propone estructura simplificada (1 CBO + 2 AdSets) y matriz de ángulos', async () => {
    const brandProfile = {
      ...DEFAULT_CREATIVE_PROFILE,
      brandIdentity: { commercialName: 'Grupo Novati Tech' },
    };

    const res = await recommendAIStrategy({
      brandProfile,
      products: [{ id: 'prod_1', name: 'Notebook Lenovo ThinkPad', price: 1299999, installments: '12 cuotas fijas' }],
      objective: 'leads',
      budget: 25000,
    });

    expect(res.success).toBe(true);
    expect(res.strategy.recommendedStructure.adSetsCount).toBe(2);
    expect(res.strategy.recommendedStructure.adsCount).toBe(6);
    expect(res.strategy.creativeMatrix.length).toBeGreaterThanOrEqual(3);
    expect(res.strategy.campaignScore).toBeGreaterThanOrEqual(90);
  });

  it('3. executeTransactionalLaunchPipeline crea la estructura completa en Meta en estado PAUSED', async () => {
    const launchConfig = {
      clientId: mockTenantId,
      clientRequestId: 'req_test_12345',
      name: 'Campaña Leads Novati',
      businessObjective: 'leads',
      dailyBudget: 25000,
      currency: 'ARS',
      targeting: { location: 'Tucumán', ageMin: 25, ageMax: 55 },
    };

    const res = await executeTransactionalLaunchPipeline({
      launchConfig,
      clientProfile: { brandIdentity: { commercialName: 'Grupo Novati Tech' } },
      user: { email: 'admin@animamkt.com' },
    });

    expect(res.success).toBe(true);
    expect(res.campaign.status).toBe('paused'); // Strict PAUSED rule
    expect(res.campaign.pipelineState.stepStatus).toBe('success');
    expect(res.campaign.pipelineState.stepsCompleted).toEqual([
      'create_campaign',
      'create_adset',
      'create_creative',
      'create_ad',
      'attach_form',
    ]);
  });

  it('4. executeTransactionalLaunchPipeline captura fallas parciales (partial_creation) sin perder IDs previos', async () => {
    const launchConfig = {
      clientId: mockTenantId,
      clientRequestId: 'req_fail_test',
      name: 'Campaña con Error Parcial',
      businessObjective: 'leads',
      dailyBudget: 25000,
      targeting: { location: 'Tucumán', ageMin: 25, ageMax: 55 },
    };

    const res = await executeTransactionalLaunchPipeline({
      launchConfig,
      clientProfile: { brandIdentity: { commercialName: 'Grupo Novati Tech' } },
      user: { email: 'admin@animamkt.com' },
      simulateErrorAtStep: 'create_ad',
    });

    expect(res.success).toBe(false);
    expect(res.isPartial).toBe(true);
    expect(res.campaign.status).toBe('partial_creation');
    expect(res.campaign.metaCampaignId).toBeDefined(); // Saved
    expect(res.campaign.metaAdSetId).toBeDefined(); // Saved
    expect(res.campaign.metaAdId).toBeNull(); // Failed step
    expect(res.campaign.pipelineState.failedStepError).toContain('create_ad');
  });

  it('5. POST /api/meta-launch/create-paused responde idempotentemente si se envía el mismo clientRequestId', async () => {
    const existingCampaign = {
      _id: new ObjectId('65df33333333333333333333'),
      clientRequestId: 'req_duplicate_check',
      clientId: mockTenantId,
      name: 'Campaña Existente',
      status: 'paused',
    };

    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(existingCampaign),
      insertOne: vi.fn(),
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
      path: '/api/meta-launch/create-paused',
      body: JSON.stringify({
        clientRequestId: 'req_duplicate_check',
        clientId: mockTenantId.toString(),
        name: 'Campaña Existente',
        dailyBudget: 20000,
      }),
    };

    const res = await metaLaunchHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.idempotent).toBe(true);
    expect(mockCollection.insertOne).not.toHaveBeenCalled(); // Protected against duplicate insertion
  });
});
