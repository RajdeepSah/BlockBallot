/**
 * @module utils/supabase/clients
 * @category Data Storage
 *
 * Supabase client creation utilities for server-side operations.
 *
 * This module provides functions to create Supabase clients with different
 * permission levels:
 * - **Service Role Client**: Bypasses RLS, full database access
 * - **Anonymous Client**: Respects RLS, limited permissions
 *
 * All clients are configured for server-side use (no session persistence).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Asserts that an environment variable is set.
 *
 * Validates that a required environment variable has a value.
 *
 * @param value - Environment variable value (may be undefined)
 * @param name - Environment variable name for error message
 * @returns The value if set
 * @throws {Error} If value is undefined
 *
 * @internal
 */
function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Gets a Supabase client with service role permissions.
 *
 * This client has full database access and can bypass Row Level Security (RLS)
 * policies. Use this for server-side operations that require elevated permissions,
 * such as KV store operations or admin functions.
 *
 * **Security Warning**: Never expose the service role key to the client.
 *
 * @returns Supabase client with service role key and full permissions
 * @throws {Error} If required environment variables are missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *
 * @example
 * ```typescript
 * const supabase = getServiceRoleClient();
 * // Can access all tables, bypasses RLS
 * const { data } = await supabase.from('elections').select('*');
 * ```
 *
 * @see {@link getAnonServerClient} for client with RLS
 * @category Data Storage
 */
export function getServiceRoleClient() {
  const url = assertEnv(supabaseUrl, 'SUPABASE_URL');
  const key = assertEnv(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Gets a Supabase client with anonymous key for server-side operations.
 *
 * This client respects Row Level Security (RLS) policies and has limited
 * permissions. Use this for operations that should respect user permissions
 * and data access rules.
 *
 * @returns Supabase client with anonymous key and RLS enabled
 * @throws {Error} If required environment variables are missing (SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * @example
 * ```typescript
 * const supabase = getAnonServerClient();
 * // Respects RLS policies
 * const { data } = await supabase.from('elections').select('*');
 * ```
 *
 * @see {@link getServiceRoleClient} for client with full permissions
 * @category Data Storage
 */
export function getAnonServerClient() {
  const url = assertEnv(supabaseUrl, 'SUPABASE_URL');
  const key = assertEnv(anonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
