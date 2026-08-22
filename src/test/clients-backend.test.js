import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as clientsHandler } from '../../netlify/functions/api-clients.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Backend Clients API (api-clients)', () => {
  let mockClientsCollection;
  let mockDb;
  let mockUser;

  beforeEach(() => {
    mockClientsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'clients') return mockClientsCollection;
        return null;
      }),
    };

    mockUser = {
      _id: new ObjectId('65df11111111111111111111'),
      email: 'admin@animamkt.com',
      role: 'super_admin',
      status: 'active',
      firebaseUid: 'mock-super-admin-uid',
    };
  });

  it('1. GET /api/clients lista todos los clientes para un super_admin', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const mockClients = [
      {
        _id: new ObjectId('65df22222222222222222222'),
        name: 'Cliente Alpha',
        slug: 'cliente-alpha',
        status: 'active',
        defaultCurrency: 'ARS',
        createdAt: new Date(),
      },
      {
        _id: new ObjectId('65df33333333333333333333'),
        name: 'Cliente Beta',
        slug: 'cliente-beta',
        status: 'inactive',
        defaultCurrency: 'USD',
        createdAt: new Date(),
      },
    ];

    mockClientsCollection.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce(mockClients),
      }),
    });

    const res = await clientsHandler({
      httpMethod: 'GET',
      path: '/api/clients',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(2);
    expect(body.clients[0].name).toBe('Cliente Alpha');
    expect(body.clients[1].slug).toBe('cliente-beta');
  });

  it('2. POST /api/clients crea un cliente exitosamente con slug único', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.findOne
      .mockResolvedValueOnce(null) // No existing slug
      .mockResolvedValueOnce(null); // No existing meta accounts conflict
    const insertedId = new ObjectId('65df44444444444444444444');
    mockClientsCollection.insertOne.mockResolvedValueOnce({ insertedId });
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: insertedId,
      name: 'Distribuidora San Juan',
      slug: 'distribuidora-san-juan',
      status: 'active',
      defaultCurrency: 'ARS',
      enabledCurrencies: ['ARS', 'USD'],
      country: 'AR',
      timezone: 'America/Argentina/Tucuman',
      metaBusinessId: '1234567890',
      metaAdAccountIds: ['act_112233'],
      createdBy: mockUser._id,
      createdAt: new Date(),
    });

    const res = await clientsHandler({
      httpMethod: 'POST',
      path: '/api/clients',
      body: JSON.stringify({
        name: 'Distribuidora San Juan',
        defaultCurrency: 'ARS',
        metaBusinessId: '1234567890',
        metaAdAccountIds: ['act_112233'],
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.client.name).toBe('Distribuidora San Juan');
    expect(body.client.slug).toBe('distribuidora-san-juan');
    expect(body.client.metaAdAccountIds).toEqual(['act_112233']);
  });

  it('3. POST /api/clients rechaza slug duplicado con código 409', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    // Existing client with same slug
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: new ObjectId(),
      slug: 'empresa-repetida',
    });

    const res = await clientsHandler({
      httpMethod: 'POST',
      path: '/api/clients',
      body: JSON.stringify({
        name: 'Empresa Repetida',
      }),
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('SLUG_ALREADY_EXISTS');
  });

  it('4. POST /api/clients rechaza tokens de acceso Meta en metaAdAccountIds', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const res = await clientsHandler({
      httpMethod: 'POST',
      path: '/api/clients',
      body: JSON.stringify({
        name: 'Empresa Insegura',
        metaAdAccountIds: ['EAABxxxxxxxxxxxxxxxSecretToken'],
      }),
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('5. POST /api/clients/:id/deactivate desactiva el cliente lógicamente', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const clientId = new ObjectId('65df55555555555555555555');
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientId,
      name: 'Cliente Activo',
      status: 'active',
    });
    mockClientsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientId,
      name: 'Cliente Activo',
      status: 'inactive',
      deactivatedAt: new Date(),
    });

    const res = await clientsHandler({
      httpMethod: 'POST',
      path: `/api/clients/${clientId.toString()}/deactivate`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.client.status).toBe('inactive');
    expect(body.client.deactivatedAt).toBeTruthy();
  });

  it('6. POST /api/clients/:id/reactivate reactiva un cliente inactivo', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const clientId = new ObjectId('65df55555555555555555555');
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientId,
      name: 'Cliente Inactivo',
      status: 'inactive',
    });
    mockClientsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientId,
      name: 'Cliente Inactivo',
      status: 'active',
      deactivatedAt: null,
    });

    const res = await clientsHandler({
      httpMethod: 'POST',
      path: `/api/clients/${clientId.toString()}/reactivate`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.client.status).toBe('active');
    expect(body.client.deactivatedAt).toBeNull();
  });

  it('7. POST /api/clients rechaza metaAdAccountIds ya asignados a otra empresa (409 META_AD_ACCOUNT_ALREADY_ASSIGNED)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    mockClientsCollection.findOne
      .mockResolvedValueOnce(null) // slug uniqueness check passes
      .mockResolvedValueOnce({ _id: new ObjectId(), name: 'Otra Empresa', metaAdAccountIds: ['act_999999'] }); // Meta account conflict

    const res = await clientsHandler({
      httpMethod: 'POST',
      path: '/api/clients',
      body: JSON.stringify({
        name: 'Nueva Empresa Con Cuenta Ocupada',
        metaAdAccountIds: ['act_999999'],
      }),
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('META_AD_ACCOUNT_ALREADY_ASSIGNED');
  });

  it('8. PATCH /api/clients/:id rechaza asociar metaAdAccountIds asignados a otra empresa (409)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockUser,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
    });

    const currentClientId = new ObjectId('65df66666666666666666666');
    mockClientsCollection.findOne
      .mockResolvedValueOnce({ _id: currentClientId, name: 'Mi Empresa', metaAdAccountIds: [] }) // Lookup current client
      .mockResolvedValueOnce({ _id: new ObjectId(), name: 'Empresa Competidora', metaAdAccountIds: ['act_conflict'] }); // Conflict lookup

    const res = await clientsHandler({
      httpMethod: 'PATCH',
      path: `/api/clients/${currentClientId.toString()}`,
      body: JSON.stringify({
        metaAdAccountIds: ['act_conflict'],
      }),
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('META_AD_ACCOUNT_ALREADY_ASSIGNED');
  });
});
