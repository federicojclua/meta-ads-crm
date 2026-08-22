import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as authMeHandler } from '../../netlify/functions/api-auth-me.js';
import { handler as clientsHandler } from '../../netlify/functions/api-clients.js';
import { handler as usersHandler } from '../../netlify/functions/api-users.js';
import * as AuthModule from '../../netlify/functions/_shared/auth.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';

describe('Multi-Tenant Isolation & Lifecycle Verification', () => {
  let mockUsersCollection;
  let mockClientsCollection;
  let mockDb;

  const clientAId = new ObjectId('65df11111111111111111111');
  const clientBId = new ObjectId('65df22222222222222222222');

  const clientUserA = {
    _id: new ObjectId('65df33333333333333333333'),
    email: 'user-a@client-a.com',
    normalizedEmail: 'user-a@client-a.com',
    displayName: 'Usuario A',
    role: 'client',
    status: 'active',
    clientId: clientAId,
    clientIds: [clientAId],
    firebaseUid: 'firebase-uid-a',
  };

  const salespersonUserA = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'sales-a@client-a.com',
    normalizedEmail: 'sales-a@client-a.com',
    displayName: 'Vendedor A',
    role: 'salesperson',
    status: 'active',
    clientId: clientAId,
    clientIds: [clientAId],
    firebaseUid: 'firebase-uid-sales-a',
  };

  beforeEach(() => {
    mockUsersCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    mockClientsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        return null;
      }),
    };

    vi.spyOn(DbModule, 'connectToDatabase').mockResolvedValue({ db: mockDb });
  });

  it('1. Preauthorized user links firebaseUid atomically on first Google login in api-auth-me', async () => {
    vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
      authenticated: true,
      user: {
        uid: 'newly-created-google-uid',
        email: 'preauthorized@client-a.com',
        name: 'Nuevo Usuario',
        picture: 'https://photo.url',
      },
    });

    const preauthorizedDoc = {
      _id: new ObjectId('65df55555555555555555555'),
      email: 'preauthorized@client-a.com',
      normalizedEmail: 'preauthorized@client-a.com',
      displayName: 'Nuevo Usuario',
      role: 'client',
      status: 'invited',
      clientId: clientAId,
      clientIds: [clientAId],
      firebaseUid: null,
    };

    // User lookup by uid -> null; lookup by email -> preauthorizedDoc
    mockUsersCollection.findOne
      .mockResolvedValueOnce(null) // userByUid
      .mockResolvedValueOnce(preauthorizedDoc) // userByEmail
      .mockResolvedValueOnce({ _id: clientAId, status: 'active', name: 'Cliente A' }); // client check

    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientAId,
      status: 'active',
      name: 'Cliente A',
    });

    mockUsersCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const res = await authMeHandler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer mock-token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe('preauthorized@client-a.com');
    expect(body.user.firebaseUid).toBe('newly-created-google-uid');
    expect(body.user.status).toBe('active');
    expect(body.user.clientId).toBe(clientAId.toString());
  });

  it('2. api-auth-me rejects non-preauthorized user with 403 USER_NOT_AUTHORIZED', async () => {
    vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
      authenticated: true,
      user: {
        uid: 'unknown-google-uid',
        email: 'stranger@gmail.com',
      },
    });

    mockUsersCollection.findOne
      .mockResolvedValueOnce(null) // userByUid
      .mockResolvedValueOnce(null); // userByEmail

    const res = await authMeHandler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer mock-token' },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('USER_NOT_AUTHORIZED');
  });

  it('3. api-auth-me rejects login if user client is inactive with 403 CLIENT_INACTIVE', async () => {
    vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
      authenticated: true,
      user: {
        uid: 'firebase-uid-a',
        email: 'user-a@client-a.com',
      },
    });

    mockUsersCollection.findOne
      .mockResolvedValueOnce(clientUserA) // userByUid
      .mockResolvedValueOnce(clientUserA); // userByEmail

    // Client A is inactive
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientAId,
      status: 'inactive',
      name: 'Cliente A',
    });

    const res = await authMeHandler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer mock-token' },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CLIENT_INACTIVE');
  });

  it('4. GET /api/clients/:id rejects client user trying to view another client (403 FORBIDDEN_CLIENT_ACCESS)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: clientUserA,
      db: mockDb,
      clientScope: clientAId.toString(),
      isGlobal: false,
    });

    // Client B document
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: clientBId,
      name: 'Cliente B',
      slug: 'cliente-b',
      status: 'active',
    });

    const res = await clientsHandler({
      httpMethod: 'GET',
      path: `/api/clients/${clientBId.toString()}`,
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('FORBIDDEN_CLIENT_ACCESS');
  });

  it('5. GET /api/clients forces strict tenant filter for client role regardless of query params', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: clientUserA,
      db: mockDb,
      clientScope: clientAId.toString(),
      isGlobal: false,
    });

    mockClientsCollection.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([
          {
            _id: clientAId,
            name: 'Cliente A',
            slug: 'cliente-a',
            status: 'active',
          },
        ]),
      }),
    });

    const res = await clientsHandler({
      httpMethod: 'GET',
      path: '/api/clients',
      queryStringParameters: { clientId: clientBId.toString() }, // Adversarial param
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(1);
    expect(body.clients[0].name).toBe('Cliente A');

    // Confirm that the database query was forced to clientAId
    const queryArg = mockClientsCollection.find.mock.calls[0][0];
    expect(queryArg.$or).toBeDefined();
    expect(queryArg.$or[0]._id).toEqual(clientAId);
  });

  it('6. GET /api/users restricts salesperson to only users of their own assigned client', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: salespersonUserA,
      db: mockDb,
      clientScope: clientAId.toString(),
      isGlobal: false,
    });

    mockUsersCollection.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([clientUserA, salespersonUserA]),
      }),
    });

    const res = await usersHandler({
      httpMethod: 'GET',
      path: '/api/users',
      queryStringParameters: { clientId: clientBId.toString() }, // Adversarial param
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(2);

    // Verify DB query enforced clientScope
    const queryArg = mockUsersCollection.find.mock.calls[0][0];
    expect(queryArg.$or).toBeDefined();
  });

  it('7. Admite la existencia de múltiples usuarios con firebaseUid null en estado invited', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: clientUserA,
      db: mockDb,
      clientScope: clientAId.toString(),
      isGlobal: true,
    });

    const invitedUsers = [
      { _id: new ObjectId(), email: 'invitado1@cliente-a.com', firebaseUid: null, status: 'invited' },
      { _id: new ObjectId(), email: 'invitado2@cliente-a.com', firebaseUid: null, status: 'invited' },
    ];

    mockUsersCollection.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce(invitedUsers),
      }),
    });

    const res = await usersHandler({
      httpMethod: 'GET',
      path: '/api/users',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.total).toBe(2);
    expect(body.users[0].firebaseUid).toBeNull();
    expect(body.users[1].firebaseUid).toBeNull();
  });

  it('8. api-auth-me rechaza colisión de identidad cuando un correo ya tiene otro firebaseUid diferente vinculado', async () => {
    vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
      authenticated: true,
      user: {
        uid: 'attacker-google-uid',
        email: 'user-a@client-a.com',
      },
    });

    // An existing user with this email has 'firebase-uid-a', not 'attacker-google-uid'
    mockUsersCollection.findOne
      .mockResolvedValueOnce(null) // userByUid -> null
      .mockResolvedValueOnce(clientUserA); // userByEmail -> clientUserA (with firebase-uid-a)

    const res = await authMeHandler({
      httpMethod: 'GET',
      headers: { authorization: 'Bearer mock-token' },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('IDENTITY_MISMATCH');
  });
});
