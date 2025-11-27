const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * JWT payload structure containing expiration information.
 */
interface JwtPayload {
  exp?: number;
}

/**
 * Decodes a base64 string, handling both Node.js and browser environments.
 *
 * @param input - Base64 encoded string
 * @returns Decoded UTF-8 string
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
 * @param token - JWT token string
 * @returns Parsed JWT payload or null if parsing fails
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
 * @param token - JWT token to check
 * @param offsetSeconds - Seconds before expiration to consider token expired (default: 30)
 * @returns True if token is expired or will expire within the offset window
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
 * Updates localStorage with new tokens if refresh succeeds.
 *
 * @returns New access token if refresh succeeds, null otherwise
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
 * Returns the current token if valid, or attempts to refresh if expired.
 *
 * @returns Valid access token, or null if no token exists or refresh fails
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
