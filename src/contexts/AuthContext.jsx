import { useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onIdTokenChanged,
  setPersistence,
  linkWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth, googleProvider, browserSessionPersistence } from '../lib/firebase';
import { apiClient, ApiError } from '../lib/api';
import { AuthContext } from './authContextDefinition';

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authErrorCode, setAuthErrorCode] = useState(null);
  const [serverUnavailable, setServerUnavailable] = useState(false);

  const fetchProfile = useCallback(async (token, isRetry = false) => {
    try {
      setAuthError(null);
      setAuthErrorCode(null);
      setServerUnavailable(false);

      const data = await apiClient('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUserProfile(data.user);
      return data.user;
    } catch (err) {
      if (err instanceof ApiError) {
        // 1. Handle 401 with a single automatic token refresh retry
        if (err.status === 401) {
          if (!isRetry && auth.currentUser) {
            try {
              const freshToken = await auth.currentUser.getIdToken(true);
              return await fetchProfile(freshToken, true);
            } catch (refreshErr) {
              console.warn('[AUTH] Token refresh retry failed:', refreshErr.message);
            }
          }
          // Failed retry or unrecoverable 401
          setUserProfile(null);
          setAuthError('Sesión expirada o no válida. Por favor, inicia sesión nuevamente.');
          setAuthErrorCode('AUTH_TOKEN_INVALID');
          await signOut(auth);
          return null;
        }

        // 2. Handle 403 Forbidden (Authenticated in Firebase, but unauthorized in MongoDB)
        if (err.status === 403) {
          setUserProfile(null);
          setAuthError(err.message || 'Acceso no autorizado al CRM.');
          setAuthErrorCode(err.code || 'USER_NOT_AUTHORIZED');
          return null;
        }

        // 3. Handle 500 Server Error (Configuration / Verification / DB Failure)
        if (err.status >= 500) {
          setUserProfile(null);
          setServerUnavailable(true);
          setAuthError('El servicio de autenticación no está disponible temporalmente. Intente nuevamente en unos instantes.');
          setAuthErrorCode(err.code || 'SERVER_ERROR');
          return null;
        }
      }

      // Generic or network connection error
      setUserProfile(null);
      setServerUnavailable(true);
      setAuthError('Error al conectar con el servidor de autenticación.');
      setAuthErrorCode('NETWORK_ERROR');
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          if (user.emailVerified) {
            await fetchProfile(token);
          } else {
            setUserProfile(null);
          }
        } catch (err) {
          console.error('[AUTH] Error obtaining token on auth state change:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setAuthError(null);
        setAuthErrorCode(null);
        setServerUnavailable(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
    setAuthErrorCode(null);
    setServerUnavailable(false);
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    const token = await result.user.getIdToken();
    if (result.user.emailVerified) {
      await fetchProfile(token);
    }
    return result.user;
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    setAuthErrorCode(null);
    setServerUnavailable(false);
    await setPersistence(auth, browserSessionPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    if (result.user.emailVerified) {
      await fetchProfile(token);
    }
    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUserProfile(null);
    setAuthError(null);
    setAuthErrorCode(null);
    setServerUnavailable(false);
  };

  const sendPasswordReset = async (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  const sendVerification = async () => {
    if (auth.currentUser) {
      return sendEmailVerification(auth.currentUser);
    }
    throw new Error('No hay usuario autenticado para enviar la verificación.');
  };

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      return fetchProfile(token);
    }
    return null;
  };

  // Provider Data Helpers (Google vs Password)
  const providers = firebaseUser?.providerData?.map((p) => p.providerId) || [];
  const isGoogleOnly = providers.length > 0 && providers.includes('google.com') && !providers.includes('password');
  const hasPasswordProvider = providers.includes('password');
  const hasGoogleProvider = providers.includes('google.com');

  // Prepared account linking helper (Links password to an authenticated Google user without changing UID)
  const linkPasswordAccount = async (newPassword) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('Debe haber una sesión activa con correo para vincular contraseña.');
    }
    const credential = EmailAuthProvider.credential(auth.currentUser.email, newPassword);
    const result = await linkWithCredential(auth.currentUser, credential);
    setFirebaseUser(result.user);
    return result.user;
  };

  const value = {
    firebaseUser,
    userProfile,
    role: userProfile?.role || null,
    isAuthenticated: !!firebaseUser && !!userProfile,
    isEmailVerified: !!firebaseUser?.emailVerified,
    loading,
    authError,
    authErrorCode,
    serverUnavailable,
    providers,
    isGoogleOnly,
    hasPasswordProvider,
    hasGoogleProvider,
    linkPasswordAccount,
    loginWithEmail,
    loginWithGoogle,
    logout,
    sendPasswordReset,
    sendVerification,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
