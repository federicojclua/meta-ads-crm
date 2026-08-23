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
  ]);
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
