const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

interface JwtPayload {
  exp?: number;
}

function decodeBase64(input: string) {
  if (typeof window === 'undefined') {
    return Buffer.from(input, 'base64').toString('utf-8');
  }
  return atob(input);
}

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

export function isTokenExpired(token: string, offsetSeconds = 30): boolean {
  const payload = parseJwt(token);
  if (!payload?.exp) {
    return false;
  }
  const expiresAt = payload.exp * 1000;
  const buffer = offsetSeconds * 1000;
  return Date.now() >= expiresAt - buffer;
}

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

