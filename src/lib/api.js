import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export class ApiError extends Error {
  constructor(message, status, code, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

/**
 * Centralized authenticated API client.
 * Handles automatic Firebase ID token retrieval, single 401 force-refresh retry,
 * session termination on persistent 401, and normalized error responses.
 */
export async function apiClient(endpoint, options = {}) {
  const { isRetry = false, ...fetchOptions } = options;

  let token = null;
  const user = auth.currentUser;

  if (user) {
    try {
      token = isRetry ? await user.getIdToken(true) : await user.getIdToken();
    } catch (tokenErr) {
      console.warn('[API] Error obtaining Firebase token:', tokenErr.message);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...fetchOptions.headers,
  };

  const config = {
    ...fetchOptions,
    headers,
  };

  let response;
  try {
    response = await fetch(endpoint, config);
  } catch (networkErr) {
    throw new ApiError('Error de conexión con el servidor. Verifique su red.', 0, 'NETWORK_ERROR', null);
  }

  let data = null;
  try {
    if (typeof response.text === 'function') {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } else if (typeof response.json === 'function') {
      data = await response.json();
    }
  } catch {
    data = null;
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (!isRetry && auth.currentUser) {
      try {
        // Attempt single retry with force-refreshed token
        return await apiClient(endpoint, { ...options, isRetry: true });
      } catch (retryErr) {
        console.warn('[API] Token refresh retry failed:', retryErr.message);
      }
    }

    // If persistent 401 or no currentUser, trigger sign out
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (signOutErr) {
      console.warn('[API] Error during signOut after 401:', signOutErr.message);
    }

    const message = data?.message || data?.error || 'Sesión expirada o no válida. Inicie sesión nuevamente.';
    const code = data?.code || 'AUTH_TOKEN_EXPIRED';
    throw new ApiError(message, 401, code, data);
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Error en la solicitud al servidor';
    const code = data?.code || `HTTP_${response.status}`;
    throw new ApiError(message, response.status, code, data);
  }

  return data;
}
