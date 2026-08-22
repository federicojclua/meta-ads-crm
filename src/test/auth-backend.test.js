import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mocks
const mockVerifyIdToken = vi.fn();
const mockFindOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();
const mockUpdateOne = vi.fn();

vi.mock('../../netlify/functions/_shared/firebaseAdmin.js', () => ({
  getFirebaseAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
  getFirebaseAdmin: () => ({}),
}));

vi.mock('../../netlify/functions/_shared/db.js', () => ({
  connectToDatabase: async () => ({
    db: {
      collection: () => ({
        findOne: mockFindOne,
        findOneAndUpdate: mockFindOneAndUpdate,
        updateOne: mockUpdateOne,
      }),
    },
  }),
}));

import { handler } from '../../netlify/functions/api-auth-me.js';

describe('Backend Auth & Bootstrap Endpoint (api-auth-me)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPER_ADMIN_EMAIL = 'admin@animamkt.com';
    process.env.MONGODB_DB_NAME = 'anima_mkt_crm';
  });

  it('1. Sin token -> responde 401', async () => {
    const event = {
      httpMethod: 'GET',
      headers: {},
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('AUTH_TOKEN_MISSING');
  });

  it('2. Token inválido -> responde 401', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_invalido_123',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('AUTH_TOKEN_INVALID');
  });

  it('3. Email no verificado -> responde 403', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user_123',
      email: 'admin@animamkt.com',
      email_verified: false,
    });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer valid_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('AUTH_EMAIL_NOT_VERIFIED');
  });

  it('4. Firebase válido sin usuario en MongoDB y no es super_admin -> responde 403', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user_regular',
      email: 'desconocido@agencia.com',
      email_verified: true,
    });
    mockFindOne.mockResolvedValue(null);

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer valid_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('USER_NOT_AUTHORIZED');
  });

  it('5. Correo distinto a SUPER_ADMIN_EMAIL no obtiene super_admin', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user_random',
      email: 'hacker@agencia.com',
      email_verified: true,
    });
    mockFindOne.mockResolvedValue(null);

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer valid_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
  });

  it('6. Super_admin correcto -> bootstrap atómico con findOneAndUpdate y upsert', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'uid_super_admin',
      email: 'admin@animamkt.com',
      name: 'Super Admin Test',
      email_verified: true,
      firebase: { sign_in_provider: 'password' },
    });
    mockFindOne.mockResolvedValue(null);

    const createdSuperAdmin = {
      _id: 'new_id_123',
      firebaseUid: 'uid_super_admin',
      email: 'admin@animamkt.com',
      normalizedEmail: 'admin@animamkt.com',
      displayName: 'Super Admin Test',
      photoURL: null,
      role: 'super_admin',
      status: 'active',
      clientIds: [],
    };

    mockFindOneAndUpdate.mockResolvedValueOnce(createdSuperAdmin);
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer super_admin_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.role).toBe('super_admin');
    expect(body.user.status).toBe('active');
    expect(body.user.normalizedEmail).toBe('admin@animamkt.com');
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { normalizedEmail: 'admin@animamkt.com' },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          role: 'super_admin',
          status: 'active',
          firebaseUid: 'uid_super_admin',
        }),
      }),
      { upsert: true, returnDocument: 'after' }
    );
  });

  it('7. Recuperación explícita de colisión E11000 en bootstrap simultáneo', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'uid_super_admin',
      email: 'admin@animamkt.com',
      email_verified: true,
    });
    // First findOne returns null for both
    mockFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const duplicateError = new Error('E11000 duplicate key error');
    duplicateError.code = 11000;
    mockFindOneAndUpdate.mockRejectedValueOnce(duplicateError);

    const existingAdminDoc = {
      _id: 'existing_admin_id',
      firebaseUid: 'uid_super_admin',
      email: 'admin@animamkt.com',
      normalizedEmail: 'admin@animamkt.com',
      role: 'super_admin',
      status: 'active',
    };
    mockFindOne.mockResolvedValueOnce(existingAdminDoc);
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer super_admin_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.role).toBe('super_admin');
    expect(mockFindOne).toHaveBeenCalledWith({ normalizedEmail: 'admin@animamkt.com' });
  });

  it('8. Rechazo de Identity Mismatch: mismo correo con UID diferente -> responde 403', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'nuevo_hacker_uid',
      email: 'admin@animamkt.com',
      email_verified: true,
    });

    const existingUserWithOtherUid = {
      _id: 'existing_id',
      firebaseUid: 'uid_legitimo_previo',
      email: 'admin@animamkt.com',
      normalizedEmail: 'admin@animamkt.com',
      role: 'super_admin',
      status: 'active',
    };

    // findOne by uid returns null, findOne by email returns existing doc with different uid
    mockFindOne.mockImplementation(({ firebaseUid, normalizedEmail }) => {
      if (firebaseUid) return Promise.resolve(null);
      if (normalizedEmail) return Promise.resolve(existingUserWithOtherUid);
      return Promise.resolve(null);
    });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_con_otro_uid',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('IDENTITY_MISMATCH');
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it('9. Rechazo de Identity Mismatch: mismo UID con correo diferente -> responde 403', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'uid_compartido',
      email: 'nuevo_correo@test.com',
      email_verified: true,
    });

    const existingUserWithOriginalEmail = {
      _id: 'existing_id_2',
      firebaseUid: 'uid_compartido',
      email: 'correo_original@test.com',
      normalizedEmail: 'correo_original@test.com',
      role: 'admin',
      status: 'active',
    };

    mockFindOne.mockImplementation(({ firebaseUid }) => {
      if (firebaseUid === 'uid_compartido') return Promise.resolve(existingUserWithOriginalEmail);
      return Promise.resolve(null);
    });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer token_mismo_uid',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('IDENTITY_MISMATCH');
  });

  it('10. Segundo login de super_admin -> idempotente y no sobrescribe datos', async () => {
    const existingProfile = {
      _id: 'existing_id_123',
      firebaseUid: 'uid_super_admin',
      email: 'admin@animamkt.com',
      normalizedEmail: 'admin@animamkt.com',
      displayName: 'Super Admin Test',
      role: 'super_admin',
      status: 'active',
      clientIds: [],
    };

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'uid_super_admin',
      email: 'admin@animamkt.com',
      email_verified: true,
    });
    mockFindOne.mockResolvedValue(existingProfile);
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer super_admin_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.role).toBe('super_admin');
    expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    expect(mockUpdateOne).toHaveBeenCalledTimes(1);
  });

  it('11. Usuario suspendido en MongoDB -> responde 403 Forbidden', async () => {
    const suspendedProfile = {
      _id: 'suspended_id',
      firebaseUid: 'uid_suspended',
      email: 'cliente@empresa.com',
      normalizedEmail: 'cliente@empresa.com',
      role: 'client',
      status: 'suspended',
    };

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'uid_suspended',
      email: 'cliente@empresa.com',
      email_verified: true,
    });
    mockFindOne.mockResolvedValue(suspendedProfile);

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer suspended_token',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('USER_SUSPENDED');
  });

  it('12. Rol enviado desde frontend o parámetros es ignorado (solo GET /auth/me usa MongoDB)', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'client_uid',
      email: 'cliente@test.com',
      email_verified: true,
    });

    const clientProfile = {
      _id: 'client_doc_id',
      firebaseUid: 'client_uid',
      email: 'cliente@test.com',
      normalizedEmail: 'cliente@test.com',
      role: 'client',
      status: 'active',
      clientIds: ['client_1'],
    };

    mockFindOne.mockResolvedValue(clientProfile);
    mockUpdateOne.mockResolvedValueOnce({ modifiedCount: 1 });

    const event = {
      httpMethod: 'GET',
      headers: {
        authorization: 'Bearer client_token',
      },
      queryStringParameters: { role: 'super_admin' },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.role).toBe('client');
  });
});
