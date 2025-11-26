import { getValidAccessToken } from './tokenRefresh';

const AUTH_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'user',
  'tempToken',
  'tempRefreshToken',
];

const REQUEST_TIMEOUT_MS = 30000;

export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function handleUnauthorizedError(redirect = true) {
  if (typeof window === 'undefined') {
    return;
  }
  clearStoredAuth();
  if (redirect) {
    window.location.href = '/';
  }
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = new Headers(init.headers || {});

  let hasAuthHeader = headers.has('Authorization');

  if (!hasAuthHeader) {
    const token = await getValidAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      hasAuthHeader = true;
    }
  }

  const fetchInit: RequestInit = {
    ...init,
    headers,
    signal: init.signal ?? controller.signal,
  };

  try {
    const response = await fetch(input, fetchInit);
    if (response.status === 401 && hasAuthHeader) {
      handleUnauthorizedError();
    }
    return response;
  } finally {
    clearTimeout(timeout);
  }
}
