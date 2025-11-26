import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

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


