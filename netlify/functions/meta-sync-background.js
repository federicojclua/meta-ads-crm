import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { getMetaConfig } from './_shared/metaConfig.js';
import { executeSyncJob } from './_shared/metaSyncWorker.js';

/**
 * Netlify Background Function: meta-sync-background
 * Runs asynchronously for up to 15 minutes to process heavy Meta Graph API sync jobs.
 */
export const handler = async (event) => {
  const now = new Date();
  console.log(`[META_BACKGROUND_SYNC] Started at ${now.toISOString()}`);

  try {
    const config = getMetaConfig();
    const headers = event.headers || {};
    const cronHeader = headers['x-cron-auth'] || headers['X-Cron-Auth'];

    // Verify system cron token if invoked via webhook/cron
    if (config.cronSecret && cronHeader && cronHeader !== config.cronSecret) {
      console.error('[META_BACKGROUND_SYNC] Unauthorized cron token');
      return;
    }

    let payload = {};
    try {
      if (event.body) {
        payload = JSON.parse(event.body);
      }
    } catch {
      // payload remains empty
    }

    const db = await getDb();
    const syncLogsCollection = db.collection('meta_sync_logs');

    const jobId = new ObjectId();
    const lookbackDays = payload.fullBackfill ? 90 : payload.lookbackDays || 7;

    await syncLogsCollection.insertOne({
      _id: jobId,
      trigger: 'background_worker',
      adAccountId: payload.adAccountId || 'ALL',
      lookbackDays,
      status: 'in_progress',
      startedAt: now,
      finishedAt: null,
      adAccountsProcessed: 0,
      rowsUpserted: 0,
      errorsCount: 0,
      errors: [],
    });

    const result = await executeSyncJob(db, {
      jobId,
      adAccountId: payload.adAccountId || null,
      lookbackDays,
    });

    console.log(`[META_BACKGROUND_SYNC] Finished job ${jobId.toString()} with status: ${result.status}, rows: ${result.rowsUpserted}`);
  } catch (err) {
    console.error('[META_BACKGROUND_SYNC] Fatal error during background execution:', err);
  }
};
