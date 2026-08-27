import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { calculateTrueNetMargin, validateAffiliate } from '../../models/Affiliate.js';
import { handler as affiliatesHandler } from '../../netlify/functions/api-affiliates.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 15 — Affiliate Network & True Net Margin Unit Economics Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. calculateTrueNetMargin descuenta Ads, COGS y Comisiones con precisión', () => {
    const analysis = calculateTrueNetMargin({
      grossRevenue: 10000000,
      metaSpend: 2000000,
      dropshipCogs: 4000000,
      affiliateCommissions: 1000000,
    });

    expect(analysis.totalCosts).toBe(7000000);
    expect(analysis.netProfit).toBe(3000000);
    expect(analysis.netMarginPercent).toBe(30);
    expect(analysis.roas).toBe(5);
    expect(analysis.cogsRatio).toBe(40);
    expect(analysis.affiliateRatio).toBe(10);
  });

  it('2. validateAffiliate valida campos obligatorios y rango de comisión', () => {
    const invalid = validateAffiliate({ clientId: null, name: '' });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThanOrEqual(2);

    const valid = validateAffiliate({
      clientId: 'tenant_1',
      name: 'Influencer Pro',
      promoCode: 'PRO10',
      commissionRate: 15,
    });
    expect(valid.isValid).toBe(true);
  });

  it('3. GET /api/affiliates/profitability retorna balance en cascada', async () => {
    const mockDb = {
      collection: vi.fn().mockImplementation(() => ({
        find: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
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
      path: '/api/affiliates/profitability',
      queryStringParameters: {},
    };

    const res = await affiliatesHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.profitability.netProfit).toBeGreaterThan(0);
    expect(body.profitability.netMarginPercent).toBeGreaterThan(0);
  });

  it('4. POST /api/affiliates/track registra conversión por código de descuento', async () => {
    const mockAffiliateId = new ObjectId('65df22222222222222222222');
    const mockAffiliatesCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: mockAffiliateId,
        name: 'Influencer Club',
        promoCode: 'CLUB10',
        commissionRate: 10,
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    const mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'affiliates') return mockAffiliatesCollection;
        return { find: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }) };
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
      path: '/api/affiliates/track',
      body: JSON.stringify({
        promoCode: 'CLUB10',
        amount: 250000,
      }),
    };

    const res = await affiliatesHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.tracked.commissionEarned).toBe(25000);
    expect(mockAffiliatesCollection.updateOne).toHaveBeenCalled();
  });
});
