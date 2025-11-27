/* Node.js compatible version of KV store utilities
 * Ported from src/supabase/functions/server/kv_store.tsx
 * 
 * Table schema:
 * CREATE TABLE kv_store_b7b6fbd4 (
 *   key TEXT NOT NULL PRIMARY KEY,
 *   value JSONB NOT NULL
 * );
 */

import { createClient } from '@supabase/supabase-js';

const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Set stores a key-value pair in the database.
export const set = async <T = unknown>(key: string, value: T): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase.from('kv_store_b7b6fbd4').upsert({
    key,
    value
  });
  if (error) {
    throw new Error(error.message);
  }
};

// Get retrieves a key-value pair from the database.
export const get = async <T = unknown>(key: string): Promise<T | undefined> => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('kv_store_b7b6fbd4')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data?.value as T | undefined;
};

// Delete deletes a key-value pair from the database.
export const del = async (key: string): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('kv_store_b7b6fbd4')
    .delete()
    .eq('key', key);
  if (error) {
    throw new Error(error.message);
  }
};

// Sets multiple key-value pairs in the database.
export const mset = async <T = unknown>(keys: string[], values: T[]): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('kv_store_b7b6fbd4')
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  if (error) {
    throw new Error(error.message);
  }
};

// Gets multiple key-value pairs from the database.
export const mget = async <T = unknown>(keys: string[]): Promise<T[]> => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('kv_store_b7b6fbd4')
    .select('value')
    .in('key', keys);
  if (error) {
    throw new Error(error.message);
  }
  return (data?.map((d) => d.value) ?? []) as T[];
};

// Deletes multiple key-value pairs from the database.
export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('kv_store_b7b6fbd4')
    .delete()
    .in('key', keys);
  if (error) {
    throw new Error(error.message);
  }
};

// Search for key-value pairs by prefix.
export const getByPrefix = async <T = unknown>(prefix: string): Promise<T[]> => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('kv_store_b7b6fbd4')
    .select('key, value')
    .like('key', `${prefix}%`);
  if (error) {
    throw new Error(error.message);
  }
  return (data?.map((d) => d.value) ?? []) as T[];
};

