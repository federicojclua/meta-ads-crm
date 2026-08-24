import { ObjectId } from 'mongodb';
import { MetaApiClient } from './metaClient.js';
import { sanitizeMetaLog } from './metaConfig.js';

/**
 * Normalizes action arrays from Graph API.
 * @param {Array} rawActions
 * @returns {Array<{ actionType: string, value: number }>}
 */
export function normalizeActions(rawActions) {
  if (!Array.isArray(rawActions)) return [];
  return rawActions.map((a) => ({
    actionType: a.action_type || 'unknown',
    value: parseFloat(a.value || 0) || 0,
  }));
}

/**
 * Normalizes action values (revenue) to minor units (cents).
 * @param {Array} rawActionValues
 * @returns {Array<{ actionType: string, valueMinor: number }>}
 */
export function normalizeActionValues(rawActionValues) {
  if (!Array.isArray(rawActionValues)) return [];
  return rawActionValues.map((a) => ({
    actionType: a.action_type || 'unknown',
    valueMinor: Math.round((parseFloat(a.value || 0) || 0) * 100),
  }));
}

/**
 * Normalizes cost per action type to minor units (cents).
 * @param {Array} rawCosts
 * @returns {Array<{ actionType: string, costMinor: number }>}
 */
export function normalizeCostPerActionType(rawCosts) {
  if (!Array.isArray(rawCosts)) return [];
  return rawCosts.map((a) => ({
    actionType: a.action_type || 'unknown',
    costMinor: Math.round((parseFloat(a.value || 0) || 0) * 100),
  }));
}

/**
 * Resolves which tenant (clientId) owns an adset on a specific date based on temporal scopes and dataset references.
 * @param {Object} params
 * @param {string} params.adAccountId
 * @param {string} params.adsetId
 * @param {string|null} params.datasetId
 * @param {string|null} params.campaignId
 * @param {string} params.dateStr - YYYY-MM-DD
 * @param {Array} params.activeScopes
 * @param {Array} params.adAccounts
 * @param {Array} params.dataSources
 * @returns {ObjectId|null}
 */
export function resolveAdSetTenant({
  adAccountId,
  datasetId,
  campaignId,
  dateStr,
  activeScopes,
  adAccounts,
  dataSources,
}) {
  const rowDate = new Date(`${dateStr}T12:00:00Z`);

  // 1. Try finding scope matching datasetId valid on rowDate
  if (datasetId) {
    const matchingScope = activeScopes.find((s) => {
      if (s.adAccountId !== adAccountId) return false;
      if (!(s.allowedDatasetIds || []).includes(datasetId)) return false;
      const from = new Date(s.effectiveFrom);
      const to = s.effectiveTo ? new Date(s.effectiveTo) : null;
      if (from > rowDate) return false;
      if (to && to < rowDate) return false;
      return true;
    });

    if (matchingScope) {
      return matchingScope.clientId;
    }

    // Check directly in dataSources collection
    const dsDoc = dataSources.find((d) => d.metaDatasetId === datasetId && d.assignedClientId);
    if (dsDoc) {
      return dsDoc.assignedClientId;
    }
  }

  // 2. Try finding scope matching manual campaign assignment
  if (campaignId) {
    const matchingCampScope = activeScopes.find((s) => {
      if (s.adAccountId !== adAccountId) return false;
      if (!(s.manuallyAssignedCampaignIds || []).includes(campaignId)) return false;
      const from = new Date(s.effectiveFrom);
      const to = s.effectiveTo ? new Date(s.effectiveTo) : null;
      if (from > rowDate) return false;
      if (to && to < rowDate) return false;
      return true;
    });

    if (matchingCampScope) {
      return matchingCampScope.clientId;
    }
  }

  // 3. Fallback: If adAccount has an exclusive tenant assigned
  const accountDoc = adAccounts.find((a) => a.adAccountId === adAccountId && a.assignedClientId);
  if (accountDoc) {
    return accountDoc.assignedClientId;
  }

  return null;
}

