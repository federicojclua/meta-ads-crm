import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  LEAD_STAGES,
  LEAD_SOURCES,
  normalizeEmail,
  normalizePhone,
  validateLeadDocument,
  sanitizeLeadResponse,
} from '../../models/Lead.js';
import {
  validateLeadActivity,
  sanitizeActivityResponse,
} from '../../models/LeadActivity.js';
import { sanitizeSaleResponse } from '../../models/Sale.js';
import { parseCsvString } from '../../src/lib/csvParser.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const isSalesperson = user.role === 'salesperson';
  const leadsCollection = db.collection('leads');
  const activitiesCollection = db.collection('lead_activities');
  const salesCollection = db.collection('sales');
  const usersCollection = db.collection('users');
  const clientsCollection = db.collection('clients');
  const method = event.httpMethod;
  const now = new Date();

  // Normalize path segments
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-leads/, '')
    .replace(/^\/api\/leads/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // Helper: Build tenant query filter
    // ----------------------------------------------------
    const buildTenantFilter = (baseQuery = {}) => {
      const query = { ...baseQuery };
      if (!isGlobal) {
        if (ObjectId.isValid(clientScope)) {
          query.clientId = new ObjectId(clientScope);
        } else {
          query.clientId = clientScope;
        }
      } else {
        const params = event.queryStringParameters || {};
        if (params.clientId && params.clientId.trim() !== '' && params.clientId.trim() !== 'all') {
          const rawId = params.clientId.trim();
          query.clientId = ObjectId.isValid(rawId) ? new ObjectId(rawId) : rawId;
        }
      }
      if (isSalesperson) {
        query.assignedToUserId = user._id;
      }
      return query;
    };

    // ----------------------------------------------------
    // Helper: Log activity (performedBy set exclusively on backend)
    // ----------------------------------------------------
    const logActivity = async (clientId, leadId, type, description, data = {}) => {
      const activityData = {
        clientId,
        leadId,
        type,
        description,
        data,
        performedBy: user._id,
        performedByName: user.displayName || user.email,
        createdAt: new Date(),
      };
      const validation = validateLeadActivity(activityData);
      if (validation.isValid) {
        await activitiesCollection.insertOne(activityData);
      }
    };

    // ----------------------------------------------------
    // Route: POST /api/leads/import (CSV Batch Import)
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'import') {
      if (method !== 'POST') {
        return errorResponse(405, 'Utilice POST para importar prospectos.', 'METHOD_NOT_ALLOWED');
      }

      if (isSalesperson) {
        return errorResponse(403, 'Los vendedores no tienen permisos para realizar importaciones masivas.', 'FORBIDDEN_ACTION');
      }

      let body;
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
      }

      // Check byte size of payload
      const payloadString = typeof event.body === 'string' ? event.body : JSON.stringify(body);
      const byteSize = new TextEncoder().encode(payloadString).length;
      if (byteSize > 1024 * 1024) {
        return errorResponse(400, 'El archivo o lote supera el tamaño máximo permitido de 1 MB.', 'CSV_LIMIT_EXCEEDED');
      }

      let parsedRows = [];
      if (typeof body.csvText === 'string') {
        const parseRes = parseCsvString(body.csvText, { maxRows: 500, maxBytes: 1024 * 1024 });
        if (parseRes.error) {
          return errorResponse(400, parseRes.error, 'CSV_PARSE_ERROR');
        }
        parsedRows = parseRes.rows.filter((r) => r.isValid);
      } else if (Array.isArray(body.leads)) {
        parsedRows = body.leads;
      }

      if (parsedRows.length === 0) {
        return errorResponse(400, 'Debe enviar un array "leads" o texto "csvText" con registros válidos.', 'EMPTY_IMPORT');
      }

      if (parsedRows.length > 500) {
        return errorResponse(400, 'El límite máximo por lote de importación es de 500 filas.', 'CSV_LIMIT_EXCEEDED');
      }

      // Determine target client
      let targetClientId = null;
      if (!isGlobal) {
        targetClientId = user.clientId;
      } else {
        const rawClientId = body.clientId ? String(body.clientId).trim() : null;
        if (!rawClientId) {
          return errorResponse(400, 'Debe seleccionar la empresa a la que pertenecen los prospectos.', 'CLIENT_REQUIRED');
        }
        const clientDoc = await clientsCollection.findOne({
          $or: [
            ...(ObjectId.isValid(rawClientId) ? [{ _id: new ObjectId(rawClientId) }] : []),
            { _id: rawClientId },
            { slug: rawClientId },
          ],
        });
        if (!clientDoc || clientDoc.status !== 'active') {
          return errorResponse(400, 'La empresa especificada no existe o está inactiva.', 'CLIENT_INACTIVE');
        }
        targetClientId = clientDoc._id;
      }

      // Pre-fetch active or invited salespersons for this client
      const activeSalespeople = await usersCollection
        .find({
          role: 'salesperson',
          status: { $in: ['active', 'invited'] },
          $or: [
            { clientId: targetClientId },
            { clientIds: targetClientId },
            { clientId: targetClientId.toString() },
            { clientIds: targetClientId.toString() },
          ],
        })
        .toArray();

      const salespersonMap = new Map();
      activeSalespeople.forEach((sp) => {
        salespersonMap.set(sp.normalizedEmail, sp._id);
      });

      const batchTimestamp = body.batchId || Date.now();
      let createdCount = 0;
      let duplicateWarningCount = 0;
      const errors = [];
      const createdLeads = [];

      for (let i = 0; i < parsedRows.length; i++) {
        const row = parsedRows[i];
        const rowNum = row.rowNumber || i + 1;
        const name = (row.name || '').trim();
        const rawEmail = (row.email || '').trim();
        const rawPhone = (row.phone || '').trim();
        const normEmail = normalizeEmail(rawEmail);
        const normPhone = normalizePhone(rawPhone);

        if (!name) {
          errors.push({ row: rowNum, error: 'Nombre requerido.' });
          continue;
        }

        if (!normEmail && !normPhone) {
          errors.push({ row: rowNum, error: 'Debe incluir email o teléfono.' });
          continue;
        }

        // Generate or check tenant-scoped stable idempotency key
        const ingestionKey = row.ingestionKey
          ? String(row.ingestionKey).trim()
          : `csv_${batchTimestamp}_row_${rowNum}`;

        // Check if this tenant already imported this key
        const existingByIngestion = await leadsCollection.findOne({
          clientId: targetClientId,
          ingestionKey,
        });

        if (existingByIngestion) {
          duplicateWarningCount++;
          continue; // Skip silently on idempotent retry
        }

        // Check for duplicate warning (same email or phone in this client)
        const duplicateMatch = await leadsCollection.findOne({
          clientId: targetClientId,
          $or: [
            ...(normEmail ? [{ normalizedEmail: normEmail }] : []),
            ...(normPhone ? [{ normalizedPhone: normPhone }] : []),
          ],
        });

        if (duplicateMatch) {
          duplicateWarningCount++;
        }

        // Determine assignment
        let assignedToUserId = null;
        if (row.assignedSalespersonEmail) {
          const spNorm = normalizeEmail(row.assignedSalespersonEmail);
          if (salespersonMap.has(spNorm)) {
            assignedToUserId = salespersonMap.get(spNorm);
          } else {
            errors.push({ row: rowNum, error: `Vendedor especificado no encontrado o inactivo.` });
            continue;
          }
        } else if (body.defaultAssignedToUserId) {
          const defaultSp = activeSalespeople.find(
            (sp) => sp._id.toString() === String(body.defaultAssignedToUserId)
          );
          if (defaultSp) {
            assignedToUserId = defaultSp._id;
          }
        }

        const stage = LEAD_STAGES.includes(row.stage) ? row.stage : 'new';
        const leadDoc = {
          clientId: targetClientId,
          name,
          email: rawEmail || null,
          normalizedEmail: normEmail || null,
          phone: rawPhone || null,
          normalizedPhone: normPhone || null,
          stage,
          source: 'csv',
          assignedToUserId,
          valueEstimateMinor: Number.isInteger(row.valueEstimateMinor) && row.valueEstimateMinor >= 0 ? row.valueEstimateMinor : 0,
          currency: row.currency === 'USD' ? 'USD' : 'ARS',
          notes: row.notes ? String(row.notes).trim().slice(0, 2000) : null,
          acquiredAt: row.acquiredAt ? new Date(row.acquiredAt) : now,
          firstContactedAt: stage === 'contacted' ? now : null,
          qualifiedAt: stage === 'qualified' ? now : null,
          wonAt: stage === 'won' ? now : null,
          lostAt: stage === 'lost' ? now : null,
          lostReason: stage === 'lost' ? (row.lostReason ? String(row.lostReason).trim().slice(0, 500) : 'Importado como perdido') : null,
          status: 'active',
          ingestionKey,
          createdBy: user._id,
          updatedBy: user._id,
          createdAt: now,
          updatedAt: now,
        };

        const validation = validateLeadDocument(leadDoc);
        if (!validation.isValid) {
          errors.push({ row: rowNum, error: validation.errors.join(' ') });
          continue;
        }

        try {
          const insertRes = await leadsCollection.insertOne(leadDoc);
          createdCount++;
          createdLeads.push(insertRes.insertedId);

          await logActivity(
            targetClientId,
            insertRes.insertedId,
            'system',
            `Prospecto importado vía CSV${assignedToUserId ? ' y asignado a vendedor.' : '.'}`,
            { source: 'csv', ingestionKey }
          );
        } catch (insertErr) {
          if (insertErr.code === 11000) {
            duplicateWarningCount++;
          } else {
            errors.push({ row: rowNum, error: 'Error al registrar la fila.' });
          }
        }
      }

      return jsonResponse(200, {
        message: `Importación completada. Creados: ${createdCount}, Advertencias de duplicados: ${duplicateWarningCount}, Errores: ${errors.length}.`,
        summary: {
          totalRows: parsedRows.length,
          createdCount,
          duplicateWarningCount,
          errorCount: errors.length,
          errors,
        },
      });
    }

    // ----------------------------------------------------
    // Route: /api/leads (Collection level)
    // ----------------------------------------------------
    if (segments.length === 0) {
      if (method === 'GET') {
        const params = event.queryStringParameters || {};
        const query = buildTenantFilter();

        if (params.stage && LEAD_STAGES.includes(params.stage)) {
          query.stage = params.stage;
        }

        if (params.source && LEAD_SOURCES.includes(params.source)) {
          query.source = params.source;
        }

        if (params.status) {
          query.status = params.status;
        } else {
          query.status = 'active'; // Default active leads
        }

        if (params.assignedToUserId && !isSalesperson) {
          const rawSpId = params.assignedToUserId.trim();
          if (ObjectId.isValid(rawSpId)) {
            query.assignedToUserId = new ObjectId(rawSpId);
          } else {
            query.assignedToUserId = rawSpId;
          }
        }

        if (params.search) {
          const search = params.search.trim();
          const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          query.$or = [
            { name: { $regex: escaped, $options: 'i' } },
            { normalizedEmail: { $regex: escaped.toLowerCase(), $options: 'i' } },
            { phone: { $regex: escaped, $options: 'i' } },
          ];
        }

        const page = Math.max(1, parseInt(params.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));
        const skip = (page - 1) * limit;

        const [leads, total] = await Promise.all([
          leadsCollection
            .find(query)
            .sort({ acquiredAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          leadsCollection.countDocuments(query),
        ]);

        // Enrich with assigned salesperson details
        const salespersonIds = leads
          .map((l) => l.assignedToUserId)
          .filter((id) => id && ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        const salespeople = salespersonIds.length > 0
          ? await usersCollection
              .find({ _id: { $in: salespersonIds } })
              .project({ displayName: 1, email: 1, photoURL: 1 })
              .toArray()
          : [];

        const spMap = new Map();
        salespeople.forEach((sp) => {
          spMap.set(sp._id.toString(), {
            id: sp._id.toString(),
            displayName: sp.displayName || sp.email,
            email: sp.email,
            photoURL: sp.photoURL || null,
          });
        });

        const formattedLeads = leads.map((doc) => {
          const sanitized = sanitizeLeadResponse(doc);
          if (doc.assignedToUserId) {
            sanitized.assignedToUser = spMap.get(doc.assignedToUserId.toString()) || null;
          }
          return sanitized;
        });

        return jsonResponse(200, {
          leads: formattedLeads,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        });
      }

      if (method === 'POST') {
        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        // Determine target client
        let targetClientId = null;
        if (!isGlobal) {
          targetClientId = user.clientId;
        } else {
          const rawClientId = body.clientId ? String(body.clientId).trim() : null;
          if (!rawClientId) {
            return errorResponse(400, 'Debe seleccionar la empresa a la que pertenece el prospecto.', 'CLIENT_REQUIRED');
          }
          const clientDoc = await clientsCollection.findOne({
            $or: [
              ...(ObjectId.isValid(rawClientId) ? [{ _id: new ObjectId(rawClientId) }] : []),
              { _id: rawClientId },
              { slug: rawClientId },
            ],
          });
          if (!clientDoc || clientDoc.status !== 'active') {
            return errorResponse(400, 'La empresa especificada no existe o está inactiva.', 'CLIENT_INACTIVE');
          }
          targetClientId = clientDoc._id;
        }

        // Determine salesperson assignment
        let assignedToUserId = null;
        if (isSalesperson) {
          assignedToUserId = user._id; // Salesperson is forced to assign to self
        } else if (body.assignedToUserId) {
          const rawSpId = String(body.assignedToUserId).trim();
          if (ObjectId.isValid(rawSpId)) {
            const spUser = await usersCollection.findOne({
              _id: new ObjectId(rawSpId),
              role: 'salesperson',
              status: { $in: ['active', 'invited'] },
              $or: [
                { clientId: targetClientId },
                { clientIds: targetClientId },
                { clientId: targetClientId.toString() },
                { clientIds: targetClientId.toString() },
              ],
            });
            if (!spUser) {
              return errorResponse(400, 'El usuario asignado debe ser un vendedor activo o invitado de esta empresa.', 'INVALID_SALESPERSON');
            }
            assignedToUserId = spUser._id;
          } else {
            return errorResponse(400, 'Identificador de vendedor inválido.', 'INVALID_SALESPERSON_ID');
          }
        }

        const name = (body.name || '').trim();
        const rawEmail = (body.email || '').trim();
        const rawPhone = (body.phone || '').trim();
        const normEmail = normalizeEmail(rawEmail);
        const normPhone = normalizePhone(rawPhone);
        const stage = LEAD_STAGES.includes(body.stage) ? body.stage : 'new';
        const source = LEAD_SOURCES.includes(body.source) ? body.source : 'manual';

        const leadData = {
          clientId: targetClientId,
          name,
          email: rawEmail || null,
          normalizedEmail: normEmail || null,
          phone: rawPhone || null,
          normalizedPhone: normPhone || null,
          stage,
          source,
          assignedToUserId,
          valueEstimateMinor: Number.isInteger(body.valueEstimateMinor) && body.valueEstimateMinor >= 0 ? body.valueEstimateMinor : 0,
          currency: body.currency === 'USD' ? 'USD' : 'ARS',
          notes: body.notes ? String(body.notes).trim().slice(0, 2000) : null,
          acquiredAt: body.acquiredAt ? new Date(body.acquiredAt) : now,
          firstContactedAt: stage === 'contacted' ? now : null,
          qualifiedAt: stage === 'qualified' ? now : null,
          wonAt: stage === 'won' ? now : null,
          lostAt: stage === 'lost' ? now : null,
          lostReason: stage === 'lost' ? (body.lostReason ? String(body.lostReason).trim().slice(0, 500) : null) : null,
          status: 'active',
          ingestionKey: null,
          createdBy: user._id,
          updatedBy: user._id,
          createdAt: now,
          updatedAt: now,
        };

        const validation = validateLeadDocument(leadData);
        if (!validation.isValid) {
          return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR', { errors: validation.errors });
        }

        // Check for duplicate warning (warn without blocking)
        let duplicateWarning = false;
        const duplicateMatch = await leadsCollection.findOne({
          clientId: targetClientId,
          $or: [
            ...(normEmail ? [{ normalizedEmail: normEmail }] : []),
            ...(normPhone ? [{ normalizedPhone: normPhone }] : []),
          ],
        });
        if (duplicateMatch) {
          duplicateWarning = true;
        }

        const insertRes = await leadsCollection.insertOne(leadData);
        const created = await leadsCollection.findOne({ _id: insertRes.insertedId });

        await logActivity(
          targetClientId,
          insertRes.insertedId,
          'stage_change',
          `Prospecto creado en etapa ${stage}.${assignedToUserId ? ' Asignado a vendedor.' : ''}`,
          { stage, assignedToUserId: assignedToUserId?.toString() }
        );

        return jsonResponse(201, {
          lead: sanitizeLeadResponse(created),
          message: 'Prospecto creado exitosamente.',
          duplicateWarning,
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    // ----------------------------------------------------
    // Resource Level Routes: /api/leads/:id ...
    // ----------------------------------------------------
    const targetLeadId = segments[0];
    if (!ObjectId.isValid(targetLeadId)) {
      return errorResponse(400, 'Identificador de prospecto inválido.', 'INVALID_ID');
    }

    const leadIdObj = new ObjectId(targetLeadId);
    const targetLead = await leadsCollection.findOne({ _id: leadIdObj });

    if (!targetLead) {
      return errorResponse(404, 'Prospecto no encontrado.', 'LEAD_NOT_FOUND');
    }

    // Tenant Scoping Verification
    if (!isGlobal && targetLead.clientId.toString() !== clientScope) {
      return errorResponse(403, 'No tienes autorización para acceder a este prospecto.', 'FORBIDDEN_LEAD_ACCESS');
    }

    // Salesperson Scoping Verification
    if (isSalesperson && targetLead.assignedToUserId?.toString() !== user._id.toString()) {
      return errorResponse(403, 'Solo puedes acceder a prospectos que tengas asignados.', 'FORBIDDEN_SALESPERSON_ACCESS');
    }

    // ----------------------------------------------------
    // Sub-actions: /api/leads/:id/:action
    // ----------------------------------------------------
    if (segments.length === 2) {
      const action = segments[1];

      // 1. Change Stage: POST /api/leads/:id/stage
      if (action === 'stage') {
        if (method !== 'POST') return errorResponse(405, 'Utilice POST.', 'METHOD_NOT_ALLOWED');

        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        const nextStage = body.stage;
        if (!LEAD_STAGES.includes(nextStage)) {
          return errorResponse(400, `Etapa inválida. Debe ser una de: ${LEAD_STAGES.join(', ')}`, 'INVALID_STAGE');
        }

        const updateFields = {
          stage: nextStage,
          updatedBy: user._id,
          updatedAt: now,
        };

        // Invariant: firstContactedAt set only on first contact
        if (nextStage === 'contacted' && !targetLead.firstContactedAt) {
          updateFields.firstContactedAt = now;
        }
        if (nextStage === 'qualified') {
          updateFields.qualifiedAt = now;
        }
        if (nextStage === 'won') {
          updateFields.wonAt = now;
        }
        if (nextStage === 'lost') {
          const reason = body.lostReason ? String(body.lostReason).trim().slice(0, 500) : '';
          if (!reason) {
            return errorResponse(400, 'El motivo de pérdida (lostReason) es obligatorio para marcar el lead como Perdido.', 'LOST_REASON_REQUIRED');
          }
          updateFields.lostAt = now;
          updateFields.lostReason = reason;
        } else if (targetLead.stage === 'lost') {
          // Cleaning active lost state when moving out of lost
          updateFields.lostAt = null;
          updateFields.lostReason = null;
        }

        await leadsCollection.updateOne({ _id: leadIdObj }, { $set: updateFields });
        const updated = await leadsCollection.findOne({ _id: leadIdObj });

        await logActivity(
          targetLead.clientId,
          leadIdObj,
          'stage_change',
          `Etapa cambiada de ${targetLead.stage} a ${nextStage}.`,
          { fromStage: targetLead.stage, toStage: nextStage, lostReason: updateFields.lostReason || null }
        );

        return jsonResponse(200, {
          lead: sanitizeLeadResponse(updated),
          message: 'Etapa comercial actualizada.',
        });
      }

      // 2. Assign Salesperson: POST /api/leads/:id/assign
      if (action === 'assign') {
        if (method !== 'POST') return errorResponse(405, 'Utilice POST.', 'METHOD_NOT_ALLOWED');

        if (isSalesperson) {
          return errorResponse(403, 'Los vendedores no tienen permisos para reasignar prospectos.', 'SALESPERSON_CANNOT_REASSIGN');
        }

        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        let newAssignedUserId = null;
        let assignedUserName = 'Sin asignar';

        if (body.assignedToUserId) {
          const spId = String(body.assignedToUserId).trim();
          if (ObjectId.isValid(spId)) {
            const spUser = await usersCollection.findOne({
              _id: new ObjectId(spId),
              role: 'salesperson',
              status: { $in: ['active', 'invited'] },
              $or: [
                { clientId: targetLead.clientId },
                { clientIds: targetLead.clientId },
                { clientId: targetLead.clientId.toString() },
                { clientIds: targetLead.clientId.toString() },
              ],
            });
            if (!spUser) {
              return errorResponse(400, 'El usuario asignado debe ser un vendedor activo o invitado de esta empresa.', 'INVALID_SALESPERSON');
            }
            newAssignedUserId = spUser._id;
            assignedUserName = spUser.displayName || spUser.email;
          } else {
            return errorResponse(400, 'Identificador de vendedor inválido.', 'INVALID_SALESPERSON_ID');
          }
        }

        await leadsCollection.updateOne(
          { _id: leadIdObj },
          {
            $set: {
              assignedToUserId: newAssignedUserId,
              updatedBy: user._id,
              updatedAt: now,
            },
          }
        );

        const updated = await leadsCollection.findOne({ _id: leadIdObj });

        await logActivity(
          targetLead.clientId,
          leadIdObj,
          'assignment',
          `Prospecto asignado a: ${assignedUserName}.`,
          { assignedToUserId: newAssignedUserId?.toString() }
        );

        return jsonResponse(200, {
          lead: sanitizeLeadResponse(updated),
          message: `Prospecto asignado a ${assignedUserName}.`,
        });
      }

      // 3. Archive: POST /api/leads/:id/archive
      if (action === 'archive') {
        if (method !== 'POST') return errorResponse(405, 'Utilice POST.', 'METHOD_NOT_ALLOWED');

        if (isSalesperson) {
          return errorResponse(403, 'No tienes permisos para archivar prospectos.', 'FORBIDDEN_ACTION');
        }

        await leadsCollection.updateOne(
          { _id: leadIdObj },
          { $set: { status: 'archived', updatedBy: user._id, updatedAt: now } }
        );
        const updated = await leadsCollection.findOne({ _id: leadIdObj });

        await logActivity(targetLead.clientId, leadIdObj, 'status_change', 'Prospecto archivado.', { status: 'archived' });

        return jsonResponse(200, {
          lead: sanitizeLeadResponse(updated),
          message: 'Prospecto archivado exitosamente.',
        });
      }

      // 4. Reactivate: POST /api/leads/:id/reactivate
      if (action === 'reactivate') {
        if (method !== 'POST') return errorResponse(405, 'Utilice POST.', 'METHOD_NOT_ALLOWED');

        if (isSalesperson) {
          return errorResponse(403, 'No tienes permisos para reactivar prospectos.', 'FORBIDDEN_ACTION');
        }

        await leadsCollection.updateOne(
          { _id: leadIdObj },
          { $set: { status: 'active', updatedBy: user._id, updatedAt: now } }
        );
        const updated = await leadsCollection.findOne({ _id: leadIdObj });

        await logActivity(targetLead.clientId, leadIdObj, 'status_change', 'Prospecto reactivado.', { status: 'active' });

        return jsonResponse(200, {
          lead: sanitizeLeadResponse(updated),
          message: 'Prospecto reactivado exitosamente.',
        });
      }

      // 5. Activities: GET & POST /api/leads/:id/activities
      if (action === 'activities') {
        if (method === 'GET') {
          const activities = await activitiesCollection
            .find({ leadId: leadIdObj })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray();

          return jsonResponse(200, {
            activities: activities.map(sanitizeActivityResponse),
            total: activities.length,
          });
        }

        if (method === 'POST') {
          let body;
          try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
          } catch {
            return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
          }

          const note = (body.note || body.description || '').trim();
          if (!note) {
            return errorResponse(400, 'El contenido de la nota no puede estar vacío.', 'EMPTY_NOTE');
          }

          if (note.length > 2000) {
            return errorResponse(400, 'La nota no puede superar los 2000 caracteres.', 'NOTE_TOO_LONG');
          }

          await logActivity(targetLead.clientId, leadIdObj, 'note', note, { raw: body.data || null });

          return jsonResponse(201, {
            message: 'Nota registrada exitosamente en el historial del prospecto.',
          });
        }

        return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
      }

      return errorResponse(404, 'Acción no encontrada.', 'ACTION_NOT_FOUND');
    }

    // ----------------------------------------------------
    // Direct /api/leads/:id (GET & PATCH)
    // ----------------------------------------------------
    if (segments.length === 1) {
      if (method === 'GET') {
        // Fetch associated sales
        const leadSales = await salesCollection
          .find({ leadId: leadIdObj })
          .sort({ soldAt: -1 })
          .toArray();

        // Fetch salesperson info
        let assignedUser = null;
        if (targetLead.assignedToUserId && ObjectId.isValid(targetLead.assignedToUserId)) {
          const spDoc = await usersCollection.findOne({ _id: new ObjectId(targetLead.assignedToUserId) });
          if (spDoc) {
            assignedUser = {
              id: spDoc._id.toString(),
              displayName: spDoc.displayName || spDoc.email,
              email: spDoc.email,
            };
          }
        }

        const sanitized = sanitizeLeadResponse(targetLead);
        sanitized.assignedToUser = assignedUser;
        sanitized.sales = leadSales.map(sanitizeSaleResponse);

        return jsonResponse(200, { lead: sanitized });
      }

      if (method === 'PATCH') {
        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        const updateFields = {
          updatedBy: user._id,
          updatedAt: now,
        };

        if (body.name !== undefined) {
          const name = String(body.name).trim();
          if (!name) return errorResponse(400, 'El nombre no puede estar vacío.', 'VALIDATION_ERROR');
          updateFields.name = name;
        }

        if (body.email !== undefined) {
          const rawEmail = String(body.email).trim();
          updateFields.email = rawEmail || null;
          updateFields.normalizedEmail = normalizeEmail(rawEmail) || null;
        }

        if (body.phone !== undefined) {
          const rawPhone = String(body.phone).trim();
          updateFields.phone = rawPhone || null;
          updateFields.normalizedPhone = normalizePhone(rawPhone) || null;
        }

        if (body.notes !== undefined) {
          updateFields.notes = String(body.notes).trim().slice(0, 2000) || null;
        }

        if (body.valueEstimateMinor !== undefined) {
          if (!Number.isInteger(body.valueEstimateMinor) || body.valueEstimateMinor < 0) {
            return errorResponse(400, 'El valor estimado debe ser un entero >= 0 en centavos.', 'VALIDATION_ERROR');
          }
          updateFields.valueEstimateMinor = body.valueEstimateMinor;
        }

        if (body.currency !== undefined && ['ARS', 'USD'].includes(body.currency)) {
          updateFields.currency = body.currency;
        }

        await leadsCollection.updateOne({ _id: leadIdObj }, { $set: updateFields });
        const updated = await leadsCollection.findOne({ _id: leadIdObj });

        await logActivity(targetLead.clientId, leadIdObj, 'stage_change', 'Datos de contacto del prospecto actualizados.');

        return jsonResponse(200, {
          lead: sanitizeLeadResponse(updated),
          message: 'Prospecto actualizado exitosamente.',
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    return errorResponse(404, 'Endpoint no encontrado.', 'NOT_FOUND');
  } catch (err) {
    // Sanitize log: log only system error message without PII
    console.error('[API_LEADS_ERROR]', err.message);
    return errorResponse(500, 'Error interno al procesar la solicitud de prospectos.', 'INTERNAL_SERVER_ERROR');
  }
}
