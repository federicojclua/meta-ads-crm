import { ObjectId } from 'mongodb';
import { verifyAuth } from './auth.js';
import { connectToDatabase } from './db.js';

/**
 * Reusable backend authorization & tenant scoping helper.
 * Verifies Firebase token, retrieves authoritative user profile from MongoDB,
 * enforces account status, validates assigned roles, and guarantees tenant isolation.
 *
 * @param {object} event - Netlify function event
 * @param {string[]} allowedRoles - Optional list of authorized roles
 * @returns {Promise<object>} Authorization result
 */
export async function verifyAuthorizedUser(event, allowedRoles = []) {
  // 1. Verify Firebase JWT
  const authResult = await verifyAuth(event);
  if (!authResult.authenticated) {
    return {
      authorized: false,
      status: authResult.status,
      error: authResult.error,
      code: authResult.code,
    };
  }

  const { user: decodedToken } = authResult;

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // 2. Fetch authoritative user document by firebaseUid
    const user = await usersCollection.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return {
        authorized: false,
        status: 403,
        error: 'Usuario autenticado pero sin perfil activo autorizado en Anima MKT CRM. Solicite preautorización.',
        code: 'USER_NOT_AUTHORIZED',
      };
    }

    // 3. Verify user status
    if (user.status === 'suspended') {
      return {
        authorized: false,
        status: 403,
        error: 'Tu cuenta en Anima MKT CRM ha sido suspendida. Contacta a la administración.',
        code: 'USER_SUSPENDED',
      };
    }

    // 4. Role authorization check
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return {
        authorized: false,
        status: 403,
        error: 'No tienes los permisos necesarios para realizar esta acción.',
        code: 'FORBIDDEN_ROLE',
      };
    }

    const isGlobal = ['super_admin', 'admin'].includes(user.role);
    let clientScope = null;

    // 5. Strict Tenant Scoping for client / salesperson roles
    if (['client', 'salesperson'].includes(user.role)) {
      const rawClientId = user.clientId || user.clientIds?.[0];
      if (!rawClientId) {
        return {
          authorized: false,
          status: 403,
          error: 'El usuario no tiene una empresa o cliente asignado en MongoDB.',
          code: 'NO_CLIENT_ASSIGNED',
        };
      }

      clientScope = rawClientId.toString();

      // Verify that the assigned client exists and is active
      const clientsCollection = db.collection('clients');
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
        return {
          authorized: false,
          status: 403,
          error: 'La empresa o cliente asignado se encuentra inactivo o deshabilitado.',
          code: 'CLIENT_INACTIVE',
        };
      }
    }

    return {
      authorized: true,
      user,
      db,
      clientScope,
      isGlobal,
      isSuperAdmin: user.role === 'super_admin',
      isAdmin: user.role === 'admin',
    };
  } catch (err) {
    console.error('[PERMISSIONS] Error in verifyAuthorizedUser:', err.message);
    return {
      authorized: false,
      status: 500,
      error: 'Error interno de base de datos durante la verificación de autorización.',
      code: 'DB_AUTHORIZATION_ERROR',
    };
  }
}
