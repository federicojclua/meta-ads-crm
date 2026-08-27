export const VIDEO_STATUSES = ['draft', 'generating', 'needs_review', 'approved', 'published'];

export const FUNNEL_ROLES = ['hook', 'problem', 'proof', 'solution', 'offer', 'cta'];

export const BLOCK_TYPES = ['ai_avatar', 'organic_video', 'product_demo', 'broll', 'cta_overlay'];

export const BLOCK_TYPE_LABELS = {
  ai_avatar: 'Avatar IA (Presentador)',
  organic_video: 'Video Real / Grabado con Celular (B-Roll)',
  product_demo: 'Demostración de Producto Real',
  broll: 'B-Roll & Escena Atmosférica',
  cta_overlay: 'Llamado a la Acción & Contacto',
};

/**
 * Validates a VideoProject document.
 */
export function validateVideoProject(data = {}) {
  const errors = [];
  if (!data.clientId) {
    errors.push('clientId es obligatorio.');
  }
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('El título del proyecto de video es obligatorio.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a VideoProject document for output.
 */
export function sanitizeVideoProject(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    campaignId: doc.campaignId?.toString() || null,
    title: doc.title || 'Video Ad Lead Gen',
    objective: doc.objective || 'leads',
    aspectRatio: doc.aspectRatio || '9:16',
    status: VIDEO_STATUSES.includes(doc.status) ? doc.status : 'draft',
    version: Number(doc.version) || 1,
    scenes: Array.isArray(doc.scenes) ? doc.scenes : [],
    storyboardSummary: {
      totalDurationSec: Number(doc.storyboardSummary?.totalDurationSec) || 28,
      hookAngle: doc.storyboardSummary?.hookAngle || 'Problema & Pérdida de Rendimiento',
      leadMagnetOffer: doc.storyboardSummary?.leadMagnetOffer || 'Financiación Exclusiva 12 Cuotas',
      cplOptimizationTarget: doc.storyboardSummary?.cplOptimizationTarget || '-32% CPL proyectado',
    },
    costEstimate: {
      creditsEstimated: Number(doc.costEstimate?.creditsEstimated) || 45,
      modelTier: doc.costEstimate?.modelTier || 'veo-3.1-lite',
      estimatedCostUsd: Number(doc.costEstimate?.estimatedCostUsd) || 0.85,
    },
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}

export const SAMPLE_INITIAL_SCENES = [
  {
    sceneId: 'scene_01',
    sequence: 1,
    blockType: 'ai_avatar',
    funnelRole: 'hook',
    durationSec: 5,
    script: {
      speechText: '¿Sentís que tu computadora ya no rinde y te hace perder horas de trabajo?',
      visualPrompt: 'Martina in modern tech studio, close up shot, confident engaging look, speaking to camera.',
      onScreenText: '¿TU NOTEBOOK SE QUEDA TRABADA? ⏱️',
      ctaText: '',
    },
    avatarId: 'avatar_martina',
    voiceId: 'voice_martina_01',
    organicMediaUrl: '',
    continuityPack: {
      characterId: 'avatar_martina',
      lighting: 'studio_soft',
      lastFrameUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    },
    outputVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-working-on-a-laptop-43339-large.mp4',
    status: 'completed',
  },
  {
    sceneId: 'scene_02',
    sequence: 2,
    blockType: 'organic_video',
    funnelRole: 'problem',
    durationSec: 6,
    script: {
      speechText: 'Esto pasa todos los días cuando los programas se tildan y perdés tus archivos.',
      visualPrompt: 'Real office B-roll recorded with mobile camera showing slow loading screen.',
      onScreenText: 'Horas perdidas esperando que cargue...',
      ctaText: '',
    },
    avatarId: '',
    voiceId: 'voice_martina_01',
    organicMediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-working-on-a-laptop-43339-large.mp4',
    continuityPack: {
      lastFrameUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    },
    outputVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-working-on-a-laptop-43339-large.mp4',
    status: 'completed',
  },
  {
    sceneId: 'scene_03',
    sequence: 3,
    blockType: 'product_demo',
    funnelRole: 'solution',
    durationSec: 7,
    script: {
      speechText: 'La nueva Lenovo ThinkPad Core i7 procesa todo en segundos con 16GB de RAM y SSD ultrarrápido.',
      visualPrompt: 'Hero product showcase with smooth camera push in on sleek keyboard and screen.',
      onScreenText: 'LENOVO THINKPAD CORE i7 🚀',
      ctaText: '',
    },
    avatarId: '',
    voiceId: 'voice_martina_01',
    organicMediaUrl: '',
    continuityPack: {
      lastFrameUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    },
    outputVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-working-on-a-laptop-43339-large.mp4',
    status: 'completed',
  },
  {
    sceneId: 'scene_04',
    sequence: 4,
    blockType: 'cta_overlay',
    funnelRole: 'cta',
    durationSec: 6,
    script: {
      speechText: 'Tocá el botón abajo para solicitar presupuesto en 12 cuotas fijas por WhatsApp.',
      visualPrompt: 'Brand animated card with WhatsApp button and official warranty seal.',
      onScreenText: '12 CUOTAS FIJAS | ENVÍO GRATIS 🚚',
      ctaText: 'CONSULTAR POR WHATSAPP',
    },
    avatarId: 'avatar_martina',
    voiceId: 'voice_martina_01',
    organicMediaUrl: '',
    continuityPack: {
      lastFrameUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    },
    outputVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-working-on-a-laptop-43339-large.mp4',
    status: 'completed',
  },
];
