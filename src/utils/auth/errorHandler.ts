/**
 * @module utils/auth/errorHandler
 * @category Authentication
 *
 * Authentication error handling and authenticated fetch utilities.
 *
 * This module provides:
 * - Functions to clear authentication data
 * - Unauthorized error handling with automatic redirects
 * - `authenticatedFetch` wrapper that automatically adds auth headers and handles token refresh
 *
 * The `authenticatedFetch` function is the recommended way to make authenticated
 * API calls from the client, as it handles token management automatically.
 *
 * ## Usage
 *
 * ```typescript
 * import { authenticatedFetch, handleUnauthorizedError } from '@/utils/auth/errorHandler';
 *
 * // Make authenticated request (token added automatically)
 * const response = await authenticatedFetch('/api/protected-endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 *
 * // Handle unauthorized errors
 * if (response.status === 401) {
 *   handleUnauthorizedError(); // Clears auth and redirects
 * }
 * ```
 */

import { getValidAccessToken } from './tokenRefresh';

const AUTH_STORAGE_KEYS = ['accessToken', 'refreshToken', 'user', 'tempToken', 'tempRefreshToken'];

const REQUEST_TIMEOUT_MS = 30000;

/**
 * Clears all authentication-related data from localStorage.
 *
 * Removes all authentication tokens and user data from localStorage.
 * This includes access tokens, refresh tokens, user data, and temporary tokens.
 *
 * **Note**: No-op in server-side environments (Node.js).
 *
 * @see {@link handleUnauthorizedError} to clear auth and redirect
 * @category Authentication
 */
export function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }
  AUTH_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

/**
 * Handles unauthorized errors by clearing auth data and optionally redirecting.
 *
 * When a 401 Unauthorized response is received, this function:
 * 1. Clears all authentication data from localStorage
 * 2. Optionally redirects the user to the home page (`/`)
 *
 * **Note**: No-op in server-side environments (Node.js).
 *
 * @param redirect - Whether to redirect to home page after clearing auth (default: `true`)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/protected');
 * if (response.status === 401) {
 *   handleUnauthorizedError(); // Clears auth and redirects to home
 * }
 * ```
 *
 * @see {@link clearStoredAuth} to clear auth without redirecting
 * @category Authentication
 */
export function handleUnauthorizedError(redirect = true) {
  if (typeof window === 'undefined') {
    return;
  }
  clearStoredAuth();
  if (redirect) {
    window.location.href = '/';
  }
}

/**
 * Wrapper around fetch that automatically adds authentication headers.
 *
 * This is the recommended way to make authenticated API calls from the client.
 * It automatically:
 * - Adds `Authorization: Bearer <token>` header using a valid access token
 * - Refreshes the token if it's expired before making the request
 * - Handles 401 responses by clearing auth and redirecting
 * - Implements request timeout (30 seconds)
 *
 * If an `Authorization` header is already provided in `init.headers`, it will
 * be used instead of the automatic token.
 *
 * @param input - Request URL string or Request object
 * @param init - Optional fetch init options (method, headers, body, etc.)
 * @returns Promise resolving to Response object
 *
 * @example
 * ```typescript
 * // Simple GET request
 * const response = await authenticatedFetch('/api/elections');
 * const data = await response.json();
 *
 * // POST request with body
 * const response = await authenticatedFetch('/api/vote', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ electionId, votes })
 * });
 * ```
 *
 * @see {@link getValidAccessToken} for token management
 * @see {@link handleUnauthorizedError} for 401 handling
 * @category Authentication
 */
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
