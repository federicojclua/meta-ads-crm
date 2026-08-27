import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { compileLayoutToSvg } from '../../netlify/functions/_shared/creativeEngine/programmaticRenderer.js';
import { generateLayoutSpecification } from '../../netlify/functions/_shared/creativeEngine/aiDirectorProvider.js';
import { DEFAULT_CREATIVE_PROFILE } from '../../models/CreativeProfile.js';
import { SEED_SAMPLE_PRODUCTS } from '../../models/Product.js';
import { handler as campaignsHandler } from '../../netlify/functions/api-creative-campaigns.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 16 — Programmatic Rendering Pipeline & Campaign Endpoints', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. compileLayoutToSvg renderiza una pieza vectorial nítida con precios formateados y cero alucinaciones', () => {
    const spec = generateLayoutSpecification({
      concept: {
        headline: 'OFERTA IMPERDIBLE',
        subtitle: 'Financiación en 12 cuotas fijas',
        cta: 'COMPRAR POR WHATSAPP',
      },
      products: [
        {
          name: 'Notebook Lenovo ThinkPad',
          price: 1299999,
          previousPrice: 1549999,
          discount: 16,
          installments: '12 cuotas sin interés',
          imageUrl: 'https://example.com/lenovo.png',
        },
      ],
      brandProfile: DEFAULT_CREATIVE_PROFILE,
      format: '1:1',
    });

    const svg = compileLayoutToSvg({ layoutSpec: spec, brandProfile: DEFAULT_CREATIVE_PROFILE });

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 1080 1080"');
    expect(svg).toContain('OFERTA IMPERDIBLE');
    expect(svg).toContain('1.299.999'); // Formatted price with thousands separator
    expect(svg).toContain('COMPRAR POR WHATSAPP');
    expect(svg).toContain('https://example.com/lenovo.png');
  });

  it('2. POST /api/creative-campaigns/generate ejecuta el pipeline completo y almacena la campaña', async () => {
    const mockCampaignsCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId('65df33333333333333333333') }),
      findOne: vi.fn().mockResolvedValue(null),
    };
    const mockProfileCollection = {
      findOne: vi.fn().mockResolvedValue({
        clientId: mockTenantId,
        ...DEFAULT_CREATIVE_PROFILE,
      }),
    };
    const mockProductsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(SEED_SAMPLE_PRODUCTS),
      }),
    };

    const mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'creative_campaigns') return mockCampaignsCollection;
        if (name === 'creative_profiles') return mockProfileCollection;
        if (name === 'products') return mockProductsCollection;
        return { findOne: vi.fn().mockResolvedValue(null) };
      }),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/creative-campaigns/generate',
      body: JSON.stringify({
        productIds: ['prod_1'],
        objective: 'vender',
        concept: { id: 'A', name: 'Hero Protagonista', headline: 'SUPER OFERTAS' },
        formats: ['1:1', '9:16'],
      }),
    };

    const res = await campaignsHandler(event);
    expect(res.statusCode).toBe(201);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.campaign.campaignName).toBeDefined();
    expect(body.campaign.renderedAssets).toHaveLength(2);
    expect(body.campaign.qualityScore.overall).toBeGreaterThanOrEqual(85);
  });

  it('3. POST /api/creative-campaigns/:id/reuse clona la estructura y genera la versión 2', async () => {
    const originalCampaignId = new ObjectId('65df44444444444444444444');
    const existingCampaign = {
      _id: originalCampaignId,
      clientId: mockTenantId,
      campaignName: 'Campaña Cyber Monday',
      version: 1,
      formats: ['1:1'],
      layoutSpec: {},
    };

    const mockCampaignsCollection = {
      findOne: vi.fn().mockResolvedValue(existingCampaign),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId('65df55555555555555555555') }),
    };

    const mockDb = {
      collection: vi.fn().mockImplementation(() => mockCampaignsCollection),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: `/api/creative-campaigns/${originalCampaignId.toString()}/reuse`,
    };

    const res = await campaignsHandler(event);
    expect(res.statusCode).toBe(201);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.campaign.version).toBe(2);
    expect(body.campaign.parentCampaignId).toBe(originalCampaignId.toString());
  });
});
