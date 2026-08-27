import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as sourcesHandler } from '../../netlify/functions/api-social-sources.js';
import { handler as snapshotHandler } from '../../netlify/functions/api-social-snapshot.js';
import { handler as analyzerHandler } from '../../netlify/functions/api-social-analyzer.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 8 — Backend Social APIs & Multi-Tenant Isolation Tests', () => {
  let mockSourcesCollection;
  let mockSnapshotsCollection;
  let mockAnalysesCollection;
  let mockRateLimitsCollection;
  let mockDb;

  const mockTenant1Id = new ObjectId('65df11111111111111111111');
  const mockTenant2Id = new ObjectId('65df22222222222222222222');

  const mockClientUser = {
    _id: new ObjectId('65df33333333333333333333'),
    email: 'client@empresa1.com',
    role: 'client',
    status: 'active',
    clientId: mockTenant1Id,
  };

  beforeEach(() => {
    mockSourcesCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockSnapshotsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockAnalysesCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockRateLimitsCollection = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ count: 1 }),
      createIndex: vi.fn().mockResolvedValue('ok'),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'social_sources') return mockSourcesCollection;
        if (name === 'social_snapshots') return mockSnapshotsCollection;
        if (name === 'social_analyses') return mockAnalysesCollection;
        if (name === 'rate_limits') return mockRateLimitsCollection;
        return null;
      }),
    };
  });

  // 1. Multi-Tenant Source Listing
  it('1. GET /api/social/sources para un usuario con rol client restringe las fuentes a su propio clientId', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    const mockSources = [
      {
        _id: new ObjectId('65df44444444444444444444'),
        clientId: mockTenant1Id,
        platform: 'instagram',
        accountUsername: 'empresa1_ig',
        accountName: 'Empresa 1',
        followersCount: 5000,
        status: 'active',
        createdAt: new Date(),
      },
    ];

    mockSourcesCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockSources),
      }),
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/social/sources',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await sourcesHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sources.length).toBe(1);
    expect(body.sources[0].accountUsername).toBe('empresa1_ig');

    // Verify query scoped to mockTenant1Id
    const queryPassed = mockSourcesCollection.find.mock.calls[0][0];
    expect(queryPassed).toHaveProperty('$or');
  });

  it('1b. GET /api/social/sources devuelve 200 con sources: [] cuando no hay perfiles creados', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    mockSourcesCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([]),
      }),
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/social/sources',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await sourcesHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sources).toEqual([]);
  });

  it('1c. GET /api/social/sources para usuario no global sin empresa asignada devuelve 200 con sources: [] en lugar de error', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { ...mockClientUser, clientId: null },
      db: mockDb,
      clientScope: null,
      isGlobal: false,
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/social/sources',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await sourcesHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sources).toEqual([]);
  });

  // 2. Multi-Tenant Cross-Access Prevention on Deletion
  it('2. DELETE /api/social/sources/:id rechaza con HTTP 403 si un cliente intenta eliminar una fuente de otra empresa', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    const foreignSourceId = new ObjectId('65df55555555555555555555');
    // Source belongs to Tenant 2
    mockSourcesCollection.findOne.mockResolvedValueOnce({
      _id: foreignSourceId,
      clientId: mockTenant2Id,
      platform: 'instagram',
      accountUsername: 'empresa2_ig',
    });

    const event = {
      httpMethod: 'DELETE',
      path: `/api/social/sources/${foreignSourceId.toString()}`,
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await sourcesHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(403);
    expect(body.code).toBe('FORBIDDEN_TENANT');
    expect(mockSourcesCollection.deleteOne).not.toHaveBeenCalled();
  });

  // 3. Snapshot Ingestion
  it('3. POST /api/social/snapshot ingesta publicaciones y actualiza el contador de la fuente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    const sourceId = new ObjectId('65df44444444444444444444');
    mockSourcesCollection.findOne.mockResolvedValueOnce({
      _id: sourceId,
      clientId: mockTenant1Id,
      platform: 'instagram',
      accountUsername: 'empresa1_ig',
      followersCount: 1000,
    });

    mockSnapshotsCollection.insertOne.mockResolvedValueOnce({
      insertedId: new ObjectId('65df66666666666666666666'),
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/social/snapshot',
      headers: { authorization: 'Bearer mock-token' },
      body: JSON.stringify({
        sourceId: sourceId.toString(),
        posts: [
          { timestamp: '2026-08-20T10:00:00Z', caption: 'Post test 1', format: 'reel', likes: 50 },
          { timestamp: '2026-08-22T10:00:00Z', caption: 'Post test 2', format: 'carousel', likes: 70 },
        ],
      }),
    };

    const res = await snapshotHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.postsCount).toBe(2);
    expect(mockSourcesCollection.updateOne).toHaveBeenCalledWith(
      { _id: sourceId },
      expect.objectContaining({ $set: expect.objectContaining({ mediaCount: 2 }) })
    );
  });

  // 4. Social Analyzer Run
  it('4. POST /api/social/analyze ejecuta el cálculo determinista y genera reporte estructurado', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    const sourceId = new ObjectId('65df44444444444444444444');
    mockSourcesCollection.findOne.mockResolvedValueOnce({
      _id: sourceId,
      clientId: mockTenant1Id,
      platform: 'instagram',
      accountUsername: 'empresa1_ig',
      followersCount: 5000,
    });

    mockSnapshotsCollection.findOne.mockResolvedValueOnce({
      _id: new ObjectId('65df77777777777777777777'),
      sourceId,
      clientId: mockTenant1Id,
      posts: [
        { id: '1', timestamp: '2026-08-10T10:00:00Z', format: 'reel', likes: 100, comments: 20, reach: 2000 },
        { id: '2', timestamp: '2026-08-14T10:00:00Z', format: 'carousel', likes: 80, comments: 10, reach: 1500 },
      ],
    });

    mockAnalysesCollection.insertOne.mockResolvedValueOnce({
      insertedId: new ObjectId('65df88888888888888888888'),
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/social/analyze',
      headers: { authorization: 'Bearer mock-token', 'client-ip': '127.0.0.1' },
      body: JSON.stringify({ sourceId: sourceId.toString() }),
    };

    const res = await analyzerHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.analysis).toBeDefined();
    expect(body.analysis.deterministicMetrics.postsCount).toBe(2);
    expect(body.analysis.aiReport.overallScore).toBeDefined();
    expect(body.analysis.aiReport.pillars).toBeDefined();
  });
});
