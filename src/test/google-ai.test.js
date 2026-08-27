import { describe, it, expect } from 'vitest';
import {
  validateGoogleAiReportSchema,
  generateDeterministicFallbackGoogleReport,
  generateReviewReplyDraft,
  buildMasterSeoSemPrompt,
  buildLeadAuditProspectPrompt,
} from '../../netlify/functions/_shared/googleAi.js';

describe('Stage 9 — Google Intelligence AI & Strategic Schema Tests', () => {
  it('1. validateGoogleAiReportSchema valida y sanea el esquema de 5 pilares estratégicos', () => {
    const rawReport = {
      executiveSummary: 'Resumen ejecutivo de prueba.',
      overallScore: 82,
      pillars: {
        reputationAndGbp: { score: 90, status: 'excellent', assessment: 'Excelente reputación.' },
        organicSeoVisibility: { score: 75, status: 'good', assessment: 'Buen posicionamiento.' },
        webConversionAndUx: { score: 70, status: 'good', assessment: 'Conversión estable.' },
        paidSearchEfficiency: { score: 80, status: 'good', assessment: 'CPA controlado.' },
        competitivePositioning: { score: 85, status: 'good', assessment: 'Liderazgo en la zona.' },
      },
      findings: [
        { type: 'strength', title: 'Excelente Reputación', description: 'Alta cantidad de reseñas 5 estrellas.', priority: 'high', responsibleRole: 'CM' },
      ],
      quickWins: ['Responder reseñas pendientes en menos de 24hs.'],
      roadmap: {
        days30: [{ action: 'Responder reseñas', channel: 'GBP', impact: '+10% engagement' }],
      },
    };

    const res = validateGoogleAiReportSchema(rawReport);

    expect(res.isValid).toBe(true);
    expect(res.sanitizedReport.overallScore).toBe(82);
    expect(res.sanitizedReport.pillars.reputationAndGbp.score).toBe(90);
    expect(res.sanitizedReport.findings.length).toBe(1);
    expect(res.sanitizedReport.disclaimer).toContain('Diferenciación estricta');
  });

  it('2. generateDeterministicFallbackGoogleReport genera reporte completo estructurado sin depender de APIs externas', () => {
    const mockMetrics = {
      reputation: { averageRating: 4.8, totalReviews: 45, responseRatePercentage: 90, unansweredCount: 2 },
      seoSummary: { avgCtr: 3.5, totalImpressions: 12000, totalClicks: 420, opportunitiesCount: 3 },
      competitiveDiff: { ratingGap: 0.4, tenantRank: 1, competitorsCount: 4 },
    };

    const res = generateDeterministicFallbackGoogleReport(mockMetrics, { businessName: 'Perfumería Marion' });

    expect(res.provider).toBe('deterministic-engine');
    expect(res.report.overallScore).toBeGreaterThanOrEqual(60);
    expect(res.report.pillars.reputationAndGbp.status).toBe('excellent');
    expect(res.report.roadmap.days30.length).toBeGreaterThan(0);
    expect(res.report.roadmap.days60.length).toBeGreaterThan(0);
    expect(res.report.roadmap.days90.length).toBeGreaterThan(0);
  });

  it('3. generateReviewReplyDraft redacta un borrador empático y educado según la calificación', async () => {
    const positiveReview = {
      reviewerName: 'Lucas Gomez',
      rating: 5,
      comment: 'Excelente producto y atención rápida.',
    };

    const draftPos = await generateReviewReplyDraft({ review: positiveReview, businessName: 'Marion' });

    expect(draftPos.draft).toContain('Lucas Gomez');
    expect(draftPos.draft.toLowerCase()).toContain('gracias');

    const negativeReview = {
      reviewerName: 'Mariana P.',
      rating: 2,
      comment: 'Tardó mucho el envío.',
    };

    const draftNeg = await generateReviewReplyDraft({ review: negativeReview, businessName: 'Marion' });

    expect(draftNeg.draft).toContain('Mariana P.');
    expect(draftNeg.draft.toLowerCase()).toContain('lamentamos');
  });

  it('4. buildMasterSeoSemPrompt genera el bloque estructurado con las 4 reglas y el payload de la empresa', () => {
    const prompt = buildMasterSeoSemPrompt({
      businessName: 'Perfumería Marion',
      websiteUrl: 'https://marion.com',
      metrics: {
        reputation: { averageRating: 4.9, totalReviews: 80, responseRatePercentage: 95 },
        seoSummary: { totalClicks: 320, totalImpressions: 4800, avgCtr: 6.67, avgPosition: 2.3 },
        competitiveDiff: { tenantRank: 1, competitorsCount: 3 },
      },
    });

    expect(prompt).toContain('Consultor Estratégico Senior en SEO y SEM');
    expect(prompt).toContain('Diagnóstico Orgánico:');
    expect(prompt).toContain('Diagnóstico Pago:');
    expect(prompt).toContain('Estrategia de Sinergia:');
    expect(prompt).toContain('Plan de Acción Táctico:');
    expect(prompt).toContain('Perfumería Marion');
    expect(prompt).toContain('4.9★');
  });

  it('5. buildLeadAuditProspectPrompt genera el prompt de radiografía de prospecto para closer de ventas', () => {
    const prompt = buildLeadAuditProspectPrompt({
      businessName: 'Grupo Novati SRL',
      category: 'Venta de informática y posnet',
      city: 'San Miguel de Tucumán',
      rating: 3.2,
      userRatingsTotal: 14,
      websiteUrl: 'https://novati.com.ar',
    });

    expect(prompt).toContain('Director de Estrategia Digital y Closer de Ventas');
    expect(prompt).toContain('Grupo Novati SRL');
    expect(prompt).toContain('San Miguel de Tucumán');
    expect(prompt).toContain('3.2 estrellas');
    expect(prompt).toContain('14 reseñas');
    expect(prompt).toContain('1. Matriz de Esfuerzo vs. Recompensa');
    expect(prompt).toContain('2. Diagnóstico de Puntos Ciegos');
    expect(prompt).toContain('3. Ángulo de Venta');
  });
});
