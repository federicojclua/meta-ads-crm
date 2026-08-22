import { ObjectId } from 'mongodb';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  generateSlug,
  validateClientDocument,
  sanitizeClientResponse,
} from '../../models/Client.js';

export async function handler(event) {
  // 1. Verify authorization & tenant scoping
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, db, clientScope, isGlobal } = auth;
  const clientsCollection = db.collection('clients');
  const method = event.httpMethod;
  const now = new Date();

  // Normalize path segments
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-clients/, '')
    .replace(/^\/api\/clients/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // Route: /api/clients (Collection level)
    // ----------------------------------------------------
    if (segments.length === 0) {
      if (method === 'GET') {
        let query = {};
        if (!isGlobal) {
          // Strict tenant scoping: force client's assigned scope
          if (ObjectId.isValid(clientScope)) {
            query = {
              $or: [
                { _id: new ObjectId(clientScope) },
                { _id: clientScope },
                { slug: clientScope },
              ],
            };
          } else {
            query = { slug: clientScope };
          }
        } else {
          // Optional status filter for admins
          const params = event.queryStringParameters || {};
          if (params.status) {
            query.status = params.status;
          }
          if (params.search) {
            query.normalizedName = { $regex: params.search.trim().toLowerCase() };
          }
        }

        const clients = await clientsCollection.find(query).sort({ createdAt: -1 }).toArray();
        return jsonResponse(200, {
          clients: clients.map(sanitizeClientResponse),
          total: clients.length,
        });
      }

      if (method === 'POST') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para crear nuevas empresas.', 'FORBIDDEN_ACTION');
        }

        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        const name = (body.name || '').trim();
        const slug = (body.slug || generateSlug(name)).trim().toLowerCase();
        const normalizedName = name.toLowerCase();

        const clientData = {
          name,
          normalizedName,
          slug,
          status: 'active',
          legalName: (body.legalName || '').trim() || null,
          country: (body.country || 'AR').trim().toUpperCase(),
          timezone: (body.timezone || 'America/Argentina/Tucuman').trim(),
          defaultCurrency: body.defaultCurrency === 'USD' ? 'USD' : 'ARS',
          enabledCurrencies: Array.isArray(body.enabledCurrencies) && body.enabledCurrencies.length > 0
            ? body.enabledCurrencies
            : ['ARS', 'USD'],
          metaBusinessId: body.metaBusinessId ? String(body.metaBusinessId).trim() : null,
          metaAdAccountIds: Array.isArray(body.metaAdAccountIds)
            ? body.metaAdAccountIds.map((id) => String(id).trim()).filter(Boolean)
            : [],
          createdBy: user._id,
          updatedBy: user._id,
          createdAt: now,
          updatedAt: now,
          deactivatedAt: null,
        };

        const validation = validateClientDocument(clientData);
        if (!validation.isValid) {
          return errorResponse(400, validation.errors.join(' '), 'VALIDATION_ERROR', { errors: validation.errors });
        }

        // Ensure unique slug
        const existingSlug = await clientsCollection.findOne({ slug });
        if (existingSlug) {
          return errorResponse(409, `El identificador/slug "${slug}" ya se encuentra registrado.`, 'SLUG_ALREADY_EXISTS');
        }

        // Ensure Meta Ad Accounts are not assigned to another client
        if (clientData.metaAdAccountIds.length > 0) {
          const existingAccountConflict = await clientsCollection.findOne({
            metaAdAccountIds: { $in: clientData.metaAdAccountIds },
          });
          if (existingAccountConflict) {
            return errorResponse(
              409,
              'Una o más cuentas publicitarias Meta ya se encuentran asignadas a otra empresa.',
              'META_AD_ACCOUNT_ALREADY_ASSIGNED'
            );
          }
        }

        const insertResult = await clientsCollection.insertOne(clientData);
        const createdClient = await clientsCollection.findOne({ _id: insertResult.insertedId });

        return jsonResponse(201, {
          client: sanitizeClientResponse(createdClient),
          message: 'Empresa creada exitosamente.',
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    // ----------------------------------------------------
    // Route: /api/clients/:id (Resource level)
    // ----------------------------------------------------
    const targetId = segments[0];
    let clientLookupQuery = { slug: targetId };
    if (ObjectId.isValid(targetId)) {
      clientLookupQuery = {
        $or: [
          { _id: new ObjectId(targetId) },
          { _id: targetId },
          { slug: targetId },
        ],
      };
    }

    const existingClient = await clientsCollection.findOne(clientLookupQuery);
    if (!existingClient) {
      return errorResponse(404, 'Empresa o cliente no encontrado.', 'CLIENT_NOT_FOUND');
    }

    // Tenant isolation verification for non-global users
    if (!isGlobal) {
      const allowedIdStr = clientScope;
      const currentClientIdStr = existingClient._id.toString();
      const currentClientSlug = existingClient.slug;

      if (allowedIdStr !== currentClientIdStr && allowedIdStr !== currentClientSlug) {
        return errorResponse(403, 'No tienes autorización para acceder a esta empresa.', 'FORBIDDEN_CLIENT_ACCESS');
      }
    }

    // Action sub-routes: /api/clients/:id/deactivate and /api/clients/:id/reactivate
    if (segments.length === 2) {
      const action = segments[1];

      if (action === 'deactivate') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para desactivar empresas.', 'FORBIDDEN_ACTION');
        }
        if (method !== 'POST') {
          return errorResponse(405, 'Utilice POST para desactivar.', 'METHOD_NOT_ALLOWED');
        }

        await clientsCollection.updateOne(
          { _id: existingClient._id },
          {
            $set: {
              status: 'inactive',
              deactivatedAt: now,
              updatedBy: user._id,
              updatedAt: now,
            },
          }
        );

        const updatedClient = await clientsCollection.findOne({ _id: existingClient._id });
        return jsonResponse(200, {
          client: sanitizeClientResponse(updatedClient),
          message: 'Empresa desactivada exitosamente.',
        });
      }

      if (action === 'reactivate') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para reactivar empresas.', 'FORBIDDEN_ACTION');
        }
        if (method !== 'POST') {
          return errorResponse(405, 'Utilice POST para reactivar.', 'METHOD_NOT_ALLOWED');
        }

        await clientsCollection.updateOne(
          { _id: existingClient._id },
          {
            $set: {
              status: 'active',
              deactivatedAt: null,
              updatedBy: user._id,
              updatedAt: now,
            },
          }
        );

        const updatedClient = await clientsCollection.findOne({ _id: existingClient._id });
        return jsonResponse(200, {
          client: sanitizeClientResponse(updatedClient),
          message: 'Empresa reactivada exitosamente.',
        });
      }

      return errorResponse(404, 'Acción no encontrada.', 'ACTION_NOT_FOUND');
    }

    // Direct /api/clients/:id operations
    if (segments.length === 1) {
      if (method === 'GET') {
        return jsonResponse(200, {
          client: sanitizeClientResponse(existingClient),
        });
      }

      if (method === 'PATCH') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para modificar empresas.', 'FORBIDDEN_ACTION');
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

        if (body.name !== undefined) {
          const name = String(body.name).trim();
          if (name.length === 0) {
            return errorResponse(400, 'El nombre no puede estar vacío.', 'INVALID_NAME');
          }
          updateFields.name = name;
          updateFields.normalizedName = name.toLowerCase();
        }

        if (body.legalName !== undefined) {
          updateFields.legalName = body.legalName ? String(body.legalName).trim() : null;
        }

        if (body.country !== undefined) {
          updateFields.country = String(body.country).trim().toUpperCase();
        }

        if (body.timezone !== undefined) {
          updateFields.timezone = String(body.timezone).trim();
        }

        if (body.defaultCurrency !== undefined) {
          if (!['ARS', 'USD'].includes(body.defaultCurrency)) {
            return errorResponse(400, 'Divisa por defecto no soportada.', 'INVALID_CURRENCY');
          }
          updateFields.defaultCurrency = body.defaultCurrency;
        }

        if (body.enabledCurrencies !== undefined) {
          if (!Array.isArray(body.enabledCurrencies) || body.enabledCurrencies.length === 0) {
            return errorResponse(400, 'enabledCurrencies debe ser un array no vacío.', 'INVALID_CURRENCIES');
          }
          updateFields.enabledCurrencies = body.enabledCurrencies;
        }

        if (body.metaBusinessId !== undefined) {
          updateFields.metaBusinessId = body.metaBusinessId ? String(body.metaBusinessId).trim() : null;
        }

        if (body.metaAdAccountIds !== undefined) {
          if (!Array.isArray(body.metaAdAccountIds)) {
            return errorResponse(400, 'metaAdAccountIds debe ser un array.', 'INVALID_ACCOUNTS');
          }
          const cleanedAccounts = body.metaAdAccountIds.map((id) => String(id).trim()).filter(Boolean);

          if (cleanedAccounts.length > 0) {
            const existingAccountConflict = await clientsCollection.findOne({
              _id: { $ne: existingClient._id },
              metaAdAccountIds: { $in: cleanedAccounts },
            });
            if (existingAccountConflict) {
              return errorResponse(
                409,
                'Una o más cuentas publicitarias Meta ya se encuentran asignadas a otra empresa.',
                'META_AD_ACCOUNT_ALREADY_ASSIGNED'
              );
            }
          }

          updateFields.metaAdAccountIds = cleanedAccounts;
        }

        await clientsCollection.updateOne(
          { _id: existingClient._id },
          { $set: updateFields }
        );

        const updated = await clientsCollection.findOne({ _id: existingClient._id });
        return jsonResponse(200, {
          client: sanitizeClientResponse(updated),
          message: 'Empresa actualizada exitosamente.',
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    return errorResponse(404, 'Ruta no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API-CLIENTS] Error:', err.message);
    return errorResponse(500, 'Error interno del servidor al procesar la empresa.', 'INTERNAL_SERVER_ERROR');
  }
}
