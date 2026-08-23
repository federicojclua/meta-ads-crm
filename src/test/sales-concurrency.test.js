import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as salesHandler } from '../../netlify/functions/api-sales.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Sales Concurrency & Financial Integrity Tests', () => {
  let mockSalesCollection;
  let mockLeadsCollection;
  let mockClientsCollection;
  let mockActivitiesCollection;
  let mockDb;

  const clientId = new ObjectId('65df11111111111111111111');
  const leadId = new ObjectId('65df22222222222222222222');
  const saleId = new ObjectId('65df33333333333333333333');

  const mockClientUser = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'client@empresa.com',
    role: 'client',
    status: 'active',
    clientId,
    clientIds: [clientId],
  };

  beforeEach(() => {
    mockSalesCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      updateOne: vi.fn(),
      insertOne: vi.fn(),
    };

    mockLeadsCollection = {
      findOne: vi.fn(),
      updateOne: vi.fn(),
    };

    mockClientsCollection = {
      findOne: vi.fn().mockResolvedValue({
        _id: clientId,
        status: 'active',
        defaultCurrency: 'ARS',
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

  it('1. Cobros concurrentes: solo uno es aceptado y el segundo es rechazado con 409 COLLECTED_EXCEEDS_AMOUNT', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    // Sale of $100.000,00 ARS (10000000 cents)
    const baseSale = {
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 10000000,
      collectedAmountMinor: 0,
      currency: 'ARS',
      status: 'pending',
      payments: [],
    };

    mockSalesCollection.findOne.mockResolvedValue(baseSale);

    // First concurrent call succeeds (increments by $60.000,00)
    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 10000000,
      collectedAmountMinor: 6000000,
      currency: 'ARS',
      status: 'pending',
      payments: [{ amountMinor: 6000000, amountDefaultMinor: 6000000, collectedBy: mockClientUser._id }],
    });

    const res1 = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({ collectedAmountMinor: 6000000 }),
    });

    expect(res1.statusCode).toBe(200);

    // Second concurrent call fails the $expr $lte check and returns null from findOneAndUpdate
    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce(null);
    // When inspecting targetSale and re-inspecting current state in DB:
    mockSalesCollection.findOne.mockResolvedValue({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 10000000,
      collectedAmountMinor: 6000000, // already 60.000 in DB
      currency: 'ARS',
      status: 'partial',
    });

    const res2 = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({ collectedAmountMinor: 6000000 }), // 60.000 + 60.000 > 100.000
    });

    expect(res2.statusCode).toBe(409);
    const body2 = JSON.parse(res2.body);
    expect(body2.code).toBe('COLLECTED_EXCEEDS_AMOUNT');
  });

  it('2. Cobro sobre venta cancelada es rechazado con 400 SALE_CANCELLED', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    mockSalesCollection.findOne.mockResolvedValue({
      _id: saleId,
      clientId,
      leadId,
      status: 'cancelled',
      amountMinor: 5000000,
    });

    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({ collectedAmountMinor: 1000000 }),
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('SALE_CANCELLED');
  });

  it('3. Cobro sobre venta ya totalmente cobrada es rechazado con 409 SALE_ALREADY_COLLECTED', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    mockSalesCollection.findOne.mockResolvedValue({
      _id: saleId,
      clientId,
      leadId,
      status: 'collected',
      amountMinor: 5000000,
      collectedAmountMinor: 5000000,
    });

    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce(null);

    const res = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({ collectedAmountMinor: 1000000 }),
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('SALE_ALREADY_COLLECTED');
  });

  it('4. Historial inmutable con dos cobros a diferentes tipos de cambio: calcula amountDefaultMinor exacto y coincide con total', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
      authorized: true,
      user: mockClientUser,
      db: mockDb,
      clientScope: clientId.toString(),
      isGlobal: false,
    });

    // Sale of $1,000.00 USD (100,000 cents) for client with ARS as defaultCurrency
    const initialSaleDoc = {
      _id: saleId,
      clientId,
      leadId,
      status: 'pending',
      amountMinor: 100000, // $1000.00 USD
      collectedAmountMinor: 0,
      collectedAmountDefaultMinor: 0,
      currency: 'USD',
      payments: [],
    };

    mockSalesCollection.findOne.mockResolvedValue(initialSaleDoc);

    // First payment: $400.00 USD (40,000 cents) at exchangeRate = 1200.5
    // amountDefaultMinor = Math.round(40000 * 1200.5) = 48020000 ($480,200.00 ARS)
    const firstPaymentRecord = {
      _id: new ObjectId(),
      amountMinor: 40000,
      amountDefaultMinor: 48020000,
      exchangeRateToDefault: 1200.5,
      collectedAt: new Date('2026-08-01T10:00:00Z'),
      collectedBy: mockClientUser._id,
      notes: 'Primer pago parcial',
    };

    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 100000,
      collectedAmountMinor: 40000,
      collectedAmountDefaultMinor: 48020000,
      currency: 'USD',
      status: 'partial',
      payments: [firstPaymentRecord],
    });

    const res1 = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({
        collectedAmountMinor: 40000,
        exchangeRateToDefault: 1200.5,
        notes: 'Primer pago parcial',
      }),
    });

    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.body);
    expect(body1.sale.payments.length).toBe(1);
    expect(body1.sale.payments[0].amountMinor).toBe(40000);
    expect(body1.sale.payments[0].amountDefaultMinor).toBe(48020000);
    expect(body1.sale.payments[0].exchangeRateToDefault).toBe(1200.5);
    expect(body1.sale.payments[0].collectedBy).toBe(mockClientUser._id.toString());

    // Second payment: $600.00 USD (60,000 cents) at exchangeRate = 1350.0
    // amountDefaultMinor = Math.round(60000 * 1350.0) = 81000000 ($810,000.00 ARS)
    // total collectedAmountDefaultMinor = 48020000 + 81000000 = 129020000 ($1,290,200.00 ARS)
    const secondPaymentRecord = {
      _id: new ObjectId(),
      amountMinor: 60000,
      amountDefaultMinor: 81000000,
      exchangeRateToDefault: 1350.0,
      collectedAt: new Date('2026-08-15T12:00:00Z'),
      collectedBy: mockClientUser._id,
      notes: 'Segundo pago final',
    };

    const cumulativeDefaultMinor = firstPaymentRecord.amountDefaultMinor + secondPaymentRecord.amountDefaultMinor;
    expect(cumulativeDefaultMinor).toBe(129020000);

    mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce({
      _id: saleId,
      clientId,
      leadId,
      amountMinor: 100000,
      collectedAmountMinor: 100000,
      collectedAmountDefaultMinor: cumulativeDefaultMinor,
      currency: 'USD',
      status: 'collected',
      payments: [firstPaymentRecord, secondPaymentRecord],
    });

    const res2 = await salesHandler({
      httpMethod: 'POST',
      path: `/api/sales/${saleId.toString()}/collect`,
      body: JSON.stringify({
        collectedAmountMinor: 60000,
        exchangeRateToDefault: 1350.0,
        notes: 'Segundo pago final',
      }),
    });

    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);
    expect(body2.sale.status).toBe('collected');
    expect(body2.sale.collectedAmountMinor).toBe(100000);
    expect(body2.sale.collectedAmountDefaultMinor).toBe(129020000);
    expect(body2.sale.payments.length).toBe(2);

    // Verify individual immutable history preservation
    expect(body2.sale.payments[0].exchangeRateToDefault).toBe(1200.5);
    expect(body2.sale.payments[0].amountDefaultMinor).toBe(48020000);
    expect(body2.sale.payments[1].exchangeRateToDefault).toBe(1350.0);
    expect(body2.sale.payments[1].amountDefaultMinor).toBe(81000000);

    // Sum of payments exactly equals collectedAmountDefaultMinor
    const sumOfPaymentsDefaultMinor = body2.sale.payments.reduce((acc, p) => acc + p.amountDefaultMinor, 0);
    expect(sumOfPaymentsDefaultMinor).toBe(body2.sale.collectedAmountDefaultMinor);
  });
});
