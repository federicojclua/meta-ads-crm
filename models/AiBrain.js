export const DEFAULT_AI_BRAIN = {
  industryAndTone: 'Agencia de Marketing Digital y Publicidad. Personalidad: Amable, consultiva, ejecutiva y orientada a resultados.',
  knowledgeBase: `• Servicios principales: Gestión de pauta publicitaria en Meta Ads (Facebook & Instagram), Campañas de Google Ads & Search Console, Estrategia de contenidos y SEO Local.
• Presupuesto mínimo de inversión recomendado: $150.000 ARS / mes en pauta oficial.
• Metodología de trabajo: Diagnóstico inicial sin cargo, configuración de tracking con Pixel y CAPI, optimización semanal y reportes transparentes en tiempo real.
• Políticas: Atención comercial de lunes a viernes de 9 a 18 hs. Soporte prioritario para clientes activos.`,
  qualificationRules: `• Extraer nombre de la empresa o proyecto.
• Identificar objetivo principal (generación de leads, ventas ecommerce o posicionamiento local).
• Confirmar que cuente con presupuesto publicitario disponible.
• Solicitar correo electrónico o confirmación de teléfono para agendamiento.`,
  autoQualifyEnabled: true,
  autoSetterEnabled: true,
  idealCustomerProfile: {
    targetAudience: 'Dueños de negocio y directores de marketing con productos o servicios validados.',
    topPainPoints: ['Falta de previsibilidad en ventas', 'Costo por lead elevado en Meta Ads', 'Baja tasa de conversión del equipo comercial'],
    winningOffer: 'Estrategia de pauta de alta conversión con optimización continua y CRM integrado.',
  },
};

/**
 * Validates the AI Brain document.
 * @param {Object} data
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export function validateAiBrain(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio para configurar el Cerebro de IA.');
  }

  if (data.industryAndTone && typeof data.industryAndTone !== 'string') {
    errors.push('industryAndTone debe ser una cadena de texto.');
  }

  if (data.knowledgeBase && typeof data.knowledgeBase !== 'string') {
    errors.push('knowledgeBase debe ser una cadena de texto.');
  }

  if (data.qualificationRules && typeof data.qualificationRules !== 'string') {
    errors.push('qualificationRules debe ser una cadena de texto.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes the AI Brain document for API output.
 * @param {Object} doc
 * @returns {Object}
 */
export function sanitizeAiBrain(doc) {
  if (!doc) return null;

  return {
    id: doc._id?.toString() || doc.id,
    clientId: doc.clientId?.toString() || doc.clientId,
    industryAndTone: doc.industryAndTone || DEFAULT_AI_BRAIN.industryAndTone,
    knowledgeBase: doc.knowledgeBase || DEFAULT_AI_BRAIN.knowledgeBase,
    qualificationRules: doc.qualificationRules || DEFAULT_AI_BRAIN.qualificationRules,
    autoQualifyEnabled: doc.autoQualifyEnabled !== undefined ? Boolean(doc.autoQualifyEnabled) : true,
    autoSetterEnabled: doc.autoSetterEnabled !== undefined ? Boolean(doc.autoSetterEnabled) : true,
    idealCustomerProfile: doc.idealCustomerProfile || DEFAULT_AI_BRAIN.idealCustomerProfile,
    updatedAt: doc.updatedAt || doc.createdAt || new Date(),
  };
}
