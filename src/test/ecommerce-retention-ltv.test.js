import { describe, it, expect } from 'vitest';
import {
  evaluateCustomerEligibilityService,
  getLtvAnalyticsService,
  getCrossSellRecommendationsService,
} from '../../netlify/functions/_shared/ecommerceEngine/retentionEngineService.js';

describe('Stage 20 — Customer Retention, LTV & WhatsApp Safety Tests', () => {
  it('1. evaluateCustomerEligibilityService aplica reglas de seguridad de WhatsApp (Opt-out, formato y frecuencia)', () => {
    // 1. Eligible customer
    const eligible = evaluateCustomerEligibilityService({
      customer: { optInWhatsApp: true, normalizedPhone: '5491144445555', tags: ['ecom_buyer'] },
    });
    expect(eligible.eligible).toBe(true);

    // 2. Ineligible (Opt-out)
    const optOut = evaluateCustomerEligibilityService({
      customer: { optInWhatsApp: false, normalizedPhone: '5491144445555' },
    });
    expect(optOut.eligible).toBe(false);
    expect(optOut.reason).toContain('Opt-out');

    // 3. Ineligible (Missing phone)
    const noPhone = evaluateCustomerEligibilityService({
      customer: { optInWhatsApp: true, normalizedPhone: '' },
    });
    expect(noPhone.eligible).toBe(false);
    expect(noPhone.reason).toContain('teléfono');

    // 4. Ineligible (Rate limit: contacted 2 days ago < 7 days minimum)
    const rateLimited = evaluateCustomerEligibilityService({
      customer: {
        optInWhatsApp: true,
        normalizedPhone: '5491144445555',
        lastWhatsAppContactAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
    expect(rateLimited.eligible).toBe(false);
    expect(rateLimited.reason).toContain('intervalo mínimo de 7 días');
  });

  it('2. getLtvAnalyticsService calcula Real LTV vs Predicted LTV, Repeat Rate e Incremental Revenue', async () => {
    const ltv = await getLtvAnalyticsService({ clientId: null, db: null });

    expect(ltv.totalCustomers).toBeGreaterThan(0);
    expect(ltv.repeatPurchaseRate).toBeGreaterThan(0);
    expect(ltv.realLtv).toBeGreaterThan(0);
    expect(ltv.predictedLtv).toBeGreaterThan(ltv.realLtv);
    expect(ltv.retentionRevenue).toBeGreaterThan(0);
    expect(ltv.retentionRoi).toBeGreaterThan(1.0);
    expect(Array.isArray(ltv.topCategories)).toBe(true);
  });

  it('3. getCrossSellRecommendationsService genera sugerencias justificadas racionalmente ("Why This Product")', () => {
    const recs = getCrossSellRecommendationsService('Notebook Lenovo');

    expect(recs.length).toBe(3);
    recs.forEach((rec) => {
      expect(rec.title).toBeDefined();
      expect(rec.whyThisProduct).toBeDefined();
      expect(rec.whyThisProduct.length).toBeGreaterThan(15);
      expect(rec.recommendedTimingDays).toBeGreaterThan(0);
    });
  });
});
