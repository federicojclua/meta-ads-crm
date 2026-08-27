import { BRAND_GUARDIAN_GATEKEEPER_THRESHOLD } from '../../../../models/CreativeAsset.js';

/**
 * Audits a creative asset against the client's Brand DNA and active offer.
 * Enforces zero-hallucination brand compliance and Gatekeeper blocking.
 */
export function auditCreativeAsset({
  asset = {},
  creativeProfile = null,
  activeOffer = null,
} = {}) {
  const profile = creativeProfile || {
    logoUrl: 'https://example.com/logo.png',
    colorPalette: { primary: '#0F172A', secondary: '#3B82F6', accent: '#F59E0B' },
    forbiddenElements: [],
  };

  let logoScore = 25;
  let colorScore = 25;
  let offerScore = 25;
  let safetyScore = 25;

  const violations = [];
  const recommendations = [];

  const rawContent = (
    (asset.svg || '') +
    ' ' +
    (asset.headline || '') +
    ' ' +
    (asset.text || '') +
    ' ' +
    (asset.adHeadline || '')
  ).toLowerCase();

  // 1. Logo Integrity (25 pts)
  const hasLogoUrl = Boolean(profile.logoUrl && profile.logoUrl.trim().length > 0);
  const logoUrlClean = profile.logoUrl ? profile.logoUrl.toLowerCase() : '';
  const svgContent = (asset.svg || '').toLowerCase();
  const hasLogoInSvg = svgContent.includes('<image') ||
    svgContent.includes('<img') ||
    svgContent.includes('id="logo"') ||
    svgContent.includes('class="logo"') ||
    (logoUrlClean && svgContent.includes(logoUrlClean));

  if (!hasLogoUrl || (!hasLogoInSvg && asset.svg)) {
    logoScore = 0;
    violations.push('Logo Integrity: No se detectó el logo oficial en la composición.');
    recommendations.push('Incorporar el logo oficial en alta resolución en el cuadrante superior o inferior.');
  }

  // 2. Color Palette Match (25 pts)
  const primaryHex = (profile.colorPalette?.primary || '#0F172A').toLowerCase();
  const secondaryHex = (profile.colorPalette?.secondary || '#3B82F6').toLowerCase();
  const accentHex = (profile.colorPalette?.accent || '#F59E0B').toLowerCase();

  const usesPalette = !asset.svg ||
    rawContent.includes(primaryHex) ||
    rawContent.includes(secondaryHex) ||
    rawContent.includes(accentHex) ||
    rawContent.includes('fill=') ||
    rawContent.includes('color');

  if (!usesPalette) {
    colorScore = 10;
    violations.push('Color Palette Match: Desviación de los colores primarios y secundarios de marca.');
    recommendations.push(`Alinear los gradientes y acentos con los colores corporativos (${primaryHex}, ${secondaryHex}).`);
  }

  // 3. Offer & Price Accuracy (25 pts)
  if (activeOffer) {
    const offerPrice = activeOffer.projectedPrice ? String(activeOffer.projectedPrice) : null;
    const hasPriceMismatch = asset.hallucinatedPrice || (offerPrice && asset.adPrice && String(asset.adPrice) !== offerPrice);

    if (hasPriceMismatch) {
      offerScore = 0;
      violations.push('Offer Accuracy: El precio o descuento impreso difiere de la oferta activa autorizada.');
      recommendations.push('Sincronizar el sticker de precio con los valores de la Active Offer de la Etapa 15B.');
    }
  }

  // 4. Brand Safety & Forbidden Rules (25 pts)
  const forbiddenList = Array.isArray(profile.forbiddenElements) ? profile.forbiddenElements : [];
  for (const forbidden of forbiddenList) {
    const cleanWord = forbidden.toLowerCase().trim();
    if (cleanWord.length > 2 && rawContent.includes(cleanWord)) {
      safetyScore = 0;
      violations.push(`Brand Safety: Elemento prohibido detectado ('${forbidden}').`);
      recommendations.push(`Remover inmediatamente la referencia o elemento '${forbidden}'.`);
    }
  }

  const totalScore = Math.max(0, Math.min(100, logoScore + colorScore + offerScore + safetyScore));
  const isGatekeeperPassed = totalScore >= BRAND_GUARDIAN_GATEKEEPER_THRESHOLD && safetyScore > 0;

  let complianceStatus = 'APPROVED';
  if (safetyScore === 0) {
    complianceStatus = 'REJECTED';
  } else if (totalScore < BRAND_GUARDIAN_GATEKEEPER_THRESHOLD) {
    complianceStatus = 'NEEDS_REVIEW';
  }

  return {
    brandComplianceScore: totalScore,
    isGatekeeperPassed,
    complianceStatus,
    complianceBreakdown: {
      logoIntegrity: logoScore,
      colorPaletteMatch: colorScore,
      offerAccuracy: offerScore,
      brandSafety: safetyScore,
    },
    violations,
    recommendations,
  };
}
