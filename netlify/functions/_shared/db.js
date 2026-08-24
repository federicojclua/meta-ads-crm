import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;
let indexesEnsured = false;

/**
 * Idempotently creates and migrates MongoDB collection indexes for multi-tenant isolation,
 * canonical user authorization, and commercial lead deduplication.
 * Tolerates concurrent serverless runs, missing collections, and benign index conflicts.
 *
 * @param {import('mongodb').Db} db
 */
export async function ensureIndexes(db) {
  const usersCollection = db.collection('users');
  const clientsCollection = db.collection('clients');
  const leadsCollection = db.collection('leads');
  const leadActivitiesCollection = db.collection('lead_activities');
  const salesCollection = db.collection('sales');

  // 1. Idempotent Migration for Users: inspect existing indexes on firebaseUid
  try {
    const existingUserIndexes = await usersCollection.indexes();
    for (const idx of existingUserIndexes) {
      if (idx.key && idx.key.firebaseUid === 1) {
        const isCanonical =
          idx.name === 'uniq_firebaseUid_when_bound' &&
          idx.unique === true &&
          idx.partialFilterExpression &&
          idx.partialFilterExpression.firebaseUid &&
          idx.partialFilterExpression.firebaseUid.$type === 'string';

        if (!isCanonical) {
          try {
            await usersCollection.dropIndex(idx.name);
          } catch (dropErr) {
            const isExpected =
              dropErr.code === 27 ||
              dropErr.code === 26 ||
              dropErr.codeName === 'IndexNotFound' ||
              dropErr.codeName === 'NamespaceNotFound';
            if (!isExpected) {
              throw dropErr;
            }
          }
        }
      }
    }
  } catch (inspectErr) {
    const isNamespaceNotFound = inspectErr.code === 26 || inspectErr.codeName === 'NamespaceNotFound';
    if (!isNamespaceNotFound) {
      console.warn('[DB] User index inspection warning:', inspectErr.message);
    }
  }

  // 2. Idempotent Migration for Leads: inspect existing indexes on ingestionKey
  try {
    const existingLeadIndexes = await leadsCollection.indexes();
    for (const idx of existingLeadIndexes) {
      if (idx.key && (idx.key.ingestionKey === 1 || (idx.key.clientId === 1 && idx.key.ingestionKey === 1))) {
        const isCanonical =
          idx.name === 'uniq_lead_client_ingestionKey' &&
          idx.unique === true &&
          idx.key.clientId === 1 &&
          idx.key.ingestionKey === 1 &&
          idx.partialFilterExpression &&
          idx.partialFilterExpression.ingestionKey &&
          idx.partialFilterExpression.ingestionKey.$type === 'string';

        if (!isCanonical) {
          try {
            await leadsCollection.dropIndex(idx.name);
          } catch (dropErr) {
            const isExpected =
              dropErr.code === 27 ||
              dropErr.code === 26 ||
              dropErr.codeName === 'IndexNotFound' ||
              dropErr.codeName === 'NamespaceNotFound';
            if (!isExpected) {
              throw dropErr;
            }
          }
        }
      }
    }
  } catch (inspectErr) {
    const isNamespaceNotFound = inspectErr.code === 26 || inspectErr.codeName === 'NamespaceNotFound';
    if (!isNamespaceNotFound) {
      console.warn('[DB] Lead index inspection warning:', inspectErr.message);
    }
  }

  // 3. Helper to safely create indexes tolerating concurrent creation
  const createIndexSafely = async (collection, keys, options) => {
    if (!collection || typeof collection.createIndex !== 'function') return;
    try {
      await collection.createIndex(keys, options);
    } catch (createErr) {
      const isBenignConflict =
        createErr.code === 85 || // IndexOptionsConflict
        createErr.code === 86 || // IndexKeySpecsConflict
        createErr.code === 11000 || // Already exists
        createErr.codeName === 'IndexOptionsConflict' ||
        createErr.codeName === 'IndexKeySpecsConflict';
      if (!isBenignConflict) {
        throw createErr;
      }
    }
  };

  await Promise.all([
    // Users Collection Indexes
    createIndexSafely(
      usersCollection,
      { firebaseUid: 1 },
      {
        unique: true,
        partialFilterExpression: { firebaseUid: { $type: 'string' } },
        name: 'uniq_firebaseUid_when_bound',
      }
    ),
    createIndexSafely(
      usersCollection,
      { normalizedEmail: 1 },
      { unique: true, name: 'uniq_normalizedEmail' }
    ),
    createIndexSafely(
      usersCollection,
      { role: 1, status: 1 },
      { name: 'idx_role_status' }
    ),
    createIndexSafely(
      usersCollection,
      { clientId: 1 },
      { name: 'idx_user_clientId' }
    ),

    // Clients Collection Indexes
    createIndexSafely(
      clientsCollection,
      { slug: 1 },
      { unique: true, name: 'uniq_client_slug' }
    ),
    createIndexSafely(
      clientsCollection,
      { normalizedName: 1 },
      { name: 'idx_client_normalizedName' }
    ),
    createIndexSafely(
      clientsCollection,
      { status: 1 },
      { name: 'idx_client_status' }
    ),
    createIndexSafely(
      clientsCollection,
      { metaAdAccountIds: 1 },
      { name: 'idx_client_metaAdAccountIds' }
    ),

    // Leads Collection Indexes
    createIndexSafely(
      leadsCollection,
      { clientId: 1, stage: 1 },
      { name: 'idx_lead_client_stage' }
    ),
    createIndexSafely(
      leadsCollection,
      { clientId: 1, assignedToUserId: 1 },
      { name: 'idx_lead_client_assignedTo' }
    ),
    createIndexSafely(
      leadsCollection,
      { clientId: 1, normalizedEmail: 1 },
      { name: 'idx_lead_client_email' }
    ),
    createIndexSafely(
      leadsCollection,
      { clientId: 1, normalizedPhone: 1 },
      { name: 'idx_lead_client_phone' }
    ),
    createIndexSafely(
      leadsCollection,
      { clientId: 1, acquiredAt: -1 },
      { name: 'idx_lead_client_acquiredAt' }
    ),
    createIndexSafely(
      leadsCollection,
      { clientId: 1, status: 1 },
      { name: 'idx_lead_client_status' }
    ),
    createIndexSafely(
      leadsCollection,
      { clientId: 1, ingestionKey: 1 },
      {
        unique: true,
        partialFilterExpression: { ingestionKey: { $type: 'string' } },
        name: 'uniq_lead_client_ingestionKey',
      }
    ),

    // Lead Activities Collection Indexes
    createIndexSafely(
      leadActivitiesCollection,
      { clientId: 1, leadId: 1, createdAt: -1 },
      { name: 'idx_activity_client_lead_date' }
    ),

    // Sales Collection Indexes
    createIndexSafely(
      salesCollection,
      { clientId: 1, leadId: 1 },
      { name: 'idx_sale_client_lead' }
    ),
    createIndexSafely(
      salesCollection,
      { clientId: 1, status: 1 },
      { name: 'idx_sale_client_status' }
    ),
    createIndexSafely(
      salesCollection,
      { clientId: 1, soldAt: -1 },
      { name: 'idx_sale_client_soldAt' }
    ),

    // =========================================================================
    // Stage 4: Meta Ads Collections & Indexes
    // =========================================================================
    // 1. Meta Insights Daily (Tenant-Scoped Unique Key & Query Indexes)
    createIndexSafely(
      db.collection('meta_insights_daily'),
      { clientId: 1, adAccountId: 1, adsetId: 1, date: 1, attributionSettingKey: 1, actionReportTime: 1 },
      {
        unique: true,
        name: 'uniq_insight_tenant_adset_date',
      }
    ),
    createIndexSafely(
      db.collection('meta_insights_daily'),
      { clientId: 1, date: 1, currency: 1 },
      { name: 'idx_insight_client_date_currency' }
    ),
    createIndexSafely(
      db.collection('meta_insights_daily'),
      { clientId: 1, campaignId: 1, date: 1 },
      { name: 'idx_insight_client_campaign_date' }
    ),
    createIndexSafely(
      db.collection('meta_insights_daily'),
      { clientId: 1, datasetId: 1, date: 1 },
      { name: 'idx_insight_client_dataset_date' }
    ),

    // 2. Meta Ad Accounts
    createIndexSafely(
      db.collection('meta_ad_accounts'),
      { adAccountId: 1 },
      { unique: true, name: 'uniq_meta_ad_account_id' }
    ),
    createIndexSafely(
      db.collection('meta_ad_accounts'),
      { assignedClientId: 1 },
      { name: 'idx_meta_ad_account_client' }
    ),

    // 3. Meta Data Sources (Datasets & Pixels)
    createIndexSafely(
      db.collection('meta_data_sources'),
      { metaDatasetId: 1 },
      { unique: true, name: 'uniq_meta_dataset_id' }
    ),
    createIndexSafely(
      db.collection('meta_data_sources'),
      { assignedClientId: 1 },
      { name: 'idx_meta_data_source_client' }
    ),

    // 4. Client Meta Scopes (Temporal Scoping)
    createIndexSafely(
      db.collection('client_meta_scopes'),
      { clientId: 1, adAccountId: 1, status: 1 },
      { name: 'idx_client_meta_scope_active' }
    ),

    // 5. Meta Campaigns & AdSets
    createIndexSafely(
      db.collection('meta_campaigns'),
      { campaignId: 1 },
      { unique: true, name: 'uniq_meta_campaign_id' }
    ),
    createIndexSafely(
      db.collection('meta_campaigns'),
      { adAccountId: 1, status: 1 },
      { name: 'idx_meta_campaign_account_status' }
    ),
    createIndexSafely(
      db.collection('meta_campaigns'),
      { assignedClientId: 1 },
      { name: 'idx_meta_campaign_client' }
    ),
    createIndexSafely(
      db.collection('meta_adsets'),
      { adsetId: 1 },
      { unique: true, name: 'uniq_meta_adset_id' }
    ),
    createIndexSafely(
      db.collection('meta_adsets'),
      { campaignId: 1 },
      { name: 'idx_meta_adset_campaign' }
    ),
    createIndexSafely(
      db.collection('meta_adsets'),
      { assignedClientId: 1 },
      { name: 'idx_meta_adset_client' }
    ),

    // 6. Meta Asset Conflicts
    createIndexSafely(
      db.collection('meta_asset_conflicts'),
      { conflictCode: 1, entityId: 1, resolvedAt: 1 },
      { name: 'idx_meta_conflict_lookup' }
    ),

    // 7. Meta Sync Checkpoints & Logs
    createIndexSafely(
      db.collection('meta_sync_checkpoints'),
      { adAccountId: 1, dateStart: 1, dateStop: 1 },
      { name: 'idx_meta_sync_checkpoint' }
    ),
    createIndexSafely(
      db.collection('meta_sync_logs'),
      { createdAt: -1 },
      { name: 'idx_meta_sync_logs_created' }
    ),
  ]);

  // 4. Idempotent Data Repair: Fix historical leads with invalid assignments (e.g. non-salesperson roles)
  await repairInvalidAssignments(db);
}

