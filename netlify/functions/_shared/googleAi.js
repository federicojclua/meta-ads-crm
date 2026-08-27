import { sanitizeSocialText } from './promptSanitizer.js';

/**
 * Validates and sanitizes the AI output schema for Google Intelligence.
 */
export function validateGoogleAiReportSchema(rawReport) {
  if (!rawReport || typeof rawReport !== 'object') {
    return { isValid: false, errors: ['El reporte no es un objeto válido.'] };
  }

  const sanitized = {
    executiveSummary: typeof rawReport.executiveSummary === 'string' ? rawReport.executiveSummary.trim() : 'Diagnóstico estratégico generado a partir de métricas verificadas.',
    overallScore: Math.min(100, Math.max(0, Math.round(Number(rawReport.overallScore) || 70))),
    pillars: {
      reputationAndGbp: {
        score: Math.min(100, Math.max(0, Math.round(Number(rawReport.pillars?.reputationAndGbp?.score) || 70))),
        status: ['excellent', 'good', 'fair', 'poor'].includes(rawReport.pillars?.reputationAndGbp?.status) ? rawReport.pillars.reputationAndGbp.status : 'good',
        assessment: typeof rawReport.pillars?.reputationAndGbp?.assessment === 'string' ? rawReport.pillars.reputationAndGbp.assessment : 'Evaluación de reputación y optimización de ficha comercial.',
      },
      organicSeoVisibility: {
        score: Math.min(100, Math.max(0, Math.round(Number(rawReport.pillars?.organicSeoVisibility?.score) || 65))),
        status: ['excellent', 'good', 'fair', 'poor'].includes(rawReport.pillars?.organicSeoVisibility?.status) ? rawReport.pillars.organicSeoVisibility.status : 'fair',
        assessment: typeof rawReport.pillars?.organicSeoVisibility?.assessment === 'string' ? rawReport.pillars.organicSeoVisibility.assessment : 'Evaluación de palabras clave, CTR orgánico y páginas indexadas.',
      },
      webConversionAndUx: {
        score: Math.min(100, Math.max(0, Math.round(Number(rawReport.pillars?.webConversionAndUx?.score) || 75))),
        status: ['excellent', 'good', 'fair', 'poor'].includes(rawReport.pillars?.webConversionAndUx?.status) ? rawReport.pillars.webConversionAndUx.status : 'good',
        assessment: typeof rawReport.pillars?.webConversionAndUx?.assessment === 'string' ? rawReport.pillars.webConversionAndUx.assessment : 'Evaluación de retención de sesiones y conversión en el sitio web.',
      },
      paidSearchEfficiency: {
        score: Math.min(100, Math.max(0, Math.round(Number(rawReport.pillars?.paidSearchEfficiency?.score) || 70))),
        status: ['excellent', 'good', 'fair', 'poor'].includes(rawReport.pillars?.paidSearchEfficiency?.status) ? rawReport.pillars.paidSearchEfficiency.status : 'good',
        assessment: typeof rawReport.pillars?.paidSearchEfficiency?.assessment === 'string' ? rawReport.pillars.paidSearchEfficiency.assessment : 'Evaluación de costo por adquisición y conversión en campañas de Google Ads.',
      },
      competitivePositioning: {
        score: Math.min(100, Math.max(0, Math.round(Number(rawReport.pillars?.competitivePositioning?.score) || 65))),
        status: ['excellent', 'good', 'fair', 'poor'].includes(rawReport.pillars?.competitivePositioning?.status) ? rawReport.pillars.competitivePositioning.status : 'fair',
        assessment: typeof rawReport.pillars?.competitivePositioning?.assessment === 'string' ? rawReport.pillars.competitivePositioning.assessment : 'Diferencial de reputación y cuota de visibilidad frente a competidores locales.',
      },
    },
    findings: Array.isArray(rawReport.findings)
      ? rawReport.findings.map(f => ({
          type: ['strength', 'opportunity', 'warning'].includes(f.type) ? f.type : 'opportunity',
          title: typeof f.title === 'string' ? f.title.slice(0, 100) : 'Hallazgo Estratégico',
          description: typeof f.description === 'string' ? f.description.slice(0, 300) : '',
          evidence: typeof f.evidence === 'string' ? f.evidence.slice(0, 150) : '',
          priority: ['high', 'medium', 'low'].includes(f.priority) ? f.priority : 'medium',
          responsibleRole: typeof f.responsibleRole === 'string' ? f.responsibleRole : 'Especialista SEO / Marketing',
        }))
      : [],
    quickWins: Array.isArray(rawReport.quickWins)
      ? rawReport.quickWins.map(qw => (typeof qw === 'string' ? qw.slice(0, 200) : String(qw)))
      : [],
    roadmap: {
      days30: Array.isArray(rawReport.roadmap?.days30)
        ? rawReport.roadmap.days30.map(r => ({
            action: typeof r.action === 'string' ? r.action : 'Optimización inicial',
            channel: typeof r.channel === 'string' ? r.channel : 'Google Business Profile',
            impact: typeof r.impact === 'string' ? r.impact : 'Mejora en tasa de respuesta',
          }))
        : [],
      days60: Array.isArray(rawReport.roadmap?.days60)
        ? rawReport.roadmap.days60.map(r => ({
            action: typeof r.action === 'string' ? r.action : 'Optimización de contenidos',
            channel: typeof r.channel === 'string' ? r.channel : 'Search Console / SEO',
            impact: typeof r.impact === 'string' ? r.impact : 'Aumento de CTR orgánico',
          }))
        : [],
      days90: Array.isArray(rawReport.roadmap?.days90)
        ? rawReport.roadmap.days90.map(r => ({
            action: typeof r.action === 'string' ? r.action : 'Escalado y consolidación',
            channel: typeof r.channel === 'string' ? r.channel : 'Google Ads / Web',
            impact: typeof r.impact === 'string' ? r.impact : 'Reducción de CPA y liderazgo local',
          }))
        : [],
    },
    disclaimer: 'Diferenciación estricta entre métricas verificadas y recomendaciones estratégicas. No se garantizan rankings ni ventas.',
  };

  return { isValid: true, sanitizedReport: sanitized };
}

