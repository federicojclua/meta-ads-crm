import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as leadsHandler } from '../../netlify/functions/api-leads.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Backend Leads API (api-leads)', () => {
  let mockLeadsCollection;
  let mockActivitiesCollection;
  let mockSalesCollection;
  let mockUsersCollection;
  let mockClientsCollection;
  let mockDb;

  const clientIdA = new ObjectId('65df11111111111111111111');
  const clientIdB = new ObjectId('65df99999999999999999999');

  const mockClientUserA = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'client@empresa-a.com',
    role: 'client',
    status: 'active',
    clientId: clientIdA,
    clientIds: [clientIdA],
  };

  const mockClientUserB = {
    _id: new ObjectId('65df88888888888888888888'),
    email: 'client@empresa-b.com',
    role: 'client',
    status: 'active',
    clientId: clientIdB,
    clientIds: [clientIdB],
  };

  beforeEach(() => {
    mockLeadsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockActivitiesCollection = {
      find: vi.fn(),
      insertOne: vi.fn(),
    };

    mockSalesCollection = {
      find: vi.fn(),
    };

    mockUsersCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
    };

    mockClientsCollection = {
      findOne: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'lead_activities') return mockActivitiesCollection;
        if (name === 'sales') return mockSalesCollection;
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        return null;
      }),
    };
  });

  it('1. POST /api/leads crea un prospecto y registra la actividad inicial', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    mockLeadsCollection.findOne.mockResolvedValueOnce(null);

    const insertedLeadId = new ObjectId('65df55555555555555555555');
    mockLeadsCollection.insertOne.mockResolvedValueOnce({ insertedId: insertedLeadId });
    mockLeadsCollection.findOne.mockResolvedValueOnce({
      _id: insertedLeadId,
      clientId: clientIdA,
      name: 'Carlos Gómez',
      email: 'carlos@empresa.com',
      normalizedEmail: 'carlos@empresa.com',
      phone: '+5491112345678',
      normalizedPhone: '+5491112345678',
      stage: 'new',
      source: 'manual',
      status: 'active',
      createdAt: new Date(),
    });

    const res = await leadsHandler({
      httpMethod: 'POST',
      path: '/api/leads',
      body: JSON.stringify({
        name: 'Carlos Gómez',
        email: 'carlos@empresa.com',
        phone: '+54 9 11 1234-5678',
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.lead.name).toBe('Carlos Gómez');
    expect(body.lead.stage).toBe('new');
    expect(mockActivitiesCollection.insertOne).toHaveBeenCalled();
  });

  it('2. POST /api/leads rechaza prospecto sin email y sin teléfono (400)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    const res = await leadsHandler({
      httpMethod: 'POST',
      path: '/api/leads',
      body: JSON.stringify({
        name: 'Sin Contacto',
      }),
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('3. POST /api/leads/:id/stage a "lost" exige motivo obligatorio (lostReason)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    const leadId = new ObjectId('65df66666666666666666666');
    mockLeadsCollection.findOne.mockResolvedValueOnce({
      _id: leadId,
      clientId: clientIdA,
      name: 'Lead Activo',
      stage: 'qualified',
    });

    const res = await leadsHandler({
      httpMethod: 'POST',
      path: `/api/leads/${leadId.toString()}/stage`,
      body: JSON.stringify({ stage: 'lost' }), // missing lostReason
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('LOST_REASON_REQUIRED');
  });

  it('4. POST /api/leads/:id/stage al salir de "lost" limpia lostReason y lostAt del estado vigente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    const leadId = new ObjectId('65df66666666666666666666');
    mockLeadsCollection.findOne
      .mockResolvedValueOnce({
        _id: leadId,
        clientId: clientIdA,
        name: 'Lead Perdido',
        stage: 'lost',
        lostReason: 'Presupuesto insuficiente',
        lostAt: new Date(),
      })
      .mockResolvedValueOnce({
        _id: leadId,
        clientId: clientIdA,
        name: 'Lead Reactivado',
        stage: 'contacted',
        lostReason: null,
        lostAt: null,
      });

    mockLeadsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await leadsHandler({
      httpMethod: 'POST',
      path: `/api/leads/${leadId.toString()}/stage`,
      body: JSON.stringify({ stage: 'contacted' }),
    });

    expect(res.statusCode).toBe(200);
    expect(mockLeadsCollection.updateOne).toHaveBeenCalledWith(
      { _id: leadId },
      expect.objectContaining({
        $set: expect.objectContaining({
          stage: 'contacted',
          lostReason: null,
          lostAt: null,
        }),
      })
    );
  });

  it('5. firstContactedAt solo se asigna en el primer contacto y no se sobrescribe', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    const initialContactDate = new Date('2026-01-01T10:00:00Z');
    const leadId = new ObjectId('65df66666666666666666666');
    mockLeadsCollection.findOne
      .mockResolvedValueOnce({
        _id: leadId,
        clientId: clientIdA,
        name: 'Lead Recontactado',
        stage: 'qualified',
        firstContactedAt: initialContactDate,
      })
      .mockResolvedValueOnce({
        _id: leadId,
        clientId: clientIdA,
        name: 'Lead Recontactado',
        stage: 'contacted',
        firstContactedAt: initialContactDate,
      });

    mockLeadsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await leadsHandler({
      httpMethod: 'POST',
      path: `/api/leads/${leadId.toString()}/stage`,
      body: JSON.stringify({ stage: 'contacted' }),
    });

    expect(res.statusCode).toBe(200);
    const updateArg = mockLeadsCollection.updateOne.mock.calls[0][1].$set;
    expect(updateArg.firstContactedAt).toBeUndefined(); // Did not overwrite
  });

  it('6. Idempotencia multiempresa: dos empresas pueden usar la misma clave de ingesta sin conflicto', async () => {
    // Empresa A
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    mockUsersCollection.find.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });

    mockLeadsCollection.findOne.mockResolvedValue(null);
    mockLeadsCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

    const resA = await leadsHandler({
      httpMethod: 'POST',
      path: '/api/leads/import',
      body: JSON.stringify({
        leads: [{ name: 'Lead Multi A', email: 'multi@demo.com', ingestionKey: 'batch_001_row_1' }],
      }),
    });

    expect(resA.statusCode).toBe(200);
    const bodyA = JSON.parse(resA.body);
    expect(bodyA.summary.createdCount).toBe(1);

    // Empresa B importando con la misma clave ingestionKey
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserB,
      db: mockDb,
      clientScope: clientIdB.toString(),
      isGlobal: false,
    });

    const resB = await leadsHandler({
      httpMethod: 'POST',
      path: '/api/leads/import',
      body: JSON.stringify({
        leads: [{ name: 'Lead Multi B', email: 'multi@demo.com', ingestionKey: 'batch_001_row_1' }],
      }),
    });

    expect(resB.statusCode).toBe(200);
    const bodyB = JSON.parse(resB.body);
    expect(bodyB.summary.createdCount).toBe(1);
  });

  it('7. Reimportar el mismo archivo en la misma empresa es idempotente y no duplica', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockClientUserA,
      db: mockDb,
      clientScope: clientIdA.toString(),
      isGlobal: false,
    });

    mockUsersCollection.find.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });

    // Mock existing document for this ingestion key in Empresa A
    mockLeadsCollection.findOne.mockResolvedValueOnce({
      _id: new ObjectId(),
      clientId: clientIdA,
      ingestionKey: 'batch_001_row_1',
    });

    const res = await leadsHandler({
      httpMethod: 'POST',
      path: '/api/leads/import',
      body: JSON.stringify({
        leads: [{ name: 'Lead Repetido', email: 'repetido@demo.com', ingestionKey: 'batch_001_row_1' }],
      }),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.summary.createdCount).toBe(0);
    expect(body.summary.duplicateWarningCount).toBe(1);
    expect(mockLeadsCollection.insertOne).not.toHaveBeenCalled();
  });
});
