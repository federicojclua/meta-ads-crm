import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  sanitizeBusinessMemory,
  DEFAULT_BUSINESS_MEMORY,
  MEMORY_DIMENSIONS,
} from '../../models/BusinessMemory.js';
import { handler as biHandler } from '../../netlify/functions/api-business-intelligence.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 11 Evolution — ANIMA Business Memory Engine & Performance DNA Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. sanitizeBusinessMemory estructura adecuadamente las 7 dimensiones de memoria de negocio', () => {
    const memory = sanitizeBusinessMemory({ clientId: mockTenantId });

    MEMORY_DIMENSIONS.forEach((dim) => {
      expect(memory[dim]).toBeDefined();
    });

    expect(memory.brandMemory.commercialName).toBeDefined();
    expect(memory.businessMemory.averageTicket).toBe(1299999);
    expect(memory.salesMemory.historicalCloseRatePct).toBe(16.5);
    expect(memory.audienceMemory.highLtvSegments.length).toBeGreaterThan(0);
    expect(memory.creativeMemory.bestAspectRatios).toContain('9:16 (Reels/Stories: 4.2% CTR)');
    expect(memory.campaignMemory.historicalBenchmarkCpl).toBe(1650);
    expect(memory.revenueMemory.collectionEfficiencyPct).toBe(96.8);
  });

  it('2. Performance DNA y Winning / Losing Patterns se preservan y protegen contra alucinaciones', () => {
    const memory = sanitizeBusinessMemory({ clientId: mockTenantId });

    expect(memory.performanceDna.bestHooks.length).toBeGreaterThanOrEqual(3);
    expect(memory.performanceDna.bestFormats.length).toBeGreaterThanOrEqual(2);
    expect(memory.winningPatterns.length).toBeGreaterThanOrEqual(2);
    expect(memory.losingPatterns.length).toBeGreaterThanOrEqual(2);

    const winning01 = memory.winningPatterns[0];
    expect(winning01.metricImpact).toContain('+38% CTR');

    const losing01 = memory.losingPatterns[0];
    expect(losing01.failureReason).toBeDefined();
    expect(losing01.avoidRules).toBeDefined();
  });

  it('3. GET /api/business-intelligence/performance-dna retorna el Performance DNA y reglas de patrones', async () => {
    const mockCollection = {
      findOne: vi.fn().mockResolvedValue({
        clientId: mockTenantId,
        performanceDna: DEFAULT_BUSINESS_MEMORY.performanceDna,
        winningPatterns: DEFAULT_BUSINESS_MEMORY.winningPatterns,
        losingPatterns: DEFAULT_BUSINESS_MEMORY.losingPatterns,
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
      httpMethod: 'GET',
      path: '/api/business-intelligence/performance-dna',
    };

    const res = await biHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.performanceDna.bestHooks.length).toBeGreaterThan(0);
    expect(body.winningPatterns.length).toBeGreaterThan(0);
    expect(body.losingPatterns.length).toBeGreaterThan(0);
  });
});
