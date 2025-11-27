import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { projectId, publicAnonKey } from '@/utils/supabase/info';

/**
 * Authenticates a user from the Authorization header.
 * Validates the JWT token and returns user information.
 *
 * @param authHeader - Authorization header value (e.g., "Bearer <token>")
 * @returns Promise resolving to user object with id and optional email
 * @throws Error if authorization header is missing or token is invalid
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
