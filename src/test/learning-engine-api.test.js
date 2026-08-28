import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as learningEngineHandler } from '../../netlify/functions/api-learning-engine.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 19 — ANIMA Learning Engine API Endpoint Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. GET /api/learning-engine/insights retorna patterns y diagnóstico global', async () => {
    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: { collection: vi.fn().mockReturnValue({ updateOne: vi.fn() }) },
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/learning-engine/insights',
    };

    const res = await learningEngineHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.patterns.length).toBeGreaterThanOrEqual(3);
    expect(body.summary.winningCount).toBeGreaterThanOrEqual(1);
    expect(body.summary.avgRoasLiftPct).toBeGreaterThan(0);
  });

  it('2. POST /api/learning-engine/apply-to-creative-studio genera preset para el Creative Studio', async () => {
    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: { collection: vi.fn() },
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { email: 'admin@animamkt.com', role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/learning-engine/apply-to-creative-studio',
      body: JSON.stringify({
        pattern: {
          id: 'pat_win_01',
          headline: 'Winning DNA: 9:16 Bundle',
          featureCombination: { format: '9:16', hookType: 'question_problem' },
        },
      }),
    };

    const res = await learningEngineHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.preset.formats).toContain('9:16');
    expect(body.preset.campaignName).toContain('Winning DNA');
  });
});
