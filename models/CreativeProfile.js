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
  videoDna: {
    cameraStyle: 'cinematic_dolly',
    lightingStyle: 'studio_soft',
    editingPacing: 'dynamic_fast',
    motionStyle: 'slow_push_in',
    musicStyle: 'electronic_modern',
  },
  voiceProfiles: [
    {
      id: 'voice_martina_01',
      name: 'Martina (Comercial / Cercana)',
      provider: 'elevenlabs',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      language: 'es-AR',
      gender: 'female',
      tone: 'confident_friendly',
      speed: 1.0,
      pitch: 1.0,
      isDefault: true,
    },
    {
      id: 'voice_lucas_02',
      name: 'Lucas (Institucional / Enérgico)',
      provider: 'google_tts',
      voiceId: 'es-AR-Standard-C',
      language: 'es-AR',
      gender: 'male',
      tone: 'authoritative_energetic',
      speed: 1.05,
      pitch: 0.95,
      isDefault: false,
    },
  ],
  avatarProfiles: [
    {
      id: 'avatar_martina',
      name: 'Martina (Asesora Comercial)',
      role: 'Sales Presenter & Lead Closer',
      gender: 'female',
      style: 'modern_friendly',
      appearanceRules: 'Mujer profesional 28-35 años, cabello castaño recogido, saco azul marino de marca.',
      clothing: 'business_casual_navy',
      background: 'brand_tech_studio',
      voiceId: 'voice_martina_01',
      referenceImages: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      ],
      isDefault: true,
    },
    {
      id: 'avatar_lucas',
      name: 'Lucas (Especialista Técnico)',
      role: 'Product Demo Host',
      gender: 'male',
      style: 'tech_expert',
      appearanceRules: 'Hombre joven 25-32 años, camisa oxford gris, anteojos de diseño moderno.',
      clothing: 'smart_casual_gray',
      background: 'modern_workspace',
      voiceId: 'voice_lucas_02',
      referenceImages: [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
      ],
      isDefault: false,
    },
  ],
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
    videoDna: {
      cameraStyle: doc.videoDna?.cameraStyle || DEFAULT_CREATIVE_PROFILE.videoDna.cameraStyle,
      lightingStyle: doc.videoDna?.lightingStyle || DEFAULT_CREATIVE_PROFILE.videoDna.lightingStyle,
      editingPacing: doc.videoDna?.editingPacing || DEFAULT_CREATIVE_PROFILE.videoDna.editingPacing,
      motionStyle: doc.videoDna?.motionStyle || DEFAULT_CREATIVE_PROFILE.videoDna.motionStyle,
      musicStyle: doc.videoDna?.musicStyle || DEFAULT_CREATIVE_PROFILE.videoDna.musicStyle,
    },
    voiceProfiles: Array.isArray(doc.voiceProfiles) && doc.voiceProfiles.length > 0
      ? doc.voiceProfiles
      : DEFAULT_CREATIVE_PROFILE.voiceProfiles,
    avatarProfiles: Array.isArray(doc.avatarProfiles) && doc.avatarProfiles.length > 0
      ? doc.avatarProfiles
      : DEFAULT_CREATIVE_PROFILE.avatarProfiles,
    forbiddenElements: Array.isArray(doc.forbiddenElements) && doc.forbiddenElements.length > 0
      ? doc.forbiddenElements
      : DEFAULT_CREATIVE_PROFILE.forbiddenElements,
    brandAssets: Array.isArray(doc.brandAssets) ? doc.brandAssets : DEFAULT_CREATIVE_PROFILE.brandAssets,
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