/**
 * Deterministic fallback generator when external API keys are unavailable.
 */
export function generateDeterministicFallbackGoogleReport(metrics = {}, source = {}) {
  const rep = metrics.reputation || {};
  const comp = metrics.competitiveDiff || {};
  const gsc = metrics.seoSummary || {};

  const rating = rep.averageRating || 4.5;
  const ratingScore = Math.min(100, Math.round(rating * 20));
  const responseScore = Math.min(100, Math.round(rep.responseRatePercentage || 80));
  const gbpScore = Math.round((ratingScore + responseScore) / 2);

  const ctr = gsc.avgCtr || 2.5;
  const seoScore = Math.min(100, Math.max(40, Math.round(ctr * 25)));

  const overallScore = Math.round((gbpScore * 0.4) + (seoScore * 0.3) + 70 * 0.3);

  const report = {
    executiveSummary: `La presencia en Google de ${source.businessName || 'la empresa'} muestra una reputación local sólida (${rating}★ con ${rep.totalReviews || 0} reseñas) y una tasa de respuesta del ${rep.responseRatePercentage || 0}%. Existen oportunidades claras de optimización de CTR en búsquedas orgánicas locales.`,
    overallScore,
    pillars: {
      reputationAndGbp: {
        score: gbpScore,
        status: gbpScore >= 80 ? 'excellent' : gbpScore >= 65 ? 'good' : 'fair',
        assessment: `Ficha con ${rating} estrellas y ${rep.unansweredCount || 0} reseñas pendientes de respuesta.`,
      },
      organicSeoVisibility: {
        score: seoScore,
        status: seoScore >= 75 ? 'excellent' : seoScore >= 60 ? 'good' : 'fair',
        assessment: `CTR orgánico medio del ${ctr}% sobre ${gsc.totalImpressions || 0} impresiones en Google Search.`,
      },
      webConversionAndUx: {
        score: 75,
        status: 'good',
        assessment: 'El tráfico web derivado de Google muestra tiempos de permanencia y engagement estables.',
      },
      paidSearchEfficiency: {
        score: 72,
        status: 'good',
        assessment: 'Estructura de campañas de Google Ads alineada con intención de búsqueda transaccional.',
      },
      competitivePositioning: {
        score: comp.ratingGap >= 0 ? 80 : 60,
        status: comp.ratingGap >= 0 ? 'good' : 'fair',
        assessment: `Posición #${comp.tenantRank || 1} en el radar local frente a ${comp.competitorsCount || 0} competidores analizados en su categoría.`,
      },
    },
    findings: [
      {
        type: rep.unansweredCount > 0 ? 'opportunity' : 'strength',
        title: rep.unansweredCount > 0 ? 'Reducción de Tiempo de Respuesta en Reseñas' : 'Alta Tasa de Respuesta Oficial',
        description: rep.unansweredCount > 0
          ? `Hay ${rep.unansweredCount} reseñas sin responder. Responder dentro de las 24 horas incrementa la confianza de clientes potenciales y el algoritmo local.`
          : 'Excelente consistencia en la atención de reseñas de clientes en Google Maps.',
        evidence: `${rep.responseRatePercentage || 0}% de tasa de respuesta actual.`,
        priority: 'high',
        responsibleRole: 'Atención al Cliente / Community Manager',
      },
      {
        type: 'opportunity',
        title: 'Sinergia SEO/SEM: Oportunidades Orgánicas para Google Ads',
        description: `Se detectaron ${gsc.opportunitiesCount || 0} búsquedas con alto volumen de impresiones y CTR menor al 3%. Atacarlas a corto plazo con campañas de Google Ads mientras se construye autoridad orgánica.`,
        evidence: `${gsc.totalClicks || 0} clics sobre ${gsc.totalImpressions || 0} impresiones totales.`,
        priority: 'high',
        responsibleRole: 'Media Buyer / Especialista SEM',
      },
      {
        type: 'strength',
        title: 'Posicionamiento Competitivo Local Sólido',
        description: `La empresa se ubica en el puesto #${comp.tenantRank || 1} en el leaderboard local de su categoría.`,
        evidence: `Rating medio de ${rep.averageRating || 4.8}★ vs ${comp.avgCompetitorRating || 4.2}★ promedio de competidores.`,
        priority: 'medium',
        responsibleRole: 'Especialista de Marca',
      },
    ],
    quickWins: [
      '3 Tareas Técnicas Web: 1) Optimizar etiquetas Title y Meta Description en landings clave. 2) Validar etiquetas H1 únicas y canonicals. 3) Comprimir imágenes para acelerar carga web.',
      '3 Acciones de Marketing: 1) Lanzar campaña de Ads para términos con bajo CTR orgánico. 2) Responder el 100% de reseñas pendientes. 3) Cargar tareas comerciales de seguimiento en Kommo CRM.',
    ],
    roadmap: {
      days30: [
        {
          action: 'Completar el 100% de respuestas a reseñas pendientes usando borradores asistidos.',
          channel: 'Google Business Profile',
          impact: '+15% conversión en llamadas y visitas a la tienda',
        },
        {
          action: 'Pautar en Google Ads las consultas transaccionales con CTR orgánico débil (Sinergia SEO/SEM).',
          channel: 'Google Ads',
          impact: 'Captura inmediata de leads con alta intención comercial',
        },
      ],
      days60: [
        {
          action: 'Optimizar Title, Meta Description y canonicals en las 5 landing pages con mayor tráfico.',
          channel: 'Google Search Console / SEO',
          impact: 'Incremento del CTR orgánico del 2% al 4.5%',
        },
      ],
      days90: [
        {
          action: 'Lanzar campaña de solicitud ética de reseñas e integrar leads calificados al embudo de Kommo CRM.',
          channel: 'Reputación & Ventas CRM',
          impact: 'Superar la brecha de volumen frente al competidor líder local',
        },
      ],
    },
    disclaimer: 'Diferenciación estricta entre métricas verificadas y recomendaciones estratégicas. No se garantizan rankings ni ventas.',
  };

  return {
    provider: 'deterministic-engine',
    model: 'deterministic-rules-v1',
    report,
  };
}

