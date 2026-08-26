import crypto from 'node:crypto';
import { verifyAuth } from './_shared/auth.js';
import { connectToDatabase } from './_shared/db.js';
import { jsonResponse, errorResponse } from './_shared/response.js';

export async function handler(event) {
  // Only allow GET requests for profile retrieval
  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Método no permitido. Utilice GET.', 'METHOD_NOT_ALLOWED');
  }

  // 1. Verify Firebase ID Token and email verification status
  const authResult = await verifyAuth(event);
  if (!authResult.authenticated) {
    return errorResponse(authResult.status, authResult.error, authResult.code);
  }

  const { user: decodedToken } = authResult;
  const rawEmail = decodedToken.email;

  if (!rawEmail) {
    return errorResponse(400, 'El token no contiene un correo electrónico asociado.', 'EMAIL_MISSING');
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  const now = new Date();

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // 2. Separate lookups for strict identity validation (No ambiguous $or)
    const [userByUid, userByEmail] = await Promise.all([
      usersCollection.findOne({ firebaseUid: decodedToken.uid }),
      usersCollection.findOne({ normalizedEmail }),
    ]);

    const headers = event.headers || {};
    const inviteToken = headers['x-invite-token'] || headers['X-Invite-Token'];
    let userByInviteToken = null;
    if (inviteToken) {
      const hash = crypto.createHash('sha256').update(inviteToken).digest('hex');
      userByInviteToken = await usersCollection.findOne({ invitationTokenHash: hash });
    }

    // 3. Strict Identity Mismatch Checks
    if (userByUid && userByUid.normalizedEmail !== normalizedEmail) {
      return errorResponse(
        403,
        'El identificador de autenticación está asociado a otra dirección de correo registrada.',
        'IDENTITY_MISMATCH'
      );
    }

    if (userByEmail && userByEmail.firebaseUid && userByEmail.firebaseUid !== decodedToken.uid) {
      return errorResponse(
        403,
        'Esta dirección de correo ya tiene otro identificador de autenticación vinculado.',
        'IDENTITY_MISMATCH'
      );
    }

    let userProfile = userByUid || userByEmail || userByInviteToken;

    // 4. Atomic Bootstrap for Super Admin or rejection of unknown users
    if (!userProfile) {
      if (superAdminEmail && normalizedEmail === superAdminEmail) {
        const newSuperAdminData = {
          firebaseUid: decodedToken.uid,
          email: rawEmail,
          normalizedEmail,
          displayName: decodedToken.name || rawEmail.split('@')[0],
          photoURL: decodedToken.picture || null,
          authProviders: [decodedToken.firebase?.sign_in_provider || 'password'],
          role: 'super_admin',
          status: 'active',
          clientIds: [],
          permissions: {
            canExport: true,
            canDeleteLeads: true,
            canViewFinancials: true,
          },
          invitedBy: null,
          lastLoginAt: now,
          createdAt: now,
          updatedAt: now,
        };

        try {
          // Atomic findOneAndUpdate with upsert
          const result = await usersCollection.findOneAndUpdate(
            { normalizedEmail },
            { $setOnInsert: newSuperAdminData },
            { upsert: true, returnDocument: 'after' }
          );
          userProfile = result.value || result;
        } catch (upsertError) {
          // Explicit E11000 duplicate key race condition recovery
          if (upsertError.code === 11000) {
            userProfile = await usersCollection.findOne({ normalizedEmail });
          } else {
            throw upsertError;
          }
        }

        // Final sanity verification on the bootstrapped profile
        if (!userProfile || (userProfile.firebaseUid && userProfile.firebaseUid !== decodedToken.uid)) {
          return errorResponse(
            403,
            'Conflicto de identidad durante el bootstrap del Super Administrador.',
            'IDENTITY_MISMATCH'
          );
        }
      } else {
        return errorResponse(
          403,
          'Usuario autenticado pero sin perfil activo autorizado en Anima MKT CRM. Solicita acceso al Super Administrador.',
          'USER_NOT_AUTHORIZED'
        );
      }
    }

    // 5. Status check (Suspended user verification)
    if (userProfile.status === 'suspended') {
      return errorResponse(
        403,
        'Tu cuenta en Anima MKT CRM ha sido suspendida. Contacta a la administración.',
        'USER_SUSPENDED'
      );
    }

    // 5b. Tenant active status check for client / salesperson
    if (['client', 'salesperson'].includes(userProfile.role)) {
      const rawClientId = userProfile.clientId || userProfile.clientIds?.[0];
      if (rawClientId) {
        const { ObjectId } = await import('mongodb');
        const clientsCollection = db.collection('clients');
        const clientScope = rawClientId.toString();
        let clientQuery = { slug: clientScope };
        if (ObjectId.isValid(clientScope)) {
          clientQuery = {
            $or: [
              { _id: new ObjectId(clientScope) },
              { _id: clientScope },
              { slug: clientScope },
            ],
          };
        }

        const clientDoc = await clientsCollection.findOne(clientQuery);
        if (!clientDoc || clientDoc.status !== 'active') {
          return errorResponse(
            403,
            'La empresa o cliente asignado se encuentra inactivo o deshabilitado.',
            'CLIENT_INACTIVE'
          );
        }
      }
    }

    // 6. Safe linking of unlinked firebaseUid & lastLoginAt update
    const updateFields = {
      lastLoginAt: now,
      updatedAt: now,
    };

    let effectiveStatus = userProfile.status;

    if (!userProfile.firebaseUid) {
      if (userProfile.status === 'invited' && userProfile.invitationTokenHash) {
        const headers = event.headers || {};
        const inviteToken = headers['x-invite-token'] || headers['X-Invite-Token'];
        if (!inviteToken) {
          return errorResponse(403, 'Se requiere un token de invitación válido para activar la cuenta.', 'INVITE_TOKEN_REQUIRED');
        }

        const hash = crypto.createHash('sha256').update(inviteToken).digest('hex');
        if (userProfile.invitationTokenHash !== hash) {
          return errorResponse(403, 'El token de invitación es inválido o no coincide.', 'INVALID_OR_EXPIRED_INVITATION');
        }

        if (userProfile.invitationExpiresAt && now > new Date(userProfile.invitationExpiresAt)) {
          return errorResponse(403, 'El token de invitación ha expirado.', 'INVALID_OR_EXPIRED_INVITATION');
        }

        if (userProfile.normalizedEmail !== normalizedEmail) {
          return errorResponse(403, 'El correo autenticado no coincide con el correo invitado.', 'IDENTITY_MISMATCH');
        }

        updateFields.invitationTokenHash = null;
        updateFields.invitationExpiresAt = null;

        // Register audit log
        const auditLogsCollection = db.collection('audit_logs');
        if (auditLogsCollection && typeof auditLogsCollection.insertOne === 'function') {
          await auditLogsCollection.insertOne({
            action: 'ACCEPT_INVITATION',
            performedByUserId: userProfile._id,
            performedAt: now,
            details: {
              email: userProfile.normalizedEmail,
              role: userProfile.role,
              clientId: userProfile.clientId ? userProfile.clientId.toString() : null,
            },
          });
        }
      }

      updateFields.firebaseUid = decodedToken.uid;
      updateFields.activatedAt = userProfile.activatedAt || now;
      if (userProfile.status === 'invited' || userProfile.status === 'pending_invite') {
        updateFields.status = 'active';
        effectiveStatus = 'active';
      }
    }

    if (decodedToken.picture && decodedToken.picture !== userProfile.photoURL) {
      updateFields.photoURL = decodedToken.picture;
    }

    await usersCollection.updateOne(
      { _id: userProfile._id },
      { $set: updateFields }
    );

    // 7. Sanitized profile output
    const primaryClientId = userProfile.clientId
      ? userProfile.clientId.toString()
      : (userProfile.clientIds?.[0] ? userProfile.clientIds[0].toString() : null);

    const responseProfile = {
      _id: userProfile._id ? userProfile._id.toString() : undefined,
      firebaseUid: decodedToken.uid,
      email: userProfile.email,
      normalizedEmail: userProfile.normalizedEmail,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      role: userProfile.role,
      status: effectiveStatus,
      clientId: primaryClientId,
      clientIds: userProfile.clientIds ? userProfile.clientIds.map((id) => id.toString()) : (primaryClientId ? [primaryClientId] : []),
      permissions: userProfile.permissions || {},
      lastLoginAt: now.toISOString(),
    };

    return jsonResponse(200, {
      user: responseProfile,
      authenticated: true,
    });
  } catch (dbError) {
    console.error('Database error in api-auth-me:', dbError.message);
    return errorResponse(
      500,
      'Error interno al consultar el perfil del usuario. Intenta nuevamente más tarde.',
      'INTERNAL_SERVER_ERROR'
    );
  }
}
