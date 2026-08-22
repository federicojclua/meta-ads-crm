import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;
let indexesEnsured = false;

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
      const usersCollection = db.collection('users');
      await Promise.all([
        usersCollection.createIndex(
          { normalizedEmail: 1 },
          { unique: true, name: 'uniq_normalizedEmail' }
        ),
        usersCollection.createIndex(
          { firebaseUid: 1 },
          {
            unique: true,
            partialFilterExpression: { firebaseUid: { $type: 'string' } },
            name: 'uniq_partial_firebaseUid',
          }
        ),
        usersCollection.createIndex(
          { role: 1, status: 1 },
          { name: 'idx_role_status' }
        ),
      ]);
      indexesEnsured = true;
    } catch (indexErr) {
      console.warn('Index verification warning:', indexErr.message);
    }
  }

  return { client, db };
}
