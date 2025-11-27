import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Asserts that an environment variable is set.
 * 
 * @param value - Environment variable value
 * @param name - Environment variable name
 * @returns The value if set
 * @throws Error if value is undefined
 */
function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/**
 * Gets a Supabase client with service role permissions.
 * Can bypass Row Level Security (RLS) policies.
 * 
 * @returns Supabase client with service role key
 * @throws Error if required environment variables are missing
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
 * Respects Row Level Security (RLS) policies.
 * 
 * @returns Supabase client with anonymous key
 * @throws Error if required environment variables are missing
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


