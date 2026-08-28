import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { MetaApiClient } from './_shared/metaClient.js';
import { getMetaConfig, sanitizeMetaLog } from './_shared/metaConfig.js';
import { sanitizeMetaAdAccount } from '../../models/MetaAdAccount.js';
import { sanitizeMetaDataSource } from '../../models/MetaDataSource.js';
import { sanitizeClientMetaScope } from '../../models/ClientMetaScope.js';

async function findClient(idOrSlug, clientsCollection) {
  if (!idOrSlug) return null;
  if (!clientsCollection || typeof clientsCollection.findOne !== 'function') {
    return { _id: idOrSlug };
  }
  if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
    const doc = await clientsCollection.findOne({ _id: new ObjectId(idOrSlug) });
    if (doc) return doc;
  }
  const docByStrId = await clientsCollection.findOne({ _id: idOrSlug });
  if (docByStrId) return docByStrId;
  const docBySlug = await clientsCollection.findOne({ slug: idOrSlug });
  if (docBySlug) return docBySlug;
  return null;
}

export const handler = async (event) => {
  try {
    const auth = await verifyAuthorizedUser(event);
    if (!auth.authorized) {
      return errorResponse(auth.statusCode || 401, auth.error || 'No autorizado.', auth.code || 'UNAUTHORIZED');
    }

    const { user, isGlobal, clientScope } = auth;
    const method = event.httpMethod;
    const path = event.path || '';
    const metaClient = new MetaApiClient();

    // =========================================================================
    // 1. GET /api/meta/status -> Estado de conexión seguro (sin tokens expuestos)
    // =========================================================================
    if (method === 'GET' && path.endsWith('/status')) {
      const config = getMetaConfig();
      if (!config.isConfigured) {
        return jsonResponse(200, {
          ok: true,
          configured: false,
          connectionStatus: 'not_configured',
          apiVersion: config.apiVersion,
          hasAppId: Boolean(config.appId),
          hasAppSecret: Boolean(config.appSecret),
          hasSystemUserToken: Boolean(config.systemUserToken),
          hasBusinessId: Boolean(config.businessId),
          hasCronSecret: Boolean(config.cronSecret),
          manualSyncEnabled: process.env.META_MANUAL_SYNC_ENABLED === 'true',
        });
      }

      const connection = await metaClient.checkConnectionStatus();
      return jsonResponse(200, {
        ok: true,
        configured: connection.configured,
        connectionStatus: connection.connectionStatus,
        apiVersion: connection.apiVersion,
        hasAppId: Boolean(config.appId),
        hasAppSecret: Boolean(config.appSecret),
        hasSystemUserToken: Boolean(config.systemUserToken),
        hasBusinessId: Boolean(config.businessId),
        hasCronSecret: Boolean(config.cronSecret),
        manualSyncEnabled: process.env.META_MANUAL_SYNC_ENABLED === 'true',
      });
    }

    const db = auth.db || (await getDb());
    if (!db) {
      return errorResponse(500, 'Error conectando con la base de datos.', 'DATABASE_ERROR');
    }

    const adAccountsCollection = db.collection('meta_ad_accounts');
    const dataSourcesCollection = db.collection('meta_data_sources');
    const scopesCollection = db.collection('client_meta_scopes');
    const insightsCollection = db.collection('meta_insights_daily');
    const conflictsCollection = db.collection('meta_asset_conflicts');
    const clientsCollection = db.collection('clients');
    const previewsCollection = db.collection('meta_reclassify_previews');
    const auditLogsCollection = db.collection('audit_logs');

    // =========================================================================
    // 2. GET /api/meta/assets -> Catálogo de cuentas y datasets asignados
    // =========================================================================
    if (method === 'GET' && path.endsWith('/assets')) {
      let targetClientId = null;
      if (!isGlobal) {
        if (!clientScope) {
          return errorResponse(403, 'Usuario sin empresa asignada.', 'FORBIDDEN');
        }
        const clientDoc = await findClient(clientScope, clientsCollection);
        if (!clientDoc) {
          return errorResponse(404, 'Empresa no encontrada.', 'CLIENT_NOT_FOUND');
        }
        targetClientId = clientDoc._id;
      } else {
        const queryParams = event.queryStringParameters || {};
        const rawClientId = queryParams.clientId ? String(queryParams.clientId).trim() : '';
        if (rawClientId) {
          const clientDoc = await findClient(rawClientId, clientsCollection);
          if (clientDoc) {
            targetClientId = clientDoc._id;
          }
        }
      }

      const scopesQuery = { status: 'active' };
      if (targetClientId) {
        scopesQuery.clientId = targetClientId;
      }

      const activeScopes = await scopesCollection.find(scopesQuery).toArray();
      const allowedAdAccountIds = [...new Set(activeScopes.map((s) => s.adAccountId))];
      const allowedDatasetIds = [...new Set(activeScopes.flatMap((s) => s.allowedDatasetIds || []))];

      let adAccounts = [];
      let dataSources = [];

      if (isGlobal && !targetClientId) {
        // Super admin sees all registered assets
        adAccounts = await adAccountsCollection.find({}).sort({ name: 1 }).toArray();
        dataSources = await dataSourcesCollection.find({}).sort({ name: 1 }).toArray();
      } else {
        adAccounts = await adAccountsCollection
          .find({
            $or: [
              { adAccountId: { $in: allowedAdAccountIds } },
              ...(targetClientId ? [{ assignedClientId: targetClientId }] : []),
            ],
          })
          .sort({ name: 1 })
          .toArray();

        dataSources = await dataSourcesCollection
          .find({
            $or: [
              { metaDatasetId: { $in: allowedDatasetIds } },
              ...(targetClientId ? [{ assignedClientId: targetClientId }] : []),
            ],
          })
          .sort({ name: 1 })
          .toArray();
      }

      const conflicts = isGlobal
        ? await conflictsCollection.find({ resolvedAt: null }).sort({ detectedAt: -1 }).toArray()
        : [];

      return jsonResponse(200, {
        ok: true,
        adAccounts: adAccounts.map(sanitizeMetaAdAccount),
        dataSources: dataSources.map(sanitizeMetaDataSource),
        scopes: activeScopes.map(sanitizeClientMetaScope),
        conflicts,
      });
    }

    // =========================================================================
    // 3. POST /api/meta/assets/manual -> Carga manual de ID con validación oficial
    // =========================================================================
    if (method === 'POST' && path.endsWith('/assets/manual')) {
      if (!isGlobal || user.role !== 'super_admin') {
        return errorResponse(403, 'Solo el super_admin puede registrar identificadores manualmente.', 'FORBIDDEN');
      }

      let payload = {};
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const { type, id, name, currency = 'ARS', isExclusive = true } = payload;

      if (!type || !['ad_account', 'dataset', 'pixel'].includes(type)) {
        return errorResponse(400, "El tipo debe ser 'ad_account', 'dataset' o 'pixel'.", 'INVALID_TYPE');
      }

      if (!id || typeof id !== 'string') {
        return errorResponse(400, 'El identificador de Meta debe ser un string.', 'INVALID_META_ID');
      }

      const cleanId = id.trim();
      if (cleanId.length < 5 || cleanId.length > 25) {
        return errorResponse(400, 'El identificador de Meta debe tener entre 5 y 25 caracteres.', 'INVALID_META_ID');
      }

      // Check if it contains spaces or is a URL
      if (/\s/.test(cleanId) || cleanId.includes('/') || cleanId.includes(':')) {
        return errorResponse(400, 'El identificador de Meta no debe contener espacios ni caracteres de URL.', 'INVALID_META_ID');
      }

      // Numeric check (with optional 'act_' prefix for ad accounts)
      if (type === 'ad_account') {
        const numericPart = cleanId.startsWith('act_') ? cleanId.substring(4) : cleanId;
        if (!/^\d+$/.test(numericPart)) {
          return errorResponse(400, 'El identificador de cuenta publicitaria debe contener solo dígitos.', 'INVALID_META_ID');
        }
      } else {
        if (!/^\d+$/.test(cleanId)) {
          return errorResponse(400, 'El identificador de píxel/dataset debe contener solo dígitos.', 'INVALID_META_ID');
        }
      }

      const cleanName = (name || '').trim() || cleanId;
      const now = new Date();

      if (type === 'ad_account') {
        const adAccountId = cleanId.startsWith('act_') ? cleanId : `act_${cleanId}`;
        const existing = await adAccountsCollection.findOne({ adAccountId });
        if (existing) {
          return errorResponse(409, `La cuenta publicitaria ${adAccountId} ya está registrada.`, 'ACCOUNT_ALREADY_EXISTS');
        }

        const doc = {
          adAccountId,
          name: cleanName,
          currency: currency.toUpperCase(),
          timezoneName: 'America/Argentina/Buenos_Aires',
          accountStatus: 1,
          assignedClientId: null,
          isSharedAccount: !isExclusive,
          ownershipType: 'manual',
          createdAt: now,
          updatedAt: now,
        };

        await adAccountsCollection.insertOne(doc);
        return jsonResponse(201, {
          ok: true,
          asset: sanitizeMetaAdAccount(doc),
          message: 'Cuenta publicitaria registrada exitosamente.',
        });
      } else {
        // Pixel or Dataset manual registration with official validation if configured
        const metaDatasetId = cleanId;
        const existing = await dataSourcesCollection.findOne({ metaDatasetId });
        if (existing) {
          return errorResponse(409, `La fuente de datos ${metaDatasetId} ya está registrada.`, 'DATA_SOURCE_ALREADY_EXISTS');
        }

        // Validate against Meta if configured
        if (metaClient.config.isConfigured) {
          try {
            await metaClient.validatePixelId(metaDatasetId);
          } catch (valErr) {
            console.warn(`[MANUAL_ASSET_VALIDATION] Warning validating pixel ${metaDatasetId}:`, valErr.message);
          }
        }

        const doc = {
          metaDatasetId,
          name: cleanName,
          type: type === 'pixel' ? 'pixel' : 'dataset',
          assignedClientId: null,
          ownershipType: 'manual',
          isExclusive: Boolean(isExclusive),
          createdAt: now,
          updatedAt: now,
        };

        await dataSourcesCollection.insertOne(doc);
        return jsonResponse(201, {
          ok: true,
          asset: sanitizeMetaDataSource(doc),
          message: 'Fuente de datos (Píxel/Dataset) registrada exitosamente.',
        });
      }
    }

    // =========================================================================
    // 4. POST /api/meta/assign -> Asignación explícita con control de duplicados
    // =========================================================================
    if (method === 'POST' && path.endsWith('/assign')) {
      if (!isGlobal || user.role !== 'super_admin') {
        return errorResponse(403, 'Solo el super_admin puede asignar activos publicitarios.', 'FORBIDDEN');
      }

      let payload = {};
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const {
        clientId,
        adAccountId,
        allowedDatasetIds = [],
        manuallyAssignedCampaignIds = [],
        isExclusiveAccount = false,
        assignmentReason,
      } = payload;

      if (!clientId || !ObjectId.isValid(clientId)) {
        return errorResponse(400, 'clientId inválido o faltante.', 'INVALID_CLIENT_ID');
      }
      if (!adAccountId || typeof adAccountId !== 'string') {
        return errorResponse(400, 'adAccountId es requerido.', 'INVALID_AD_ACCOUNT_ID');
      }

      const cleanAdAccountId = adAccountId.trim();
      const numericAdAccount = cleanAdAccountId.startsWith('act_') ? cleanAdAccountId.substring(4) : cleanAdAccountId;
      if (cleanAdAccountId.length < 5 || cleanAdAccountId.length > 25 || !/^\d+$/.test(numericAdAccount) || /\s/.test(cleanAdAccountId) || cleanAdAccountId.includes('/') || cleanAdAccountId.includes(':')) {
        return errorResponse(400, 'adAccountId es inválido.', 'INVALID_AD_ACCOUNT_ID');
      }

      if (!Array.isArray(allowedDatasetIds)) {
        return errorResponse(400, 'allowedDatasetIds debe ser un array.', 'INVALID_DATASET_IDS');
      }

      for (const datasetId of allowedDatasetIds) {
        if (typeof datasetId !== 'string') {
          return errorResponse(400, 'El datasetId debe ser un string.', 'INVALID_DATASET_ID');
        }
        const cleanDatasetId = datasetId.trim();
        if (cleanDatasetId.length < 5 || cleanDatasetId.length > 25 || !/^\d+$/.test(cleanDatasetId) || /\s/.test(cleanDatasetId) || cleanDatasetId.includes('/') || cleanDatasetId.includes(':')) {
          return errorResponse(400, `El datasetId ${datasetId} es inválido.`, 'INVALID_DATASET_ID');
        }
      }

      if (!assignmentReason || typeof assignmentReason !== 'string' || assignmentReason.trim().length < 5) {
        return errorResponse(400, 'El motivo de asignación es obligatorio para auditoría (mínimo 5 caracteres).', 'REASON_REQUIRED');
      }

      const targetClient = await clientsCollection.findOne({ _id: new ObjectId(clientId), status: 'active' });
      if (!targetClient) {
        return errorResponse(404, 'Empresa cliente no encontrada o inactiva.', 'CLIENT_NOT_FOUND');
      }

      // Validate dataset conflict: check if any dataset is already assigned to a DIFFERENT company
      if (allowedDatasetIds.length > 0) {
        const conflictingSources = await dataSourcesCollection
          .find({
            metaDatasetId: { $in: allowedDatasetIds },
            assignedClientId: { $nin: [null, new ObjectId(clientId)] },
          })
          .toArray();

        if (conflictingSources.length > 0) {
          const conflictingIds = conflictingSources.map((s) => s.metaDatasetId).join(', ');
          return errorResponse(
            409,
            `Los siguientes Datasets ya están asignados a otra empresa: ${conflictingIds}. Resuelva el conflicto antes de asignar.`,
            'DATA_SOURCE_ALREADY_ASSIGNED'
          );
        }
      }

      const now = new Date();

      // Archive previous active scope for this client and account
      await scopesCollection.updateMany(
        {
          clientId: new ObjectId(clientId),
          adAccountId,
          status: 'active',
        },
        {
          $set: {
            status: 'archived',
            effectiveTo: now,
            updatedAt: now,
          },
        }
      );

      // Create new temporal scope
      const newScope = {
        clientId: new ObjectId(clientId),
        adAccountId,
        allowedDatasetIds: Array.isArray(allowedDatasetIds) ? allowedDatasetIds : [],
        manuallyAssignedCampaignIds: Array.isArray(manuallyAssignedCampaignIds) ? manuallyAssignedCampaignIds : [],
        isExclusiveAccount: Boolean(isExclusiveAccount),
        effectiveFrom: now,
        effectiveTo: null,
        assignedByUserId: user._id,
        assignmentReason: assignmentReason.trim(),
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      const insertResult = await scopesCollection.insertOne(newScope);

      // If account is exclusive, update assignedClientId on ad account
      if (isExclusiveAccount) {
        await adAccountsCollection.updateOne(
          { adAccountId },
          {
            $set: {
              assignedClientId: new ObjectId(clientId),
              isSharedAccount: false,
              updatedAt: now,
            },
          }
        );
      }

      // Update assignedClientId on datasets
      if (allowedDatasetIds.length > 0) {
        await dataSourcesCollection.updateMany(
          { metaDatasetId: { $in: allowedDatasetIds } },
          {
            $set: {
              assignedClientId: new ObjectId(clientId),
              updatedAt: now,
            },
          }
        );
      }

      return jsonResponse(201, {
        ok: true,
        scope: sanitizeClientMetaScope({ _id: insertResult.insertedId, ...newScope }),
        message: 'Asignación publicitaria registrada exitosamente.',
      });
    }

    // =========================================================================
    // 5. POST /api/meta/reclassify-historical -> Reclasificación en 2 fases con hash
    // =========================================================================
    if (method === 'POST' && path.endsWith('/reclassify-historical')) {
      if (!isGlobal || user.role !== 'super_admin') {
        return errorResponse(403, 'Solo el super_admin puede reclasificar datos históricos.', 'FORBIDDEN');
      }

      let payload = {};
      try {
        payload = JSON.parse(event.body || '{}');
      } catch {
        return errorResponse(400, 'Payload JSON inválido.', 'INVALID_JSON');
      }

      const {
        action = 'preview', // 'preview' | 'confirm'
        adAccountId,
        sourceClientId,
        targetClientId,
        dateStart,
        dateStop,
        assignmentReason,
        previewId,
        confirmationHash,
      } = payload;

      // FASE 1: PREVIEW (Dry-Run con emisión de hash firmado)
      if (action === 'preview' || payload.dryRun === true) {
        if (!adAccountId || !sourceClientId || !targetClientId || !dateStart || !dateStop) {
          return errorResponse(400, 'adAccountId, sourceClientId, targetClientId, dateStart y dateStop son obligatorios.', 'MISSING_PARAMS');
        }

        const filter = {
          adAccountId,
          clientId: new ObjectId(sourceClientId),
          date: { $gte: dateStart, $lte: dateStop },
        };

        const matchingInsights = await insightsCollection.find(filter).toArray();
        const totalSpendMinor = matchingInsights.reduce((acc, row) => acc + (row.spendMinor || 0), 0);
        const docIds = matchingInsights.map((doc) => doc._id.toString()).sort();

        // Generate SHA-256 confirmation hash
        const config = getMetaConfig();
        const secret = config.appSecret;
        if (!secret) {
          return jsonResponse(400, { ok: false, error: 'META_APP_SECRET no configurada. No se puede generar hash de reclasificación.' });
        }
        const hashPayload = `${adAccountId}:${sourceClientId}:${targetClientId}:${dateStart}:${dateStop}:${totalSpendMinor}:${docIds.length}`;
        const previewHash = crypto.createHmac('sha256', secret).update(hashPayload).digest('hex');

        const previewDoc = {
          adAccountId,
          sourceClientId: new ObjectId(sourceClientId),
          targetClientId: new ObjectId(targetClientId),
          dateStart,
          dateStop,
          assignmentReason: (assignmentReason || 'Reclasificación administrativa histórica').trim(),
          affectedDocumentsCount: docIds.length,
          totalSpendMinor,
          previewHash,
          createdByUserId: user._id,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes TTL
        };

        const previewInsert = await previewsCollection.insertOne(previewDoc);

        return jsonResponse(200, {
          ok: true,
          dryRun: true,
          previewId: previewInsert.insertedId.toString(),
          confirmationHash: previewHash,
          affectedDocumentsCount: docIds.length,
          totalSpendMinor,
          totalSpendFormatted: (totalSpendMinor / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 }),
          expiresAt: previewDoc.expiresAt.toISOString(),
          message: 'Previsualización calculada. Requiere confirmación con previewId y confirmationHash.',
        });
      }

      // FASE 2: CONFIRM (Ejecución real atómica validando el hash)
      if (action === 'confirm') {
        if (!previewId || !ObjectId.isValid(previewId) || !confirmationHash) {
          return errorResponse(400, 'previewId y confirmationHash son obligatorios para confirmar la reclasificación.', 'CONFIRMATION_REQUIRED');
        }

        const preview = await previewsCollection.findOne({ _id: new ObjectId(previewId) });
        if (!preview) {
          return errorResponse(404, 'Previsualización no encontrada.', 'PREVIEW_NOT_FOUND');
        }

        if (new Date() > new Date(preview.expiresAt)) {
          return errorResponse(410, 'La previsualización ha expirado. Genere una nueva previsualización.', 'PREVIEW_EXPIRED');
        }

        if (preview.previewHash !== confirmationHash) {
          return errorResponse(400, 'El hash de confirmación no coincide con la previsualización.', 'INVALID_CONFIRMATION_HASH');
        }

        const filter = {
          adAccountId: preview.adAccountId,
          clientId: preview.sourceClientId,
          date: { $gte: preview.dateStart, $lte: preview.dateStop },
        };

        const updateResult = await insightsCollection.updateMany(filter, {
          $set: {
            clientId: preview.targetClientId,
            reclassifiedAt: new Date(),
            reclassifiedByUserId: user._id,
            reclassificationReason: preview.assignmentReason,
          },
        });

        // Audit log
        await auditLogsCollection.insertOne({
          action: 'RECLASSIFY_HISTORICAL_INSIGHTS',
          performedByUserId: user._id,
          performedAt: new Date(),
          details: {
            adAccountId: preview.adAccountId,
            sourceClientId: preview.sourceClientId,
            targetClientId: preview.targetClientId,
            dateStart: preview.dateStart,
            dateStop: preview.dateStop,
            modifiedCount: updateResult.modifiedCount,
            reason: preview.assignmentReason,
          },
        });

        // Clean up preview
        await previewsCollection.deleteOne({ _id: preview._id });

        return jsonResponse(200, {
          ok: true,
          dryRun: false,
          modifiedCount: updateResult.modifiedCount,
          message: 'Reclasificación histórica ejecutada y auditada exitosamente.',
        });
      }

      return errorResponse(400, "Acción inválida. Utilice 'preview' o 'confirm'.", 'INVALID_ACTION');
    }

    // =========================================================================
    // 6. GET /api/meta/conflicts -> Conflictos multitenant
    // =========================================================================
    if (method === 'GET' && path.endsWith('/conflicts')) {
      if (!isGlobal || user.role !== 'super_admin') {
        return errorResponse(403, 'Solo el super_admin puede consultar conflictos.', 'FORBIDDEN');
      }

      const conflicts = await conflictsCollection.find({ resolvedAt: null }).sort({ detectedAt: -1 }).toArray();
      return jsonResponse(200, {
        ok: true,
        conflicts: conflicts.map((c) => ({
          id: c._id?.toString(),
          conflictCode: c.conflictCode,
          entityType: c.entityType,
          entityId: c.entityId,
          affectedClientIds: (c.affectedClientIds || []).map((id) => id.toString()),
          details: c.details || null,
          detectedAt: c.detectedAt,
        })),
      });
    }

    // =========================================================================
    // 7. POST /api/meta/discover -> Descubrimiento oficial contra Graph API v26.0
    // =========================================================================
    if (method === 'POST' && path.endsWith('/discover')) {
      if (!isGlobal || user.role !== 'super_admin') {
        return errorResponse(403, 'Solo el super_admin puede ejecutar el descubrimiento de activos.', 'FORBIDDEN');
      }

      if (!metaClient.config.isConfigured) {
        return errorResponse(503, 'Credenciales de Meta Ads no configuradas en el servidor.', 'META_NOT_CONFIGURED');
      }

      const businessId = metaClient.config.businessId;
      if (!businessId) {
        return errorResponse(400, 'META_BUSINESS_ID no configurado en el servidor para el descubrimiento.', 'BUSINESS_ID_MISSING');
      }

      try {
        // Query official verified edges: owned_ad_accounts, client_ad_accounts, owned_pixels
        const [ownedAccountsRes, clientAccountsRes, ownedPixelsRes] = await Promise.allSettled([
          metaClient.request(`${businessId}/owned_ad_accounts`, {
            params: { fields: 'id,name,currency,timezone_name,account_status' },
          }),
          metaClient.request(`${businessId}/client_ad_accounts`, {
            params: { fields: 'id,name,currency,timezone_name,account_status' },
          }),
          metaClient.request(`${businessId}/owned_pixels`, {
            params: { fields: 'id,name,is_unavailable,creation_time' },
          }),
        ]);

        const allAccounts = [];
        if (ownedAccountsRes.status === 'fulfilled' && ownedAccountsRes.value?.data?.data) {
          allAccounts.push(...ownedAccountsRes.value.data.data.map((a) => ({ ...a, ownershipType: 'owned' })));
        }
        if (clientAccountsRes.status === 'fulfilled' && clientAccountsRes.value?.data?.data) {
          allAccounts.push(...clientAccountsRes.value.data.data.map((a) => ({ ...a, ownershipType: 'client' })));
        }

        const allPixels = [];
        if (ownedPixelsRes.status === 'fulfilled' && ownedPixelsRes.value?.data?.data) {
          allPixels.push(...ownedPixelsRes.value.data.data);
        }

        const now = new Date();
        let upsertedAccountsCount = 0;
        let upsertedPixelsCount = 0;

        for (const acc of allAccounts) {
          const adAccountId = acc.id.startsWith('act_') ? acc.id : `act_${acc.id}`;
          await adAccountsCollection.updateOne(
            { adAccountId },
            {
              $set: {
                name: acc.name || 'Sin Nombre',
                currency: acc.currency || 'ARS',
                timezoneName: acc.timezone_name || 'America/Argentina/Buenos_Aires',
                accountStatus: acc.account_status || 1,
                ownershipType: acc.ownershipType || 'owned',
                updatedAt: now,
              },
              $setOnInsert: {
                discoveredAt: now,
                assignedClientId: null,
                isSharedAccount: false,
                createdAt: now,
              },
            },
            { upsert: true }
          );
          upsertedAccountsCount++;
        }

        for (const px of allPixels) {
          await dataSourcesCollection.updateOne(
            { metaDatasetId: px.id },
            {
              $set: {
                name: px.name || `Píxel ${px.id}`,
                type: 'pixel',
                ownershipType: 'owned',
                updatedAt: now,
              },
              $setOnInsert: {
                discoveredAt: now,
                assignedClientId: null,
                isExclusive: true,
                createdAt: now,
              },
            },
            { upsert: true }
          );
          upsertedPixelsCount++;
        }

        return jsonResponse(200, {
          ok: true,
          discoveredAccountsCount: allAccounts.length,
          discoveredPixelsCount: allPixels.length,
          upsertedAccountsCount,
          upsertedPixelsCount,
          message: 'Descubrimiento de activos oficiales completado exitosamente.',
        });
      } catch (err) {
        return errorResponse(500, `Error durante el descubrimiento: ${sanitizeMetaLog(err.message)}`, err.metaType || 'DISCOVERY_FAILED');
      }
    }

    return errorResponse(404, 'Ruta no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[META_ASSETS_ERROR]', sanitizeMetaLog(err.message));
    return errorResponse(500, 'Error interno en administración de activos de Meta.', 'INTERNAL_SERVER_ERROR');
  }
};
