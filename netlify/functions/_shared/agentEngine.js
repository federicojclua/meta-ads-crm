/**
 * Autonomous Agent Engine — WhatsApp Bot Brain
 *
 * Evaluates incoming messages using the tenant's AI Brain configuration,
 * retrieves relevant knowledge base context (RAG), builds a system prompt
 * with the commercial plan and behavioral rules, and calls Gemini 2.0 Flash
 * to generate a grounded response with structured tool calls.
 *
 * Tools available to the LLM:
 *   - registrar_lead: Register a prospect with real commercial interest.
 *   - escalar_a_humano: Hand off the conversation to a human agent.
 *   - prometer_contacto: Mark that the bot promised the client someone will contact them.
 *
 * Fallback: If the LLM call fails, returns a deterministic greeting + handoff suggestion.
 */

import { DEFAULT_AI_BRAIN } from '../../../models/AiBrain.js';
import { buildRAGContext, formatCommercialPlan } from './knowledgeBase.js';

// --- Tool definitions for Gemini function calling ---
const AGENT_TOOLS = [
  {
    name: 'registrar_lead',
    description:
      'Registra un prospecto con interés comercial real. Llamar cuando el prospecto muestra interés ' +
      'implícito o explícito: pregunta precios/condiciones Y cuenta sobre su negocio. ' +
      'NO esperar a que diga "quiero comprar".',
    parameters: {
      type: 'object',
      properties: {
        nombre: { type: 'string', description: 'Nombre del contacto o del comercio.' },
        rubro: { type: 'string', description: 'Rubro del comercio (ej: panadería, kiosco, gastronomía).' },
        ubicacion: { type: 'string', description: 'Ciudad o zona del comercio.' },
        interes: { type: 'string', description: 'Qué le interesa al prospecto (ej: terminal Clover, POSBerry, QR).' },
        tamano: {
          type: 'string',
          enum: ['chico', 'mediano', 'grande'],
          description: 'Tamaño estimado: chico (1 local, hasta 2 terminales), mediano (2-4 locales), grande (5+ locales).',
        },
        condicion_fiscal: {
          type: 'string',
          enum: ['monotributista', 'responsable_inscripto', 'desconocido'],
          description: 'Condición fiscal del comercio si se identificó.',
        },
        es_cliente_fiserv: {
          type: 'string',
          enum: ['si', 'no', 'ex_cliente', 'desconocido'],
          description: 'Si ya es o fue cliente de Fiserv/PosNet/Clover.',
        },
        notas: { type: 'string', description: 'Resumen breve de la conversación y lo que el prospecto necesita.' },
      },
      required: ['nombre', 'interes'],
    },
  },
  {
    name: 'escalar_a_humano',
    description:
      'Deriva la conversación a un vendedor o asesor humano. Usar cuando: ' +
      '(1) el cliente pide explícitamente hablar con una persona, ' +
      '(2) la consulta requiere datos que no están en la base de conocimiento, ' +
      '(3) hay un reclamo o frustración, ' +
      '(4) se necesita negociación comercial específica.',
    parameters: {
      type: 'object',
      properties: {
        motivo: { type: 'string', description: 'Motivo concreto de la derivación.' },
        resumen: { type: 'string', description: 'Resumen de lo que el cliente necesita, para que el humano tenga contexto.' },
      },
      required: ['motivo', 'resumen'],
    },
  },
  {
    name: 'prometer_contacto',
    description:
      'OBLIGATORIO llamar esta herramienta cada vez que le digas al cliente que alguien lo va a contactar, ' +
      'llamar, o que le van a pasar sus datos a un asesor. Esto dispara el aviso al equipo y la red de seguridad.',
    parameters: {
      type: 'object',
      properties: {
        promesa: { type: 'string', description: 'Qué se le prometió exactamente al cliente.' },
      },
      required: ['promesa'],
    },
  },
];

/**
 * Formats products catalog for the system prompt.
 */
