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

  it('3. super_admin consultando todas las empresas', async () => {
    const mockAdminUser = {
      _id: new ObjectId(),
      email: 'admin@animamkt.com',
      role: 'super_admin',
      status: 'active',
    };

    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const activeClients = [
      { _id: new ObjectId(), name: 'Empresa A', status: 'active' },
      { _id: new ObjectId(), name: 'Empresa B', status: 'active' },
    ];

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce(activeClients),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(5);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: 'all' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(5);
    expect(body.kpis.totalCollectedFormatted).toBe('0,00');
  });

  it('4. super_admin consultando una empresa válida', async () => {
    const mockAdminUser = {
      _id: new ObjectId(),
      email: 'admin@animamkt.com',
      role: 'super_admin',
      status: 'active',
    };

    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const targetId = new ObjectId();
    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([{ _id: targetId, name: 'Empresa Valida', status: 'active' }]),
    });

    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: targetId,
      name: 'Empresa Valida',
      status: 'active',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(2);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: targetId.toString() },
    });

    expect(res.statusCode).toBe(200);
  });

  it('5. Identificador de empresa malformado retorna 400', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: 'invalid/id/with/slashes' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('6. Empresa inexistente retorna 404', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockClientsCollection.findOne.mockResolvedValueOnce(null);

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: new ObjectId().toString() },
    });

    expect(res.statusCode).toBe(404);
  });

  it('7. Empresa inactiva retorna 404', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const targetId = new ObjectId();
    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([{ _id: targetId, status: 'inactive' }]),
    });
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: targetId,
      status: 'inactive',
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: targetId.toString() },
    });

    expect(res.statusCode).toBe(404);
  });

  it('8. Usuario client intentando forzar otro clientId es forzado a su scope', async () => {
    const userScope = new ObjectId();
    const forcedScope = new ObjectId();

    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'client', clientId: userScope },
      db: mockDb,
      clientScope: userScope.toString(),
      isGlobal: false,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([{ _id: userScope, status: 'active' }]),
    });
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: userScope,
      status: 'active',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(1);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: forcedScope.toString() },
    });

    expect(res.statusCode).toBe(200);
    // Verified that it queried the user's scope
    expect(mockClientsCollection.findOne).toHaveBeenCalledWith({
      _id: new ObjectId(userScope),
    });
  });

  it('9. Usuario salesperson intentando forzar otro clientId es forzado a su scope', async () => {
    const userScope = new ObjectId();
    const forcedScope = new ObjectId();

    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'salesperson', clientId: userScope },
      db: mockDb,
      clientScope: userScope.toString(),
      isGlobal: false,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([{ _id: userScope, status: 'active' }]),
    });
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: userScope,
      status: 'active',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(1);
    mockLeadsCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: forcedScope.toString() },
    });

    expect(res.statusCode).toBe(200);
  });

  it('10. Vista global sin leads ni cobros no da error fatal', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
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
    expect(body.kpis.totalCollectedFormatted).toBe('0,00');
  });

  it('11. Vista global con dos empresas ARS se suman correctamente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(10);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { currency: 'ARS', amountMinor: 100000, collectedAmountMinor: 100000 },
        { currency: 'ARS', amountMinor: 200000, collectedAmountMinor: 200000 },
      ]),
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
    expect(body.kpis.totalCollectedFormatted).toBe('3.000,00');
  });

  it('12. Vista global con empresas ARS y USD no se suman en total y se desglosan', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(10);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { currency: 'ARS', amountMinor: 100000, collectedAmountMinor: 100000 },
        { currency: 'USD', amountMinor: 20000, collectedAmountMinor: 20000 },
      ]),
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
    // Should split ARS and USD with a slash
    expect(body.kpis.totalCollectedFormatted).toContain('ARS');
    expect(body.kpis.totalCollectedFormatted).toContain('USD');
    expect(body.kpis.totalCollectedFormatted).toContain('/');
  });

  it('13. ROAS, CPL, CPA calculados por moneda y no mezclados globalmente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(10);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { currency: 'ARS', amountMinor: 200000, collectedAmountMinor: 200000 },
      ]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    // Mock meta_insights_daily
    const mockMetaCollection = {
      aggregate: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([
          { _id: 'ARS', spendMinor: 100000 },
        ]),
      }),
    };
    mockDb.collection.mockImplementation((name) => {
      if (name === 'meta_insights_daily') return mockMetaCollection;
      if (name === 'leads') return mockLeadsCollection;
      if (name === 'sales') return mockSalesCollection;
      if (name === 'users') return mockUsersCollection;
      if (name === 'clients') return mockClientsCollection;
      return null;
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.metaMetrics.roasFormatted).toBe('2x');
  });

  it('14. Ranking global compuesto únicamente por vendedores y con identificación de empresa', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const clientAId = new ObjectId();
    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { _id: clientAId, name: 'Empresa Alpha', status: 'active' },
      ]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(0);
    mockLeadsCollection.find.mockReturnValue({
      project: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
    });
    mockSalesCollection.find.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });

    // Mock users return (one salesperson, one client that should be excluded)
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([
          { _id: new ObjectId(), displayName: 'Vendedor Real', role: 'salesperson', clientId: clientAId },
          { _id: new ObjectId(), displayName: 'Cliente Excluido', role: 'client', clientId: clientAId },
        ]),
      }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.salespeoplePerformance.length).toBe(1);
    expect(body.salespeoplePerformance[0].displayName).toBe('Vendedor Real');
    expect(body.salespeoplePerformance[0].companyName).toBe('Empresa Alpha');
  });

  it('15. Ausencia de inversión Meta no provoca error fatal', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(2);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    // Mock metaaggregate failure
    mockDb.collection.mockImplementation((name) => {
      if (name === 'meta_insights_daily') return null;
      if (name === 'leads') return mockLeadsCollection;
      if (name === 'sales') return mockSalesCollection;
      if (name === 'users') return mockUsersCollection;
      if (name === 'clients') return mockClientsCollection;
      return null;
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.metaMetrics.hasMetaIntegration).toBe(false);
  });

  it('16. Ausencia de cobros no provoca error fatal', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(2);
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
    expect(body.kpis.totalCollectedFormatted).toBe('0,00');
  });

  it('17. Empresa activa sin ningún dato devuelve HTTP 200', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const activeCompanyId = new ObjectId();
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: activeCompanyId,
      status: 'active',
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
      queryStringParameters: { clientId: activeCompanyId.toString() },
    });

    expect(res.statusCode).toBe(200);
  });

  it('18. Empresa activa sin datos produce KPIs en cero y arreglos vacíos', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const activeCompanyId = new ObjectId();
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: activeCompanyId,
      status: 'active',
      defaultCurrency: 'USD',
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
      queryStringParameters: { clientId: activeCompanyId.toString() },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(0);
    expect(body.kpis.amountsByCurrency).toEqual({ USD: 0 });
    expect(body.salespeoplePerformance).toEqual([]);
  });

  it('19. Empresa activa con leads pero sin cobros ni Meta devuelve los leads correctamente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const activeCompanyId = new ObjectId();
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: activeCompanyId,
      status: 'active',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(12);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: activeCompanyId.toString() },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(12);
    expect(body.kpis.amountsByCurrency).toEqual({ ARS: 0 });
  });

  it('20. Ferreteria del sur no se interpreta como inactiva por una diferencia ObjectId/string', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const ferreteriaIdStr = '507f1f77bcf86cd799439011';
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: new ObjectId(ferreteriaIdStr),
      name: 'Ferretería del Sur',
      status: 'active',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(3);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: ferreteriaIdStr },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(3);
  });

  it('21. Vista global conserva importes separados por moneda de forma estructurada', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'super_admin' },
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([{ _id: new ObjectId(), status: 'active' }]),
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(10);
    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([
        { currency: 'ARS', amountMinor: 100000, collectedAmountMinor: 100000 },
        { currency: 'USD', amountMinor: 20000, collectedAmountMinor: 20000 },
      ]),
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
    expect(body.kpis.amountsByCurrency).toEqual({
      ARS: 1000,
      USD: 200,
    });
  });

  it('22. Usuario cliente sin clientScope recibe 403 Forbidden', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: false,
      status: 403,
      error: 'El usuario no tiene una empresa o cliente asignado en MongoDB.',
      code: 'NO_CLIENT_ASSIGNED',
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
    });

    expect(res.statusCode).toBe(403);
  });

  it('23. Usuario cliente intentando pedir vista global es forzado a su empresa', async () => {
    const userScope = new ObjectId();
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: { _id: new ObjectId(), role: 'client', clientId: userScope },
      db: mockDb,
      clientScope: userScope.toString(),
      isGlobal: false,
    });

    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: userScope,
      status: 'active',
      defaultCurrency: 'ARS',
    });

    mockLeadsCollection.countDocuments.mockResolvedValue(2);
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
    expect(body.kpis.totalLeadsCount).toBe(2);
  });

  it('24. Vista global de super_admin incluye solamente empresas activas y excluye datos de inactivas', async () => {
    const mockAdminUser = {
      _id: new ObjectId(),
      email: 'admin@animamkt.com',
      role: 'super_admin',
      status: 'active',
    };

    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdminUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const activeCompanyId = new ObjectId();
    const inactiveCompanyId = new ObjectId();

    const activeClients = [
      { _id: activeCompanyId, name: 'Empresa Activa', status: 'active' },
    ];

    mockClientsCollection.find = vi.fn().mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce(activeClients),
    });

    mockLeadsCollection.countDocuments.mockImplementation((query) => {
      const inList = query.clientId?.$in || [];
      if (inList.some(id => id.toString() === inactiveCompanyId.toString())) {
        return Promise.resolve(99); // Error state if inactive is included
      }
      if (inList.some(id => id.toString() === activeCompanyId.toString())) {
        return Promise.resolve(5);
      }
      return Promise.resolve(0);
    });

    mockSalesCollection.find.mockReturnValueOnce({
      toArray: vi.fn().mockResolvedValueOnce([]),
    });
    mockUsersCollection.find.mockReturnValueOnce({
      project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }),
    });

    const res = await dashboardHandler({
      httpMethod: 'GET',
      path: '/api/dashboard/stats',
      queryStringParameters: { clientId: 'all' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.kpis.totalLeadsCount).toBe(5);
  });
});
