import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { validateExchangeRate } from '../../models/ExchangeRate.js';

export const handler = async (event) => {
  try {
    const auth = await verifyAuthorizedUser(event);
    if (!auth.authorized) {
      return errorResponse(auth.status, auth.error, auth.code);
    }

    const { user } = auth;
    const db = auth.db || (await getDb());
    const collection = db.collection('exchange_rates');
    const auditLogsCollection = db.collection('audit_logs');
    const method = event.httpMethod;

    // Route segments mapping
    const cleanPath = (event.path || '')
      .replace(/^\/\.netlify\/functions\/api-exchange-rates/, '')
      .replace(/^\/api\/exchange-rates/, '');
    const segments = cleanPath.split('/').filter(Boolean);

    // GET /api/exchange-rates - List all rates
    if (method === 'GET' && segments.length === 0) {
      const rates = await collection.find({}).sort({ validFrom: -1 }).toArray();
      return jsonResponse(200, {
        ok: true,
        exchangeRates: rates.map(r => ({
          id: r._id.toString(),
          baseCurrency: r.baseCurrency,
          quoteCurrency: r.quoteCurrency,
          quotePerBase: r.quotePerBase,
          rateType: r.rateType || 'official',
          validFrom: r.validFrom.toISOString(),
          validTo: r.validTo ? r.validTo.toISOString() : null,
          createdByUserId: r.createdByUserId ? r.createdByUserId.toString() : null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      });
    }

    // Require super_admin for modifying requests
    if (user.role !== 'super_admin') {
      return errorResponse(403, 'Acceso denegado. Se requiere rol de super_admin.', 'FORBIDDEN');
    }

    // POST /api/exchange-rates - Create exchange rate
    if (method === 'POST' && segments.length === 0) {
      let body;
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
      }

      // Normalization of rates payload
      const validFromDate = body.validFrom ? new Date(body.validFrom) : null;
      const validToDate = body.validTo ? new Date(body.validTo) : null;

      const rateDoc = {
        baseCurrency: (body.baseCurrency || '').toUpperCase(),
        quoteCurrency: (body.quoteCurrency || '').toUpperCase(),
        quotePerBase: Number(body.quotePerBase),
        rateType: body.rateType || 'official',
        validFrom: validFromDate,
        validTo: validToDate,
      };

      const validation = validateExchangeRate(rateDoc);
      if (!validation.isValid) {
        return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR', { errors: validation.errors });
      }

      // Check for overlap:
      // If we insert a new active rate (validTo = null)
      if (rateDoc.validTo === null) {
        const currentActive = await collection.findOne({
          baseCurrency: rateDoc.baseCurrency,
          quoteCurrency: rateDoc.quoteCurrency,
          validTo: null
        });

        if (currentActive) {
          if (rateDoc.validFrom <= currentActive.validFrom) {
            return errorResponse(
              400,
              'La fecha de inicio de la nueva tasa activa debe ser estrictamente posterior a la fecha de inicio de la tasa activa existente.',
              'INVALID_VALID_FROM'
            );
          }
          // Automatically close the previous active rate
          await collection.updateOne(
            { _id: currentActive._id },
            { $set: { validTo: rateDoc.validFrom, updatedAt: new Date() } }
          );
        }
      } else {
        // Checking overlaps when validTo is specified
        const overlap = await collection.findOne({
          baseCurrency: rateDoc.baseCurrency,
          quoteCurrency: rateDoc.quoteCurrency,
          $or: [
            {
              validFrom: { $lte: rateDoc.validTo },
              validTo: { $gte: rateDoc.validFrom }
            },
            {
              validFrom: { $lte: rateDoc.validTo },
              validTo: null
            }
          ]
        });

        if (overlap) {
          return errorResponse(
            409,
            'El intervalo de validez de esta tasa se solapa con una tasa de cambio existente.',
            'EXCHANGE_RATE_OVERLAP'
          );
        }
      }

      const now = new Date();
      const insertResult = await collection.insertOne({
        ...rateDoc,
        createdByUserId: user._id,
        createdAt: now,
        updatedAt: now,
      });

      // Audit log creation
      await auditLogsCollection.insertOne({
        action: 'CREATE_EXCHANGE_RATE',
        performedByUserId: user._id,
        performedAt: now,
        details: {
          rateId: insertResult.insertedId.toString(),
          baseCurrency: rateDoc.baseCurrency,
          quoteCurrency: rateDoc.quoteCurrency,
          quotePerBase: rateDoc.quotePerBase,
          validFrom: rateDoc.validFrom,
          validTo: rateDoc.validTo,
        },
      });

      return jsonResponse(201, {
        ok: true,
        id: insertResult.insertedId.toString(),
        message: 'Tasa de cambio creada exitosamente.',
      });
    }

    // DELETE /api/exchange-rates/:id
    if (method === 'DELETE' && segments.length === 1) {
      const targetIdStr = segments[0];
      if (!ObjectId.isValid(targetIdStr)) {
        return errorResponse(400, 'Identificador de tasa inválido.', 'INVALID_ID');
      }

      const targetId = new ObjectId(targetIdStr);
      const rateToDelete = await collection.findOne({ _id: targetId });
      if (!rateToDelete) {
        return errorResponse(404, 'Tasa de cambio no encontrada.', 'NOT_FOUND');
      }

      await collection.deleteOne({ _id: targetId });

      await auditLogsCollection.insertOne({
        action: 'DELETE_EXCHANGE_RATE',
        performedByUserId: user._id,
        performedAt: new Date(),
        details: {
          rateId: targetIdStr,
          baseCurrency: rateToDelete.baseCurrency,
          quoteCurrency: rateToDelete.quoteCurrency,
          quotePerBase: rateToDelete.quotePerBase,
        },
      });

      return jsonResponse(200, {
        ok: true,
        message: 'Tasa de cambio eliminada exitosamente.',
      });
    }

    return errorResponse(404, 'Ruta no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API_EXCHANGE_RATES_ERROR]', err.message);
    return errorResponse(500, 'Error interno al administrar tasas de cambio.', 'INTERNAL_SERVER_ERROR');
  }
};
