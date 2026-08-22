import { auth } from './firebase';

export class ApiError extends Error {
  constructor(message, status, code, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export async function apiClient(endpoint, options = {}) {
  const user = auth.currentUser;
  let token = null;

  if (user) {
    token = await user.getIdToken();
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(endpoint, config);
  let data = null;

  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || 'Error en la solicitud al servidor';
    const code = data?.code || `HTTP_${response.status}`;
    throw new ApiError(message, response.status, code, data);
  }

  return data;
}
