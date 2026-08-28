import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import { getDb } from './_shared/db.js';
import { verifyAuthorizedUser } from './_shared/permissions.js';
import { getFirebaseAdmin } from './_shared/firebaseAdmin.js';
import { jsonResponse, errorResponse } from './_shared/response.js';
import {
  ROLES,
  DEFAULT_PERMISSIONS,
  sanitizeUserResponse,
} from '../../models/User.js';

export async function handler(event) {
  // 1. Verify authorization
  const auth = await verifyAuthorizedUser(event);
  if (!auth.authorized) {
    return errorResponse(auth.status, auth.error, auth.code);
  }

  const { user, clientScope, isGlobal, isSuperAdmin } = auth;
  const db = auth.db || await getDb();
  const usersCollection = db.collection('users');
  const clientsCollection = db.collection('clients');
  const method = event.httpMethod;
  const now = new Date();

  // Normalize path segments
  const cleanPath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api-users/, '')
    .replace(/^\/api\/users/, '');
  const segments = cleanPath.split('/').filter(Boolean);

  try {
    // ----------------------------------------------------
    // Route: /api/users (Collection level)
    // ----------------------------------------------------
    if (segments.length === 0) {
      if (method === 'GET') {
        let query = {};
        if (!isGlobal) {
          // Strict tenant scoping: only users from the same clientId
          if (ObjectId.isValid(clientScope)) {
            query = {
              $or: [
                { clientId: new ObjectId(clientScope) },
                { clientId: clientScope },
                { clientIds: new ObjectId(clientScope) },
                { clientIds: clientScope },
              ],
            };
          } else {
            query = {
              $or: [
                { clientId: clientScope },
                { clientIds: clientScope },
              ],
            };
          }
        } else {
          const params = event.queryStringParameters || {};
          if (params.clientId) {
            const rawId = params.clientId.trim();
            if (ObjectId.isValid(rawId)) {
              query.$or = [
                { clientId: new ObjectId(rawId) },
                { clientId: rawId },
                { clientIds: new ObjectId(rawId) },
                { clientIds: rawId },
              ];
            } else {
              query.$or = [
                { clientId: rawId },
                { clientIds: rawId },
              ];
            }
          }
          if (params.status) {
            query.status = params.status;
          }
          if (params.role) {
            query.role = params.role;
          }
        }

        const usersList = await usersCollection.find(query).sort({ createdAt: -1 }).toArray();
        return jsonResponse(200, {
          users: usersList.map(sanitizeUserResponse),
          total: usersList.length,
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    // ----------------------------------------------------
    // Route: /api/users/authorize (Preauthorize user)
    // ----------------------------------------------------
    if (segments.length === 1 && segments[0] === 'authorize') {
      if (!isGlobal) {
        return errorResponse(403, 'No tienes permisos para autorizar nuevos usuarios.', 'FORBIDDEN_ACTION');
      }
      if (method !== 'POST') {
        return errorResponse(405, 'Utilice POST para autorizar usuarios.', 'METHOD_NOT_ALLOWED');
      }

      let body;
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
      } catch {
        return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
      }

      const rawEmail = (body.email || '').trim();
      const role = (body.role || '').trim();
      const displayName = (body.displayName || '').trim() || rawEmail.split('@')[0];
      const rawClientId = body.clientId ? String(body.clientId).trim() : null;

      if (!rawEmail || !rawEmail.includes('@')) {
        return errorResponse(400, 'Debe proporcionar una dirección de correo electrónico válida.', 'INVALID_EMAIL');
      }

      const normalizedEmail = rawEmail.toLowerCase();

      if (!ROLES.includes(role)) {
        return errorResponse(400, `Rol inválido. Debe ser uno de: ${ROLES.join(', ')}`, 'INVALID_ROLE');
      }

      // Hierarchy rule: admin can only authorize client and salesperson roles
      if (!isSuperAdmin && ['super_admin', 'admin'].includes(role)) {
        return errorResponse(
          403,
          'Un Administrador solo puede autorizar usuarios con rol client o salesperson.',
          'CANNOT_CREATE_ADMIN'
        );
      }

      let targetClientId = null;
      if (['client', 'salesperson'].includes(role)) {
        if (!rawClientId) {
          return errorResponse(400, 'Los usuarios con rol client o salesperson requieren un clientId asignado.', 'CLIENT_REQUIRED');
        }

        let clientQuery = { slug: rawClientId };
        if (ObjectId.isValid(rawClientId)) {
          clientQuery = {
            $or: [
              { _id: new ObjectId(rawClientId) },
              { _id: rawClientId },
              { slug: rawClientId },
            ],
          };
        }

        const clientDoc = await clientsCollection.findOne(clientQuery);
        if (!clientDoc) {
          return errorResponse(404, 'La empresa o cliente especificado no existe.', 'CLIENT_NOT_FOUND');
        }
        if (clientDoc.status !== 'active') {
          return errorResponse(400, 'No se pueden asignar usuarios a una empresa inactiva.', 'CLIENT_INACTIVE');
        }
        targetClientId = clientDoc._id;
      }

      // Ensure no duplicate email
      const existingUser = await usersCollection.findOne({ normalizedEmail });
      if (existingUser) {
        return errorResponse(409, `El correo ${rawEmail} ya se encuentra registrado en Anima MKT CRM.`, 'EMAIL_ALREADY_EXISTS');
      }

      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationTokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex');
      const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

      const newUserData = {
        firebaseUid: null,
        email: rawEmail,
        normalizedEmail,
        displayName,
        photoURL: null,
        role,
        status: 'invited',
        clientId: targetClientId,
        clientIds: targetClientId ? [targetClientId] : [],
        permissions: DEFAULT_PERMISSIONS[role] || {},
        invitedBy: user._id,
        invitedAt: now,
        invitationTokenHash,
        invitationExpiresAt,
        activatedAt: null,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const result = await usersCollection.insertOne(newUserData);
      const createdUser = await usersCollection.findOne({ _id: result.insertedId });

      // Audit log registration
      const auditLogsCollection = db.collection('audit_logs');
      if (auditLogsCollection && typeof auditLogsCollection.insertOne === 'function') {
        await auditLogsCollection.insertOne({
          action: 'INVITE_USER',
          performedByUserId: user?._id || null,
          performedAt: now,
          details: {
            userId: result.insertedId.toString(),
            email: normalizedEmail,
            role,
            clientId: targetClientId ? targetClientId.toString() : null,
          },
        });
      }

      return jsonResponse(201, {
        user: sanitizeUserResponse(createdUser),
        message: 'Usuario preautorizado exitosamente. Comparta el enlace de invitación de un solo uso con el usuario.',
        loginUrl: '/login',
        inviteToken: invitationToken,
        inviteLink: `/login?inviteToken=${invitationToken}`,
      });
    }

    // ----------------------------------------------------
    // Route: /api/users/:id (Resource level)
    // ----------------------------------------------------
    const targetUserId = segments[0];
    let userLookupQuery = { normalizedEmail: targetUserId.toLowerCase() };
    if (ObjectId.isValid(targetUserId)) {
      userLookupQuery = {
        $or: [
          { _id: new ObjectId(targetUserId) },
          { _id: targetUserId },
          { firebaseUid: targetUserId },
        ],
      };
    }

    const targetUser = await usersCollection.findOne(userLookupQuery);
    if (!targetUser) {
      return errorResponse(404, 'Usuario no encontrado.', 'USER_NOT_FOUND');
    }

    // Sub-actions: /api/users/:id/suspend and /api/users/:id/reactivate
    if (segments.length === 2) {
      const action = segments[1];

      if (action === 'suspend') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para suspender usuarios.', 'FORBIDDEN_ACTION');
        }
        if (method !== 'POST') {
          return errorResponse(405, 'Utilice POST para suspender.', 'METHOD_NOT_ALLOWED');
        }

        // Security check: cannot suspend oneself
        if (targetUser._id.toString() === user._id.toString() || (targetUser.firebaseUid && targetUser.firebaseUid === user.firebaseUid)) {
          return errorResponse(400, 'No puedes suspender tu propia cuenta de usuario.', 'CANNOT_SUSPEND_SELF');
        }

        // Hierarchy check: admin cannot suspend another admin or super_admin
        if (!isSuperAdmin && ['admin', 'super_admin'].includes(targetUser.role)) {
          return errorResponse(
            403,
            'Un Administrador no puede suspender a otro Administrador ni a un Super Administrador.',
            'CANNOT_SUSPEND_ADMIN'
          );
        }

        // 1. Authoritative suspension in MongoDB
        await usersCollection.updateOne(
          { _id: targetUser._id },
          {
            $set: {
              status: 'suspended',
              updatedAt: now,
            },
          }
        );

        // 2. Best-effort external token revocation (never fail request if Firebase is unavailable)
        let revocationWarning = null;
        if (targetUser.firebaseUid) {
          try {
            const firebaseAuth = getFirebaseAdmin();
            await firebaseAuth.revokeRefreshTokens(targetUser.firebaseUid);
            console.log('[AUTH_AUDIT] User refresh tokens revoked successfully:', {
              revoked: true,
            });
          } catch (revokeErr) {
            console.warn('[AUTH_AUDIT] Firebase token revocation deferred or failed:', {
              revoked: false,
              errorCode: revokeErr.code || revokeErr.name || 'UNKNOWN_ERROR',
            });
            revocationWarning = 'SESSION_REVOCATION_DEFERRED';
          }
        }

        const updated = await usersCollection.findOne({ _id: targetUser._id });
        return jsonResponse(200, {
          user: sanitizeUserResponse(updated),
          message: 'Usuario suspendido exitosamente.',
          ...(revocationWarning ? { warning: revocationWarning } : {}),
        });
      }

      if (action === 'reactivate') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para reactivar usuarios.', 'FORBIDDEN_ACTION');
        }
        if (method !== 'POST') {
          return errorResponse(405, 'Utilice POST para reactivar.', 'METHOD_NOT_ALLOWED');
        }

        // Hierarchy check: admin cannot reactivate another admin or super_admin
        if (!isSuperAdmin && ['admin', 'super_admin'].includes(targetUser.role)) {
          return errorResponse(
            403,
            'Un Administrador no puede reactivar a otro Administrador ni a un Super Administrador.',
            'CANNOT_REACTIVATE_ADMIN'
          );
        }

        const restoredStatus = targetUser.firebaseUid ? 'active' : 'invited';

        await usersCollection.updateOne(
          { _id: targetUser._id },
          {
            $set: {
              status: restoredStatus,
              updatedAt: now,
            },
          }
        );

        const updated = await usersCollection.findOne({ _id: targetUser._id });
        return jsonResponse(200, {
          user: sanitizeUserResponse(updated),
          message: 'Usuario reactivado exitosamente.',
        });
      }

      return errorResponse(404, 'Acción no encontrada.', 'ACTION_NOT_FOUND');
    }

    // Direct /api/users/:id operations
    if (segments.length === 1) {
      if (method === 'GET') {
        if (!isGlobal && clientScope !== targetUser.clientId?.toString()) {
          return errorResponse(403, 'No tienes autorización para consultar este usuario.', 'FORBIDDEN_USER_ACCESS');
        }
        return jsonResponse(200, {
          user: sanitizeUserResponse(targetUser),
        });
      }

      if (method === 'PATCH') {
        if (!isGlobal) {
          return errorResponse(403, 'No tienes permisos para modificar usuarios.', 'FORBIDDEN_ACTION');
        }

        let body;
        try {
          body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        } catch {
          return errorResponse(400, 'Payload JSON malformado.', 'INVALID_JSON');
        }

        const isSelf = targetUser._id.toString() === user._id.toString();

        // Security rule: cannot modify own role
        if (body.role !== undefined && body.role !== targetUser.role && isSelf) {
          return errorResponse(403, 'No puedes modificar tu propio rol.', 'CANNOT_MODIFY_OWN_ROLE');
        }

        // Hierarchy rule: admin cannot edit an admin/super_admin nor grant admin/super_admin roles
        if (!isSuperAdmin && ['admin', 'super_admin'].includes(targetUser.role)) {
          return errorResponse(
            403,
            'Un Administrador no puede modificar a otro Administrador ni a un Super Administrador.',
            'CANNOT_MODIFY_ADMIN'
          );
        }
        if (!isSuperAdmin && body.role !== undefined && ['admin', 'super_admin'].includes(body.role)) {
          return errorResponse(
            403,
            'Un Administrador solo puede asignar roles client o salesperson.',
            'CANNOT_GRANT_ADMIN'
          );
        }

        const updateFields = {
          updatedAt: now,
        };

        if (body.displayName !== undefined) {
          updateFields.displayName = String(body.displayName).trim() || targetUser.displayName;
        }

        if (body.role !== undefined && ROLES.includes(body.role)) {
          updateFields.role = body.role;
          updateFields.permissions = DEFAULT_PERMISSIONS[body.role] || targetUser.permissions;
        }

        if (body.clientId !== undefined) {
          if (body.clientId === null) {
            updateFields.clientId = null;
            updateFields.clientIds = [];
          } else {
            const rawId = String(body.clientId).trim();
            let cQuery = { slug: rawId };
            if (ObjectId.isValid(rawId)) {
              cQuery = {
                $or: [
                  { _id: new ObjectId(rawId) },
                  { _id: rawId },
                  { slug: rawId },
                ],
              };
            }
            const cDoc = await clientsCollection.findOne(cQuery);
            if (!cDoc) {
              return errorResponse(404, 'La empresa o cliente especificado no existe.', 'CLIENT_NOT_FOUND');
            }
            updateFields.clientId = cDoc._id;
            updateFields.clientIds = [cDoc._id];
          }
        }

        await usersCollection.updateOne(
          { _id: targetUser._id },
          { $set: updateFields }
        );

        const updated = await usersCollection.findOne({ _id: targetUser._id });
        return jsonResponse(200, {
          user: sanitizeUserResponse(updated),
          message: 'Usuario actualizado exitosamente.',
        });
      }

      return errorResponse(405, 'Método no permitido.', 'METHOD_NOT_ALLOWED');
    }

    return errorResponse(404, 'Ruta no encontrada.', 'NOT_FOUND');
  } catch (err) {
    console.error('[API-USERS] Error:', err.message);
    return errorResponse(500, 'Error interno del servidor al procesar el usuario.', 'INTERNAL_SERVER_ERROR');
  }
}
