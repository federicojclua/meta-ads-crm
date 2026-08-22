import { useEffect, useState, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onIdTokenChanged,
  setPersistence,
} from 'firebase/auth';
import { auth, googleProvider, browserSessionPersistence } from '../lib/firebase';
import { apiClient, ApiError } from '../lib/api';
import { AuthContext } from './authContextDefinition';

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const fetchProfile = useCallback(async (token) => {
    try {
      setAuthError(null);
      const data = await apiClient('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUserProfile(data.user);
      return data.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setUserProfile(null);
        setAuthError(err.message || 'Acceso no autorizado al CRM.');
      } else {
        setUserProfile(null);
        setAuthError(err.message || 'Error al conectar con el servidor.');
      }
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
          console.error('Error fetching token on state change:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
        setAuthError(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfile]);

  const loginWithEmail = async (email, password) => {
    setAuthError(null);
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

  const value = {
    firebaseUser,
    userProfile,
    role: userProfile?.role || null,
    isAuthenticated: !!firebaseUser && !!userProfile,
    isEmailVerified: !!firebaseUser?.emailVerified,
    loading,
    authError,
    loginWithEmail,
    loginWithGoogle,
    logout,
    sendPasswordReset,
    sendVerification,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
