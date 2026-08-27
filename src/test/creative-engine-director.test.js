import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  generateCampaignBriefAndConcepts,
  generateLayoutSpecification,
  auditQualityScore,
  analyzeLogoVisuals,
} from '../../netlify/functions/_shared/creativeEngine/aiDirectorProvider.js';
import { DEFAULT_CREATIVE_PROFILE } from '../../models/CreativeProfile.js';
import { SEED_SAMPLE_PRODUCTS } from '../../models/Product.js';

describe('Stage 16 — AI Design Director & Computational Art Engine Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. analyzeLogoVisuals sugiere paleta de contraste AAA y tipografía adecuada', async () => {
    const analysis = await analyzeLogoVisuals({
      logoUrl: 'https://example.com/logo.png',
      commercialName: 'Tech Store',
    });

    expect(analysis.success).toBe(true);
    expect(analysis.suggestedPalette.primary).toBeDefined();
    expect(analysis.suggestedPalette.accent).toBeDefined();
    expect(analysis.detectedAesthetic.contrastLevel).toContain('Alto Contraste');
  });

  it('2. generateCampaignBriefAndConcepts genera 3 conceptos diferenciados (A, B, C)', async () => {
    const brandProfile = {
      ...DEFAULT_CREATIVE_PROFILE,
      brandIdentity: { commercialName: 'Grupo Novati' },
    };

    const result = await generateCampaignBriefAndConcepts({
      brandProfile,
      products: SEED_SAMPLE_PRODUCTS,
      objective: 'vender',
      industry: 'electronics',
    });

    expect(result.brief.campaignTitle).toContain('Grupo Novati');
    expect(result.concepts).toHaveLength(3);
    expect(result.concepts[0].id).toBe('A');
    expect(result.concepts[1].id).toBe('B');
    expect(result.concepts[2].id).toBe('C');
    expect(result.concepts[0].headline).toBeDefined();
    expect(result.concepts[0].cta).toBeDefined();
  });

  it('3. generateLayoutSpecification genera un esquema JSON estricto con capas y coordenadas', () => {
    const concept = {
      id: 'A',
      name: 'Hero Protagonista',
      visualTheme: 'hero_single_focus',
      headline: 'OFERTAS GAMER',
      subtitle: '12 cuotas fijas',
      cta: 'COMPRAR AHORA',
    };

    const spec1to1 = generateLayoutSpecification({
      concept,
      products: SEED_SAMPLE_PRODUCTS,
      brandProfile: DEFAULT_CREATIVE_PROFILE,
      format: '1:1',
    });

    expect(spec1to1.canvas.width).toBe(1080);
    expect(spec1to1.canvas.height).toBe(1080);
    expect(spec1to1.elements.some((e) => e.type === 'logo')).toBe(true);
    expect(spec1to1.elements.some((e) => e.type === 'headline')).toBe(true);
    expect(spec1to1.elements.some((e) => e.type === 'product_hero')).toBe(true);
    expect(spec1to1.elements.some((e) => e.type === 'price_badge')).toBe(true);
    expect(spec1to1.elements.some((e) => e.type === 'cta_button')).toBe(true);

    const spec9to16 = generateLayoutSpecification({
      concept,
      products: SEED_SAMPLE_PRODUCTS,
      brandProfile: DEFAULT_CREATIVE_PROFILE,
      format: '9:16',
    });

    expect(spec9to16.canvas.width).toBe(1080);
    expect(spec9to16.canvas.height).toBe(1920);
  });

  it('4. auditQualityScore evalúa legibilidad, consistencia y visibilidad de CTA', () => {
    const layoutSpec = generateLayoutSpecification({
      concept: { headline: 'PROMO EXCLUSIVA', cta: 'CONSULTAR' },
      products: SEED_SAMPLE_PRODUCTS,
      brandProfile: DEFAULT_CREATIVE_PROFILE,
      format: '1:1',
    });

    const score = auditQualityScore({
      layoutSpec,
      brandProfile: DEFAULT_CREATIVE_PROFILE,
      copy: { headline: 'PROMO EXCLUSIVA' },
    });

    expect(score.overall).toBeGreaterThanOrEqual(85);
    expect(score.brandConsistency).toBeGreaterThanOrEqual(90);
    expect(score.ctaVisibility).toBeGreaterThanOrEqual(90);
    expect(score.recommendations.length).toBeGreaterThan(0);
  });
});
