import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureIndexes } from '../../netlify/functions/_shared/db.js';

describe('Database Indexes & Idempotent Migration', () => {
  let mockUsersCollection;
  let mockClientsCollection;
  let mockDb;

  beforeEach(() => {
    mockUsersCollection = {
      indexes: vi.fn(),
      dropIndex: vi.fn(),
      createIndex: vi.fn(),
    };

    mockClientsCollection = {
      createIndex: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        return null;
      }),
    };
  });

  it('1. Detecta y elimina de forma segura índices incompatibles/antiguos sobre firebaseUid', async () => {
    // Legacy index without partialFilterExpression
    mockUsersCollection.indexes.mockResolvedValueOnce([
      { name: '_id_', key: { _id: 1 } },
      { name: 'firebaseUid_1', key: { firebaseUid: 1 }, unique: true },
    ]);
    mockUsersCollection.dropIndex.mockResolvedValueOnce(true);
    mockUsersCollection.createIndex.mockResolvedValue(true);
    mockClientsCollection.createIndex.mockResolvedValue(true);

    await ensureIndexes(mockDb);

    expect(mockUsersCollection.dropIndex).toHaveBeenCalledWith('firebaseUid_1');
    expect(mockUsersCollection.createIndex).toHaveBeenCalledWith(
      { firebaseUid: 1 },
      {
        unique: true,
        partialFilterExpression: { firebaseUid: { $type: 'string' } },
        name: 'uniq_firebaseUid_when_bound',
      }
    );
  });

  it('2. Conserva el índice canónico uniq_firebaseUid_when_bound si ya existe con la expresión parcial exacta', async () => {
    mockUsersCollection.indexes.mockResolvedValueOnce([
      { name: '_id_', key: { _id: 1 } },
      {
        name: 'uniq_firebaseUid_when_bound',
        key: { firebaseUid: 1 },
        unique: true,
        partialFilterExpression: { firebaseUid: { $type: 'string' } },
      },
    ]);
    mockUsersCollection.createIndex.mockResolvedValue(true);
    mockClientsCollection.createIndex.mockResolvedValue(true);

    await ensureIndexes(mockDb);

    expect(mockUsersCollection.dropIndex).not.toHaveBeenCalled();
    expect(mockUsersCollection.createIndex).toHaveBeenCalledWith(
      { firebaseUid: 1 },
      {
        unique: true,
        partialFilterExpression: { firebaseUid: { $type: 'string' } },
        name: 'uniq_firebaseUid_when_bound',
      }
    );
  });

  it('3. Crea índice único en normalizedEmail y todos los índices secundarios requeridos', async () => {
    mockUsersCollection.indexes.mockResolvedValueOnce([]);
    mockUsersCollection.createIndex.mockResolvedValue(true);
    mockClientsCollection.createIndex.mockResolvedValue(true);

    await ensureIndexes(mockDb);

    // Verify normalizedEmail unique index
    expect(mockUsersCollection.createIndex).toHaveBeenCalledWith(
      { normalizedEmail: 1 },
      { unique: true, name: 'uniq_normalizedEmail' }
    );

    // Verify clients collection indexes
    expect(mockClientsCollection.createIndex).toHaveBeenCalledWith(
      { slug: 1 },
      { unique: true, name: 'uniq_client_slug' }
    );
    expect(mockClientsCollection.createIndex).toHaveBeenCalledWith(
      { metaAdAccountIds: 1 },
      { name: 'idx_client_metaAdAccountIds' }
    );
  });

  it('4. Tolera concurrentes IndexNotFound e IndexOptionsConflict sin fallar', async () => {
    mockUsersCollection.indexes.mockResolvedValueOnce([
      { name: 'old_idx', key: { firebaseUid: 1 } },
    ]);

    const indexNotFoundError = new Error('index not found');
    indexNotFoundError.code = 27;
    indexNotFoundError.codeName = 'IndexNotFound';
    mockUsersCollection.dropIndex.mockRejectedValueOnce(indexNotFoundError);

    const conflictError = new Error('Index options conflict');
    conflictError.code = 85;
    conflictError.codeName = 'IndexOptionsConflict';
    mockUsersCollection.createIndex.mockRejectedValue(conflictError);
    mockClientsCollection.createIndex.mockRejectedValue(conflictError);

    await expect(ensureIndexes(mockDb)).resolves.not.toThrow();
  });
});
