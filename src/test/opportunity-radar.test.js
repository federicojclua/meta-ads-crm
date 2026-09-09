import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  evaluateUSCustomsCompliance,
  evaluateShippingViability,
  calculateFinancials,
  auditProductForUSMarket,
  getCuratedUSOpportunities,
} from '../../netlify/functions/_shared/ecommerceEngine/opportunityEngine.js';
import { handler } from '../../netlify/functions/api-shopify.js';

describe('Opportunity Radar & US Customs Compliance Engine Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SHOPIFY_STORE_URL = 'https://mi-tienda-test.myshopify.com/';
    process.env.SHOPIFY_ACCESS_TOKEN = 'shpat_test_access_token_12345';
    process.env.ALIEXPRESS_APP_KEY = 'mock_app_key';
    process.env.ALIEXPRESS_APP_SECRET = 'mock_app_secret';
    process.env.ALIEXPRESS_ACCESS_TOKEN = 'mock_access_token';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ----------------------------------------------------
  // 1. Evaluación de Cumplimiento Aduanero de EE.UU. (CBP)
  // ----------------------------------------------------
  describe('evaluateUSCustomsCompliance', () => {
    it('detecta infracciones de propiedad intelectual, réplicas y marcas protegidas', () => {
      const infringingProduct = {
        title: 'New Luxury 1:1 Rolex Watch Replica Waterproof Stainless Steel',
        description: 'Exact copy of luxury brand with automatic movement.',
        costUsd: 45.0,
      };

      const result = evaluateUSCustomsCompliance(infringingProduct);
      expect(result.isSafe).toBe(false);
      expect(result.complianceScore).toBeLessThan(60);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.flags.some((f) => f.includes('Propiedad Intelectual'))).toBe(true);
    });

    it('detecta mercancías peligrosas para transporte aéreo (baterías sueltas, cuchillos, etc.)', () => {
      const hazardousProduct = {
        title: 'Tactical Hunting Knife with Raw 18650 Pure Battery Flashlight',
        description: 'Military blade and flammables survival kit.',
        costUsd: 25.0,
      };

      const result = evaluateUSCustomsCompliance(hazardousProduct);
      expect(result.isSafe).toBe(false);
      expect(result.flags.some((f) => f.includes('Restricción de Carga Aérea'))).toBe(true);
    });

    it('aprueba productos seguros, legales y compactos para el mercado estadounidense', () => {
      const safeProduct = {
        title: 'Minimalist Magnetic Silicone Cable Management Hub for Desktop',
        description: 'Eco-friendly silicone cord organizer with non-scratch base.',
        costUsd: 4.80,
      };

      const result = evaluateUSCustomsCompliance(safeProduct);
      expect(result.isSafe).toBe(true);
      expect(result.complianceScore).toBeGreaterThanOrEqual(90);
      expect(result.riskLevel).toBe('LOW');
      expect(result.flags).toHaveLength(0);
      expect(result.deMinimisEligible).toBe(true);
    });

    it('advierte cuando el valor supera el umbral De Minimis Section 321 ($800 USD)', () => {
      const expensiveProduct = {
        title: 'Commercial Laser Engraving Station Heavy Industrial',
        costUsd: 950.0,
      };

      const result = evaluateUSCustomsCompliance(expensiveProduct);
      expect(result.deMinimisEligible).toBe(false);
      expect(result.flags.some((f) => f.includes('Section 321'))).toBe(true);
    });
  });

  // ----------------------------------------------------
  // 2. Viabilidad Logística & Flete Aéreo
  // ----------------------------------------------------
  describe('evaluateShippingViability', () => {
    it('identifica productos compactos (<600g) como aptos para flete aéreo express (7-12d)', () => {
      const compactProduct = {
        title: 'Mini Portable Wireless Inkless Thermal Printer',
        weightGrams: 220,
      };

      const result = evaluateShippingViability(compactProduct);
      expect(result.isCompact).toBe(true);
      expect(result.airCargoFriendly).toBe(true);
      expect(result.estimatedShippingDays).toContain('7-12');
      expect(result.viabilityScore).toBeGreaterThanOrEqual(85);
    });

    it('penaliza artículos sobredimensionados o muebles que generan altos recargos volumétricos', () => {
      const bulkyProduct = {
        title: 'Heavy Duty Power Rack Weight Bench Gym Sofa Couch',
        weightGrams: 25000,
      };

      const result = evaluateShippingViability(bulkyProduct);
      expect(result.isCompact).toBe(false);
      expect(result.airCargoFriendly).toBe(false);
      expect(result.viabilityScore).toBeLessThan(60);
    });
  });

  // ----------------------------------------------------
  // 3. Proyecciones Financieras AutoDS (2.5x)
  // ----------------------------------------------------
  describe('calculateFinancials', () => {
    it('calcula landed cost, markup 2.5x y margen superior al 50%', () => {
      // Costo: $10.00, Flete: $4.00 -> Landed: $14.00
      // Venta: 14 * 2.5 = $35.00
      // Compare at: 35 * 1.20 = $42.00
      // Ganancia: 35 - 14 = $21.00 (60% margen)
      const fin = calculateFinancials(10.0, 4.0);
      expect(fin.totalLandedCost).toBe(14.0);
      expect(fin.sellingPrice).toBe(35.0);
      expect(fin.compareAtPrice).toBe(42.0);
      expect(fin.estimatedProfit).toBe(21.0);
      expect(fin.marginPct).toBe(60.0);
      expect(fin.isHealthyMargin).toBe(true);
    });
  });

  // ----------------------------------------------------
  // 4. Auditoría Integral del Producto (Opportunity Score)
  // ----------------------------------------------------
  describe('auditProductForUSMarket', () => {
    it('califica al M5Stack Desktop Robot como WINNING_OPPORTUNITY de alto score', () => {
      const robot = {
        productId: '3256812053422003',
        title: 'M5Stack Official StackChan: Kawaii Co-Created Open-Source AI Desktop Robot (ESP32-S3)',
        category: 'Tech Gadgets & AI',
        costUsd: 136.13,
        shippingCostUsd: 12.97,
        weightGrams: 320,
      };

      const audit = auditProductForUSMarket(robot);
      expect(audit.opportunityScore).toBeGreaterThanOrEqual(80);
      expect(audit.status).toBe('WINNING_OPPORTUNITY');
      expect(audit.customs.isSafe).toBe(true);
      expect(audit.logistics.isCompact).toBe(true);
      expect(audit.badges).toContain('🛡️ CBP Customs Safe');
      expect(audit.badges).toContain('📦 Air Cargo Friendly');
    });
  });

  // ----------------------------------------------------
  // 5. Catálogo Curado de Oportunidades Ganadoras
  // ----------------------------------------------------
  describe('getCuratedUSOpportunities', () => {
    it('todos los productos del catálogo seleccionado cumplen con las políticas de aduana y tamaño compacto', () => {
      const catalog = getCuratedUSOpportunities();
      expect(catalog.length).toBeGreaterThanOrEqual(5);

      for (const item of catalog) {
        expect(item.customs.isSafe).toBe(true);
        expect(item.logistics.isCompact).toBe(true);
        expect(item.financials.marginPct).toBeGreaterThanOrEqual(50);
        expect(item.opportunityScore).toBeGreaterThanOrEqual(80);
        expect(item.weightGrams).toBeLessThan(750);
      }
    });
  });

  // ----------------------------------------------------
  // 6. Netlify Serverless Controller Endpoints
  // ----------------------------------------------------
  describe('Netlify Controller Endpoints for Opportunities', () => {
    it('GET /api/shopify/opportunities devuelve el listado con filtros aplicados', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/shopify/opportunities',
        queryStringParameters: {
          minMargin: '55',
          category: 'tech',
        },
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(true);
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.data.length).toBeGreaterThanOrEqual(1);
      expect(parsed.data[0].financials.marginPct).toBeGreaterThanOrEqual(55);
    });

    it('POST /api/shopify/opportunities/audit ejecuta la auditoría aduanera y logística', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/shopify/opportunities/audit',
        body: JSON.stringify({
          title: 'Portable Rechargeable Desk Fan Ultra Quiet USB',
          costUsd: 8.50,
          shippingCostUsd: 2.50,
          weightGrams: 210,
        }),
      };

      const res = await handler(event);
      expect(res.statusCode).toBe(200);

      const parsed = JSON.parse(res.body);
      expect(parsed.ok).toBe(true);
      expect(parsed.data.customs.isSafe).toBe(true);
      expect(parsed.data.opportunityScore).toBeGreaterThanOrEqual(75);
      expect(parsed.data.financials.sellingPrice).toBe(27.5);
    });
  });
});
