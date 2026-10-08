import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  validateCaseDocument,
  sanitizeCase,
  CASE_TYPE_LABELS,
  CASE_STATUS_LABELS,
} from '../../models/Case.js';
import { notifyGroup } from './_shared/whatsappGroupNotifier.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const casesCollection = db.collection('cases');
  const countersCollection = db.collection('counters');
  const method = event.httpMethod;
  const now = new Date();

  // Parse path segments
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-cases/, '')
    .replace(/^\/api\/cases/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // Helper: Build Tenant Filter
    // ----------------------------------------------------
    const buildTenantFilter = (baseQuery = {}) => {
      const query = { ...baseQuery };
      if (!isGlobal) {
        query.clientId = ObjectId.isValid(clientScope) ? new ObjectId(clientScope) : clientScope;
      } else {
        const params = event.queryStringParameters || {};
        if (params.clientId && params.clientId.trim() !== '' && params.clientId.trim() !== 'all') {
          const rawId = params.clientId.trim();
          query.clientId = ObjectId.isValid(rawId) ? new ObjectId(rawId) : rawId;
        }
      }
      return query;
    };

    // ----------------------------------------------------
    // 1. GET /api/cases — List Cases with Filters
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'GET') {
      const params = event.queryStringParameters || {};
      const filter = buildTenantFilter({});

      if (params.status && params.status !== 'all') {
        filter.status = params.status;
      }
      if (params.type && params.type !== 'all') {
        filter.type = params.type;
      }
      if (params.priority && params.priority !== 'all') {
        filter.priority = params.priority;
      }
      if (params.assignedToUserId && params.assignedToUserId !== 'all') {
        filter.assignedToUserId = ObjectId.isValid(params.assignedToUserId)
          ? new ObjectId(params.assignedToUserId)
          : params.assignedToUserId;
      }
      if (params.chatId) {
        filter.chatId = ObjectId.isValid(params.chatId) ? new ObjectId(params.chatId) : params.chatId;
      }
      if (params.leadId) {
        filter.leadId = ObjectId.isValid(params.leadId) ? new ObjectId(params.leadId) : params.leadId;
      }
      if (params.phone) {
        filter.contactPhone = params.phone.trim();
      }

      // Search across title, contactName, phone, or caseCode
      if (params.search && params.search.trim()) {
        const s = params.search.trim();
        const searchRegex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [
          { title: searchRegex },
          { contactName: searchRegex },
          { contactPhone: searchRegex },
          { description: searchRegex },
          { caseCode: searchRegex },
        ];
      }

      const cases = await casesCollection
        .find(filter)
        .sort({ updatedAt: -1 })
        .limit(100)
        .toArray();

      return jsonResponse(200, {
        ok: true,
        cases: cases.map(sanitizeCase),
        total: cases.length,
      });
    }

    // ----------------------------------------------------
    // 2. POST /api/cases — Create New Case
    // ----------------------------------------------------
    if (segments.length === 0 && method === 'POST') {
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const targetClientId = isGlobal ? (body.clientId || clientScope) : clientScope;
      if (!targetClientId) {
        return errorResponse(400, 'clientId es requerido para registrar un caso.', 'CLIENT_ID_REQUIRED');
      }

      const validation = validateCaseDocument({ ...body, clientId: targetClientId });
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_FAILED');
      }

      // Atomic sequential case number (#1001, #1002...)
      const counterId = `cases_${targetClientId.toString()}`;
      const counterResult = await countersCollection.findOneAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
      );
      const nextSeq = counterResult?.seq || (counterResult?.value?.seq || 1);
      const caseNumber = 1000 + nextSeq;
      const caseCode = `#${caseNumber}`;

      const caseDoc = {
        clientId: ObjectId.isValid(targetClientId) ? new ObjectId(targetClientId) : targetClientId,
        caseNumber,
        caseCode,
        leadId: body.leadId && ObjectId.isValid(body.leadId) ? new ObjectId(body.leadId) : null,
        chatId: body.chatId && ObjectId.isValid(body.chatId) ? new ObjectId(body.chatId) : null,
        contactName: (body.contactName || '').trim(),
        contactPhone: (body.contactPhone || '').trim(),
        title: body.title.trim(),
        description: (body.description || '').trim(),
        type: body.type || 'soporte_tecnico',
        status: body.status || 'abierto',
        priority: body.priority || 'media',
        assignedToUserId: body.assignedToUserId && ObjectId.isValid(body.assignedToUserId)
          ? new ObjectId(body.assignedToUserId)
          : (user._id || null),
        assignedToName: body.assignedToName || user.displayName || user.email || 'Asesor',
        resolutionNotes: null,
        resolvedAt: null,
        resolvedBy: null,
        activities: [
          {
            type: 'created',
            description: `Caso ${caseCode} creado.`,
            performedBy: { id: user._id?.toString(), displayName: user.displayName || user.email },
            timestamp: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };

      const insertRes = await casesCollection.insertOne(caseDoc);
      const createdCase = { _id: insertRes.insertedId, ...caseDoc };

      // Dispatch guaranteed operational alert to WhatsApp group
      try {
        await notifyGroup('new_case', {
          caseNumber,
          clientName: createdCase.contactName || createdCase.contactPhone || 'Cliente',
          phone: createdCase.contactPhone,
          caseType: CASE_TYPE_LABELS[createdCase.type] || createdCase.type,
          status: CASE_STATUS_LABELS[createdCase.status] || createdCase.status,
          detail: createdCase.title,
        });
      } catch (notifyErr) {
        console.warn('[CASES_API] Error dispatching group notification:', notifyErr.message);
      }

      return jsonResponse(201, {
        ok: true,
        case: sanitizeCase(createdCase),
      });
    }

    // ----------------------------------------------------
    // 3. GET /api/cases/:id — Case Detail
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'GET') {
      const caseIdRaw = segments[0];
      if (!ObjectId.isValid(caseIdRaw)) {
        return errorResponse(400, 'ID de caso inválido.', 'INVALID_CASE_ID');
      }

      const caseQuery = buildTenantFilter({ _id: new ObjectId(caseIdRaw) });
      const foundCase = await casesCollection.findOne(caseQuery);

      if (!foundCase) {
        return errorResponse(404, 'Caso no encontrado.', 'CASE_NOT_FOUND');
      }

      return jsonResponse(200, {
        ok: true,
        case: sanitizeCase(foundCase),
      });
    }

    // ----------------------------------------------------
    // 4. PATCH /api/cases/:id — Update Case (Status, Notes, Assignee)
    // ----------------------------------------------------
    if (segments.length === 1 && method === 'PATCH') {
      const caseIdRaw = segments[0];
      if (!ObjectId.isValid(caseIdRaw)) {
        return errorResponse(400, 'ID de caso inválido.', 'INVALID_CASE_ID');
      }

      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const validation = validateCaseDocument(body, true);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_FAILED');
      }

      const caseQuery = buildTenantFilter({ _id: new ObjectId(caseIdRaw) });
      const existingCase = await casesCollection.findOne(caseQuery);

      if (!existingCase) {
        return errorResponse(404, 'Caso no encontrado.', 'CASE_NOT_FOUND');
      }

      const updateFields = { updatedAt: now };
      const newActivities = [...(existingCase.activities || [])];

      if (body.title && body.title.trim()) {
        updateFields.title = body.title.trim();
      }
      if (body.description !== undefined) {
        updateFields.description = (body.description || '').trim();
      }
      if (body.type && body.type !== existingCase.type) {
        updateFields.type = body.type;
        newActivities.push({
          type: 'type_change',
          description: `Tipo cambiado de "${CASE_TYPE_LABELS[existingCase.type] || existingCase.type}" a "${CASE_TYPE_LABELS[body.type] || body.type}".`,
          performedBy: { id: user._id?.toString(), displayName: user.displayName || user.email },
          timestamp: now,
        });
      }
      if (body.priority && body.priority !== existingCase.priority) {
        updateFields.priority = body.priority;
        newActivities.push({
          type: 'priority_change',
          description: `Prioridad cambiada a "${body.priority}".`,
          performedBy: { id: user._id?.toString(), displayName: user.displayName || user.email },
          timestamp: now,
        });
      }
      if (body.assignedToUserId && body.assignedToUserId !== existingCase.assignedToUserId?.toString()) {
        updateFields.assignedToUserId = ObjectId.isValid(body.assignedToUserId)
          ? new ObjectId(body.assignedToUserId)
          : body.assignedToUserId;
        updateFields.assignedToName = body.assignedToName || 'Asesor';
        newActivities.push({
          type: 'assignment_change',
          description: `Caso asignado a ${updateFields.assignedToName}.`,
          performedBy: { id: user._id?.toString(), displayName: user.displayName || user.email },
          timestamp: now,
        });
      }

      // Status change & Resolution Notes
      if (body.status && body.status !== existingCase.status) {
        updateFields.status = body.status;

        if (body.status === 'resuelto') {
          updateFields.resolvedAt = now;
          updateFields.resolvedBy = user.displayName || user.email;
          updateFields.resolutionNotes = (body.resolutionNotes || '').trim();
          newActivities.push({
            type: 'resolved',
            description: `Caso resuelto: "${updateFields.resolutionNotes}".`,
            performedBy: { id: user._id?.toString(), displayName: user.displayName || user.email },
            timestamp: now,
          });
        } else {
          newActivities.push({
            type: 'status_change',
            description: `Estado cambiado a "${CASE_STATUS_LABELS[body.status] || body.status}".`,
            performedBy: { id: user._id?.toString(), displayName: user.displayName || user.email },
            timestamp: now,
          });
        }
      } else if (body.resolutionNotes && body.resolutionNotes.trim()) {
        updateFields.resolutionNotes = body.resolutionNotes.trim();
      }

      updateFields.activities = newActivities;

      await casesCollection.updateOne({ _id: existingCase._id }, { $set: updateFields });
      const updatedCase = await casesCollection.findOne({ _id: existingCase._id });

      return jsonResponse(200, {
        ok: true,
        case: sanitizeCase(updatedCase),
      });
    }

    return errorResponse(404, 'Ruta de casos no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[CASES_API_ERROR]', err.message);
    return errorResponse(500, 'Error interno del servidor al procesar el caso.', 'INTERNAL_ERROR');
  }
}
