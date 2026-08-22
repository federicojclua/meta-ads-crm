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
    throw new Error('Firebase Admin environment variables are not fully configured.');
  }

  // Normalize private key handling escaped newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.trim(),
    }),
  });

  return firebaseAdminApp;
}

export function getFirebaseAuth() {
  const app = getFirebaseAdmin();
  return admin.auth(app);
}
