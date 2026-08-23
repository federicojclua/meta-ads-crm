import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as salesHandler } from '../../netlify/functions/api-sales.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Backend Sales API (api-sales)', () => {
  let mockSalesCollection;
  let mockLeadsCollection;
  let mockClientsCollection;
  let mockActivitiesCollection;
  let mockDb;

  const clientId = new ObjectId('65df11111111111111111111');
  const leadId = new ObjectId('65df22222222222222222222');
  const salespersonId = new ObjectId('65df33333333333333333333');
  const otherSalespersonId = new ObjectId('65df44444444444444444444');

  const mockClientUser = {
    _id: new ObjectId('65df55555555555555555555'),
    email: 'client@empresa.com',
    role: 'client',
    status: 'active',
    clientId,
    clientIds: [clientId],
  };

  const mockSalespersonUser = {
    _id: salespersonId,
    email: 'sales@empresa.com',
    role: 'salesperson',
    status: 'active',
    clientId,
    clientIds: [clientId],
  };

  beforeEach(() => {
    mockSalesCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockLeadsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      updateOne: vi.fn(),
    };

    mockClientsCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: clientId,
        status: 'active',
        defaultCurrency: 'ARS',
        enabledCurrencies: ['ARS', 'USD'],
      }),
    };

    mockActivitiesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'sales') return mockSalesCollection;
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'clients') return mockClientsCollection;
        if (name === 'lead_activities') return mockActivitiesCollection;
        return null;
      }),
    };
  });

  it('1. POST /api/sales registra venta en centavos y avanza el prospecto a won', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    mockLeadsCollection.findOne.mockResolvedValueOnce({
      _id: leadId,
      clientId,
      name: 'Prospecto Ganado',
      stage: 'qualified',
    });

    const insertedSaleId = new ObjectId('65df66666666666666666666');
    mockSalesCollection.insertOne.mockResolvedValueOnce({ insertedId: insertedSaleId });
    mockSalesCollection.findOne.mockResolvedValueOnce({
      _id: insertedSaleId,
      clientId,
      leadId,
      amountMinor: 15000000, // $150.000,00
      currency: 'ARS',
      collectedAmountMinor: 0,
      status: 'pending',
      payments: [],
      soldAt: new Date(),
    });

    const res = await salesHandler({
      httpMethod: 'POST',
      path: '/api/sales',
      body: JSON.stringify({
        leadId: leadId.toString(),
        amountMinor: 15000000,
        currency: 'ARS',
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.sale.amountMinor).toBe(15000000);
    expect(body.sale.status).toBe('pending');
    expect(mockLeadsCollection.updateOne).toHaveBeenCalledWith(
      { _id: leadId },
      expect.objectContaining({ $set: expect.objectContaining({ stage: 'won' }) })
    );
  });

  it('2. POST /api/sales por salesperson solo permite registrar sobre leads asignados', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSalespersonUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    // Lead assigned to another salesperson
    mockLeadsCollection.findOne.mockResolvedValueOnce({
      _id: leadId,
      clientId,
      name: 'Lead de Otro Vendedor',
      assignedToUserId: otherSalespersonId,
    });

    const res = await salesHandler({
      httpMethod: 'POST',
      path: '/api/sales',
      body: JSON.stringify({
        leadId: leadId.toString(),
        amountMinor: 5000000,
        currency: 'ARS',
      }),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('FORBIDDEN_LEAD_ACCESS');
  });

  it('3. POST /api/sales/:id/collect confirma cobro atómico y actualiza status a partial', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    const saleId = new ObjectId('65df77777777777777777777');
    mockSalesCollection.findOne.mockResolvedValue({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 10000000,
      collectedAmountMinor: 0,
      currency: 'ARS',
      status: 'pending',
    });

    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 10000000,
      collectedAmountMinor: 4000000, // $40.000,00
      currency: 'ARS',
      status: 'pending',
      payments: [{ paymentAmountMinor: 4000000 }],
    });

    const res = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({
        collectedAmountMinor: 4000000,
      }),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.sale.status).toBe('partial');
    expect(body.sale.collectedAmountMinor).toBe(4000000);
  });

  it('4. POST /api/sales/:id/collect ejecutado por salesperson es denegado con 403', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSalespersonUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    const saleId = new ObjectId('65df77777777777777777777');
    mockSalesCollection.findOne.mockResolvedValueOnce({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 5000000,
    });

    const res = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({
        collectedAmountMinor: 1000000,
      }),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CANNOT_CONFIRM_COLLECTIONS');
  });

  it('5. POST /api/sales/:id/cancel cancela la venta', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    const saleId = new ObjectId('65df77777777777777777777');
    mockSalesCollection.findOne
      .mockResolvedValueOnce({
        _id: saleId,
        clientId,
        leadId,
        status: 'pending',
      })
      .mockResolvedValueOnce({
        _id: saleId,
        clientId,
        leadId,
        status: 'cancelled',
      });

    mockSalesCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/cancel`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.sale.status).toBe('cancelled');
  });
});
