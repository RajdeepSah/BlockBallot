/**
 * @module utils/supabase/server
 * @category Data Storage
 *
 * Server-side Supabase client creation for Next.js server components and API routes.
 *
 * This module provides a Supabase client that integrates with Next.js cookie-based
 * session management. Use this client in server components and API routes where
 * you need to respect Row Level Security (RLS) policies based on the current user.
 *
 * ## Usage
 *
 * ```typescript
 * import { createClient } from '@/utils/supabase/server';
 *
 * export async function GET() {
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('elections').select('*');
 *   return Response.json(data);
 * }
 * ```
 *
 * @see {@link module:utils/supabase/clients.getServiceRoleClient} for service role clients
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server components and API routes.
 *
 * Uses Next.js cookies for session management. The client respects Row Level
 * Security (RLS) policies based on the authenticated user's session.
 *
 * @returns Promise resolving to Supabase client configured for server-side use
 *
 * @example
 * ```typescript
 * const supabase = await createClient();
 * const { data: elections } = await supabase
 *   .from('elections')
 *   .select('*')
 *   .eq('creator_id', userId);
 * ```
 *
 * @category Data Storage
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
