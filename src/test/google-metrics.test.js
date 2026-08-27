import { describe, it, expect } from 'vitest';
import {
  calculateReputationMetrics,
  calculateSearchConsoleMetrics,
  calculateCompetitiveDifferential,
} from '../../netlify/functions/_shared/googleMetrics.js';

describe('Stage 9 — Deterministic Google & Local SEO Metrics Engine', () => {
  it('1. calculateReputationMetrics calcula correctamente promedio de rating, distribución de estrellas y tasa de respuesta', () => {
    const mockReviews = [
      { rating: 5, comment: 'Excelente atención', replyText: '¡Gracias!', responseTimeHours: 2, sentiment: 'positive' },
      { rating: 5, comment: 'Muy buenos productos', replyText: 'Nos alegra', responseTimeHours: 4, sentiment: 'positive' },
      { rating: 4, comment: 'Bien en general', replyText: '', responseTimeHours: null, sentiment: 'positive' },
      { rating: 2, comment: 'Hubo demora en la entrega', replyText: 'Disculpas, te contactamos', responseTimeHours: 12, sentiment: 'negative' },
    ];

    const res = calculateReputationMetrics(mockReviews, 4.0, 4);

    expect(res.sampleReviewsCount).toBe(4);
    expect(res.averageRating).toBe(4.0); // (5+5+4+2)/4 = 4.0
    expect(res.starDistribution[5]).toBe(2);
    expect(res.starDistribution[4]).toBe(1);
    expect(res.starDistribution[2]).toBe(1);
    expect(res.answeredCount).toBe(3);
    expect(res.unansweredCount).toBe(1);
    expect(res.responseRatePercentage).toBe(75.0);
    expect(res.avgResponseTimeHours).toBe(6); // (2+4+12)/3 = 6
  });

  it('2. calculateSearchConsoleMetrics calcula CTR medio, posición e identifica oportunidades de alto alcance y bajo CTR', () => {
    const mockGscData = {
      queries: [
        { query: 'marca principal', clicks: 200, impressions: 1000, position: 1.2 },
        { query: 'oportunidad seo', clicks: 5, impressions: 500, position: 8.5 }, // CTR = 1% (<3%) y >30 imp -> oportunidad
        { query: 'búsqueda irrelevante', clicks: 1, impressions: 10, position: 20 },
      ],
      pages: [
        { page: 'https://ejemplo.com/home', clicks: 180, impressions: 800 },
      ],
    };

    const res = calculateSearchConsoleMetrics(mockGscData);

    expect(res.totalClicks).toBe(206);
    expect(res.totalImpressions).toBe(1510);
    expect(res.avgCtr).toBeGreaterThan(13); // (206/1510)*100 = 13.64%
    expect(res.opportunitiesCount).toBe(1);
    expect(res.opportunities[0].query).toBe('oportunidad seo');
  });

  it('3. calculateCompetitiveDifferential clasifica y rankea al inquilino contra competidores locales', () => {
    const tenantProfile = {
      businessName: 'Mi Negocio',
      rating: 4.9,
      userRatingsTotal: 150,
      category: 'Salud',
    };

    const competitors = [
      { name: 'Competidor 1', rating: 4.2, userRatingsTotal: 80, category: 'Salud' },
      { name: 'Competidor 2', rating: 4.6, userRatingsTotal: 200, category: 'Salud' },
    ];

    const res = calculateCompetitiveDifferential(tenantProfile, competitors);

    expect(res.competitorsCount).toBe(2);
    expect(res.avgCompetitorRating).toBe(4.4); // (4.2+4.6)/2 = 4.4
    expect(res.ratingGap).toBe(0.5); // 4.9 - 4.4 = 0.5
    expect(res.tenantRank).toBe(1); // Score should place tenant at top
    expect(res.leaderboard.length).toBe(3);
  });
});
