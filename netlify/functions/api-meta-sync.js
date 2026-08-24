import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import { getMetaConfig, timingSafeCompare, sanitizeMetaLog } from './_shared/metaConfig.js';

export const handler = async (event) => {
  try {
    const method = event.httpMethod;
    if (method !== 'POST') {
      return errorResponse(405, 'Método no permitido. Utilice POST.', 'METHOD_NOT_ALLOWED');
    }

    const config = getMetaConfig();
    const headers = event.headers || {};
    const cronHeader = headers['x-cron-auth'] || headers['X-Cron-Auth'];

    let isCronAuthorized = false;
    if (config.cronSecret && cronHeader) {
      isCronAuthorized = timingSafeCompare(cronHeader, config.cronSecret);
    }

    let executingUser = null;

    if (!isCronAuthorized) {
      // Require authenticated Firebase user with super_admin role
      const auth = await verifyAuthorizedUser(event);
      if (!auth.authorized || auth.user?.role !== 'super_admin') {
        return errorResponse(403, 'Solo el super_admin o el cron del sistema con autenticación válida pueden disparar la sincronización.', 'FORBIDDEN');
      }
      executingUser = auth.user;
    }

    const db = await getDb();
    const syncLogsCollection = db.collection('meta_sync_logs');

    let payload = {};
    try {
      if (event.body) {
        payload = JSON.parse(event.body);
      }
    } catch {
      // payload remains default
    }

    const { adAccountId, lookbackDays = 7, fullBackfill = false } = payload;
    const effectiveDays = fullBackfill ? 90 : Math.min(90, Math.max(1, lookbackDays));

    const targetAccountKey = adAccountId || 'ALL';
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 1. Mark stale/abandoned in_progress jobs
    await syncLogsCollection.updateMany(
      {
        status: 'in_progress',
        startedAt: { $lt: thirtyMinutesAgo },
      },
      {
        $set: {
          status: 'abandoned',
          finishedAt: new Date(),
          failureReason: 'Job marcado como abandonado tras superar 30 minutos sin finalizar.',
        },
      }
    );

    // 2. Concurrency lock: Check if an active sync is currently running or queued for this account
    const activeRunningJob = await syncLogsCollection.findOne({
      adAccountId: targetAccountKey,
      status: { $in: ['in_progress', 'queued'] },
      $or: [
        { startedAt: { $gte: thirtyMinutesAgo } },
        { createdAt: { $gte: thirtyMinutesAgo } },
      ],
    });

    if (activeRunningJob) {
      return errorResponse(
        409,
        `Ya existe una sincronización en progreso o en cola para ${targetAccountKey} iniciada hace menos de 30 minutos.`,
        'SYNC_JOB_ALREADY_RUNNING'
      );
    }

    const jobId = new ObjectId();
    const now = new Date();

    // 3. Create sync job log in queued state
    await syncLogsCollection.insertOne({
      _id: jobId,
      trigger: isCronAuthorized ? 'cron' : 'manual',
      triggeredByUserId: executingUser?._id || null,
      adAccountId: targetAccountKey,
      lookbackDays: effectiveDays,
      status: 'queued',
      createdAt: now,
      startedAt: null,
      finishedAt: null,
      attempt: 0,
      adAccountsProcessed: 0,
      rowsUpserted: 0,
      errorsCount: 0,
      errors: [],
    });

    // 4. Trigger Background Function asynchronously using server environment URL
    const serverBaseUrl = process.env.URL || process.env.TEST_URL_OVERRIDE;
    if (!serverBaseUrl) {
      console.error('[META_SYNC] Server URL not configured in process.env.URL');
      await syncLogsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            finishedAt: new Date(),
            failureReason: 'Server URL configuration missing',
          },
        }
      );
      return errorResponse(500, 'Configuración de URL del servidor faltante.', 'SERVER_URL_MISSING');
    }

    let url;
    try {
      url = new URL(serverBaseUrl);
    } catch (urlErr) {
      console.error('[META_SYNC] Invalid server URL format:', sanitizeMetaLog(urlErr.message));
      await syncLogsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            finishedAt: new Date(),
            failureReason: `Invalid server URL format: ${urlErr.message}`,
          },
        }
      );
      return errorResponse(500, 'Formato de URL del servidor no válido.', 'SERVER_URL_INVALID');
    }

    // Require HTTPS protocol in production/Netlify environment
    const isProd = process.env.NODE_ENV === 'production' || (process.env.URL && !process.env.URL.includes('localhost'));
    if (isProd && url.protocol !== 'https:') {
      console.error('[META_SYNC] Insecure protocol rejected in production:', url.protocol);
      await syncLogsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            finishedAt: new Date(),
            failureReason: 'Insecure protocol rejected in production',
          },
        }
      );
      return errorResponse(500, 'Protocolo inseguro rechazado.', 'SECURE_PROTOCOL_REQUIRED');
    }

    url.pathname = '/.netlify/functions/meta-sync-background';

    try {
      await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cron-Auth': config.cronSecret || '',
        },
        body: JSON.stringify({
          jobId: jobId.toString(),
        }),
      });
    } catch (fetchErr) {
      console.error('[META_SYNC] Error triggering background function:', fetchErr);
      await syncLogsCollection.updateOne(
        { _id: jobId },
        {
          $set: {
            status: 'failed',
            finishedAt: new Date(),
            failureReason: `Failed to trigger background worker: ${fetchErr.message}`,
          },
        }
      );
      return errorResponse(500, `Error al disparar la sincronización en segundo plano: ${sanitizeMetaLog(fetchErr.message)}`, 'SYNC_TRIGGER_FAILED');
    }

    return jsonResponse(202, {
      ok: true,
      jobId: jobId.toString(),
      trigger: isCronAuthorized ? 'cron' : 'manual',
      message: 'Sincronización iniciada en segundo plano.',
    });
  } catch (err) {
    console.error('[META_SYNC] Error during sync dispatch:', sanitizeMetaLog(err.message));
    return errorResponse(500, `Error al ejecutar sincronización: ${sanitizeMetaLog(err.message)}`, 'SYNC_ERROR');
  }
};
