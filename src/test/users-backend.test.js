import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as usersHandler } from '../../netlify/functions/api-users.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';
import * as FirebaseAdminModule from '../../netlify/functions/_shared/firebaseAdmin.js';

describe('Backend Users API (api-users)', () => {
  let mockUsersCollection;
  let mockClientsCollection;
  let mockDb;
  let mockSuperAdmin;
  let mockAdmin;
  let mockOtherAdmin;
  let mockClientUser;
  let mockFirebaseAuth;

  beforeEach(() => {
    mockUsersCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
    };

    mockClientsCollection = {
      findOne: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        return null;
      }),
    };

    mockSuperAdmin = {
      _id: new ObjectId('65df11111111111111111111'),
      email: 'superadmin@animamkt.com',
      role: 'super_admin',
      status: 'active',
      firebaseUid: 'super-admin-uid',
    };

    mockAdmin = {
      _id: new ObjectId('65df22222222222222222222'),
      email: 'admin1@animamkt.com',
      role: 'admin',
      status: 'active',
      firebaseUid: 'admin-1-uid',
    };

    mockOtherAdmin = {
      _id: new ObjectId('65df33333333333333333333'),
      email: 'admin2@animamkt.com',
      role: 'admin',
      status: 'active',
      firebaseUid: 'admin-2-uid',
    };

    mockClientUser = {
      _id: new ObjectId('65df44444444444444444444'),
      email: 'client@empresa.com',
      role: 'client',
      status: 'active',
      clientId: new ObjectId('65df55555555555555555555'),
      firebaseUid: 'client-uid',
    };

    mockFirebaseAuth = {
      revokeRefreshTokens: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(FirebaseAdminModule, 'getFirebaseAdmin').mockReturnValue(mockFirebaseAuth);
  });

  it('1. POST /api/users/authorize preautoriza un usuario con firebaseUid null y status invited', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSuperAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: true,
      isAdmin: false,
    });

    const targetClientId = new ObjectId('65df66666666666666666666');
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: targetClientId,
      name: 'Empresa Demo',
      status: 'active',
    });

    mockUsersCollection.findOne.mockResolvedValueOnce(null); // No duplicate email
    const insertedUserId = new ObjectId('65df77777777777777777777');
    mockUsersCollection.insertOne.mockResolvedValueOnce({ insertedId: insertedUserId });
    mockUsersCollection.findOne.mockResolvedValueOnce({
      _id: insertedUserId,
      email: 'cliente@empresa.com',
      normalizedEmail: 'cliente@empresa.com',
      displayName: 'Cliente Demo',
      role: 'client',
      status: 'invited',
      firebaseUid: null,
      clientId: targetClientId,
      invitedBy: mockSuperAdmin._id,
      createdAt: new Date(),
    });

    const res = await usersHandler({
      httpMethod: 'POST',
      path: '/api/users/authorize',
      body: JSON.stringify({
        displayName: 'Cliente Demo',
        email: 'cliente@empresa.com',
        role: 'client',
        clientId: targetClientId.toString(),
      }),
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe('cliente@empresa.com');
    expect(body.user.status).toBe('invited');
    expect(body.user.firebaseUid).toBeNull();
    expect(body.loginUrl).toBe('/login');
  });

  it('2. POST /api/users/authorize rechaza correo duplicado con 409', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSuperAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: true,
      isAdmin: false,
    });

    const targetClientId = new ObjectId('65df66666666666666666666');
    mockClientsCollection.findOne.mockResolvedValueOnce({
      _id: targetClientId,
      status: 'active',
    });

    mockUsersCollection.findOne.mockResolvedValueOnce({
      _id: new ObjectId(),
      normalizedEmail: 'existente@empresa.com',
    });

    const res = await usersHandler({
      httpMethod: 'POST',
      path: '/api/users/authorize',
      body: JSON.stringify({
        email: 'existente@empresa.com',
        role: 'client',
        clientId: targetClientId.toString(),
      }),
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('3. POST /api/users/authorize ejecutado por admin no puede crear admin ni super_admin (403)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: false,
      isAdmin: true,
    });

    const res = await usersHandler({
      httpMethod: 'POST',
      path: '/api/users/authorize',
      body: JSON.stringify({
        email: 'nuevo-admin@empresa.com',
        role: 'admin',
      }),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CANNOT_CREATE_ADMIN');
  });

  it('4. PATCH /api/users/:id ejecutado por admin no puede modificar a otro admin (403)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: false,
      isAdmin: true,
    });

    mockUsersCollection.findOne.mockResolvedValueOnce(mockOtherAdmin);

    const res = await usersHandler({
      httpMethod: 'PATCH',
      path: `/api/users/${mockOtherAdmin._id.toString()}`,
      body: JSON.stringify({
        displayName: 'Nombre Hackeado',
      }),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CANNOT_MODIFY_ADMIN');
  });

  it('5. POST /api/users/:id/suspend ejecutado por admin no puede suspender a otro admin ni super_admin (403)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: false,
      isAdmin: true,
    });

    mockUsersCollection.findOne.mockResolvedValueOnce(mockOtherAdmin);

    const res = await usersHandler({
      httpMethod: 'POST',
      path: `/api/users/${mockOtherAdmin._id.toString()}/suspend`,
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CANNOT_SUSPEND_ADMIN');
  });

  it('6. POST /api/users/:id/suspend suspende usuario con UID e invoca revocación en Firebase', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSuperAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: true,
      isAdmin: false,
    });

    mockUsersCollection.findOne.mockResolvedValueOnce(mockClientUser);
    mockUsersCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    mockUsersCollection.findOne.mockResolvedValueOnce({
      ...mockClientUser,
      status: 'suspended',
    });

    const res = await usersHandler({
      httpMethod: 'POST',
      path: `/api/users/${mockClientUser._id.toString()}/suspend`,
    });

    expect(res.statusCode).toBe(200);
    expect(mockFirebaseAuth.revokeRefreshTokens).toHaveBeenCalledWith(mockClientUser.firebaseUid);
    const body = JSON.parse(res.body);
    expect(body.user.status).toBe('suspended');
    expect(body.warning).toBeUndefined();
  });

  it('7. POST /api/users/:id/suspend suspende usuario sin UID sin llamar a Firebase', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSuperAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: true,
      isAdmin: false,
    });

    const invitedUserWithoutUid = {
      _id: new ObjectId('65df88888888888888888888'),
      email: 'invited@empresa.com',
      role: 'client',
      status: 'invited',
      firebaseUid: null,
    };

    mockUsersCollection.findOne.mockResolvedValueOnce(invitedUserWithoutUid);
    mockUsersCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    mockUsersCollection.findOne.mockResolvedValueOnce({
      ...invitedUserWithoutUid,
      status: 'suspended',
    });

    const res = await usersHandler({
      httpMethod: 'POST',
      path: `/api/users/${invitedUserWithoutUid._id.toString()}/suspend`,
    });

    expect(res.statusCode).toBe(200);
    expect(mockFirebaseAuth.revokeRefreshTokens).not.toHaveBeenCalled();
    const body = JSON.parse(res.body);
    expect(body.user.status).toBe('suspended');
  });

  it('8. POST /api/users/:id/suspend responde 200 con advertencia si Firebase Admin falla', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSuperAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: true,
      isAdmin: false,
    });

    mockFirebaseAuth.revokeRefreshTokens.mockRejectedValueOnce(new Error('Firebase service unavailable'));

    mockUsersCollection.findOne.mockResolvedValueOnce(mockClientUser);
    mockUsersCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });
    mockUsersCollection.findOne.mockResolvedValueOnce({
      ...mockClientUser,
      status: 'suspended',
    });

    const res = await usersHandler({
      httpMethod: 'POST',
      path: `/api/users/${mockClientUser._id.toString()}/suspend`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.status).toBe('suspended');
    expect(body.warning).toBe('SESSION_REVOCATION_DEFERRED');
  });

  it('9. POST /api/users/:id/suspend rechaza auto-suspensión con 400', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockSuperAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: true,
      isAdmin: false,
    });

    mockUsersCollection.findOne.mockResolvedValueOnce(mockSuperAdmin);

    const res = await usersHandler({
      httpMethod: 'POST',
      path: `/api/users/${mockSuperAdmin._id.toString()}/suspend`,
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CANNOT_SUSPEND_SELF');
  });

  it('10. PATCH /api/users/:id bloquea modificación del propio rol (403)', async () => {
    vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
      authorized: true,
      user: mockAdmin,
      db: mockDb,
      clientScope: null,
      isGlobal: true,
      isSuperAdmin: false,
      isAdmin: true,
    });

    mockUsersCollection.findOne.mockResolvedValueOnce(mockAdmin);

    const res = await usersHandler({
      httpMethod: 'PATCH',
      path: `/api/users/${mockAdmin._id.toString()}`,
      body: JSON.stringify({
        role: 'super_admin',
      }),
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.code).toBe('CANNOT_MODIFY_OWN_ROLE');
  });
});