/**
 * Idempotently inspects and repairs leads with invalid salesperson assignments.
 * Detects leads assigned to users who are missing, suspended, non-salesperson (e.g. client role),
 * or belonging to another company. Clears assignment safely and writes an audit activity.
 *
 * @param {import('mongodb').Db} db
 */
export async function repairInvalidAssignments(db) {
  try {
    const leadsCollection = db.collection('leads');
    const usersCollection = db.collection('users');
    const activitiesCollection = db.collection('lead_activities');

    const assignedLeads = await leadsCollection
      .find({ assignedToUserId: { $ne: null } })
      .project({ _id: 1, clientId: 1, assignedToUserId: 1, name: 1 })
      .toArray();

    if (assignedLeads.length === 0) return;

    for (const lead of assignedLeads) {
      const assignedUser = await usersCollection.findOne({ _id: lead.assignedToUserId });

      let isInvalid = false;
      let reason = '';

      if (!assignedUser) {
        isInvalid = true;
        reason = 'Usuario asignado no existe en base de datos.';
      } else if (assignedUser.role !== 'salesperson') {
        isInvalid = true;
        reason = `Usuario asignado tiene rol '${assignedUser.role}' en lugar de 'salesperson'.`;
      } else if (!['active', 'invited'].includes(assignedUser.status)) {
        isInvalid = true;
        reason = `Usuario asignado tiene estado '${assignedUser.status}'.`;
      } else {
        // Verify tenant match
        const leadClientStr = lead.clientId?.toString();
        const userClientStr = assignedUser.clientId?.toString();
        const userInClientIds = (assignedUser.clientIds || []).some(
          (cid) => cid.toString() === leadClientStr
        );
        if (userClientStr !== leadClientStr && !userInClientIds) {
          isInvalid = true;
          reason = 'El vendedor asignado pertenece a otra empresa.';
        }
      }

      if (isInvalid) {
        const now = new Date();
        await leadsCollection.updateOne(
          { _id: lead._id },
          { $set: { assignedToUserId: null, updatedAt: now } }
        );

        await activitiesCollection.insertOne({
          clientId: lead.clientId,
          leadId: lead._id,
          type: 'assignment',
          description: `Asignación comercial corregida automáticamente: ${reason}`,
          data: {
            previousAssignedToUserId: lead.assignedToUserId?.toString(),
            repaired: true,
            reason,
          },
          performedBy: null,
          performedByName: 'Sistema (Mantenimiento)',
          createdAt: now,
        });

        console.log('[MAINTENANCE] Repaired invalid lead assignment:', {
          leadId: lead._id.toString(),
          reason,
        });
      }
    }
  } catch (err) {
    console.warn('[MAINTENANCE] Warning during assignment repair:', err.message);
  }
}

/**
 * Returns a connected MongoDB client and database instance.
 * Reuses active connections in serverless execution environments.
 *
 * @returns {Promise<{ client: MongoClient, db: import('mongodb').Db }>}
 */
export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  if (cachedClient && cachedDb) {
    if (!indexesEnsured) {
      await ensureIndexes(cachedDb);
      indexesEnsured = true;
    }
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
  });

  await client.connect();
  const db = client.db('anima_mkt_crm');

  if (!indexesEnsured) {
    await ensureIndexes(db);
    indexesEnsured = true;
  }

  cachedClient = client;
  cachedDb = db;

  return { client: cachedClient, db: cachedDb };
}

/**
 * Returns the active MongoDB database instance.
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}
