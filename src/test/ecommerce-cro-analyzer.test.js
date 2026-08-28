import { describe, it, expect } from 'vitest';
import {
  analyzeLandingPageCroService,
  evaluate10CroDimensions,
} from '../../netlify/functions/_shared/ecommerceEngine/croAnalyzerService.js';
import { sanitizeEcommerceCroAudit } from '../../models/EcommerceCroAudit.js';

describe('Stage 20 — E-Commerce CRO Analyzer & PDF Report Tests', () => {
  it('1. evaluate10CroDimensions evalúa las 10 dimensiones, asigna prioridades y extrae Quick Wins (High Impact / Low Effort)', () => {
    const { dimensions, quickWins, highImpactChanges, totalScore } = evaluate10CroDimensions(
      'https://tienda-ejemplo.com/producto',
      { title: 'Notebook Lenovo ThinkPad', rawSnippet: 'Garantía oficial y despacho en 24 horas.' }
    );

    expect(dimensions.length).toBe(10);
    expect(totalScore).toBeGreaterThan(50);
    expect(quickWins.length).toBeGreaterThan(0);

    // Verify each dimension structure
    dimensions.forEach((dim) => {
      expect(dim.dimensionKey).toBeDefined();
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(10);
      expect(dim.problem).toBeDefined();
      expect(dim.recommendation).toBeDefined();
      expect(['P0', 'P1', 'P2', 'P3']).toContain(dim.priority);
      expect(['LOW', 'MED', 'HIGH']).toContain(dim.effort);
      expect(['LOW', 'MED', 'HIGH']).toContain(dim.impact);
    });

    // Quick Wins must strictly be HIGH impact and LOW effort
    quickWins.forEach((qw) => {
      expect(qw.impact).toBe('HIGH');
      expect(qw.effort).toBe('LOW');
    });
  });

  it('2. analyzeLandingPageCroService genera reporte ejecutivo estructurado con soporte de PDF', async () => {
    const mockDb = {
      collection: () => ({
        insertOne: async (doc) => ({ insertedId: 'mock_audit_id', ...doc }),
      }),
    };

    const audit = await analyzeLandingPageCroService({
      url: 'https://tienda-gamer.com/mouse',
      targetAudience: 'Jugadores Competitivos',
      campaignObjective: 'Conversions / Sales',
      clientId: '65df44444444444444444444',
      db: mockDb,
    });

    expect(audit.croScore).toBeGreaterThan(50);
    expect(audit.executiveSummary).toBeDefined();
    expect(audit.topProblems.length).toBeGreaterThan(0);
    expect(audit.topOpportunities.length).toBeGreaterThan(0);
    expect(audit.recommendedExperiments.length).toBeGreaterThan(0);
    expect(audit.pdfReportData).toBeDefined();
    expect(audit.pdfReportData.title).toContain('ANIMA MKT CRM');
  });
});
