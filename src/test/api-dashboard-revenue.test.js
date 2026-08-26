import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as revenueHandler } from '../../netlify/functions/api-dashboard-revenue.js';
import { handler as exportHandler } from '../../netlify/functions/api-dashboard-revenue-export.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Revenue Aggregation Engine & Tenant Isolation Tests', () => {
  let mockDb;
  let mockExchangeRatesCollection;
  let mockClientsCollection;
  let mockLeadsCollection;
  let mockSalesCollection;
  let mockMetaInsightsCollection;

  const clientAId = new ObjectId('65df11111111111111111111');
  const clientBId = new ObjectId('65df22222222222222222222');

  const adminUser = {
    _id: new ObjectId('65df33333333333333333333'),
    email: 'admin@animamkt.com',
    role: 'admin',
    status: 'active',
  };

  const clientUserA = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'client@clienta.com',
    role: 'client',
    status: 'active',
    clientId: clientAId,
  };

  beforeEach(() => {
    mockExchangeRatesCollection = {
      find: vi.fn().mockReturnValue({
        toArray: async () => [
          {
            baseCurrency: 'USD',
            quoteCurrency: 'ARS',
            quotePerBase: 1000,
            validFrom: new Date('2026-08-01T00:00:00Z'),
            validTo: null,
          }
        ]
      }),
    };

    mockClientsCollection = {
      findOne: vi.fn().mockImplementation(async (query) => {
        if (query._id && query._id.toString() === clientAId.toString()) {
          return { _id: clientAId, name: 'Client A', status: 'active', defaultCurrency: 'USD' };
        }
        if (query._id && query._id.toString() === clientBId.toString()) {
          return { _id: clientBId, name: 'Client B', status: 'active', defaultCurrency: 'USD' };
        }
        return null;
      }),
    };

    mockLeadsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: async () => [
          {
            _id: new ObjectId('65df55555555555555555555'),
            clientId: clientAId,
            stage: 'won',
            metaCampaignId: 'camp-1',
            acquiredAt: new Date('2026-08-10T12:00:00Z'),
          },
          {
            _id: new ObjectId('65df66666666666666666666'),
            clientId: clientAId,
            stage: 'contacted',
            metaCampaignId: 'camp-1',
            acquiredAt: new Date('2026-08-11T12:00:00Z'),
          }
        ]
      }),
    };

    mockSalesCollection = {
      find: vi.fn().mockReturnValue({
        toArray: async () => [
          {
            _id: new ObjectId('65df77777777777777777777'),
            clientId: clientAId,
            leadId: new ObjectId('65df55555555555555555555'),
            metaCampaignId: 'camp-1',
            currency: 'ARS',
            amountMinor: 5000000, // 50,000 ARS
            status: 'collected',
            soldAt: new Date('2026-08-12T12:00:00Z'),
            payments: [
              {
                amountMinor: 5000000,
                collectedAt: new Date('2026-08-12T12:00:00Z'),
              }
            ]
          }
        ]
      }),
    };

    mockMetaInsightsCollection = {
      find: vi.fn().mockReturnValue({
        toArray: async () => [
          {
            _id: new ObjectId('65df88888888888888888888'),
            clientId: clientAId,
            campaignId: 'camp-1',
            campaignName: 'Campaña Demo',
            adsetId: 'adset-1',
            adsetName: 'Conjunto Demo',
            date: '2026-08-10',
            spendMinor: 1000, // 10 USD (since currency is USD)
            currency: 'USD',
            impressions: 1000,
            clicks: 100,
          }
        ]
      }),
    };

    const mockAuditLogsCollection = {
      insertOne: vi.fn().mockResolvedValue({}),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'exchange_rates') return mockExchangeRatesCollection;
        if (name === 'clients') return mockClientsCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'sales') return mockSalesCollection;
        if (name === 'meta_insights_daily') return mockMetaInsightsCollection;
        if (name === 'audit_logs') return mockAuditLogsCollection;
        return null;
      }),
    };

    vi.spyOn(DbModule, 'connectToDatabase').mockResolvedValue({ db: mockDb });
  });

  it('1. GET /api/dashboard/revenue con admin global sin clientId retorna 400', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: adminUser,
      db: mockDb,
      isGlobal: true,
      clientScope: null,
    });

    const res = await revenueHandler({
      httpMethod: 'GET',
      queryStringParameters: {
        startDate: '2026-08-01',
        endDate: '2026-08-20',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CLIENT_ID_REQUIRED');
  });

  it('2. GET /api/dashboard/revenue con clientUser intentando forzar otro clientId retorna 403', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: clientUserA,
      db: mockDb,
      isGlobal: false,
      clientScope: clientAId.toString(),
    });

    const res = await revenueHandler({
      httpMethod: 'GET',
      queryStringParameters: {
        clientId: clientBId.toString(), // clientUserA belongs to Client A
        startDate: '2026-08-01',
        endDate: '2026-08-20',
      },
    });

    // Scoping ensures we use clientScope from session
    const body = JSON.parse(res.body);
    expect(res.statusCode).toBe(200);
    expect(body.clientId).toBe(clientAId.toString()); // forced to client A
  });

  it('3. GET /api/dashboard/revenue calcula agregados de leads, ventas, cobros e inversion correctamente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: clientUserA,
      db: mockDb,
      isGlobal: false,
      clientScope: clientAId.toString(),
    });

    const res = await revenueHandler({
      httpMethod: 'GET',
      queryStringParameters: {
        startDate: '2026-08-01',
        endDate: '2026-08-20',
        currency: 'USD', // normalize to USD
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.clientId).toBe(clientAId.toString());

    // KPIs:
    // leads = 2
    // sales = 1
    // spend = 1000 cents USD = 10 USD
    // revenue = 50,000 cents ARS. With 1000 ARS = 1 USD rate, 50,000 ARS = 50 USD = 5000 cents USD.
    expect(body.kpis.totalLeadsCount).toBe(2);
    expect(body.kpis.totalWonSales).toBe(1);
    expect(body.kpis.spendMinor).toBe(1000); // 10 USD
    expect(body.kpis.revenueMinor).toBe(5000); // 50 USD

    // Attributed:
    // leadsCount = 2 (all have metaCampaignId = 'camp-1')
    expect(body.kpis.attributed.leadsCount).toBe(2);
    expect(body.kpis.attributed.salesCount).toBe(1);
    expect(body.kpis.attributed.spendMinor).toBe(1000);
    expect(body.kpis.attributed.revenueMinor).toBe(5000);
    expect(body.kpis.attributed.roas).toBe(5); // 50 / 10 = 5.0x
  });

  describe('Export Revenue Report Endpoint', () => {
    it('1. GET /api/dashboard/revenue/export en formato CSV escapa inyeccion de formula en celdas', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientUserA,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      // Mock clients.findOne to return a company name starting with a potential formula trigger
      mockClientsCollection.findOne.mockResolvedValueOnce({
        _id: clientAId,
        name: '=Empresa Peligrosa',
        slug: 'empresa-peligrosa',
        status: 'active',
      });

      const res = await exportHandler({
        httpMethod: 'GET',
        queryStringParameters: {
          startDate: '2026-08-01',
          endDate: '2026-08-20',
          format: 'csv',
        },
      });

      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toBe('text/csv; charset=utf-8');
      
      // Verify formula trigger is escaped by prepending single quote inside double quotes: "'=Empresa Peligrosa"
      expect(res.body).toContain(`"'=Empresa Peligrosa"`);
    });

    it('2. GET /api/dashboard/revenue/export con clientUser intentando forzar otro clientId usa clientScope de sesion', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientUserA,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      const res = await exportHandler({
        httpMethod: 'GET',
        queryStringParameters: {
          clientId: clientBId.toString(), // tries to leak Client B data
          startDate: '2026-08-01',
          endDate: '2026-08-20',
          format: 'pdf_json',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      // Verify it generated metadata for Client A (not B)
      expect(body.reportMetadata.clientId).toBe(clientAId.toString());
    });
  });
});
