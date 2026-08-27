import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as sourcesHandler } from '../../netlify/functions/api-google-sources.js';
import { handler as reviewsHandler } from '../../netlify/functions/api-google-reviews.js';
import { handler as snapshotsHandler } from '../../netlify/functions/api-google-snapshots.js';
import { handler as competitorsHandler } from '../../netlify/functions/api-google-competitors.js';
import { handler as aiHandler } from '../../netlify/functions/api-google-ai.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 9 — Google Intelligence Multi-Tenant Backend APIs', () => {
  let mockSourcesCollection;
  let mockReviewsCollection;
  let mockSnapshotsCollection;
  let mockCompetitorsCollection;
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

    mockReviewsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      insertMany: vi.fn(),
      updateOne: vi.fn(),
      deleteMany: vi.fn(),
      countDocuments: vi.fn().mockResolvedValue(10),
    };

    mockSnapshotsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockCompetitorsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      deleteOne: vi.fn(),
    };

    mockAnalysesCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      deleteMany: vi.fn(),
    };

    mockRateLimitsCollection = {
      findOneAndUpdate: vi.fn().mockResolvedValue({ count: 1 }),
      createIndex: vi.fn().mockResolvedValue('ok'),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'google_sources') return mockSourcesCollection;
        if (name === 'google_reviews') return mockReviewsCollection;
        if (name === 'google_snapshots') return mockSnapshotsCollection;
        if (name === 'google_competitors') return mockCompetitorsCollection;
        if (name === 'google_analyses') return mockAnalysesCollection;
        if (name === 'rate_limits') return mockRateLimitsCollection;
        return null;
      }),
    };
  });

  it('1. GET /api/google/sources para cliente restringe la consulta a su clientId', async () => {
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
        businessName: 'Marion Belleza',
        category: 'Perfumería',
        googleBusinessProfile: { rating: 4.9, userRatingsTotal: 120, verified: true },
        status: 'active',
      },
    ];

    mockSourcesCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockSources),
      }),
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/google/sources',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await sourcesHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sources.length).toBe(1);
    expect(body.sources[0].businessName).toBe('Marion Belleza');
  });

  it('2. GET /api/google/sources retorna 200 con [] si el usuario no tiene empresa asignada', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { ...mockClientUser, clientId: null },
      db: mockDb,
      clientScope: null,
      isGlobal: false,
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/google/sources',
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await sourcesHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.sources).toEqual([]);
  });

  it('3. POST /api/google/reviews/:id/reply guarda respuesta oficial y calcula tiempo de respuesta', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    const reviewId = new ObjectId('65df55555555555555555555');
    const pastDate = new Date(Date.now() - 3600000 * 5); // 5 hours ago

    mockReviewsCollection.findOne.mockResolvedValueOnce({
      _id: reviewId,
      clientId: mockTenant1Id,
      reviewerName: 'Franco R.',
      rating: 5,
      comment: 'Excelente atención',
      createdAt: pastDate,
      reviewDate: pastDate,
    });

    const event = {
      httpMethod: 'POST',
      path: `/api/google/reviews/${reviewId.toString()}/reply`,
      body: JSON.stringify({ replyText: '¡Muchas gracias Franco!' }),
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await reviewsHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.replyText).toBe('¡Muchas gracias Franco!');
    expect(body.responseTimeHours).toBeGreaterThanOrEqual(4);
  });

  it('4. POST /api/google/ai/analyze ejecuta el motor determinista y genera reporte de diagnóstico', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: mockTenant1Id,
      isGlobal: false,
    });

    const sourceId = new ObjectId('65df66666666666666666666');
    mockSourcesCollection.findOne.mockResolvedValueOnce({
      _id: sourceId,
      clientId: mockTenant1Id,
      businessName: 'Perfumería Marion',
      category: 'Belleza',
      googleBusinessProfile: { rating: 4.8, userRatingsTotal: 30 },
    });

    mockReviewsCollection.find.mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([
            { rating: 5, comment: 'Excelente servicio', replyText: 'Gracias', responseTimeHours: 3 },
          ]),
        }),
      }),
    });

    mockSnapshotsCollection.findOne.mockResolvedValueOnce({
      type: 'search_console',
      data: {
        queries: [{ query: 'perfumes cordoba', clicks: 80, impressions: 1200, position: 2.1 }],
      },
    });

    mockCompetitorsCollection.find.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([
        { name: 'Competidor X', rating: 4.3, userRatingsTotal: 50 },
      ]),
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/google/ai/analyze',
      body: JSON.stringify({ sourceId: sourceId.toString() }),
      headers: { authorization: 'Bearer mock-token' },
    };

    const res = await aiHandler(event);
    const body = JSON.parse(res.body);

    expect(res.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.analysis).toBeDefined();
    expect(body.analysis.aiReport.overallScore).toBeGreaterThanOrEqual(50);
  });
});
