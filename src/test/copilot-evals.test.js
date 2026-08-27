import { describe, it, expect } from 'vitest';
import {
  executeDeterministicCopilot,
  queryCopilot,
} from '../../netlify/functions/_shared/copilotProviderAdapter.js';

describe('Stage 11 — Synthetic Evals & Numerical Accuracy Tests', () => {
  const mockTenantContext = {
    tenantId: 'tenant_eval_1',
    tenantName: 'Perfumería Marion',
    currency: 'USD',
    period: 'Últimos 30 días',
    attributionModel: 'last_touch',
  };

  const mockToolResults = {
    kpis: {
      invoicedRevenue: 15000,
      collectedRevenue: 12000,
      pendingRevenue: 3000,
      metaSpend: 3000,
      attributedRoas: 4.0,
      totalLeads: 120,
      wonSalesCount: 24,
      cpl: 25.0,
      cac: 125.0,
    },
    campaigns: [
      { id: 'c1', name: 'Perfumes Nicho Verano', spend: 2000, roas: 4.5 },
      { id: 'c2', name: 'Ofertas Outlet', spend: 1000, roas: 2.1 },
    ],
    funnel: {
      totalLeads: 120,
      wonLeads: 24,
      lostLeads: 30,
      cpl: 25.0,
    },
    aging: {
      totalPending: 3000,
      agingOver30Days: 1200,
      agingOver60Days: 400,
      collectionRatePercentage: 80.0,
    },
    diagnostics: {
      googleRating: 4.9,
      totalReviews: 85,
      reviewResponseRate: 95,
      organicCtr: 5.2,
    },
  };

  it('1. Eval de exactitud numérica para pregunta de sobreinversión y ROAS', () => {
    const result = executeDeterministicCopilot({
      userQuery: '¿Hay sobreinversión en Meta Ads este mes?',
      toolResults: mockToolResults,
      tenantContext: mockTenantContext,
    });

    expect(result.shortAnswer).toContain('ROAS atribuido de 4x');
    expect(result.shortAnswer).toContain('No se observa sobreinversión crítica');
    expect(result.confidence).toBe('high');
    expect(result.dashboardLink).toBe('/app/campaigns');

    const roasEvidence = result.numericalEvidence.find((e) => e.label === 'ROAS Atribuido');
    expect(roasEvidence?.value).toBe('4x');
  });

  it('2. Eval de exactitud para pregunta de campañas top y flop', () => {
    const result = executeDeterministicCopilot({
      userQuery: '¿Cuáles son las campañas con mejor y peor rendimiento?',
      toolResults: mockToolResults,
      tenantContext: mockTenantContext,
    });

    expect(result.shortAnswer).toContain('Perfumes Nicho Verano');
    expect(result.shortAnswer).toContain('Ofertas Outlet');
  });

  it('3. Eval de exactitud para pregunta de leads y CPL', () => {
    const result = executeDeterministicCopilot({
      userQuery: '¿Cuál es el CPL promedio y la conversión de prospectos?',
      toolResults: mockToolResults,
      tenantContext: mockTenantContext,
    });

    expect(result.shortAnswer).toContain('120 leads');
    expect(result.shortAnswer).toContain('CPL promedio de $25');
    expect(result.shortAnswer).toContain('20%'); // 24 / 120 = 20%
  });

  it('4. Eval de exactitud para pregunta de cobranzas y aging', () => {
    const result = executeDeterministicCopilot({
      userQuery: '¿Cómo está el saldo de cobranzas y aging a más de 30 días?',
      toolResults: mockToolResults,
      tenantContext: mockTenantContext,
    });

    expect(result.shortAnswer).toContain('$3,000');
    expect(result.shortAnswer).toContain('80%');
    expect(result.shortAnswer).toContain('$1,200');
  });

  it('5. queryCopilot despacha y retorna respuesta estructurada con circuit breaker activo', async () => {
    const result = await queryCopilot({
      userQuery: '¿Cómo están las reseñas de Google?',
      toolResults: mockToolResults,
      tenantContext: mockTenantContext,
      requestedProvider: 'deterministic',
    });

    expect(result.provider).toBe('deterministic_engine');
    expect(result.confidence).toBe('high');
    expect(result.shortAnswer).toContain('4.9★');
  });
});
