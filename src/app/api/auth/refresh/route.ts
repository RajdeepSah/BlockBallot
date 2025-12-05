/**
 * @module app/api/auth/refresh/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';

import { createValidationError, handleApiError, createUnauthorizedError } from '@/utils/api/errors';
import { getAnonServerClient } from '@/utils/supabase/clients';

/**
 * POST /api/auth/refresh
 *
 * Refreshes an access token using a refresh token.
 *
 * This endpoint exchanges a valid refresh token for a new access token
 * and optionally a new refresh token. Used to maintain user sessions
 * without requiring re-authentication.
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "refreshToken": "refresh-token-string"
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "accessToken": "new-access-token",
 *   "refreshToken": "new-refresh-token",
 *   "expiresAt": 1704067200
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing refresh token
 * - `401` - Invalid or expired refresh token
 * - `500` - Server error
 *
 * @param request - Next.js request object containing refreshToken in body
 * @returns JSON response with new tokens and expiration, or error response (400/401/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/refresh', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ refreshToken })
 * });
 * const { accessToken, refreshToken: newRefresh } = await response.json();
 * ```
 *
 * @see {@link module:utils/auth/tokenRefresh.getValidAccessToken} for client-side token refresh
 * @category API Routes
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return createValidationError('Missing refresh token');
    }

    const supabase = getAnonServerClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return createUnauthorizedError();
    }

    return Response.json({
      success: true,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  } catch (error) {
    return handleApiError(error, 'auth/refresh');
  }
}