/**
 * Executes a full or incremental synchronization job for Meta Ads.
 * @param {import('mongodb').Db} db
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function executeSyncJob(db, options = {}) {
  const { jobId, adAccountId = null, lookbackDays = 7 } = options;
  const metaClient = new MetaApiClient();

  if (!metaClient.config.isConfigured) {
    return {
      status: 'skipped',
      message: 'Meta API no configurada en el servidor.',
      rowsUpserted: 0,
    };
  }

  const now = new Date();
  const dateUntil = now.toISOString().split('T')[0];
  const sinceDate = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const dateSince = sinceDate.toISOString().split('T')[0];

  const adAccountsCollection = db.collection('meta_ad_accounts');
  const dataSourcesCollection = db.collection('meta_data_sources');
  const scopesCollection = db.collection('client_meta_scopes');
  const campaignsCollection = db.collection('meta_campaigns');
  const adsetsCollection = db.collection('meta_adsets');
  const insightsCollection = db.collection('meta_insights_daily');
  const checkpointsCollection = db.collection('meta_sync_checkpoints');
  const syncLogsCollection = db.collection('meta_sync_logs');
  const conflictsCollection = db.collection('meta_asset_conflicts');

  // Load context collections
  const accountQuery = adAccountId ? { adAccountId } : {};
  const [targetAccounts, allScopes, allDataSources] = await Promise.all([
    adAccountsCollection.find(accountQuery).toArray(),
    scopesCollection.find({ status: { $in: ['active', 'archived'] } }).toArray(),
    dataSourcesCollection.find({}).toArray(),
  ]);

  if (targetAccounts.length === 0) {
    return {
      status: 'completed',
      message: 'No hay cuentas publicitarias registradas para sincronizar.',
      adAccountsProcessed: 0,
      rowsUpserted: 0,
    };
  }

  let totalRowsUpserted = 0;
  let totalErrors = 0;
  const errorDetails = [];

  for (const account of targetAccounts) {
    const accId = account.adAccountId;
    const checkpointId = `${accId}_${dateSince}_${dateUntil}`;

    try {
      // 1. Update Checkpoint: in_progress
      await checkpointsCollection.updateOne(
        { _id: checkpointId },
        {
          $set: {
            adAccountId: accId,
            dateStart: dateSince,
            dateStop: dateUntil,
            status: 'in_progress',
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      // 2. Fetch Campaigns
      const rawCampaigns = await metaClient.fetchAllPages(`${accId}/campaigns`, {
        params: {
          fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget',
          limit: 100,
        },
      }).catch((err) => {
        console.warn(`[SYNC_CAMPAIGNS] Warning on ${accId}:`, err.message);
        return [];
      });

      for (const camp of rawCampaigns) {
        await campaignsCollection.updateOne(
          { campaignId: camp.id },
          {
            $set: {
              adAccountId: accId,
              name: camp.name || 'Campaña sin nombre',
              objective: camp.objective || 'OUTCOME_TRAFFIC',
              status: camp.status || 'PAUSED',
              effectiveStatus: camp.effective_status || camp.status || 'PAUSED',
              dailyBudgetMinor: camp.daily_budget ? Math.round(parseFloat(camp.daily_budget) * 100) : null,
              lifetimeBudgetMinor: camp.lifetime_budget ? Math.round(parseFloat(camp.lifetime_budget) * 100) : null,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              assignedClientId: account.assignedClientId || null,
              hasMultipleTenants: false,
            },
          },
          { upsert: true }
        );
      }

      // 3. Fetch AdSets (including promoted_object to detect Pixel/Dataset)
      const rawAdsets = await metaClient.fetchAllPages(`${accId}/adsets`, {
        params: {
          fields: 'id,name,campaign_id,status,promoted_object,daily_budget,lifetime_budget',
          limit: 100,
        },
      }).catch((err) => {
        console.warn(`[SYNC_ADSETS] Warning on ${accId}:`, err.message);
        return [];
      });

      const adsetDatasetMap = new Map();

      for (const adset of rawAdsets) {
        const pixelId = adset.promoted_object?.pixel_id || adset.promoted_object?.custom_event_type || null;
        if (pixelId) {
          adsetDatasetMap.set(adset.id, pixelId);
        }

        await adsetsCollection.updateOne(
          { adsetId: adset.id },
          {
            $set: {
              campaignId: adset.campaign_id,
              adAccountId: accId,
              name: adset.name || 'Conjunto sin nombre',
              status: adset.status || 'PAUSED',
              promotedObject: adset.promoted_object || null,
              assignedDatasetId: pixelId,
              dailyBudgetMinor: adset.daily_budget ? Math.round(parseFloat(adset.daily_budget) * 100) : null,
              lifetimeBudgetMinor: adset.lifetime_budget ? Math.round(parseFloat(adset.lifetime_budget) * 100) : null,
              updatedAt: new Date(),
            },
            $setOnInsert: {
              assignedClientId: null,
            },
          },
          { upsert: true }
        );
      }

      // 4. Fetch Insights at AdSet Level
      const rawInsights = await metaClient.fetchAllPages(`${accId}/insights`, {
        params: {
          level: 'adset',
          time_increment: 1,
          time_range: { since: dateSince, until: dateUntil },
          fields: 'adset_id,campaign_id,date_start,date_stop,spend,impressions,reach,clicks,inline_link_clicks,actions,action_values,cost_per_action_type,attribution_setting',
          limit: 200,
        },
      });

      let accountUpserted = 0;
      const campaignTenantsMap = new Map(); // campaignId -> Set of clientIds

      for (const row of rawInsights) {
        const adsetId = row.adset_id;
        const campaignId = row.campaign_id;
        const dateStr = row.date_start;
        const datasetId = adsetDatasetMap.get(adsetId) || null;

        // Resolve authoritative tenant for this row
        const resolvedClientId = resolveAdSetTenant({
          adAccountId: accId,
          datasetId,
          campaignId,
          dateStr,
          activeScopes: allScopes,
          adAccounts: targetAccounts,
          dataSources: allDataSources,
        });

        // Track multi-tenant campaigns
        if (campaignId && resolvedClientId) {
          if (!campaignTenantsMap.has(campaignId)) {
            campaignTenantsMap.set(campaignId, new Set());
          }
          campaignTenantsMap.get(campaignId).add(resolvedClientId.toString());
        }

        // If no tenant could be resolved and account is not exclusive, we skip or use default tenant if exclusive
        const targetClientId = resolvedClientId || account.assignedClientId;
        if (!targetClientId) {
          // Unassigned insight in shared account; skip to avoid leaking
          continue;
        }

        const spendMinor = Math.round((parseFloat(row.spend || 0) || 0) * 100);
        const attributionSettingKey = row.attribution_setting || 'default';
        const actionReportTime = 'conversion';

        // Extract primary result count
        const actionsList = normalizeActions(row.actions);
        const leadAction = actionsList.find((a) => a.actionType === 'lead' || a.actionType.includes('lead'));
        const purchaseAction = actionsList.find((a) => a.actionType === 'purchase');
        const primaryResultType = leadAction ? 'lead' : purchaseAction ? 'purchase' : 'link_click';
        const primaryResultCount = leadAction ? leadAction.value : purchaseAction ? purchaseAction.value : parseInt(row.inline_link_clicks || 0, 10);

        await insightsCollection.updateOne(
          {
            clientId: targetClientId,
            adAccountId: accId,
            adsetId,
            date: dateStr,
            attributionSettingKey,
            actionReportTime,
          },
          {
            $set: {
              campaignId,
              datasetId,
              currency: account.currency || 'ARS',
              spendMinor,
              impressions: parseInt(row.impressions || 0, 10),
              reach: parseInt(row.reach || 0, 10),
              clicks: parseInt(row.clicks || 0, 10),
              linkClicks: parseInt(row.inline_link_clicks || 0, 10),
              landingPageViews: 0,
              actions: actionsList,
              actionValues: normalizeActionValues(row.action_values),
              costPerActionType: normalizeCostPerActionType(row.cost_per_action_type),
              primaryResultType,
              primaryResultCount,
              syncedAt: new Date(),
            },
            $setOnInsert: {
              createdAt: new Date(),
            },
          },
          { upsert: true }
        );

        accountUpserted++;
      }

      totalRowsUpserted += accountUpserted;

      // 5. Check and flag Mixed Tenant Campaigns
      for (const [campId, tenantsSet] of campaignTenantsMap.entries()) {
        if (tenantsSet.size > 1) {
          await campaignsCollection.updateOne(
            { campaignId: campId },
            { $set: { hasMultipleTenants: true, updatedAt: new Date() } }
          );

          await conflictsCollection.updateOne(
            { conflictCode: 'MIXED_TENANT_CAMPAIGN', entityId: campId },
            {
              $set: {
                conflictCode: 'MIXED_TENANT_CAMPAIGN',
                entityType: 'campaign',
                entityId: campId,
                affectedClientIds: Array.from(tenantsSet).map((id) => new ObjectId(id)),
                details: 'La campaña contiene conjuntos de anuncios asociados a diferentes empresas.',
                updatedAt: new Date(),
              },
              $setOnInsert: {
                detectedAt: new Date(),
                resolvedAt: null,
              },
            },
            { upsert: true }
          );
        }
      }

      // 6. Complete Checkpoint
      await checkpointsCollection.updateOne(
        { _id: checkpointId },
        {
          $set: {
            status: 'completed',
            rowsUpserted: accountUpserted,
            completedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } catch (accErr) {
      totalErrors++;
      const errorMsg = accErr.message || 'Error desconocido';
      errorDetails.push({ adAccountId: accId, error: errorMsg });

      await checkpointsCollection.updateOne(
        { _id: checkpointId },
        {
          $set: {
            status: 'failed',
            lastError: errorMsg,
            failedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  // Finalize Sync Log
  if (jobId) {
    await syncLogsCollection.updateOne(
      { _id: jobId },
      {
        $set: {
          status: totalErrors > 0 && totalRowsUpserted === 0 ? 'failed' : 'completed',
          finishedAt: new Date(),
          adAccountsProcessed: targetAccounts.length,
          rowsUpserted: totalRowsUpserted,
          errorsCount: totalErrors,
          errors: sanitizeMetaLog(errorDetails),
          durationMs: Date.now() - now.getTime(),
        },
      }
    );
  }

  return {
    status: totalErrors > 0 && totalRowsUpserted === 0 ? 'failed' : 'completed',
    adAccountsProcessed: targetAccounts.length,
    rowsUpserted: totalRowsUpserted,
    errorsCount: totalErrors,
    durationMs: Date.now() - now.getTime(),
  };
}
