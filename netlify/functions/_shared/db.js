import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;
let indexesEnsured = false;

/**
 * Idempotently verifies, migrates, and ensures all required database indexes.
 * Safely removes legacy non-partial firebaseUid indexes to support multiple invited users with null UIDs.
 *
 * @param {import('mongodb').Db} db
 */
export async function ensureIndexes(db) {
  const usersCollection = db.collection('users');
  const clientsCollection = db.collection('clients');

  // 1. Inspect and migrate legacy/incompatible indexes on users
  try {
    const existingUserIndexes = await usersCollection.indexes();
    for (const idx of existingUserIndexes) {
      // Check for index on firebaseUid key
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
            // Tolerate IndexNotFound or NamespaceNotFound during concurrent executions
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
    // If collection does not exist yet (NamespaceNotFound / code 26), continue to createIndex
    const isNamespaceNotFound = inspectErr.code === 26 || inspectErr.codeName === 'NamespaceNotFound';
    if (!isNamespaceNotFound) {
      console.warn('[DB] User index inspection warning:', inspectErr.message);
    }
  }

  // 2. Create canonical partial index for firebaseUid and unique index for normalizedEmail
  const createIndexSafely = async (collection, keys, options) => {
    try {
      await collection.createIndex(keys, options);
    } catch (createErr) {
      // Tolerate benign concurrent creation / existing index conflicts
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
  ]);
}

export async function connectToDatabase() {
  if (cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'anima_mkt_crm';

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  if (!indexesEnsured) {
    try {
      await ensureIndexes(db);
      indexesEnsured = true;
    } catch (indexErr) {
      console.warn('Index verification warning:', indexErr.message);
    }
  }

  return { client, db };
}
