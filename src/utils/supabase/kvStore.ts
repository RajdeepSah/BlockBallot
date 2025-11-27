/**
 * Node.js compatible version of KV store utilities.
 * Ported from src/supabase/functions/server/kv_store.tsx
 *
 * Table schema:
 * CREATE TABLE kv_store_b7b6fbd4 (
 *   key TEXT NOT NULL PRIMARY KEY,
 *   value JSONB NOT NULL
 * );
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Gets a Supabase service client for KV store operations.
 *
 * @returns Supabase client with service role
 * @throws Error if required environment variables are missing
 */
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
      persistSession: false,
    },
  });
};

/**
 * Stores a key-value pair in the KV store.
 *
 * @param key - The key to store the value under
 * @param value - The value to store (will be serialized as JSON)
 * @throws Error if the database operation fails
 */
export const set = async <T = unknown>(key: string, value: T): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase.from('kv_store_b7b6fbd4').upsert({
    key,
    value,
  });
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Retrieves a value from the KV store by key.
 *
 * @param key - The key to look up
 * @returns The value if found, undefined otherwise
 * @throws Error if the database operation fails
 */
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

/**
 * Deletes a key-value pair from the KV store.
 *
 * @param key - The key to delete
 * @throws Error if the database operation fails
 */
export const del = async (key: string): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase.from('kv_store_b7b6fbd4').delete().eq('key', key);
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Sets multiple key-value pairs in the KV store atomically.
 *
 * @param keys - Array of keys to store
 * @param values - Array of values to store (must match keys length)
 * @throws Error if arrays have different lengths or database operation fails
 */
export const mset = async <T = unknown>(keys: string[], values: T[]): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('kv_store_b7b6fbd4')
    .upsert(keys.map((k, i) => ({ key: k, value: values[i] })));
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Retrieves multiple values from the KV store by their keys.
 *
 * @param keys - Array of keys to look up
 * @returns Array of values in the same order as keys (undefined values are omitted)
 * @throws Error if the database operation fails
 */
export const mget = async <T = unknown>(keys: string[]): Promise<T[]> => {
  const supabase = getServiceClient();
  const { data, error } = await supabase.from('kv_store_b7b6fbd4').select('value').in('key', keys);
  if (error) {
    throw new Error(error.message);
  }
  return (data?.map((d) => d.value) ?? []) as T[];
};

/**
 * Deletes multiple key-value pairs from the KV store.
 *
 * @param keys - Array of keys to delete
 * @throws Error if the database operation fails
 */
export const mdel = async (keys: string[]): Promise<void> => {
  const supabase = getServiceClient();
  const { error } = await supabase.from('kv_store_b7b6fbd4').delete().in('key', keys);
  if (error) {
    throw new Error(error.message);
  }
};

/**
 * Retrieves all key-value pairs where the key starts with the given prefix.
 *
 * @param prefix - The key prefix to search for
 * @returns Array of values whose keys match the prefix
 * @throws Error if the database operation fails
 */
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
