/**
 * @module app/api/auth/me/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';

import { authenticateUser } from '@/utils/api/auth';
import { handleApiError, createUnauthorizedError, createNotFoundError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { UserRecord } from '@/types/kv-records';

/**
 * GET /api/auth/me
 *
 * Retrieves the current authenticated user's profile data.
 *
 * This endpoint validates the user's JWT token and returns their stored
 * profile information from the KV store.
 *
 * ## Request
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` - Required, user authentication token
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "user": {
 *     "id": "user-uuid",
 *     "email": "user@example.com",
 *     "name": "John Doe",
 *     "phone": "+1234567890"
 *   }
 * }
 * ```
 *
 * **Error Responses:**
 * - `401` - Unauthorized (missing or invalid token)
 * - `404` - User data not found in KV store
 * - `500` - Server error
 *
 * @param request - Next.js request object with Authorization header
 * @returns JSON response with user data, or error response (401/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/me', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 * const { user } = await response.json();
 * ```
 *
 * @category API Routes
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError();
    }

    const user = await authenticateUser(authHeader);
    const userData = await kv.get<UserRecord>(`user:${user.id}`);

    if (!userData) {
      return createNotFoundError('User data');
    }

    return Response.json({ user: userData });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    return handleApiError(error, 'auth/me');
  }
}
