import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { calculateFunnelDropoff, calculateFrictionScore } from '../../models/Ecommerce.js';
import { handler as ecommerceHandler } from '../../netlify/functions/api-ecommerce.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 15 — E-Commerce Funnel & UI/UX Friction Engine Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. calculateFunnelDropoff calcula conversiones y caídas paso a paso', () => {
    const rawSteps = [
      { step: 'view_item', count: 10000 },
      { step: 'add_to_cart', count: 4000 },
      { step: 'begin_checkout', count: 2000 },
      { step: 'add_payment_info', count: 1000 },
      { step: 'purchase', count: 500 },
    ];

    const result = calculateFunnelDropoff(rawSteps);
    expect(result).toHaveLength(5);
    expect(result[0].count).toBe(10000);
    expect(result[0].conversionFromInitial).toBe(100);

    // add_to_cart -> 40% global, 60% caída
    expect(result[1].conversionFromInitial).toBe(40);
    expect(result[1].dropoffFromPrevious).toBe(60);

    // purchase -> 5% global, 50% caída desde payment info
    expect(result[4].conversionFromInitial).toBe(5);
    expect(result[4].dropoffFromPrevious).toBe(50);
  });

  it('2. calculateFrictionScore emite puntaje y severidad adecuada', () => {
    const criticalFriction = calculateFrictionScore({
      bounceRate: 70,
      avgTimeOnPageSec: 25,
      formAbandonRate: 65,
      mobileDropoffRatio: 1.5,
    });

    expect(criticalFriction.score).toBeGreaterThanOrEqual(65);
    expect(criticalFriction.severity).toBe('CRÍTICA');
    expect(criticalFriction.topBottleneck).toContain('Abandono');

    const lowFriction = calculateFrictionScore({
      bounceRate: 30,
      avgTimeOnPageSec: 90,
      formAbandonRate: 15,
      mobileDropoffRatio: 1.05,
    });

    expect(lowFriction.score).toBeLessThan(40);
    expect(lowFriction.severity).toBe('BAJA');
  });

  it('3. GET /api/ecommerce/funnel retorna embudo global y desglose móvil/desktop', async () => {
    const mockDb = {
      collection: vi.fn().mockImplementation(() => ({
        findOne: vi.fn().mockResolvedValue(null), // returns default
      })),
    };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { role: 'admin' },
    });

    const event = {
      httpMethod: 'GET',
      path: '/api/ecommerce/funnel',
    };

    const res = await ecommerceHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.funnel).toHaveLength(5);
    expect(body.deviceBreakdown.mobile).toBeDefined();
    expect(body.deviceBreakdown.desktop).toBeDefined();
  });

  it('4. POST /api/ecommerce/cro-diagnose genera reporte estructurado de mejoras', async () => {
    const mockDb = { collection: vi.fn() };

    vi.spyOn(AuthModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      db: mockDb,
      clientScope: mockTenantId.toString(),
      isGlobal: false,
      user: { role: 'admin' },
    });

    const event = {
      httpMethod: 'POST',
      path: '/api/ecommerce/cro-diagnose',
      body: JSON.stringify({}),
    };

    const res = await ecommerceHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.ok).toBe(true);
    expect(body.diagnostic.title).toContain('Auditoría');
    expect(body.diagnostic.bottlenecks.length).toBeGreaterThanOrEqual(2);
    expect(body.diagnostic.estimatedRevenueLift).toBeDefined();
  });
});
