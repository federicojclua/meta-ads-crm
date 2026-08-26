import crypto from 'node:crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as usersHandler } from '../../netlify/functions/api-users.js';
import { handler as authMeHandler } from '../../netlify/functions/api-auth-me.js';
import { handler as clientsHandler } from '../../netlify/functions/api-clients.js';
import { handler as syncHandler } from '../../netlify/functions/api-meta-sync.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';
import * as AuthModule from '../../netlify/functions/_shared/auth.js';

describe('Stage 6 — Administration & RBAC Integration Tests', () => {
  let mockDb;
  let mockUsersCollection;
  let mockClientsCollection;
  let mockAuditLogsCollection;
  let mockSyncLogsCollection;

  const clientAId = new ObjectId('65df11111111111111111111');

  const superAdminUser = {
    _id: new ObjectId('65df33333333333333333333'),
    email: 'super@animamkt.com',
    normalizedEmail: 'super@animamkt.com',
    role: 'super_admin',
    status: 'active',
  };

  const clientUserA = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'client@clienta.com',
    normalizedEmail: 'client@clienta.com',
    role: 'client',
    status: 'active',
    clientId: clientAId,
    clientIds: [clientAId],
  };

  beforeEach(() => {
    mockUsersCollection = {
      findOne: vi.fn().mockImplementation(async (query) => {
        if (query && query._id) {
          return {
            _id: query._id,
            email: 'invited@clienta.com',
            normalizedEmail: 'invited@clienta.com',
            role: 'client',
            status: 'invited',
            clientId: clientAId,
            clientIds: [clientAId],
          };
        }
        return null;
      }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      findOneAndUpdate: vi.fn(),
      find: vi.fn(),
    };

    mockClientsCollection = {
      findOne: vi.fn().mockImplementation(async (query) => {
        const isMatch = (q) => {
          if (!q) return false;
          if (q._id && q._id.toString() === clientAId.toString()) return true;
          if (typeof q === 'object' && q.slug === 'client-a') return true;
          if (q.slug === clientAId.toString()) return true;
          if (q.$or) {
            return q.$or.some(subQ => {
              if (subQ._id && subQ._id.toString() === clientAId.toString()) return true;
              if (subQ.slug === 'client-a') return true;
              if (subQ._id === clientAId.toString()) return true;
              return false;
            });
          }
          return false;
        };

        if (isMatch(query)) {
          return { _id: clientAId, name: 'Client A', status: 'active', slug: 'client-a' };
        }
        return null;
      }),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    const mockScopesCollection = {
      find: vi.fn().mockReturnValue({
        toArray: async () => [
          {
            _id: new ObjectId(),
            clientId: clientAId,
            adAccountId: 'act_123',
            allowedDatasetIds: ['ds_123'],
            status: 'active'
          }
        ]
      })
    };

    mockAuditLogsCollection = {
      insertOne: vi.fn().mockResolvedValue({}),
    };

    mockSyncLogsCollection = {
      find: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              toArray: async () => [
                { _id: new ObjectId(), adAccountId: 'act_123', status: 'success', createdAt: new Date() }
              ]
            })
          })
        })
      }),
      findOne: vi.fn(),
      countDocuments: vi.fn().mockResolvedValue(1),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: 0 }),
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        if (name === 'audit_logs') return mockAuditLogsCollection;
        if (name === 'meta_sync_logs') return mockSyncLogsCollection;
        if (name === 'client_meta_scopes') return mockScopesCollection;
        return null;
      }),
    };

    vi.spyOn(DbModule, 'connectToDatabase').mockResolvedValue({ db: mockDb });
    vi.spyOn(DbModule, 'getDb').mockResolvedValue(mockDb);
  });

  describe('Flujo de Invitación Criptográfica (Substage 6.2)', () => {
    it('1. POST /api/users/authorize genera token criptográfico, hash en DB y link copiable', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: superAdminUser,
        db: mockDb,
        isGlobal: true,
      });

      const res = await usersHandler({
        httpMethod: 'POST',
        path: '/api/users/authorize',
        body: JSON.stringify({
          email: 'invited@clienta.com',
          role: 'client',
          clientId: clientAId.toString(),
        }),
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.user.status).toBe('invited');
      expect(body.inviteLink).toContain('inviteToken=');
      expect(mockUsersCollection.insertOne).toHaveBeenCalled();

      // Check that insertOne payload includes hashes and expiration date
      const insertedDoc = mockUsersCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.invitationTokenHash).toBeDefined();
      expect(insertedDoc.invitationExpiresAt).toBeDefined();
      expect(insertedDoc.status).toBe('invited');
    });

    it('2. GET /api/auth/me sin X-Invite-Token para usuario invitado retorna 403', async () => {
      vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
        authenticated: true,
        user: { uid: 'firebase-uid-new', email: 'invited@clienta.com' },
      });

      // Mock user is invited but firebaseUid is not linked yet
      const mockInvitedUser = {
        _id: new ObjectId(),
        email: 'invited@clienta.com',
        normalizedEmail: 'invited@clienta.com',
        role: 'client',
        status: 'invited',
        clientId: clientAId,
        invitationTokenHash: 'somehash',
        invitationExpiresAt: new Date(Date.now() + 1000 * 60 * 60), // not expired
      };

      mockUsersCollection.findOne.mockImplementation(async (query) => {
        if (query.firebaseUid) return null; // not linked by UID
        if (query.normalizedEmail === 'invited@clienta.com') return mockInvitedUser;
        return null;
      });

      const res = await authMeHandler({
        httpMethod: 'GET',
        headers: { authorization: 'Bearer mock-token' },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('INVITE_TOKEN_REQUIRED');
    });

    it('3. GET /api/auth/me con X-Invite-Token vencido retorna 403', async () => {
      vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
        authenticated: true,
        user: { uid: 'firebase-uid-new', email: 'invited@clienta.com' },
      });

      const rawToken = 'expired-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockInvitedUser = {
        _id: new ObjectId(),
        email: 'invited@clienta.com',
        normalizedEmail: 'invited@clienta.com',
        role: 'client',
        status: 'invited',
        clientId: clientAId,
        invitationTokenHash: tokenHash,
        invitationExpiresAt: new Date(Date.now() - 1000 * 60), // expired
      };

      mockUsersCollection.findOne.mockImplementation(async (query) => {
        if (query.firebaseUid) return null;
        if (query.normalizedEmail === 'invited@clienta.com') return mockInvitedUser;
        if (query.invitationTokenHash === tokenHash) return mockInvitedUser;
        return null;
      });

      const res = await authMeHandler({
        httpMethod: 'GET',
        headers: {
          authorization: 'Bearer mock-token',
          'x-invite-token': rawToken,
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('INVALID_OR_EXPIRED_INVITATION');
    });

    it('4. GET /api/auth/me con X-Invite-Token válido y email coincidente activa usuario y consume token', async () => {
      vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
        authenticated: true,
        user: { uid: 'firebase-uid-new', email: 'invited@clienta.com' },
      });

      const rawToken = 'valid-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockInvitedUser = {
        _id: new ObjectId(),
        email: 'invited@clienta.com',
        normalizedEmail: 'invited@clienta.com',
        role: 'client',
        status: 'invited',
        clientId: clientAId,
        invitationTokenHash: tokenHash,
        invitationExpiresAt: new Date(Date.now() + 1000 * 60 * 60), // valid
      };

      mockUsersCollection.findOne.mockImplementation(async (query) => {
        if (query.firebaseUid) return null;
        if (query.normalizedEmail === 'invited@clienta.com') return mockInvitedUser;
        if (query.invitationTokenHash === tokenHash) return mockInvitedUser;
        return null;
      });

      const res = await authMeHandler({
        httpMethod: 'GET',
        headers: {
          authorization: 'Bearer mock-token',
          'x-invite-token': rawToken,
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.user.status).toBe('active');
      expect(body.user.firebaseUid).toBe('firebase-uid-new');

      // Verify token fields are cleared (consumed)
      expect(mockUsersCollection.updateOne).toHaveBeenCalled();
      const updateSet = mockUsersCollection.updateOne.mock.calls[0][1].$set;
      expect(updateSet.firebaseUid).toBe('firebase-uid-new');
      expect(updateSet.invitationTokenHash).toBeNull();
    });

    it('5. GET /api/auth/me con X-Invite-Token válido pero email mismatch retorna 403', async () => {
      vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
        authenticated: true,
        // Firebase email is different from invited profile email!
        user: { uid: 'firebase-uid-new', email: 'hacker@gmail.com' },
      });

      const rawToken = 'valid-token';
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const mockInvitedUser = {
        _id: new ObjectId(),
        email: 'invited@clienta.com',
        normalizedEmail: 'invited@clienta.com',
        role: 'client',
        status: 'invited',
        clientId: clientAId,
        invitationTokenHash: tokenHash,
        invitationExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
      };

      mockUsersCollection.findOne.mockImplementation(async (query) => {
        if (query.firebaseUid) return null;
        if (query.normalizedEmail === 'hacker@gmail.com') return null;
        if (query.invitationTokenHash === tokenHash) return mockInvitedUser;
        return null;
      });

      const res = await authMeHandler({
        httpMethod: 'GET',
        headers: {
          authorization: 'Bearer mock-token',
          'x-invite-token': rawToken,
        },
      });

      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('IDENTITY_MISMATCH');
    });
  });

  describe('Auditoría y Aislamiento de Clientes (Substage 6.1)', () => {
    it('1. PATCH /api/clients/:id registra auditoría y diffs', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: superAdminUser,
        db: mockDb,
        isGlobal: true,
      });

      const res = await clientsHandler({
        httpMethod: 'PATCH',
        path: `/api/clients/${clientAId.toString()}`,
        body: JSON.stringify({
          name: 'Cliente A Modificado',
          defaultCurrency: 'USD',
        }),
      });

      expect(res.statusCode).toBe(200);
      expect(mockAuditLogsCollection.insertOne).toHaveBeenCalled();
      const auditDoc = mockAuditLogsCollection.insertOne.mock.calls[0][0];
      expect(auditDoc.action).toBe('UPDATE_CLIENT');
      expect(auditDoc.performedByUserId.toString()).toBe(superAdminUser._id.toString());
      expect(auditDoc.details.clientId).toBe(clientAId.toString());
    });

    it('2. PATCH /api/clients/:id por un usuario client no global retorna 403', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientUserA,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      const res = await clientsHandler({
        httpMethod: 'PATCH',
        path: `/api/clients/${clientAId.toString()}`,
        body: JSON.stringify({
          name: 'Intento Hacker',
        }),
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('Logs de Sincronización Paginados (Substage 6.3)', () => {
    it('1. GET /api/meta/sync retorna logs paginados y filtrados', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientUserA,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      const res = await syncHandler({
        httpMethod: 'GET',
        path: '/api/meta/sync',
        queryStringParameters: {
          page: '1',
          limit: '10',
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.logs).toBeDefined();
      expect(mockSyncLogsCollection.find).toHaveBeenCalled();
    });
  });
});