function formatProductsCatalog(products = []) {
  if (!Array.isArray(products) || products.length === 0) return '';
  return `\n═══════════════════════════════════════════\n` +
    `CATÁLOGO DE PRODUCTOS / SERVICIOS DISPONIBLES:\n` +
    products
      .map(
        (p, i) =>
          `${i + 1}. [${p.name}] (${p.category || 'General'})\n` +
          `   - Precio y Cuotas: ${p.price || 'A consultar'}\n` +
          `   - Características destacadas: ${p.highlights || p.description || ''}\n` +
          `   - Perfil ideal: ${p.bestFor || 'Todo público'}`
      )
      .join('\n\n') +
    '\n';
}

/**
 * Formats objection playbook for the system prompt.
 */
function formatObjectionPlaybook(playbook = []) {
  if (!Array.isArray(playbook) || playbook.length === 0) return '';
  return `\n═══════════════════════════════════════════\n` +
    `PLAYBOOK DE MANEJO DE OBJECIONES (Astucia Comercial):\n` +
    playbook
      .map(
        (obj, i) =>
          `${i + 1}. Objeción: "${obj.objection}"\n` +
          `   - Estrategia: ${obj.strategy}\n` +
          `   - Respuesta recomendada: ${obj.recommendedResponse}`
      )
      .join('\n\n') +
    '\n';
}

/**
 * Builds the full system prompt for the assistant.
 */
function buildSystemPrompt(brain, ragContext) {
  const plan = formatCommercialPlan(brain.commercialPlan || DEFAULT_AI_BRAIN?.commercialPlan || []);
  const rules = (brain.rules || DEFAULT_AI_BRAIN?.rules || []).map((r, i) => `${i + 1}. ${r}`).join('\n');
  const businessName = brain.businessName || DEFAULT_AI_BRAIN?.businessName || 'Asistente Comercial';
  const businessDesc = brain.businessDescription || DEFAULT_AI_BRAIN?.businessDescription || '';
  const tone = brain.industryAndTone || DEFAULT_AI_BRAIN?.industryAndTone || 'Cercano y profesional';
  const zone = brain.coverageZone || DEFAULT_AI_BRAIN?.coverageZone || 'Nacional';
  const qualRules = brain.qualificationRules || DEFAULT_AI_BRAIN?.qualificationRules || '';
  const productsSection = formatProductsCatalog(brain.productsCatalog || DEFAULT_AI_BRAIN?.productsCatalog || []);
  const objectionsSection = formatObjectionPlaybook(brain.objectionPlaybook || DEFAULT_AI_BRAIN?.objectionPlaybook || []);

  return `Sos el asistente virtual de ${businessName}.
${businessDesc}

PERSONALIDAD Y TONO:
${tone}

ZONA DE COBERTURA: ${zone}

═══════════════════════════════════════════
REGLA DE ORO CONVERSACIONAL:
- Primero dar una respuesta útil al cliente.
- Después, hacer UNA SOLA pregunta por turno para avanzar.
- NUNCA hacer más de una pregunta por mensaje.
- No interrogar al cliente de entrada.
═══════════════════════════════════════════

PLAN COMERCIAL (El orden importa: si a un cliente le corresponden dos ofertas, ofrecé primero la de más arriba. Primero indagá si le corresponde SIN nombrar la oferta.):
${plan}
${productsSection}${objectionsSection}
REGLAS DE CALIFICACIÓN DE LEADS:
${qualRules}

REGLAS DE COMPORTAMIENTO:
${rules}

═══════════════════════════════════════════
BASE DE CONOCIMIENTO (usá SOLO esta información para responder):
${ragContext}
═══════════════════════════════════════════

HERRAMIENTAS:
- Usá "registrar_lead" cuando detectes interés real (implícito o explícito).
- Usá "escalar_a_humano" cuando no puedas resolver o el cliente pida un humano.
- Usá "prometer_contacto" SIEMPRE que le digas al cliente que alguien lo va a contactar.

IMPORTANTE:
- Respondé SOLO con información de la base de conocimiento y el catálogo. NO inventes datos ni precios.
- Si no tenés la respuesta, decilo honestamente y ofrecé derivar a un asesor.
- Respondé en español argentino, tuteo con "vos".
- Mensajes cortos y directos. Máximo 2-3 párrafos breves.`;
}

