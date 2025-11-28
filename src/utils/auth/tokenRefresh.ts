/**
 * @module utils/auth/tokenRefresh
 * @category Authentication
 *
 * Token refresh and expiration utilities for JWT authentication.
 *
 * This module provides functions to:
 * - Check if tokens are expired or about to expire
 * - Automatically refresh access tokens using refresh tokens
 * - Get valid access tokens (refreshing if necessary)
 *
 * Tokens are stored in `localStorage` and automatically refreshed when they
 * expire or are about to expire (within a configurable buffer window).
 *
 * ## Usage
 *
 * ```typescript
 * import { getValidAccessToken, isTokenExpired } from '@/utils/auth/tokenRefresh';
 *
 * // Get a valid token (refreshes if needed)
 * const token = await getValidAccessToken();
 *
 * // Check if token is expired
 * if (isTokenExpired(token)) {
 *   // Handle expired token
 * }
 * ```
 */

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * JWT payload structure containing expiration information.
 *
 * @internal
 */
interface JwtPayload {
  exp?: number;
}

/**
 * Decodes a base64 string, handling both Node.js and browser environments.
 *
 * Uses `Buffer` in Node.js and `atob` in the browser.
 *
 * @param input - Base64 encoded string
 * @returns Decoded UTF-8 string
 *
 * @internal
 */
function decodeBase64(input: string) {
  if (typeof window === 'undefined') {
    return Buffer.from(input, 'base64').toString('utf-8');
  }
  return atob(input);
}

/**
 * Parses a JWT token and extracts its payload.
 *
 * Decodes the JWT payload (middle section) and parses it as JSON.
 * Handles base64 URL encoding variations.
 *
 * @param token - JWT token string (format: `header.payload.signature`)
 * @returns Parsed JWT payload object with `exp` field, or `null` if parsing fails
 *
 * @internal
 */
function parseJwt(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeBase64(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT token is expired or will expire soon.
 *
 * Considers a token expired if it has already expired OR if it will expire
 * within the offset window (default 30 seconds). This buffer prevents
 * race conditions where a token expires between check and use.
 *
 * @param token - JWT token string to check
 * @param offsetSeconds - Seconds before expiration to consider token expired (default: `30`)
 * @returns `true` if token is expired or will expire within the offset window, `false` otherwise
 *
 * @example
 * ```typescript
 * const token = localStorage.getItem('accessToken');
 * if (isTokenExpired(token)) {
 *   // Token needs refresh
 *   await refreshAccessToken();
 * }
 * ```
 *
 * @see {@link getValidAccessToken} to automatically get a valid token
 * @category Authentication
 */
export function isTokenExpired(token: string, offsetSeconds = 30): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) {
    return false;
  }
  const expiresAt = payload.exp * 1000;
  const buffer = offsetSeconds * 1000;
  return Date.now() >= expiresAt - buffer;
}

/**
 * Attempts to refresh the access token using the stored refresh token.
 *
 * Calls the `/api/auth/refresh` endpoint with the stored refresh token.
 * If successful, updates `localStorage` with the new access token and
 * optionally a new refresh token.
 *
 * @returns New access token string if refresh succeeds, `null` otherwise
 *
 * @internal
 */
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data.accessToken) {
      return null;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    }
    return data.accessToken;
  } catch {
    return null;
  }
}

/**
 * Gets a valid access token, refreshing if necessary.
 *
 * This is the main function to use when you need an access token. It:
 * 1. Checks if a token exists in `localStorage`
 * 2. If token exists and is valid, returns it
 * 3. If token is expired, attempts to refresh it
 * 4. Returns the new token if refresh succeeds, or `null` if it fails
 *
 * **Note**: Returns `null` in server-side environments (Node.js).
 *
 * @returns Valid access token string, or `null` if no token exists, refresh fails, or running server-side
 *
 * @example
 * ```typescript
 * const token = await getValidAccessToken();
 * if (!token) {
 *   // User needs to log in
 *   redirectToLogin();
 * } else {
 *   // Use token for authenticated request
 *   const response = await fetch('/api/protected', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 * }
 * ```
 *
 * @see {@link isTokenExpired} to check token expiration
 * @category Authentication
 */
export async function getValidAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (!token) {
    return null;
  }

  if (!isTokenExpired(token)) {
    return token;
  }

  return refreshAccessToken();
}
