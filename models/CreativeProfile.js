
export const SUPPORTED_INDUSTRIES = [
  'restaurant',
  'electronics',
  'real_estate',
  'fashion',
  'fitness',
  'professional_services',
  'health_beauty',
  'automotive',
  'retail',
  'ecommerce',
];

export const INDUSTRY_LABELS = {
  restaurant: 'Gastronomía / Restaurantes',
  electronics: 'Computación & Electrónica',
  real_estate: 'Inmobiliaria & Propiedades',
  fashion: 'Indumentaria & Moda',
  fitness: 'Gimnasio & Fitness',
  professional_services: 'Servicios Profesionales / B2B',
  health_beauty: 'Salud & Estética',
  automotive: 'Automotor / Concesionarias',
  retail: 'Comercio Minorista / Retail',
  ecommerce: 'Tienda Online / E-Commerce',
};

export const DEFAULT_CREATIVE_PROFILE = {
  brandIdentity: {
    commercialName: 'Anima Demo Client',
    logoPrimary: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    logoSecondary: '',
    logoIsotype: '',
    logoWhite: '',
    logoDark: '',
  },
  colorPalette: {
    primary: '#1E293B',
    secondary: '#0F766E',
    accent: '#F59E0B',
    background: '#F8FAFC',
    textDark: '#0F172A',
    textLight: '#FFFFFF',
  },
  typography: {
    headingFont: 'Montserrat',
    bodyFont: 'Inter',
    priceFontWeight: '900',
  },
  brandDna: {
    industry: 'electronics',
    toneOfVoice: 'professional_friendly',
    visualStyle: 'clean_high_contrast',
    photographyStyle: 'commercial_isolated',
    preferredComposition: 'product_hero',
    brandPersonality: ['moderna', 'tecnológica', 'confiable', 'ágil'],
  },
  forbiddenElements: [
    'No alterar las dimensiones o colores del logo',
    'No utilizar tipografías infantiles o decorativas excesivas',
    'No deformar las fotografías de productos ni inventar puertos/especificaciones',
    'No utilizar colores fuera de la paleta oficial',
  ],
  brandAssets: [
    {
      id: 'asset_logo_01',
      name: 'Logo Oficial Vectorial',
      type: 'logo',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      tags: ['principal', 'vector'],
    },
  ],
};

/**
 * Validates a CreativeProfile payload.
 */
export function validateCreativeProfile(data = {}) {
  const errors = [];
  if (!data.clientId) {
    errors.push('clientId es obligatorio para el Creative Profile.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes and fills defaults for a CreativeProfile document.
 */
export function sanitizeCreativeProfile(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    brandIdentity: {
      commercialName: doc.brandIdentity?.commercialName || DEFAULT_CREATIVE_PROFILE.brandIdentity.commercialName,
      logoPrimary: doc.brandIdentity?.logoPrimary || DEFAULT_CREATIVE_PROFILE.brandIdentity.logoPrimary,
      logoSecondary: doc.brandIdentity?.logoSecondary || '',
      logoIsotype: doc.brandIdentity?.logoIsotype || '',
      logoWhite: doc.brandIdentity?.logoWhite || '',
      logoDark: doc.brandIdentity?.logoDark || '',
    },
    colorPalette: {
      primary: doc.colorPalette?.primary || DEFAULT_CREATIVE_PROFILE.colorPalette.primary,
      secondary: doc.colorPalette?.secondary || DEFAULT_CREATIVE_PROFILE.colorPalette.secondary,
      accent: doc.colorPalette?.accent || DEFAULT_CREATIVE_PROFILE.colorPalette.accent,
      background: doc.colorPalette?.background || DEFAULT_CREATIVE_PROFILE.colorPalette.background,
      textDark: doc.colorPalette?.textDark || DEFAULT_CREATIVE_PROFILE.colorPalette.textDark,
      textLight: doc.colorPalette?.textLight || DEFAULT_CREATIVE_PROFILE.colorPalette.textLight,
    },
    typography: {
      headingFont: doc.typography?.headingFont || DEFAULT_CREATIVE_PROFILE.typography.headingFont,
      bodyFont: doc.typography?.bodyFont || DEFAULT_CREATIVE_PROFILE.typography.bodyFont,
      priceFontWeight: doc.typography?.priceFontWeight || '900',
    },
    brandDna: {
      industry: SUPPORTED_INDUSTRIES.includes(doc.brandDna?.industry)
        ? doc.brandDna.industry
        : DEFAULT_CREATIVE_PROFILE.brandDna.industry,
      toneOfVoice: doc.brandDna?.toneOfVoice || DEFAULT_CREATIVE_PROFILE.brandDna.toneOfVoice,
      visualStyle: doc.brandDna?.visualStyle || DEFAULT_CREATIVE_PROFILE.brandDna.visualStyle,
      photographyStyle: doc.brandDna?.photographyStyle || DEFAULT_CREATIVE_PROFILE.brandDna.photographyStyle,
      preferredComposition: doc.brandDna?.preferredComposition || DEFAULT_CREATIVE_PROFILE.brandDna.preferredComposition,
      brandPersonality: Array.isArray(doc.brandDna?.brandPersonality)
        ? doc.brandDna.brandPersonality
        : DEFAULT_CREATIVE_PROFILE.brandDna.brandPersonality,
    },
    forbiddenElements: Array.isArray(doc.forbiddenElements) && doc.forbiddenElements.length > 0
      ? doc.forbiddenElements
      : DEFAULT_CREATIVE_PROFILE.forbiddenElements,
    brandAssets: Array.isArray(doc.brandAssets) ? doc.brandAssets : DEFAULT_CREATIVE_PROFILE.brandAssets,
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