/**
 * Formats chat history for the LLM conversation context.
 */
function formatChatHistory(chatHistory = []) {
  if (!Array.isArray(chatHistory) || chatHistory.length === 0) return [];

  return chatHistory
    .slice(-10) // Last 10 messages for context window
    .map((msg) => ({
      role: msg.direction === 'inbound' ? 'user' : 'model',
      parts: [{ text: msg.text || '' }],
    }))
    .filter((msg) => msg.parts[0].text.length > 0);
}

/**
 * Calls Gemini 2.0 Flash with the system prompt, chat history, and tools.
 *
 * @param {string} systemPrompt
 * @param {Array} history - Formatted chat history
 * @param {string} userMessage - Current user message
 * @returns {Promise<{ text: string, toolCalls: Array }>}
 */
async function callGemini(systemPrompt, history, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Build the contents array with history + current message
  const contents = [
    ...history,
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  // Build tools specification for function calling
  const tools = [{
    functionDeclarations: AGENT_TOOLS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    })),
  }];

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    tools,
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 600,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate || !candidate.content || !candidate.content.parts) {
    throw new Error('Gemini returned empty response');
  }

  // Extract text response and tool calls
  let text = '';
  const toolCalls = [];

  for (const part of candidate.content.parts) {
    if (part.text) {
      text += part.text;
    }
    if (part.functionCall) {
      toolCalls.push({
        name: part.functionCall.name,
        args: part.functionCall.args || {},
      });
    }
  }

  return { text: text.trim(), toolCalls };
}

/**
 * Evaluates an incoming message with the tenant's AI Brain context.
 * This is the main entry point called by the webhook handler.
 *
 * @param {Object} params
 * @param {string} params.messageText - The incoming user message
 * @param {Array} params.chatHistory - Previous messages in the conversation
 * @param {Object} params.brain - The tenant's AI Brain configuration
 * @param {Object} params.lead - The current lead document (if exists)
 * @param {string} params.channel - Communication channel
 * @returns {Promise<{
 *   replyText: string,
 *   shouldRegisterLead: boolean,
 *   leadData: Object|null,
 *   shouldHandOff: boolean,
 *   handOffData: Object|null,
 *   shouldPromiseContact: boolean,
 *   promiseData: Object|null,
 *   reason: string,
 * }>}
 */
