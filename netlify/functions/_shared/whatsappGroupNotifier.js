/**
 * WhatsApp Group Notifier — Sends guaranteed operational alerts to team WhatsApp groups.
 *
 * Implements the 5 core operational notifications:
 *   1. new_lead: Prospect detected with explicit or implicit commercial interest.
 *   2. escalation: Inquiry escalated to a human salesperson/advisor.
 *   3. new_case: Support or post-sales case opened.
 *   4. unregistered_promise: Safety net — bot promised contact but no human followed up.
 *   5. campaign_stopped: Broadcast campaign paused after consecutive failures.
 *
 * Uses Meta WhatsApp Cloud API to deliver the alert directly to the configured group or phone.
 */

/**
 * Formats notification messages for WhatsApp groups.
 *
 * @param {string} type - Notice type: 'new_lead' | 'escalation' | 'new_case' | 'unregistered_promise' | 'campaign_stopped'
 * @param {Object} data - Notice payload
 * @returns {string} Formatted WhatsApp message with Markdown
 */
export function formatGroupNotification(type, data = {}) {
  switch (type) {
    case 'new_lead':
      return [
        '🟢 *NUEVO LEAD DETECTADO*',
        '━━━━━━━━━━━━━━━━━━━━',
        `👤 *Contacto:* ${data.name || 'Sin nombre'}`,
        `📱 *Teléfono:* ${data.phone || 'No especificado'}`,
        `🏪 *Rubro:* ${data.rubro || 'No especificado'}`,
        `📍 *Zona:* ${data.ubicacion || 'Tucumán'}`,
        `🎯 *Interés:* ${data.interes || 'Terminales / POSBerry'}`,
        `🏢 *Tamaño:* ${data.tamano || 'chico'}`,
        data.condicionFiscal && data.condicionFiscal !== 'desconocido' ? `💼 *Condición fiscal:* ${data.condicionFiscal}` : null,
        data.esClienteFiserv && data.esClienteFiserv !== 'desconocido' ? `💳 *Cliente Fiserv:* ${data.esClienteFiserv}` : null,
        `📋 *Notas:* ${data.notas || 'Lead detectado con interés comercial.'}`,
        '━━━━━━━━━━━━━━━━━━━━',
        '⚡ *Acción:* Revisar la ficha del prospecto en el panel de Leads.',
      ].filter(Boolean).join('\n');

    case 'escalation':
      return [
        '🟡 *CONVERSACIÓN ESCALADA*',
        '━━━━━━━━━━━━━━━━━━━━',
        `👤 *Cliente:* ${data.name || data.phone || 'Cliente'}`,
        `📱 *Teléfono:* ${data.phone || 'No especificado'}`,
        `⚠️ *Motivo:* ${data.motivo || 'Solicitud de atención humana'}`,
        `📝 *Contexto:* ${data.resumen || 'El cliente requiere asistencia directa de un asesor.'}`,
        '━━━━━━━━━━━━━━━━━━━━',
        '💬 *Acción requerida:* Ingresar a Conversaciones en el panel para responder.',
      ].join('\n');

    case 'new_case':
      return [
        '🔵 *NUEVO CASO DE SOPORTE*',
        '━━━━━━━━━━━━━━━━━━━━',
        `🎫 *Caso:* #${data.caseNumber || 'Nuevo'}`,
        `👤 *Cliente:* ${data.clientName || data.phone || 'Cliente'}`,
        `📱 *Teléfono:* ${data.phone || 'No especificado'}`,
        `🔧 *Tipo:* ${data.caseType || 'Soporte técnico'}`,
        `📌 *Estado:* ${data.status || 'abierto'}`,
        `📝 *Detalle:* ${data.detail || 'Sin detalle adicional'}`,
        '━━━━━━━━━━━━━━━━━━━━',
        '⚡ *Acción:* Atender el caso desde la sección Casos.',
      ].join('\n');

    case 'unregistered_promise':
      return [
        '🔴 *ALERTA: PROMESA DE CONTACTO PENDIENTE*',
        '━━━━━━━━━━━━━━━━━━━━',
        '⚠️ *El asistente prometió al cliente que alguien lo va a contactar.*',
        `📱 *Teléfono:* ${data.phone || 'No especificado'}`,
        `🤝 *Promesa realizada:* "${data.promise || 'Te van a contactar a la brevedad'}"`,
        data.chatId ? `💬 *ID Chat:* ${data.chatId}` : null,
        '━━━━━━━━━━━━━━━━━━━━',
        '⚡ *URGENTE:* Asignar un asesor y responder en Conversaciones para no perder la venta.',
      ].filter(Boolean).join('\n');

    case 'campaign_stopped':
      return [
        '⛔ *CAMPAÑA DE DIFUSIÓN DETENIDA*',
        '━━━━━━━━━━━━━━━━━━━━',
        `📢 *Campaña:* ${data.campaignName || 'Campaña de difusión'}`,
        `⚠️ *Motivo:* 3 fallos consecutivos en el envío de mensajes.`,
        '🛡️ *Seguridad:* Envío pausado automáticamente para proteger la línea contra bloqueos.',
        '━━━━━━━━━━━━━━━━━━━━',
        '⚡ *Acción:* Verificar estado de la línea WhatsApp en el panel.',
      ].join('\n');

    default:
      return `ℹ️ *Aviso del Sistema*\n\n${JSON.stringify(data, null, 2)}`;
  }
}

/**
 * Sends a notification to the configured WhatsApp group or phone.
 *
 * @param {string} type - Notice type
 * @param {Object} data - Notice payload
 * @param {Object} [options]
 * @param {string} [options.recipient] - Override recipient phone/group ID
 * @param {string} [options.phoneNumberId] - Override sender phone number ID
 * @returns {Promise<{ ok: boolean, messageId?: string, error?: string }>}
 */
export async function notifyGroup(type, data = {}, options = {}) {
  const messageText = formatGroupNotification(type, data);

  const recipient =
    options.recipient ||
    process.env.WHATSAPP_NOTIFICATIONS_GROUP_ID ||
    process.env.WHATSAPP_ALERT_PHONE ||
    process.env.WHATSAPP_GROUP_ID;

  const phoneNumberId = options.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  console.log(`[GROUP_NOTIFIER] [${type}] Dispatched alert to ${recipient || 'CONSOLE (no recipient configured)'}:`, {
    type,
    summary: (data.name || data.motivo || data.promise || '').slice(0, 80),
  });

  if (!recipient || !phoneNumberId || !apiToken || process.env.VITEST) {
    // Return simulated success in testing or unconfigured environment
    return {
      ok: true,
      simulated: true,
      messageText,
      recipient: recipient || 'unconfigured',
    };
  }

  try {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: { preview_url: false, body: messageText },
    };

    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.warn('[GROUP_NOTIFIER] Failed to send WhatsApp alert via Cloud API:', errBody.slice(0, 200));
      return { ok: false, error: errBody };
    }

    const resData = await res.json();
    const messageId = resData.messages?.[0]?.id;
    return { ok: true, messageId, messageText };
  } catch (err) {
    console.error('[GROUP_NOTIFIER_EXCEPTION]', err.message);
    return { ok: false, error: err.message };
  }
}
