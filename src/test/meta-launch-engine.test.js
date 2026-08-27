import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  validatePreflightLaunch,
  createPausedCampaignService,
} from '../../netlify/functions/_shared/creativeEngine/metaAdsLaunchService.js';
import { validateMetaCampaignLaunch } from '../../models/MetaCampaignLaunch.js';
import { handler as metaLaunchHandler } from '../../netlify/functions/api-meta-launch.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 17 — Meta Ads Campaign Launch Engine & Safety Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. validatePreflightLaunch evalúa exitosamente los 18 puntos de control', () => {
    const launchConfig = {
      businessObjective: 'leads',
      dailyBudget: 25000,
      currency: 'ARS',
      targeting: {
        location: 'Argentina (Tucumán)',
        ageMin: 25,
        ageMax: 55,
        advantagePlacements: true,
      },
      leadForm: {
        formName: 'Solicitud Presupuesto',
      },
    };

    const preflight = validatePreflightLaunch({
      launchConfig,
      clientProfile: { brandIdentity: { commercialName: 'Grupo Novati' } },
      metaAdAccount: { adAccountId: 'act_983748291', businessName: 'Novati Business' },
    });

    expect(preflight.passed).toBe(true);
    expect(preflight.checksTotal).toBe(18);
    expect(preflight.checksPassedCount).toBe(18);
  });

  it('2. validateMetaCampaignLaunch bloquea presupuestos que excedan el límite de seguridad (Guardrails)', () => {
    const invalidConfig = {
      clientId: '65df11111111111111111111',
      name: 'Campaña Peligrosa',
      dailyBudget: 150000, // Exceeds 50,000 max
    };

    const validation = validateMetaCampaignLaunch(invalidConfig);
    expect(validation.isValid).toBe(false);
    expect(validation.errors[0]).toContain('excede el límite de seguridad');
  });

  it('3. createPausedCampaignService genera la campaña estrictamente en estado PAUSED (Cero Gasto Automático)', async () => {
    const launchConfig = {
      clientId: mockTenantId,
      name: 'Campaña Leads Notebooks',
      businessObjective: 'leads',
      dailyBudget: 20000,
      currency: 'ARS',
      targeting: { location: 'Tucumán', ageMin: 25, ageMax: 55 },
    };

    const result = await createPausedCampaignService({
      launchConfig,
      clientProfile: { brandIdentity: { commercialName: 'Grupo Novati' } },
      user: { email: 'admin@animamkt.com' },
    });

    expect(result.success).toBe(true);
    expect(result.campaign.status).toBe('paused'); // Inviolable safety rule
    expect(result.campaign.metaCampaignId).toBeDefined();
    expect(result.campaign.metaLeadFormId).toBeDefined();
    expect(result.campaign.auditLog[0].action).toBe('CREATE_PAUSED');
  });

  it('4. POST /api/meta-launch/:id/activate pasa el estado a active únicamente bajo confirmación explícita', async () => {
    const campaignId = new ObjectId('65df22222222222222222222');
    const existingCampaign = {
      _id: campaignId,
      clientId: mockTenantId,
      name: 'Campaña Leads Notebooks',
      status: 'paused',
      auditLog: [],
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
      path: `/api/meta-launch/${campaignId.toString()}/activate`,
    };

    const res = await metaLaunchHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.status).toBe('active');
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: campaignId }),
      expect.objectContaining({
        $set: expect.objectContaining({ status: 'active' }),
      })
    );
  });
});
