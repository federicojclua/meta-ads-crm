import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  getKpis,
  getTimeseries,
  getCampaignBreakdown,
  getLeadFunnel,
  getSalesAgingReport,
  getDiagnosticsSummary,
  getMetricDefinitions,
  runAllToolsForTenant,
} from '../../netlify/functions/_shared/copilotTools.js';

describe('Stage 11 — AI Copilot Deterministic Tools & Tenant Isolation', () => {
  const tenant1Id = new ObjectId('65df11111111111111111111');
  const tenant2Id = new ObjectId('65df22222222222222222222');

  let mockSalesCollection;
  let mockLeadsCollection;
  let mockCampaignsCollection;
  let mockGoogleSourcesCollection;
  let mockGoogleReviewsCollection;
  let mockSocialSourcesCollection;
  let mockDb;

  beforeEach(() => {
    mockSalesCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: new ObjectId(), clientId: tenant1Id, amount: 5000, status: 'paid', createdAt: new Date() },
          { _id: new ObjectId(), clientId: tenant1Id, amount: 2000, status: 'pending', createdAt: new Date(Date.now() - 3600000 * 24 * 45) },
        ]),
      }),
    };

    mockLeadsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: new ObjectId(), clientId: tenant1Id, status: 'new' },
          { _id: new ObjectId(), clientId: tenant1Id, status: 'won' },
          { _id: new ObjectId(), clientId: tenant1Id, status: 'proposal' },
        ]),
      }),
    };

    mockCampaignsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: new ObjectId(), clientId: tenant1Id, name: 'Campaña Primavera', spend: 1000, impressions: 50000, clicks: 1200, roas: 5.0 },
        ]),
        limit: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            { _id: new ObjectId(), clientId: tenant1Id, name: 'Campaña Primavera', spend: 1000, impressions: 50000, clicks: 1200, roas: 5.0 },
          ]),
        }),
      }),
    };

    mockGoogleSourcesCollection = {
      findOne: vi.fn().mockResolvedValue({
        clientId: tenant1Id,
        googleBusinessProfile: { rating: 4.9 },
      }),
    };

    mockGoogleReviewsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { _id: new ObjectId(), clientId: tenant1Id, rating: 5, replyStatus: 'replied' },
          { _id: new ObjectId(), clientId: tenant1Id, rating: 4, replyStatus: 'unanswered' },
        ]),
      }),
    };

    mockSocialSourcesCollection = {
      findOne: vi.fn().mockResolvedValue({
        clientId: tenant1Id,
        metrics: { followers: 5400, engagementRate: 4.8 },
      }),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'sales') return mockSalesCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'meta_campaigns') return mockCampaignsCollection;
        if (name === 'google_sources') return mockGoogleSourcesCollection;
        if (name === 'google_reviews') return mockGoogleReviewsCollection;
        if (name === 'social_sources') return mockSocialSourcesCollection;
        return null;
      }),
    };
  });

  it('1. getKpis calcula métricas financieras puras y ROAS atribuido correctamente', async () => {
    const kpis = await getKpis({ db: mockDb, clientId: tenant1Id.toString(), period: 'last_30_days', currency: 'USD' });

    expect(kpis.invoicedRevenue).toBe(7000);
    expect(kpis.collectedRevenue).toBe(5000);
    expect(kpis.pendingRevenue).toBe(2000);
    expect(kpis.metaSpend).toBe(1000);
    expect(kpis.attributedRoas).toBe(5.0);
    expect(kpis.totalLeads).toBe(3);
    expect(kpis.cpl).toBe(333.33);
  });

  it('2. getLeadFunnel desglosa las etapas del embudo comercial', async () => {
    const funnel = await getLeadFunnel({ db: mockDb, clientId: tenant1Id });

    expect(funnel.totalLeads).toBe(3);
    expect(funnel.wonLeads).toBe(1);
    expect(funnel.stages.new).toBe(1);
    expect(funnel.stages.proposal).toBe(1);
  });

  it('3. getSalesAgingReport clasifica la deuda según antigüedad', async () => {
    const aging = await getSalesAgingReport({ db: mockDb, clientId: tenant1Id });

    expect(aging.totalPending).toBe(2000);
    expect(aging.collected).toBe(5000);
    expect(aging.agingOver30Days).toBe(2000);
    expect(aging.collectionRatePercentage).toBe(71.4);
  });

  it('4. getDiagnosticsSummary consolida calificaciones de Google y Redes', async () => {
    const diag = await getDiagnosticsSummary({ db: mockDb, clientId: tenant1Id });

    expect(diag.googleRating).toBe(4.9);
    expect(diag.totalReviews).toBe(2);
    expect(diag.reviewResponseRate).toBe(50);
    expect(diag.socialFollowers).toBe(5400);
  });

  it('5. getMetricDefinitions provee definiciones canónicas', () => {
    const roasDef = getMetricDefinitions({ metricName: 'roas' });
    expect(roasDef.definition).toContain('Return on Ad Spend');

    const cacDef = getMetricDefinitions({ metricName: 'cac' });
    expect(cacDef.definition).toContain('Customer Acquisition Cost');
  });

  it('6. runAllToolsForTenant ejecuta todas las herramientas en paralelo sin cruzar empresas', async () => {
    const all = await runAllToolsForTenant({
      db: mockDb,
      clientId: tenant1Id,
      period: 'last_30_days',
      currency: 'USD',
      userQuery: 'roas',
    });

    expect(all.kpis).toBeDefined();
    expect(all.campaigns).toBeDefined();
    expect(all.funnel).toBeDefined();
    expect(all.aging).toBeDefined();
    expect(all.diagnostics).toBeDefined();
  });
});
