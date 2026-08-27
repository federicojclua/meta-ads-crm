import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as brandGuardianHandler } from '../../netlify/functions/api-brand-guardian.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stages 16/17 Evolution — Asset Gatekeeper API & Blocking Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. POST /api/brand-guardian/audit-asset ejecuta la auditoría completa vía API', async () => {
    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: { collection: vi.fn() },
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/brand-guardian/audit-asset',
      body: JSON.stringify({
        asset: {
          svg: '<svg><image href="logo.png"/><text>ThinkPad</text></svg>',
          headline: 'ThinkPad',
        },
        creativeProfile: {
          logoUrl: 'logo.png',
          colorPalette: { primary: '#0F172A' },
          forbiddenElements: [],
        },
      }),
    };

    const res = await brandGuardianHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.audit.brandComplianceScore).toBeGreaterThanOrEqual(85);
    expect(body.audit.isGatekeeperPassed).toBe(true);
  });

  it('2. POST /api/brand-guardian/gatekeeper-check bloquea el lanzamiento si algún asset tiene score < 85', async () => {
    const asset1Id = new ObjectId('65df77777777777777777771');
    const asset2Id = new ObjectId('65df77777777777777777772');

    const mockAssets = [
      {
        _id: asset1Id,
        clientId: mockTenantId,
        brandComplianceScore: 92,
        complianceStatus: 'APPROVED',
      },
      {
        _id: asset2Id,
        clientId: mockTenantId,
        brandComplianceScore: 70, // Below threshold 85
        complianceStatus: 'NEEDS_REVIEW',
        violations: ['Logo Integrity: No se detectó logo oficial.'],
      },
    ];

    const mockCollection = {
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockAssets),
      }),
    };

    const mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/brand-guardian/gatekeeper-check',
      body: JSON.stringify({
        assetIds: [asset1Id.toString(), asset2Id.toString()],
      }),
    };

    const res = await brandGuardianHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.isLaunchAllowed).toBe(false);
    expect(body.failedCount).toBe(1);
    expect(body.failedAssets[0].id).toBe(asset2Id.toString());
  });
});
