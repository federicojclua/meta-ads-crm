import { getFirebaseAuth } from './firebaseAdmin.js';

export async function verifyAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      user: null,
      status: 401,
      error: 'Cabecera de autorización faltante o con formato inválido. Debe ser Bearer <token>.',
      code: 'AUTH_TOKEN_MISSING',
    };
  }

  const token = authHeader.split('Bearer ')[1].trim();

  if (!token) {
    return {
      authenticated: false,
      user: null,
      status: 401,
      error: 'Token de autenticación vacío.',
      code: 'AUTH_TOKEN_EMPTY',
    };
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.email_verified) {
      return {
        authenticated: false,
        user: decodedToken,
        status: 403,
        error: 'El correo electrónico no ha sido verificado. Por favor, verifica tu cuenta antes de acceder al CRM.',
        code: 'AUTH_EMAIL_NOT_VERIFIED',
      };
    }

    return {
      authenticated: true,
      user: decodedToken,
      status: 200,
      error: null,
      code: null,
    };
  } catch (err) {
    console.error('Error verifying Firebase ID token:', err.code || err.message);
    return {
      authenticated: false,
      user: null,
      status: 401,
      error: 'Token de autenticación inválido o expirado.',
      code: 'AUTH_TOKEN_INVALID',
    };
  }
}
