import admin from 'firebase-admin';

let firebaseAdminApp = null;

export function getFirebaseAdmin() {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  if (admin.apps.length > 0) {
    firebaseAdminApp = admin.apps[0];
    return firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const error = new Error('Firebase Admin environment variables are incomplete.');
    error.code = 'FIREBASE_CONFIG_MISSING';
    throw error;
  }

  // Sanitize and normalize private key formatting
  privateKey = privateKey.trim();
  // Strip outer quotes if any were wrapped by environment managers
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  // Normalize literal \n into real newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  try {
    firebaseAdminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return firebaseAdminApp;
  } catch (initErr) {
    console.error('[AUTH_DIAGNOSTIC] Firebase Admin Initialization Failed:', {
      errorName: initErr.name,
      errorCode: initErr.code || 'INIT_ERROR',
      errorMessage: initErr.message,
      errorStack: initErr.stack?.split('\n').slice(0, 3).join(' | '),
      firebaseProjectIdPresent: Boolean(projectId),
      firebaseClientEmailPresent: Boolean(clientEmail),
      firebasePrivateKeyPresent: Boolean(privateKey),
      privateKeyHasBeginMarker: Boolean(privateKey?.includes('BEGIN PRIVATE KEY')),
      privateKeyHasEndMarker: Boolean(privateKey?.includes('END PRIVATE KEY')),
    });
    throw initErr;
  }
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}