export async function evaluateAutonomousAgent({
  messageText = '',
  inboundMessage = '',
  message = '',
  chatHistory = [],
  brain = null,
  aiBrain = null,
  lead = null,
  channel = 'whatsapp',
}) {
  const text = (messageText || inboundMessage || message || '').trim();
  const effectiveBrain = brain || aiBrain || DEFAULT_AI_BRAIN;

  // Empty message — no response
  if (!text) {
    return {
      replyText: '',
      responseMessage: '',
      shouldRegisterLead: false,
      leadData: null,
      shouldHandOff: false,
      handOffData: null,
      shouldPromiseContact: false,
      promiseData: null,
      reason: 'Mensaje vacío',
    };
  }

  // Build RAG context from knowledge base using the user's message as query
  let ragContext = '';
  try {
    ragContext = buildRAGContext(text, {
      tenantDocuments: effectiveBrain.knowledgeDocuments || [],
      topK: 5,
      context: 'sales',
    });
  } catch (ragErr) {
    console.warn('[AGENT_ENGINE] RAG context build failed:', ragErr.message);
    ragContext = '(No se pudo cargar la base de conocimiento.)';
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt(effectiveBrain, ragContext);

  // Format chat history
  const history = formatChatHistory(chatHistory);

  // Try LLM call
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (apiKey && !process.env.VITEST) {
    try {
      const { text: responseText, toolCalls } = await callGemini(systemPrompt, history, text);

      // Process tool calls
      let shouldRegisterLead = false;
      let leadData = null;
      let shouldHandOff = false;
      let handOffData = null;
      let shouldPromiseContact = false;
      let promiseData = null;

      for (const tc of toolCalls) {
        switch (tc.name) {
          case 'registrar_lead':
            shouldRegisterLead = true;
            leadData = {
              name: tc.args.nombre || '',
              rubro: tc.args.rubro || '',
              ubicacion: tc.args.ubicacion || '',
              interes: tc.args.interes || '',
              tamano: tc.args.tamano || 'chico',
              condicionFiscal: tc.args.condicion_fiscal || 'desconocido',
              esClienteFiserv: tc.args.es_cliente_fiserv || 'desconocido',
              notas: tc.args.notas || '',
            };
            break;

          case 'escalar_a_humano':
            shouldHandOff = true;
            handOffData = {
              motivo: tc.args.motivo || 'Solicitud de atención humana',
              resumen: tc.args.resumen || '',
            };
            break;

          case 'prometer_contacto':
            shouldPromiseContact = true;
            promiseData = {
              promesa: tc.args.promesa || 'Se le prometió contacto al cliente',
            };
            break;
        }
      }

      // Build reason for logging
      let reason = 'Respuesta generada por IA';
      if (shouldRegisterLead) reason = 'Lead detectado con interés comercial';
      if (shouldHandOff) reason = `Escalación: ${handOffData?.motivo || 'solicitud de humano'}`;

      const generatedReply = responseText || '¡Hola! Gracias por comunicarte con Grupo Novati. ¿En qué podemos ayudarte?';
      return {
        reply: generatedReply,
        replyText: generatedReply,
        responseMessage: generatedReply,
        shouldRegisterLead,
        shouldQualify: Boolean(shouldRegisterLead),
        leadData,
        shouldHandOff,
        handOffData,
        shouldPromiseContact,
        promiseData,
        reason,
      };
    } catch (llmErr) {
      console.error('[AGENT_ENGINE_LLM_ERROR]', llmErr.message);
      // Fall through to deterministic fallback
    }
  }

  // ============================================================
  // Deterministic Fallback (when LLM is unavailable or in offline tests)
  // ============================================================
  const lower = text.toLowerCase();

  // 1. Detect frustration / human request / complaints
  const wantsHuman = /(persona|humano|vendedor|asesor|hablar con alguien|llamar|llamame|estafa|queja|enojado|denuncia)/i.test(lower);
  if (wantsHuman) {
    const humanReply = 'Entiendo perfectamente. En este momento transfiero tu consulta con uno de nuestros ejecutivos de cuenta para que te atienda personalmente a la brevedad.';
    return {
      reply: humanReply,
      replyText: humanReply,
      responseMessage: humanReply,
      shouldRegisterLead: false,
      shouldQualify: false,
      leadData: null,
      shouldHandOff: true,
      handOffData: { motivo: 'Cliente solicitó hablar con una persona o expresó reclamo', resumen: text.slice(0, 200) },
      shouldPromiseContact: true,
      promiseData: { promesa: 'Se le dijo que un asesor o ejecutivo de cuenta lo va a contactar' },
      reason: 'Solicitud de atención humana / reclamo (fallback determinístico)',
    };
  }

  // 2. Detect commercial interest / budget / equipment inquiry (Implicit & Explicit Lead Detection)
  const mentionsMarketingGoals = /(campaña|pauta|meta ads|google ads|publicidad|leads|anuncio)/i.test(lower);
  const mentionsCommercial = /(presupuesto|\$|inversion|inversión|cuanto sale|cuánto sale|precio|costo|clover|posnet|posberry|terminal|monotributista|equipo|comprar|instalar|adquirir|cuotas|lavarropa|secarropa|electro|garantía|flete|envío)/i.test(lower);

  if (mentionsMarketingGoals || mentionsCommercial) {
    let fallbackReply = '';
    let interes = 'Consulta Comercial';

    if (mentionsMarketingGoals) {
      fallbackReply = '¡Excelente! Para evaluar tu caso en detalle y armar la propuesta a medida, podemos coordinar una breve llamada de diagnóstico de 15 minutos. ¿Te queda cómodo mañana por la mañana o por la tarde?';
      interes = 'Pauta publicitaria y captación de leads';
    } else if (/lavarropa|secarropa|electro|bazar/i.test(lower) || effectiveBrain.businessName?.toLowerCase().includes('electro')) {
      fallbackReply = '¡Hola! Te cuento que tenemos modelos automáticos de carga frontal y superior con hasta 12 cuotas sin interés y flete bonificado. Para pasarte la mejor opción para tu casa, ¿cuántas personas son en tu familia y qué espacio tenés disponible?';
      interes = 'Lavarropas / Electrodomésticos';
    } else if (ragContext && ragContext.includes('[Documento del Negocio]')) {
      const docTitleMatch = ragContext.match(/###\s+([^\n\[]+)/);
      const docTitle = docTitleMatch ? docTitleMatch[1].trim() : effectiveBrain.businessName;
      interes = docTitle;
      fallbackReply = `¡Hola! Con gusto te paso información sobre ${docTitle}. Para asesorarte con la opción más conveniente y adaptada a tu negocio, ¿cuál es tu objetivo principal o qué necesidad puntual estás buscando resolver?`;
    } else if (/monotributista/i.test(lower)) {
      fallbackReply = 'Para comercios monotributistas que no operan con Fiserv tenemos la propuesta especial con QR $0 los primeros 3 meses, débito 0% y terminal bonificada. ¿Hoy ya trabajás con Fiserv o tenés PosNet o Clover?';
      interes = 'Propuesta Monotributista';
    } else if (/clover|posberry/i.test(lower)) {
      fallbackReply = '¡Hola! Trabajamos con terminales Clover Mini (mostrador), Flex (movilidad con impresora) y Flex Pocket integradas con POSBerry y cobro Fiserv. ¿Qué rubro es tu comercio?';
      interes = 'Clover / POSBerry';
    } else {
      fallbackReply = `¡Hola! Con gusto te pasamos toda la información de productos y opciones de ${effectiveBrain.businessName || 'nuestra empresa'}. ¿Qué modelo o necesidad puntual estás buscando resolver?`;
      interes = 'Consulta General de Productos';
    }

    return {
      reply: fallbackReply,
      replyText: fallbackReply,
      responseMessage: fallbackReply,
      shouldRegisterLead: true,
      shouldQualify: true,
      leadData: {
        name: '',
        rubro: '',
        ubicacion: effectiveBrain.coverageZone || 'Argentina',
        interes,
        tamano: 'chico',
        condicionFiscal: /monotributista/i.test(lower) ? 'monotributista' : 'desconocido',
        esClienteFiserv: 'desconocido',
        notas: `Interés detectado en mensaje: "${text.slice(0, 150)}"`,
      },
      shouldHandOff: false,
      handOffData: null,
      shouldPromiseContact: false,
      promiseData: null,
      reason: 'Lead detectado por interés comercial o consulta de precios/equipos (fallback determinístico)',
    };
  }

  // 3. Generic greeting fallback
  const greetingReply =
    '¡Hola! Soy el asistente de Grupo Novati 👋 Vendemos terminales de cobro PosNet y Clover con POSBerry en Tucumán. ' +
    '¿En qué puedo ayudarte? Podés preguntarme por equipos, comisiones, medios de pago o lo que necesites.';

  return {
    reply: greetingReply,
    replyText: greetingReply,
    responseMessage: greetingReply,
    shouldRegisterLead: false,
    shouldQualify: false,
    leadData: null,
    shouldHandOff: false,
    handOffData: null,
    shouldPromiseContact: false,
    promiseData: null,
    reason: 'Saludo inicial (fallback determinístico)',
  };
}
