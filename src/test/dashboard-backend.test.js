import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as dashboardHandler } from '../../netlify/functions/api-dashboard.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Backend Dashboard API (api-dashboard)', () => {
  let mockLeadsCollection;
  let mockSalesCollection;
  let mockUsersCollection;
  let mockClientsCollection;
  let mockDb;

  const clientId = new ObjectId('65df11111111111111111111');

  const mockClientUser = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'client@empresa.com',
    role: 'client',
    status: 'active',
    clientId,
    clientIds: [clientId],
  };

  beforeEach(() => {
    mockLeadsCollection = {
      find: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockSalesCollection = {
      find: vi.fn(),
    };

    mockUsersCollection = {
      find: vi.fn(),
    };

    mockClientsCollection = {
      findOne: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'sales') return mockSalesCollection;
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        return null;
      }),
    };
  });

  it('1. GET /api/dashboard/stats calcula leads activos, ganados, tasa de conversión (hasConversionData: true) e ingresos por moneda sin mezclar', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientId,
      name: 'Empresa Test',
      defaultCurrency: 'ARS',
    });

    // Mock countDocuments for [total, new, contacted, qualified, won, lost]
    mockLeadsCollection.countDocuments
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(4)  // new
      .mockResolvedValueOnce(2)  // contacted
      .mockResolvedValueOnce(1)  // qualified
      .mockResolvedValueOnce(3)  // won
      .mockResolvedValueOnce(0); // lost

    // Mock sales (including a pending and collected sale)
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { currency: 'ARS', amountMinor: 10000000, collectedAmountMinor: 10000000, collectedAmountDefaultMinor: 10000000 },
        { currency: 'USD', amountMinor: 50000, collectedAmountMinor: 50000, collectedAmountDefaultMinor: 60000000 },
        { currency: 'ARS', amountMinor: 5000000, collectedAmountMinor: 0, collectedAmountDefaultMinor: 0 }, // Pending sale: 0 collected
      ]),
    });

    // Mock salespeople
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([]),
      }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(10);
    expect(body.kpis.wonLeadsCount).toBe(3);
    expect(body.kpis.hasConversionData).toBe(true);
    expect(body.kpis.conversionRate).toBe(30.0);
    expect(body.kpis.revenueByCurrency.ARS.collectedFormatted).toBe('100.000,00');
    expect(body.kpis.revenueByCurrency.USD.collectedFormatted).toBe('500,00');
    expect(body.kpis.metaMetrics.hasMetaIntegration).toBe(false);
    expect(body.kpis.metaMetrics.adSpend).toBeNull();
  });

  it('2. GET /api/dashboard/stats con 0 leads devuelve conversionRate: null y hasConversionData: false', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientId,
      name: 'Empresa Test',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(0);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(0);
    expect(body.kpis.hasConversionData).toBe(false);
    expect(body.kpis.conversionRate).toBeNull();
  });
});