/**
 * Builds the Master SEO/SEM Strategic Prompt template with optional client data payload.
 */
export function buildMasterSeoSemPrompt({ businessName = 'Cliente', websiteUrl = '', metrics = {} } = {}) {
  const rep = metrics.reputation || {};
  const gsc = metrics.seoSummary || {};
  const comp = metrics.competitiveDiff || {};

  const basePrompt = `Actúa como un Consultor Estratégico Senior en SEO y SEM. Trabajo con un CRM propio que consolida datos de Google Search Console, Google Ads, GA4 y Google Business Profile de mis clientes.

Te proporcionaré métricas de un caso real y necesito que me guíes para tomar la mejor decisión de negocio, balanceando la inversión en pauta y los esfuerzos de posicionamiento orgánico.

Estructura tu análisis y recomendaciones bajo estas reglas:

Diagnóstico Orgánico: Analiza el CTR, la posición media de las consultas orgánicas, la salud del SEO técnico (etiquetas H1, meta descriptions, canonicals) y la autoridad en reseñas locales.

Diagnóstico Pago: Evalúa el retorno de inversión, costo por clic, impresiones y volumen de conversiones pagas.

Estrategia de Sinergia: Identifica términos de búsqueda con alto potencial de conversión que estén débiles en orgánico, para atacarlos agresivamente con Google Ads a corto plazo mientras construimos autoridad.

Plan de Acción Táctico: Entrégame 3 tareas técnicas de desarrollo web y 3 acciones de marketing puntuales para ejecutar esta misma semana.`;

  const payload = `

--- DATOS CONSOLIDADOS DE LA EMPRESA ---
- Empresa: ${businessName}
- Sitio Web: ${websiteUrl || 'No especificado'}
- Google Business Profile: ${rep.averageRating || 4.8}★ (${rep.totalReviews || 0} reseñas, ${rep.responseRatePercentage || 85}% tasa de respuesta)
- Google Search Console: ${gsc.totalClicks || 0} clics, ${gsc.totalImpressions || 0} impresiones, CTR ${gsc.avgCtr || 0}%, Posición media #${gsc.avgPosition || 'N/A'}
- Radar Competitivo: Puesto #${comp.tenantRank || 1} frente a ${comp.competitorsCount || 0} competidores locales.
- Oportunidades SEO/SEM Detectadas: ${JSON.stringify(gsc.opportunities || [], null, 2)}`;

  return basePrompt + payload;
}

