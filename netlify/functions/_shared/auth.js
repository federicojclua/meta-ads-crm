import { getFirebaseAuth } from './firebaseAdmin.js';

export async function verifyAuth(event) {
  const authHeader = event.headers?.authorization || event.headers?.Authorization;

  // 1. Validate presence of Authorization header
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return {
      authenticated: false,
      user: null,
      status: 401,
      error: 'Cabecera de autorización faltante o con formato inválido. Debe ser Bearer <token>.',
      code: 'AUTH_TOKEN_MISSING',
    };
  }

  const rawToken = authHeader.substring(7).trim();

  // 2. Strict JWT format validations (never log token content)
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      authenticated: false,
      user: null,
      status: 401,
      error: 'Token de autenticación vacío.',
      code: 'AUTH_TOKEN_EMPTY',
    };
  }

  const segments = rawToken.split('.');
  if (rawToken.length < 50 || segments.length !== 3 || !segments[0] || !segments[1] || !segments[2]) {
    console.warn('[AUTH_DIAGNOSTIC] Token format validation failed:', {
      tokenType: typeof rawToken,
      tokenLength: rawToken.length,
      tokenSegmentCount: segments.length,
    });
    return {
      authenticated: false,
      user: null,
      status: 401,
      error: 'Formato de token JWT inválido.',
      code: 'AUTH_TOKEN_MALFORMED',
    };
  }

  // 3. Obtain Firebase Auth instance (Catch configuration/initialization errors)
  let auth;
  try {
    auth = getFirebaseAuth();
  } catch (initError) {
    console.error('[AUTH_DIAGNOSTIC] Auth Service Misconfigured:', {
      errorName: initError.name,
      errorCode: initError.code || 'INIT_ERROR',
      errorMessage: initError.message,
      errorStack: initError.stack?.split('\n').slice(0, 3).join(' | '),
      firebaseProjectIdPresent: Boolean(process.env.FIREBASE_PROJECT_ID),
      firebaseClientEmailPresent: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      firebasePrivateKeyPresent: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      privateKeyHasBeginMarker: Boolean(process.env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY')),
      privateKeyHasEndMarker: Boolean(process.env.FIREBASE_PRIVATE_KEY?.includes('END PRIVATE KEY')),
    });
    return {
      authenticated: false,
      user: null,
      status: 500,
      error: 'El servicio de autenticación no está configurado correctamente en el servidor.',
      code: 'AUTH_SERVER_MISCONFIGURED',
    };
  }

  // 4. Verify ID Token via Firebase Admin SDK
  try {
    const decodedToken = await auth.verifyIdToken(rawToken);

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
  } catch (verifyErr) {
    console.error('[AUTH_DIAGNOSTIC] Token Verification Failed:', {
      errorName: verifyErr.name,
      errorCode: verifyErr.code || 'VERIFICATION_ERROR',
      errorMessage: verifyErr.message,
      errorStack: verifyErr.stack?.split('\n').slice(0, 3).join(' | '),
      tokenType: typeof rawToken,
      tokenLength: rawToken.length,
      tokenSegmentCount: segments.length,
      firebaseProjectIdPresent: Boolean(process.env.FIREBASE_PROJECT_ID),
      firebaseClientEmailPresent: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      firebasePrivateKeyPresent: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      privateKeyHasBeginMarker: Boolean(process.env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY')),
      privateKeyHasEndMarker: Boolean(process.env.FIREBASE_PRIVATE_KEY?.includes('END PRIVATE KEY')),
    });

    // Distinguish expected client-token errors from unexpected runtime crashes / TypeErrors
    const isClientAuthError =
      verifyErr.code === 'auth/id-token-expired' ||
      verifyErr.code === 'auth/argument-error' ||
      verifyErr.code === 'auth/invalid-id-token' ||
      verifyErr.code === 'auth/id-token-revoked';

    if (isClientAuthError) {
      return {
        authenticated: false,
        user: null,
        status: 401,
        error: verifyErr.code === 'auth/id-token-expired'
          ? 'El token de sesión ha expirado.'
          : 'Token de autenticación inválido.',
        code: verifyErr.code === 'auth/id-token-expired' ? 'AUTH_TOKEN_EXPIRED' : 'AUTH_TOKEN_INVALID',
      };
    }

    // Unexpected internal / TypeError crash during verification
    return {
      authenticated: false,
      user: null,
      status: 500,
      error: 'Error interno al verificar las credenciales de autenticación.',
      code: 'AUTH_VERIFICATION_FAILED',
    };
  }
}
