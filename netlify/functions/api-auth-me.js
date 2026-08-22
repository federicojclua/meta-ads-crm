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

    let userProfile = userByUid || userByEmail;

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

    // 6. Safe linking of unlinked firebaseUid & lastLoginAt update
    const updateFields = {
      lastLoginAt: now,
      updatedAt: now,
    };

    if (!userProfile.firebaseUid) {
      updateFields.firebaseUid = decodedToken.uid;
    }

    if (decodedToken.picture && decodedToken.picture !== userProfile.photoURL) {
      updateFields.photoURL = decodedToken.picture;
    }

    await usersCollection.updateOne(
      { _id: userProfile._id },
      { $set: updateFields }
    );

    // 7. Sanitized profile output
    const responseProfile = {
      firebaseUid: decodedToken.uid,
      email: userProfile.email,
      normalizedEmail: userProfile.normalizedEmail,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      role: userProfile.role,
      status: userProfile.status,
      clientIds: userProfile.clientIds || [],
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
