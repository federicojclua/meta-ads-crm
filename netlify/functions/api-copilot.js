import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getDb } from './_shared/db.js';
import { checkRateLimit, getClientIp } from './_shared/rateLimiter.js';
import { runAllToolsForTenant } from './_shared/copilotTools.js';
import { queryCopilot } from './_shared/copilotProviderAdapter.js';
import { sanitizeCopilotQuery, isAdversarialAttack, createAbstentionResponse, validateCopilotResponse } from './_shared/copilotSchema.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal } = auth;
  const db = auth.db || await getDb();
  const method = event.httpMethod;

  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-copilot/, '')
    .replace(/^\/api\/copilot/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  // Rate limiting (15 requests/minute)
  const clientIp = getClientIp(event);
  const rateLimitKey = `copilot-rate-${user._id || clientIp}`;
  const allowed = await checkRateLimit(rateLimitKey, 15, 60, db);
  if (!allowed) {
    return errorResponse(429, 'Límite de solicitudes del Copiloto excedido (15 por minuto). Intente nuevamente en breve.', 'RATE_LIMIT_EXCEEDED');
  }

  try {
    // ----------------------------------------------------
    // GET /api/copilot/suggestions (Curated prompt chips)
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'suggestions' && method === 'GET') {
      const suggestions = [
        {
          id: 'overspend',
          category: 'Eficiencia de Inversión',
          query: '¿Hay sobreinversión en Meta Ads frente a los ingresos cobrados este mes?',
        },
        {
          id: 'campaigns',
          category: 'Rendimiento Publicitario',
          query: '¿Cuáles son las campañas con mejor y peor ROAS atribuido?',
        },
        {
          id: 'funnel',
          category: 'Conversión de Leads',
          query: '¿Cuál es el CPL promedio y la tasa de cierre a ventas ganadas?',
        },
        {
          id: 'aging',
          category: 'Cobranzas y Aging',
          query: '¿Cómo está el saldo pendiente de cobro y las facturas vencidas a más de 30 días?',
        },
        {
          id: 'diagnostics',
          category: 'Diagnóstico Integral',
          query: '¿Qué acciones prioritarias tenemos según las reseñas de Google y presencia en redes?',
        },
      ];

      return jsonResponse(200, { ok: true, suggestions });
    }

    // ----------------------------------------------------
    // POST /api/copilot/query (Main Conversational Handler)
    // ----------------------------------------------------
    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'query')) {
      if (method !== 'POST') {
        return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
      }

      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'El cuerpo de la solicitud no es un JSON válido.', 'INVALID_JSON');
      }

      const rawQuery = body.query || '';
      const sanitizedQuery = sanitizeCopilotQuery(rawQuery);

      if (!sanitizedQuery) {
        return errorResponse(400, 'La consulta no puede estar vacía.', 'EMPTY_QUERY');
      }

      // 1. Adversarial attack check
      if (isAdversarialAttack(rawQuery)) {
        const abstention = createAbstentionResponse(
          'La consulta contiene instrucciones que violan las políticas de seguridad del sistema.',
          rawQuery
        );
        return jsonResponse(200, { ok: true, answer: abstention });
      }

      // 2. Resolve target tenant
      const targetClientId = isGlobal ? (body.clientId || clientScope) : clientScope;
      if (!targetClientId) {
        const abstention = createAbstentionResponse(
          'No se seleccionó una empresa válida para auditar.',
          rawQuery
        );
        return jsonResponse(200, { ok: true, answer: abstention });
      }

      // 3. Fetch tenant metadata
      let tenantName = 'Empresa Activa';
      let currency = body.currency || 'USD';
      if (db.collection) {
        const clientsCollection = db.collection('clients');
        const tenantQuery = ObjectId.isValid(targetClientId)
          ? { _id: new ObjectId(targetClientId) }
          : { _id: targetClientId };
        const clientDoc = await clientsCollection.findOne(tenantQuery);
        if (clientDoc) {
          tenantName = clientDoc.name || tenantName;
          currency = clientDoc.currency || currency;
        }
      }

      // 4. Run deterministic backend tools (tenant-scoped)
      const period = body.period || 'Últimos 30 días';
      const toolResults = await runAllToolsForTenant({
        db,
        clientId: targetClientId,
        period,
        currency,
        userQuery: sanitizedQuery,
      });

      // 5. Query Copilot Provider Adapter
      const tenantContext = {
        tenantId: targetClientId.toString(),
        tenantName,
        currency,
        period,
        attributionModel: body.attributionModel || 'last_touch',
      };

      const rawResult = await queryCopilot({
        userQuery: sanitizedQuery,
        toolResults,
        tenantContext,
        requestedProvider: body.provider || 'deterministic',
      });

      // 6. Validate output schema
      const { sanitized } = validateCopilotResponse(rawResult);

      return jsonResponse(200, {
        ok: true,
        answer: sanitized,
      });
    }

    return errorResponse(404, 'Ruta de Copiloto no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_COPILOT_ERROR]', err.message);
    return errorResponse(500, 'Error procesando consulta con el Copiloto.', 'INTERNAL_ERROR');
  }
}
