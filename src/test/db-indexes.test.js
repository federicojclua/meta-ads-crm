import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureIndexes } from '../../netlify/functions/_shared/db.js';

describe('Database Indexes & Idempotent Migration', () => {
  let mockUsersCollection;
  let mockClientsCollection;
  let mockLeadsCollection;
  let mockLeadActivitiesCollection;
  let mockSalesCollection;
  let mockDb;

  beforeEach(() => {
    mockUsersCollection = {
      indexes: vi.fn().mockResolvedValue([]),
      dropIndex: vi.fn().mockResolvedValue(true),
      createIndex: vi.fn().mockResolvedValue(true),
    };

    mockClientsCollection = {
      createIndex: vi.fn().mockResolvedValue(true),
    };

    mockLeadsCollection = {
      indexes: vi.fn().mockResolvedValue([]),
      dropIndex: vi.fn().mockResolvedValue(true),
      createIndex: vi.fn().mockResolvedValue(true),
    };

    mockLeadActivitiesCollection = {
      createIndex: vi.fn().mockResolvedValue(true),
    };

    mockSalesCollection = {
      createIndex: vi.fn().mockResolvedValue(true),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'lead_activities') return mockLeadActivitiesCollection;
        if (name === 'sales') return mockSalesCollection;
        return null;
      }),
    };
  });

  it('1. Detecta y elimina de forma segura índices incompatibles/antiguos sobre firebaseUid', async () => {
    mockUsersCollection.indexes.mockResolvedValueOnce([
      { name: '_id_', key: { _id: 1 } },
      { name: 'firebaseUid_1', key: { firebaseUid: 1 }, unique: true },
    ]);

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

  it('2. Detecta y elimina índices incompatibles de ingestionKey y crea el índice compuesto canónico', async () => {
    // Non-compound legacy index on ingestionKey
    mockLeadsCollection.indexes.mockResolvedValueOnce([
      { name: '_id_', key: { _id: 1 } },
      { name: 'uniq_lead_ingestionKey', key: { ingestionKey: 1 }, unique: true },
    ]);

    await ensureIndexes(mockDb);

    expect(mockLeadsCollection.dropIndex).toHaveBeenCalledWith('uniq_lead_ingestionKey');
    expect(mockLeadsCollection.createIndex).toHaveBeenCalledWith(
      { clientId: 1, ingestionKey: 1 },
      {
        unique: true,
        partialFilterExpression: { ingestionKey: { $type: 'string' } },
        name: 'uniq_lead_client_ingestionKey',
      }
    );
  });

  it('3. Conserva el índice canónico uniq_lead_client_ingestionKey si ya existe con la expresión parcial exacta', async () => {
    mockLeadsCollection.indexes.mockResolvedValueOnce([
      { name: '_id_', key: { _id: 1 } },
      {
        name: 'uniq_lead_client_ingestionKey',
        key: { clientId: 1, ingestionKey: 1 },
        unique: true,
        partialFilterExpression: { ingestionKey: { $type: 'string' } },
      },
    ]);

    await ensureIndexes(mockDb);

    expect(mockLeadsCollection.dropIndex).not.toHaveBeenCalled();
    expect(mockLeadsCollection.createIndex).toHaveBeenCalledWith(
      { clientId: 1, ingestionKey: 1 },
      {
        unique: true,
        partialFilterExpression: { ingestionKey: { $type: 'string' } },
        name: 'uniq_lead_client_ingestionKey',
      }
    );
  });

  it('4. Crea índice único en normalizedEmail y todos los índices secundarios requeridos', async () => {
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

    // Verify leads collection indexes
    expect(mockLeadsCollection.createIndex).toHaveBeenCalledWith(
      { clientId: 1, stage: 1 },
      { name: 'idx_lead_client_stage' }
    );
    expect(mockLeadsCollection.createIndex).toHaveBeenCalledWith(
      { clientId: 1, ingestionKey: 1 },
      {
        unique: true,
        partialFilterExpression: { ingestionKey: { $type: 'string' } },
        name: 'uniq_lead_client_ingestionKey',
      }
    );
  });

  it('5. Tolera concurrentes IndexNotFound e IndexOptionsConflict sin fallar', async () => {
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
    mockLeadsCollection.createIndex.mockRejectedValue(conflictError);
    mockLeadActivitiesCollection.createIndex.mockRejectedValue(conflictError);
    mockSalesCollection.createIndex.mockRejectedValue(conflictError);

    await expect(ensureIndexes(mockDb)).resolves.not.toThrow();
  });
});
