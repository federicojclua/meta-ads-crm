import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { generateProductOffersService } from '../../netlify/functions/_shared/offerEngine/offerService.js';
import { handler as offersHandler } from '../../netlify/functions/api-offers.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 15B — AI Offer Engine & Strategic Architecture Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  const mockProduct = {
    id: '65df88888888888888888888',
    name: 'Notebook Lenovo ThinkPad E14',
    price: 1299999,
    installments: '12 cuotas fijas',
    costStructure: {
      cogs: 780000,
      gatewayFeePercent: 3.5,
      shippingCost: 8500,
      estimatedCpa: 32000,
      targetMinMarginPercent: 15,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. generateProductOffersService orquesta 3 variaciones estratégicas (A/B/C) protegiendo el margen', async () => {
    const res = await generateProductOffersService({
      product: mockProduct,
      clientId: mockTenantId,
    });

    expect(res.productId).toBe(mockProduct.id);
    expect(res.offers.length).toBe(3);

    const [offerA, offerB, offerC] = res.offers;

    // Offer A: Safe direct discount
    expect(offerA.type).toBe('direct_discount');
    expect(offerA.projectedMarginPct).toBeGreaterThanOrEqual(15);

    // Offer B: Value bundle (Recommended)
    expect(offerB.type).toBe('value_bundle');
    expect(offerB.isRecommended).toBe(true);
    expect(offerB.valueAddons.length).toBeGreaterThanOrEqual(2);
    expect(offerB.projectedTrueProfit).toBeGreaterThan(400000);

    // Offer C: Risk-free financing
    expect(offerC.type).toBe('risk_free_financing');
    expect(offerC.paymentTerms).toContain('12 cuotas');
  });

  it('2. POST /api/offers/calculate-profit retorna el desglose aritmético por API', async () => {
    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: { collection: vi.fn() },
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/offers/calculate-profit',
      body: JSON.stringify({
        price: 1299999,
        costStructure: mockProduct.costStructure,
      }),
    };

    const res = await offersHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.profit.trueProfitAmount).toBe(433999);
    expect(body.profit.isProfitable).toBe(true);
  });

  it('3. POST /api/offers/activate activa la oferta seleccionada para alimentar el Creative Engine', async () => {
    const mockCollection = {
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
      path: '/api/offers/activate',
      body: JSON.stringify({
        productId: mockProduct.id,
        offerId: 'offer_b',
      }),
    };

    const res = await offersHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.activeOfferId).toBe('offer_b');
    expect(mockCollection.updateOne).toHaveBeenCalledTimes(2);
  });
});
