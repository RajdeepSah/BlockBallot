/**
 * @module utils/api/auth
 * @category Authentication
 *
 * Server-side authentication utilities for API routes.
 *
 * This module provides functions to authenticate users in Next.js API routes
 * by validating JWT tokens from the Authorization header.
 *
 * ## Usage
 *
 * ```typescript
 * import { authenticateUser } from '@/utils/api/auth';
 *
 * export async function POST(request: NextRequest) {
 *   const authHeader = request.headers.get('Authorization');
 *   const user = await authenticateUser(authHeader);
 *   // User is authenticated, proceed with request
 * }
 * ```
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { projectId, publicAnonKey } from '@/utils/supabase/info';

/**
 * Authenticates a user from the Authorization header.
 *
 * Validates the JWT token using Supabase Auth and returns user information.
 * This function is used in API routes to verify that requests are authenticated.
 *
 * The token is extracted from the `Authorization` header in the format:
 * `Bearer <token>`
 *
 * @param authHeader - Authorization header value (e.g., `"Bearer <token>"`) or `null`
 * @returns Promise resolving to user object with `id` and optional `email`
 * @throws {Error} If authorization header is missing, token is invalid, or user not found
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   try {
 *     const authHeader = request.headers.get('Authorization');
 *     const user = await authenticateUser(authHeader);
 *     console.log('Authenticated user:', user.id, user.email);
 *     // Proceed with authenticated request
 *   } catch (error) {
 *     return createUnauthorizedError();
 *   }
 * }
 * ```
 *
 * @see {@link module:utils/api/errors.createUnauthorizedError} to return 401 response
 * @category Authentication
 */
export async function authenticateUser(
  authHeader: string | null
): Promise<{ id: string; email?: string }> {
  if (!authHeader) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Unauthorized');
  }

  const supabaseAuth = createSupabaseClient(`https://${projectId}.supabase.co`, publicAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(token);

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  return { id: user.id, email: user.email };
}
