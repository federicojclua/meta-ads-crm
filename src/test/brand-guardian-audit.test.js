import { describe, it, expect } from 'vitest';
import { auditCreativeAsset } from '../../netlify/functions/_shared/creativeEngine/brandGuardianService.js';

describe('Stages 16/17 Evolution — Brand Guardian Compliance Engine Tests', () => {
  const mockCreativeProfile = {
    logoUrl: 'https://example.com/logo-anima.png',
    colorPalette: {
      primary: '#0F172A',
      secondary: '#6366F1',
      accent: '#10B981',
    },
    forbiddenElements: ['comic sans', 'cripto ganancias garantizadas', 'neon estridente'],
  };

  const mockActiveOffer = {
    id: 'offer_b',
    projectedPrice: 1299999,
    headline: 'Notebook ThinkPad E14 + Kit Ejecutivo',
    paymentTerms: '12 cuotas fijas',
  };

  it('1. Asset válido que cumple con todas las directrices obtiene score >= 85 y aprueba Gatekeeper', () => {
    const validAsset = {
      svg: `<svg viewBox="0 0 1080 1080"><rect fill="#0F172A" /><image href="https://example.com/logo-anima.png" /><text fill="#6366F1">Notebook ThinkPad E14</text></svg>`,
      headline: 'Notebook ThinkPad E14 + Kit Ejecutivo',
      adPrice: '1299999',
    };

    const res = auditCreativeAsset({
      asset: validAsset,
      creativeProfile: mockCreativeProfile,
      activeOffer: mockActiveOffer,
    });

    expect(res.brandComplianceScore).toBe(100);
    expect(res.isGatekeeperPassed).toBe(true);
    expect(res.complianceStatus).toBe('APPROVED');
    expect(res.violations.length).toBe(0);
  });

  it('2. Asset sin logo oficial sufre penalización de 25 puntos y pasa a NEEDS_REVIEW', () => {
    const assetWithoutLogo = {
      svg: `<svg viewBox="0 0 1080 1080"><rect fill="#0F172A" /><text fill="#6366F1">Oferta Sin Logo</text></svg>`,
      headline: 'Notebook ThinkPad E14 + Kit Ejecutivo',
      adPrice: '1299999',
    };

    const res = auditCreativeAsset({
      asset: assetWithoutLogo,
      creativeProfile: mockCreativeProfile,
      activeOffer: mockActiveOffer,
    });

    expect(res.complianceBreakdown.logoIntegrity).toBe(0);
    expect(res.brandComplianceScore).toBe(75);
    expect(res.isGatekeeperPassed).toBe(false);
    expect(res.complianceStatus).toBe('NEEDS_REVIEW');
    expect(res.violations[0]).toContain('Logo Integrity');
  });

  it('3. Asset con discrepancia de precio (alucinación) sufre penalización de 25 puntos en Offer Accuracy', () => {
    const assetWithHallucinatedPrice = {
      svg: `<svg viewBox="0 0 1080 1080"><image href="logo" /><rect fill="#0F172A" /></svg>`,
      headline: 'Notebook ThinkPad',
      adPrice: '499999', // Discrepancy with 1299999
    };

    const res = auditCreativeAsset({
      asset: assetWithHallucinatedPrice,
      creativeProfile: mockCreativeProfile,
      activeOffer: mockActiveOffer,
    });

    expect(res.complianceBreakdown.offerAccuracy).toBe(0);
    expect(res.brandComplianceScore).toBe(75);
    expect(res.isGatekeeperPassed).toBe(false);
    expect(res.violations.some((v) => v.includes('Offer Accuracy'))).toBe(true);
  });

  it('4. Asset con elementos prohibidos es forzado a REJECTED con score de safety 0', () => {
    const assetWithForbiddenWord = {
      svg: `<svg viewBox="0 0 1080 1080"><image href="logo" /><rect fill="#0F172A" /><text>Cripto Ganancias Garantizadas</text></svg>`,
      headline: 'Oferta con Cripto Ganancias Garantizadas',
      adPrice: '1299999',
    };

    const res = auditCreativeAsset({
      asset: assetWithForbiddenWord,
      creativeProfile: mockCreativeProfile,
      activeOffer: mockActiveOffer,
    });

    expect(res.complianceBreakdown.brandSafety).toBe(0);
    expect(res.isGatekeeperPassed).toBe(false);
    expect(res.complianceStatus).toBe('REJECTED');
    expect(res.violations.some((v) => v.includes('Elemento prohibido detectado'))).toBe(true);
  });
});
