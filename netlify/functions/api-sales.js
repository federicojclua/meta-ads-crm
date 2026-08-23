import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  SALE_STATUSES,
  SUPPORTED_CURRENCIES,
  deriveSaleStatus,
  validateSaleDocument,
  sanitizeSaleResponse,
} from '../../models/Sale.js';
import { validateLeadActivity } from '../../models/LeadActivity.js';

export async function handler(event) {
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const isSalesperson = user.role === 'salesperson';
  const salesCollection = db.collection('sales');
  const leadsCollection = db.collection('leads');
  const clientsCollection = db.collection('clients');
  const activitiesCollection = db.collection('lead_activities');
  const method = event.httpMethod;
  const now = new Date();

  // Normalize path segments
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-sales/, '')
    .replace(/^\/api\/sales/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // Helper: Log activity on associated lead
    // ----------------------------------------------------
    const logLeadActivity = async (clientId, leadId, type, description, data = {}) => {
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
    // Route: /api/sales (Collection level)
    // ----------------------------------------------------
    if (segments.length === 0) {
      if (method === 'GET') {
        const params = event.queryStringParameters || {};
        let query = {};

        if (!isGlobal) {
          if (ObjectId.isValid(clientScope)) {
            query.clientId = new ObjectId(clientScope);
          } else {
            query.clientId = clientScope;
          }
        } else if (params.clientId) {
          const rawId = params.clientId.trim();
          if (ObjectId.isValid(rawId)) {
            query.clientId = new ObjectId(rawId);
          } else {
            query.clientId = rawId;
          }
        }

        if (params.leadId && ObjectId.isValid(params.leadId)) {
          query.leadId = new ObjectId(params.leadId);
        }

        if (params.status && SALE_STATUSES.includes(params.status)) {
          query.status = params.status;
        }

        if (params.currency && SUPPORTED_CURRENCIES.includes(params.currency)) {
          query.currency = params.currency;
        }

        // If salesperson, only show sales for leads assigned to them
        if (isSalesperson) {
          const assignedLeads = await leadsCollection
            .find({ assignedToUserId: user._id })
            .project({ _id: 1 })
            .toArray();
          const assignedLeadIds = assignedLeads.map((l) => l._id);
          query.leadId = { $in: assignedLeadIds };
        }

        const page = Math.max(1, parseInt(params.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));
        const skip = (page - 1) * limit;

        const [sales, total] = await Promise.all([
          salesCollection
            .find(query)
            .sort({ soldAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
          salesCollection.countDocuments(query),
        ]);

        return jsonResponse(200, {
          sales: sales.map(sanitizeSaleResponse),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
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

        const rawLeadId = body.leadId ? String(body.leadId).trim() : null;
        if (!rawLeadId || !ObjectId.isValid(rawLeadId)) {
          return errorResponse(400, 'Identificador de lead (leadId) requerido y válido.', 'INVALID_LEAD_ID');
        }

        const leadIdObj = new ObjectId(rawLeadId);
        const leadDoc = await leadsCollection.findOne({ _id: leadIdObj });
        if (!leadDoc) {
          return errorResponse(404, 'Prospecto asociado no encontrado.', 'LEAD_NOT_FOUND');
        }

        // Tenant scope check
        if (!isGlobal && leadDoc.clientId.toString() !== clientScope) {
          return errorResponse(403, 'No tienes autorización para registrar ventas en este prospecto.', 'FORBIDDEN_ACTION');
        }

        // Salesperson assignment check: salesperson can ONLY create sales for leads assigned to them
        if (isSalesperson && (!leadDoc.assignedToUserId || leadDoc.assignedToUserId.toString() !== user._id.toString())) {
          return errorResponse(403, 'Solo puedes registrar ventas en prospectos que tengas asignados.', 'FORBIDDEN_LEAD_ACCESS');
        }

        // Fetch client for currency verification
        const clientDoc = await clientsCollection.findOne({ _id: leadDoc.clientId });
        if (!clientDoc || clientDoc.status !== 'active') {
          return errorResponse(400, 'La empresa asociada a este prospecto está inactiva.', 'CLIENT_INACTIVE');
        }

        const amountMinor = parseInt(body.amountMinor, 10);
        const currency = body.currency || clientDoc.defaultCurrency || 'ARS';
        let initialCollectedMinor = 0;

        // Salesperson can only create pending sales; client/admin can create with initial collection
        if (!isSalesperson && body.collectedAmountMinor !== undefined) {
          initialCollectedMinor = Math.max(0, parseInt(body.collectedAmountMinor, 10) || 0);
        }

        const initialStatus = deriveSaleStatus(amountMinor, initialCollectedMinor);

        // Calculate default currency conversion if applicable
        const exchangeRateToDefault = Number(body.exchangeRateToDefault) > 0 ? Number(body.exchangeRateToDefault) : 1.0;
        let initialCollectedDefaultMinor = initialCollectedMinor;
        if (currency !== clientDoc.defaultCurrency && exchangeRateToDefault !== 1.0) {
          initialCollectedDefaultMinor = Math.round(initialCollectedMinor * exchangeRateToDefault);
        }

        const initialPayments = [];
        if (initialCollectedMinor > 0) {
          initialPayments.push({
            _id: new ObjectId(),
            amountMinor: initialCollectedMinor,
            amountDefaultMinor: initialCollectedDefaultMinor,
            exchangeRateToDefault,
            collectedAt: now,
            collectedBy: user._id,
            notes: 'Cobro inicial registrado al crear la venta.',
          });
        }

        const saleData = {
          clientId: leadDoc.clientId,
          leadId: leadIdObj,
          leadName: leadDoc.name,
          status: initialStatus,
          amountMinor,
          currency,
          collectedAmountMinor: initialCollectedMinor,
          collectedAmountDefaultMinor: initialCollectedDefaultMinor,
          payments: initialPayments,
          soldAt: body.soldAt ? new Date(body.soldAt) : now,
          collectedAt: initialCollectedMinor > 0 ? now : null,
          cancelledAt: null,
          notes: body.notes ? String(body.notes).trim().slice(0, 1000) : null,
          createdByUserId: user._id,
          createdAt: now,
          updatedAt: now,
        };

        const validation = validateSaleDocument(saleData, clientDoc);
        if (!validation.isValid) {
          return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR', { errors: validation.errors });
        }

        const insertRes = await salesCollection.insertOne(saleData);
        const createdSale = await salesCollection.findOne({ _id: insertRes.insertedId });

        // Log in lead activity
        const amountDisplay = (amountMinor / 100).toFixed(2);
        await logLeadActivity(
          leadDoc.clientId,
          leadIdObj,
          'sale_created',
          `Venta registrada por $${amountDisplay} ${currency} (Estado: ${initialStatus}).`,
          { saleId: insertRes.insertedId.toString(), amountMinor, currency, status: initialStatus }
        );

        // If lead was not in 'won' stage, automatically advance it to 'won' upon a sale
        if (leadDoc.stage !== 'won') {
          await leadsCollection.updateOne(
            { _id: leadIdObj },
            { $set: { stage: 'won', wonAt: now, updatedBy: user._id, updatedAt: now } }
          );
          await logLeadActivity(
            leadDoc.clientId,
            leadIdObj,
            'stage_change',
            'Prospecto avanzado automáticamente a etapa Ganado por registro de venta.',
            { fromStage: leadDoc.stage, toStage: 'won' }
          );
        }

        return jsonResponse(201, {
          sale: sanitizeSaleResponse(createdSale),
          message: 'Venta registrada exitosamente.',
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    // ----------------------------------------------------
    // Resource level: /api/sales/:id ...
    // ----------------------------------------------------
    const targetSaleId = segments[0];
    if (!ObjectId.isValid(targetSaleId)) {
      return errorResponse(400, 'Identificador de venta inválido.', 'INVALID_ID');
    }

    const saleIdObj = new ObjectId(targetSaleId);
    const targetSale = await salesCollection.findOne({ _id: saleIdObj });
    if (!targetSale) {
      return errorResponse(404, 'Venta no encontrada.', 'SALE_NOT_FOUND');
    }

    // Tenant Scoping
    if (!isGlobal && targetSale.clientId.toString() !== clientScope) {
      return errorResponse(403, 'No tienes autorización para acceder a esta venta.', 'FORBIDDEN_ACTION');
    }

    // Sub-actions: /api/sales/:id/collect and /api/sales/:id/cancel
    if (segments.length === 2) {
      const action = segments[1];

      // 1. Confirm collection: POST /api/sales/:id/collect (ATOMIC & IMMUTABLE)
      if (action === 'collect') {
        if (method !== 'POST') return errorResponse(405, 'Utilice POST.', 'METHOD_NOT_ALLOWED');

        if (isSalesperson) {
          return errorResponse(403, 'Los vendedores no tienen autorización para confirmar cobros de ventas.', 'CANNOT_CONFIRM_COLLECTIONS');
        }

        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        const additionalCollectedMinor = parseInt(body.collectedAmountMinor, 10);
        if (!Number.isInteger(additionalCollectedMinor) || additionalCollectedMinor <= 0) {
          return errorResponse(400, 'Debe ingresar un importe a cobrar positivo en centavos.', 'INVALID_COLLECTED_AMOUNT');
        }

        // Fetch client for default currency comparison
        const clientDoc = await clientsCollection.findOne({ _id: targetSale.clientId });
        const defaultCurrency = clientDoc?.defaultCurrency || 'ARS';
        const exchangeRateToDefault = Number(body.exchangeRateToDefault) > 0 ? Number(body.exchangeRateToDefault) : 1.0;

        let convertedAdditionalDefaultMinor = additionalCollectedMinor;
        if (targetSale.currency !== defaultCurrency && exchangeRateToDefault !== 1.0) {
          convertedAdditionalDefaultMinor = Math.round(additionalCollectedMinor * exchangeRateToDefault);
        }

        const paymentRecord = {
          _id: new ObjectId(),
          amountMinor: additionalCollectedMinor,
          amountDefaultMinor: convertedAdditionalDefaultMinor,
          exchangeRateToDefault,
          collectedAt: now,
          collectedBy: user._id,
          notes: body.notes ? String(body.notes).trim().slice(0, 500) : null,
        };

        // Atomic update in MongoDB to prevent race conditions and overcollection
        const updateResult = await salesCollection.findOneAndUpdate(
          {
            _id: saleIdObj,
            status: { $nin: ['cancelled', 'collected'] },
            $expr: {
              $lte: [
                { $add: [{ $ifNull: ['$collectedAmountMinor', 0] }, additionalCollectedMinor] },
                '$amountMinor',
              ],
            },
          },
          {
            $inc: {
              collectedAmountMinor: additionalCollectedMinor,
              collectedAmountDefaultMinor: convertedAdditionalDefaultMinor,
            },
            $push: {
              payments: paymentRecord,
            },
            $set: {
              collectedAt: now,
              updatedBy: user._id,
              updatedAt: now,
            },
          },
          { returnDocument: 'after' }
        );

        const updatedDoc = updateResult ? (updateResult.value || updateResult) : null;

        // If atomic condition failed, investigate exact reason and return structured error
        if (!updatedDoc || !updatedDoc.amountMinor) {
          const currentSaleState = await salesCollection.findOne({ _id: saleIdObj });
          if (!currentSaleState) {
            return errorResponse(404, 'Venta no encontrada.', 'SALE_NOT_FOUND');
          }
          if (currentSaleState.status === 'cancelled') {
            return errorResponse(400, 'No se pueden registrar cobros sobre una venta cancelada.', 'SALE_CANCELLED');
          }
          if (currentSaleState.status === 'collected' || currentSaleState.collectedAmountMinor >= currentSaleState.amountMinor) {
            return errorResponse(409, 'La venta ya se encuentra totalmente cobrada.', 'SALE_ALREADY_COLLECTED');
          }
          if ((currentSaleState.collectedAmountMinor || 0) + additionalCollectedMinor > currentSaleState.amountMinor) {
            return errorResponse(409, 'El importe ingresado excede el saldo restante de la venta.', 'COLLECTED_EXCEEDS_AMOUNT');
          }
          return errorResponse(409, 'Conflicto de concurrencia al registrar el cobro.', 'CONCURRENT_MODIFICATION_CONFLICT');
        }

        // Post-atomic status derivation
        const nextStatus = deriveSaleStatus(updatedDoc.amountMinor, updatedDoc.collectedAmountMinor, false);
        if (updatedDoc.status !== nextStatus) {
          await salesCollection.updateOne({ _id: saleIdObj }, { $set: { status: nextStatus } });
          updatedDoc.status = nextStatus;
        }

        const addedDisplay = (additionalCollectedMinor / 100).toFixed(2);
        const totalDisplay = (updatedDoc.collectedAmountMinor / 100).toFixed(2);
        await logLeadActivity(
          targetSale.clientId,
          targetSale.leadId,
          'payment_collected',
          `Cobro registrado por $${addedDisplay} ${targetSale.currency}. Total cobrado: $${totalDisplay} ${targetSale.currency} (${nextStatus}).`,
          { additionalCollectedMinor, newTotalCollected: updatedDoc.collectedAmountMinor, status: nextStatus }
        );

        return jsonResponse(200, {
          sale: sanitizeSaleResponse(updatedDoc),
          message: 'Cobro registrado exitosamente.',
        });
      }

      // 2. Cancel sale: POST /api/sales/:id/cancel
      if (action === 'cancel') {
        if (method !== 'POST') return errorResponse(405, 'Utilice POST.', 'METHOD_NOT_ALLOWED');

        if (isSalesperson) {
          return errorResponse(403, 'Los vendedores no tienen autorización para cancelar ventas.', 'CANNOT_CANCEL_SALES');
        }

        await salesCollection.updateOne(
          { _id: saleIdObj },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: now,
              updatedBy: user._id,
              updatedAt: now,
            },
          }
        );

        const updated = await salesCollection.findOne({ _id: saleIdObj });

        await logLeadActivity(
          targetSale.clientId,
          targetSale.leadId,
          'sale_updated',
          'Venta cancelada.',
          { saleId: saleIdObj.toString(), status: 'cancelled' }
        );

        return jsonResponse(200, {
          sale: sanitizeSaleResponse(updated),
          message: 'Venta cancelada exitosamente.',
        });
      }

      return errorResponse(404, 'Acción no encontrada.', 'ACTION_NOT_FOUND');
    }

    // Direct /api/sales/:id (GET & PATCH)
    if (segments.length === 1) {
      if (method === 'GET') {
        return jsonResponse(200, {
          sale: sanitizeSaleResponse(targetSale),
        });
      }

      if (method === 'PATCH') {
        if (isSalesperson && targetSale.status !== 'pending') {
          return errorResponse(403, 'Los vendedores no pueden editar ventas que ya registran cobros o canceladas.', 'FORBIDDEN_ACTION');
        }

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

        if (body.amountMinor !== undefined) {
          const amt = parseInt(body.amountMinor, 10);
          if (!Number.isInteger(amt) || amt < (targetSale.collectedAmountMinor || 0)) {
            return errorResponse(400, 'El importe total no puede ser inferior a lo ya cobrado.', 'INVALID_AMOUNT');
          }
          updateFields.amountMinor = amt;
          updateFields.status = deriveSaleStatus(amt, targetSale.collectedAmountMinor || 0);
        }

        if (body.notes !== undefined) {
          updateFields.notes = String(body.notes).trim().slice(0, 1000) || null;
        }

        await salesCollection.updateOne({ _id: saleIdObj }, { $set: updateFields });
        const updated = await salesCollection.findOne({ _id: saleIdObj });

        return jsonResponse(200, {
          sale: sanitizeSaleResponse(updated),
          message: 'Venta actualizada exitosamente.',
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    return errorResponse(404, 'Ruta no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_SALES_ERROR]', err.message);
    return errorResponse(500, 'Error interno del servidor al procesar las ventas.', 'INTERNAL_SERVER_ERROR');
  }
}
