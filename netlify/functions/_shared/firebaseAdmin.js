import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseAuthInstance = null;

function normalizePrivateKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return '';
  let key = rawKey.trim();
  // Strip outer quotes if added by env variable managers
  key = key.replace(/^["']|["']$/g, '');
  // Normalize \n
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }
  return key;
}

export function getFirebaseAdmin() {
  if (firebaseAuthInstance) {
    return firebaseAuthInstance;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    const error = new Error('Firebase Admin environment variables are incomplete.');
    error.code = 'FIREBASE_CONFIG_MISSING';
    throw error;
  }

  const privateKey = normalizePrivateKey(rawPrivateKey);

  console.log('[AUTH_CHECKPOINT] FIREBASE_INIT_ENV_READY', {
    hasProjectId: Boolean(projectId),
    hasClientEmail: Boolean(clientEmail),
    hasPrivateKey: Boolean(privateKey),
    privateKeyHasBeginMarker: privateKey.includes('BEGIN PRIVATE KEY'),
    privateKeyHasEndMarker: privateKey.includes('END PRIVATE KEY'),
  });

  try {
    const credential = cert({
      projectId,
      clientEmail,
      privateKey,
    });
    console.log('[AUTH_CHECKPOINT] FIREBASE_INIT_CREDENTIAL_READY');

    const app = getApps().length > 0 ? getApp() : initializeApp({ credential });
    console.log('[AUTH_CHECKPOINT] FIREBASE_INIT_APP_READY');

    firebaseAuthInstance = getAuth(app);
    console.log('[AUTH_CHECKPOINT] FIREBASE_INIT_AUTH_READY');

    return firebaseAuthInstance;
  } catch (initErr) {
    console.error('[AUTH_DIAGNOSTIC] Firebase Admin Modular Initialization Failed:', {
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
  return getFirebaseAdmin();
}