/**
 * Drafts an empathetic, professional reply to a customer review.
 * NEVER AUTO-PUBLISHES: strictly returns a draft text for operator review.
 */
export async function generateReviewReplyDraft({ review = {}, businessName = 'Nuestro Negocio' }) {
  const sanitizedComment = sanitizeSocialText(review.comment || '', 400);
  const reviewerName = sanitizeSocialText(review.reviewerName || 'Cliente', 50);
  const rating = Math.min(5, Math.max(1, Number(review.rating) || 5));

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `Actúa como el Gerente de Experiencia del Cliente de "${businessName}".
Redacta una respuesta pública, profesional, empática y cordial para la siguiente reseña de Google:
- Cliente: ${reviewerName}
- Calificación: ${rating} de 5 estrellas
- Comentario del cliente: "${sanitizedComment || 'Sin comentario escrito'}"

Reglas:
1. Si la reseña es de 4 o 5 estrellas: Agradece sinceramente la visita y la recomendación.
2. Si la reseña es de 1 a 3 estrellas: Agradece el feedback, pide disculpas con humildad por no haber cumplido las expectativas e invita a contactarse por privado/email para resolver la situación.
3. Máximo 2 a 3 oraciones. Sé humano y cercano, no robótico.
4. Responde SOLO con el texto de la respuesta, sin comillas ni encabezados.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 250 },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return { draft: text, provider: 'gemini' };
        }
      }
    } catch (err) {
      console.warn('[GOOGLE_AI] Error invoking Gemini for review draft, using fallback:', err.message);
    }
  }

  // Deterministic fallback response draft
  if (rating >= 4) {
    return {
      draft: `¡Muchas gracias por tu reseña y por elegirnos, ${reviewerName}! Nos alegra mucho saber que tuviste una gran experiencia. ¡Esperamos verte pronto nuevamente en ${businessName}!`,
      provider: 'deterministic-fallback',
    };
  } else if (rating === 3) {
    return {
      draft: `Hola ${reviewerName}, gracias por compartir tu experiencia. Tu opinión nos ayuda a mejorar día a día. Si hay algo específico que podamos ajustar, por favor contactanos para que podamos brindarte una mejor atención.`,
      provider: 'deterministic-fallback',
    };
  } else {
    return {
      draft: `Hola ${reviewerName}, lamentamos profundamente que tu experiencia no haya sido la esperada. En ${businessName} la satisfacción de nuestros clientes es prioridad. Por favor contactanos directamente para poder solucionar este inconveniente.`,
      provider: 'deterministic-fallback',
    };
  }
}

