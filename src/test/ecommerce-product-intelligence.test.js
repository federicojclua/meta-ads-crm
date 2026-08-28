import { describe, it, expect } from 'vitest';
import {
  analyzeDropshippingProductService,
  analyzeKdpBookService,
  saveProductAnalysisService,
  listEcommerceProductsService,
  generateCommercialAngles,
  generateCategorizedHooks,
} from '../../netlify/functions/_shared/ecommerceEngine/productIntelligenceService.js';

describe('Stage 20 — E-Commerce Product Intelligence & KDP Mode Tests', () => {
  it('1. analyzeDropshippingProductService calcula ANIMA Product Score, 5 ángulos y 10 hooks categorizados', async () => {
    const analysis = await analyzeDropshippingProductService({
      productName: 'Limpiador Facial Ultrasónico Pro V3',
      category: 'Belleza & Cuidado',
      salePrice: 42000,
      cost: 14000,
      shippingCost: 3500,
      clientId: '65df44444444444444444444',
    });

    expect(analysis.scores.overallScore).toBeGreaterThanOrEqual(70);
    expect(analysis.classification).toBe('potential_winner');
    expect(analysis.angles.length).toBe(5);
    expect(analysis.hooks.length).toBe(10);

    // Verify 5 angles structure
    const angle1 = analysis.angles[0];
    expect(angle1.angleType).toContain('Pain Point');
    expect(angle1.hook).toBeDefined();
    expect(angle1.coreMessage).toBeDefined();
    expect(angle1.cta).toBeDefined();
    expect(angle1.recommendedFormat).toBeDefined();

    // Verify 10 hooks categories
    const hookCats = analysis.hooks.map((h) => h.category);
    expect(hookCats).toContain('Curiosity');
    expect(hookCats).toContain('Problem');
    expect(hookCats).toContain('Social Proof');
    expect(hookCats).toContain('UGC');

    // Verify Facts vs Inferences
    expect(analysis.factsVsInferences.observed.length).toBeGreaterThan(0);
    expect(analysis.factsVsInferences.inferred.length).toBeGreaterThan(0);
    expect(analysis.factsVsInferences.recommended.length).toBeGreaterThan(0);
    expect(analysis.factsVsInferences.unknown.length).toBeGreaterThan(0);
  });

  it('2. analyzeKdpBookService genera metadata conforme a reglas de Amazon KDP y detecta infracciones de compliance', async () => {
    // Valid KDP Book
    const validBook = await analyzeKdpBookService({
      niche: 'Productividad Personal',
      mainKeyword: 'gestion del tiempo para profesionales',
      audience: 'Emprendedores',
      clientId: '65df44444444444444444444',
    });

    expect(validBook.mode).toBe('kdp');
    expect(validBook.kdpData.suggestedTitle).toContain('Productividad Personal');
    expect(validBook.kdpData.backendKeywords.length).toBe(7);
    expect(validBook.kdpData.bookDescription).toContain('<p>');
    expect(validBook.complianceCheck.status).toBe('PASS');

    // Invalid KDP Book with Forbidden Bestseller Claims
    const invalidBook = await analyzeKdpBookService({
      niche: 'Bestseller #1 Guía Rápida',
      mainKeyword: 'libro gratis',
      clientId: '65df44444444444444444444',
    });

    expect(invalidBook.complianceCheck.status).toBe('FAIL');
    expect(invalidBook.complianceCheck.issues.length).toBeGreaterThan(0);
  });

  it('3. saveProductAnalysisService guarda y versiona el análisis sin perder el historial', async () => {
    const mockDb = {
      collection: (name) => ({
        find: () => ({ sort: () => ({ toArray: async () => [] }) }),
        findOne: async () => ({ _id: 'mock_prod_id', productName: 'Producto Test' }),
        insertOne: async (doc) => ({ insertedId: 'mock_inserted_id', ...doc }),
        updateOne: async () => ({ modifiedCount: 1 }),
        countDocuments: async () => 1, // simulates 1 existing version -> new version is 2
      }),
    };

    const saved = await saveProductAnalysisService({
      clientId: '65df44444444444444444444',
      productData: { id: '65df44444444444444444444', productName: 'Producto Test' },
      analysisData: { mode: 'dropshipping', scores: { overallScore: 88 } },
      db: mockDb,
    });

    expect(saved.product).toBeDefined();
    expect(saved.analysis.analysisVersion).toBe(2);
  });
});
