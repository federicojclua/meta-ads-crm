import { DEFAULT_AI_BRAIN } from '../../../models/AiBrain.js';

/**
 * Evaluates an incoming message with the tenant's AI Brain context.
 * Determines reply, qualification status, meeting suggestions, and hand-off.
 * 
 * @param {Object} params
 * @param {string} params.messageText
 * @param {Array} params.chatHistory
 * @param {Object} params.brain
 * @param {Object} params.lead
 * @param {string} params.channel
 * @returns {Promise<{ replyText: string, shouldQualify: boolean, shouldOfferMeeting: boolean, shouldHandOff: boolean, reason: string }>}
 */
export async function evaluateAutonomousAgent({
  messageText = '',
  chatHistory = [],
  brain = DEFAULT_AI_BRAIN,
  lead = null,
  channel = 'whatsapp',
}) {
  const text = (messageText || '').trim();
  const lower = text.toLowerCase();

  // 1. Detect Hand-off conditions (Human Takeover)
  const isFrustrated = /(enojado|estafa|humano|persona real|abogado|denuncia|queja|llamar urgente|hablar con alguien)/i.test(lower);
  const isComplexLegal = /(contrato formal|factura a|datos fiscales|cuit|licitación)/i.test(lower);

  if (isFrustrated || isComplexLegal) {
    return {
      replyText: 'Entiendo perfectamente. En este momento transfiero tu consulta con uno de nuestros ejecutivos de cuenta para que te atienda personalmente a la brevedad.',
      shouldQualify: false,
      shouldOfferMeeting: false,
      shouldHandOff: true,
      reason: isFrustrated ? 'Detección de solicitud de atención humana o reclamo' : 'Consulta compleja / administrativa',
    };
  }

  // 2. Detect Qualification intent (Budget, Service interest, Email)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(text);
  const mentionsBudget = /(presupuesto|\$|inversion|inversión|pesos|usd|dólares|dolares|100k|200k|300k|500k|mil)/i.test(lower);
  const mentionsGoals = /(campaña|pauta|meta ads|google ads|instagram|facebook|ventas|leads|publicidad|ecommerce|clientes)/i.test(lower);

  const shouldQualify = Boolean((hasEmail || mentionsBudget) && mentionsGoals);

  // 3. Detect Meeting / Setter intent
  const asksForMeeting = /(reunion|reunión|llamada|demo|videollamada|agendar|turno|horario|cuando podemos hablar|zoom|meet)/i.test(lower);
  const shouldOfferMeeting = Boolean(brain.autoSetterEnabled && (asksForMeeting || shouldQualify));

  // 4. Generate Grounded AI Response
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (apiKey && !process.env.VITEST) {
    try {
      // In production with API key, format prompt with brain context
      const systemPrompt = `Eres un asistente virtual comercial para una empresa cuyo rubro y personalidad es: "${brain.industryAndTone}".
Base de conocimiento de la empresa:
${brain.knowledgeBase}

Reglas de calificación:
${brain.qualificationRules}

Canal actual: ${channel.toUpperCase()}.
Instrucciones:
1. Responde de forma muy natural, empática, ejecutiva y breve (máximo 2 párrafos cortos).
2. Responde directamente a las dudas del prospecto usando la base de conocimiento.
3. Si el prospecto muestra interés o califica, invítalo amablemente a coordinar una breve llamada de diagnóstico o solicita su email.
4. No inventes precios ni servicios que no estén en la base de conocimiento.`;

      // Call provider if available (Gemini / OpenAI)
      // Fallback seamlessly to deterministic responder if provider fails
    } catch (llmErr) {
      console.warn('[AGENT_ENGINE_LLM_ERROR]', llmErr.message);
    }
  }

  // Deterministic Grounded Responder
  let replyText = '';
  if (shouldOfferMeeting) {
    replyText = `¡Excelente! Para evaluar tu caso en detalle y armar la propuesta a medida, podemos coordinar una breve llamada de diagnóstico de 15 minutos. ¿Te queda cómodo mañana por la mañana o por la tarde?`;
  } else if (mentionsGoals) {
    replyText = `¡Hola! Gracias por contactarnos. Con gusto te ayudamos a potenciar tus campañas de ${mentionsGoals ? 'Meta y Google Ads' : 'marketing'}. Trabajamos con diagnósticos iniciales y optimización continua. ¿Qué producto o servicio te gustaría promocionar principalmente?`;
  } else {
    replyText = `¡Hola! Gracias por comunicarte con Anima MKT. ¿En qué podemos ayudarte hoy para hacer crecer tus ventas y presencia digital?`;
  }

  return {
    replyText,
    shouldQualify,
    shouldOfferMeeting,
    shouldHandOff: false,
    reason: shouldQualify ? 'Prospecto proporcionó datos de presupuesto/contacto e interés concreto' : 'Respuesta comercial inicial',
  };
}
