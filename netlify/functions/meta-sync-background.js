import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { getMetaConfig, timingSafeCompare, sanitizeMetaLog } from './_shared/metaConfig.js';
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

    // Strict timing-safe Cron authorization verification
    const isCronAuthorized = config.cronSecret && cronHeader && timingSafeCompare(cronHeader, config.cronSecret);
    if (!isCronAuthorized) {
      console.error('[META_BACKGROUND_SYNC] Unauthorized: invalid or missing cron token');
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

    if (!payload.jobId || !ObjectId.isValid(payload.jobId)) {
      console.error('[META_BACKGROUND_SYNC] Missing or invalid jobId in payload');
      return;
    }

    const jobId = new ObjectId(payload.jobId);
    const db = await getDb();
    const syncLogsCollection = db.collection('meta_sync_logs');

    // 1. Retrieve job from MongoDB to get trusted parameters
    const job = await syncLogsCollection.findOne({ _id: jobId });
    if (!job) {
      console.error(`[META_BACKGROUND_SYNC] Job ${jobId.toString()} not found in database.`);
      return;
    }

    // 2. Perform atomic queued -> in_progress transition to prevent race conditions
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
    const query = {
      _id: jobId,
      status: 'queued',
    };
    const update = {
      $set: {
        status: 'in_progress',
        startedAt: now,
        lockUntil,
      },
      $inc: { attempt: 1 },
    };

    const updateResult = await syncLogsCollection.findOneAndUpdate(query, update, { returnDocument: 'after' });
    const updatedJob = updateResult ? (updateResult.value || updateResult) : null;

    if (!updatedJob || updatedJob.status !== 'in_progress') {
      console.warn(`[META_BACKGROUND_SYNC] Job ${jobId.toString()} already acquired or not queued (current status: ${job.status}). Skipping.`);
      return;
    }

    // 3. Execute sync job using trusted parameters from database document
    const lookbackDays = updatedJob.lookbackDays || 7;
    const adAccountId = updatedJob.adAccountId || null;

    try {
      const result = await executeSyncJob(db, {
        jobId: updatedJob._id,
        adAccountId,
        lookbackDays,
      });

      if (result.status === 'skipped') {
        await syncLogsCollection.updateOne(
          { _id: updatedJob._id },
          {
            $set: {
              status: 'skipped',
              finishedAt: new Date(),
              failureReason: result.message || 'Meta API no configurada.',
            },
          }
        );
      }

      console.log(`[META_BACKGROUND_SYNC] Finished job ${jobId.toString()} with status: ${result.status}, rows: ${result.rowsUpserted}`);
    } catch (workerErr) {
      console.error('[META_BACKGROUND_SYNC] Fatal error during background execution:', workerErr);
      await syncLogsCollection.updateOne(
        { _id: updatedJob._id },
        {
          $set: {
            status: 'failed',
            finishedAt: new Date(),
            failureReason: sanitizeMetaLog(workerErr.message),
          },
        }
      );
    }
  } catch (err) {
    console.error('[META_BACKGROUND_SYNC] Fatal error during background execution:', err);
  }
};
