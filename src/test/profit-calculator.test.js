import { describe, it, expect } from 'vitest';
import {
  calculateUnitTrueProfit,
  calculateOfferVariantProfit,
} from '../../netlify/functions/_shared/offerEngine/profitCalculator.js';

describe('Stage 15B — Pure Arithmetic True Profit Engine Tests', () => {
  it('1. calculateUnitTrueProfit calcula con exactitud matemática el True Profit y Margen Neto', () => {
    const res = calculateUnitTrueProfit({
      price: 1299999,
      costStructure: {
        cogs: 780000,
        gatewayFeePercent: 3.5, // $45.500
        shippingCost: 8500,
        estimatedCpa: 32000,
        otherUnitCosts: 0,
        targetMinMarginPercent: 15,
      },
    });

    expect(res.sellingPrice).toBe(1299999);
    expect(res.gatewayFeeAmount).toBe(45500);
    expect(res.totalUnitCost).toBe(780000 + 8500 + 32000 + 45500); // 866000
    expect(res.trueProfitAmount).toBe(1299999 - 866000); // 433999
    expect(res.trueProfitMarginPct).toBeCloseTo(33.38, 1);
    expect(res.isProfitable).toBe(true);
    expect(res.healthStatus).toBe('HEALTHY');
    expect(res.maxDiscountAllowedPct).toBeCloseTo(18.38, 1);
  });

  it('2. calculateUnitTrueProfit detecta riesgo crítico si el margen cae debajo del 15%', () => {
    const res = calculateUnitTrueProfit({
      price: 100000,
      costStructure: {
        cogs: 80000,
        gatewayFeePercent: 3.5,
        shippingCost: 8500,
        estimatedCpa: 5000,
        targetMinMarginPercent: 15,
      },
    });

    expect(res.trueProfitMarginPct).toBeLessThan(15);
    expect(res.healthStatus).toBe('CRITICAL_RISK');
    expect(res.maxDiscountAllowedPct).toBe(0);
  });

  it('3. calculateOfferVariantProfit calcula el margen de bundles con bonos de bajo costo', () => {
    const res = calculateOfferVariantProfit({
      baseProductPrice: 1299999,
      discountPct: 0,
      addonsCost: 6500, // Costo de funda + guía digital
      costStructure: {
        cogs: 780000,
        gatewayFeePercent: 3.5,
        shippingCost: 8500,
        estimatedCpa: 32000,
        targetMinMarginPercent: 15,
      },
    });

    expect(res.sellingPrice).toBe(1299999);
    expect(res.cogs).toBe(780000 + 6500);
    expect(res.trueProfitAmount).toBe(1299999 - (786500 + 8500 + 32000 + 45500)); // 427499
    expect(res.trueProfitMarginPct).toBeCloseTo(32.88, 1);
    expect(res.healthStatus).toBe('HEALTHY');
  });
});
