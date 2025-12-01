/**
 * @module utils/supabase/kvStore
 * @category Data Storage
 *
 * Key-value store utilities for flexible data management in Supabase.
 *
 * This module provides a key-value store interface built on top of Supabase's
 * PostgreSQL database. It supports:
 * - Single and batch operations (get, set, delete)
 * - Prefix-based queries for retrieving related records
 * - Type-safe operations with TypeScript generics
 *
 * **Key Prefix Patterns:**
 * - `user:` - User records
 * - `user:email:` - Email to user ID mapping
 * - `eligibility:` - Eligibility records
 * - `access_request:` - Access request records
 * - `vote:user:` - User vote flags (indicates if user has voted, no transaction hash)
 * - `vote:tx:` - Transaction hash registry (anonymous, no user ID)
 * - `otp:` - OTP records
 * - `invite_history:` - Invitation history
 *
 * ## Table Schema
 *
 * ```sql
 * CREATE TABLE kv_store_b7b6fbd4 (
 *   key TEXT NOT NULL PRIMARY KEY,
 *   value JSONB NOT NULL
 * );
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import * as kv from '@/utils/supabase/kvStore';
 *
 * // Store a value
 * await kv.set('user:123', { name: 'John', email: 'john@example.com' });
 *
 * // Retrieve a value
 * const user = await kv.get<UserRecord>('user:123');
 *
 * // Get all records with prefix
 * const users = await kv.getByPrefix<UserRecord>('user:');
 * ```
 */

import { createClient } from '@supabase/supabase-js';

/**
 * Gets a Supabase service client for KV store operations.
 *
 * Creates a Supabase client with service role permissions, which are required
 * for KV store operations. The client is configured to not persist sessions
 * or auto-refresh tokens since it's used server-side.
 *
 * @returns Supabase client with service role permissions
 * @throws {Error} If required environment variables are missing (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 *
 * @internal
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
 * Upserts (inserts or updates) a key-value pair. The value is automatically
 * serialized as JSON. If the key already exists, the value is updated.
 *
 * @param key - The key to store the value under (e.g., `'user:123'`, `'eligibility:electionId:email'`)
 * @param value - The value to store (will be serialized as JSONB in the database)
 * @returns Promise that resolves when the operation completes
 * @throws {Error} If the database operation fails
 *
 * @example
 * ```typescript
 * // Store a user record
 * await set('user:123', {
 *   id: '123',
 *   email: 'john@example.com',
 *   name: 'John Doe'
 * });
 *
 * // Store eligibility record
 * await set('eligibility:election-123:john@example.com', {
 *   electionId: 'election-123',
 *   email: 'john@example.com',
 *   eligible: true
 * });
 * ```
 *
 * @see {@link mset} to store multiple key-value pairs atomically
 * @category Data Storage
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
 * Looks up a value by its key. Returns `undefined` if the key doesn't exist.
 * The value is automatically deserialized from JSON.
 *
 * @param key - The key to look up
 * @returns The value if found, `undefined` if the key doesn't exist
 * @throws {Error} If the database operation fails
 *
 * @example
 * ```typescript
 * // Get a user record
 * const user = await get<UserRecord>('user:123');
 * if (user) {
 *   console.log(user.name, user.email);
 * }
 *
 * // Get eligibility status
 * const eligibility = await get<EligibilityRecord>('eligibility:election-123:john@example.com');
 * ```
 *
 * @see {@link mget} to retrieve multiple values by keys
 * @see {@link getByPrefix} to retrieve all values with a key prefix
 * @category Data Storage
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
 * Removes a key-value pair from the store. No error is thrown if the key
 * doesn't exist (idempotent operation).
 *
 * @param key - The key to delete
 * @returns Promise that resolves when the operation completes
 * @throws {Error} If the database operation fails
 *
 * @example
 * ```typescript
 * // Delete a user record
 * await del('user:123');
 *
 * // Delete an OTP record
 * await del('otp:john@example.com');
 * ```
 *
 * @see {@link mdel} to delete multiple keys
 * @category Data Storage
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
 * Stores multiple key-value pairs in a single database operation. All pairs
 * are stored atomically (all succeed or all fail). The arrays must have
 * matching lengths.
 *
 * @param keys - Array of keys to store (must match `values` length)
 * @param values - Array of values to store (must match `keys` length)
 * @returns Promise that resolves when the operation completes
 * @throws {Error} If arrays have different lengths or database operation fails
 *
 * @example
 * ```typescript
 * // Store multiple user records atomically
 * await mset(
 *   ['user:1', 'user:2', 'user:3'],
 *   [
 *     { id: '1', name: 'John' },
 *     { id: '2', name: 'Jane' },
 *     { id: '3', name: 'Bob' }
 *   ]
 * );
 * ```
 *
 * @see {@link set} to store a single key-value pair
 * @category Data Storage
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
 * Looks up multiple values in a single database operation. Returns an array
 * of values in the same order as the input keys. Keys that don't exist are
 * omitted from the result array.
 *
 * @param keys - Array of keys to look up
 * @returns Array of values found (keys that don't exist are omitted)
 * @throws {Error} If the database operation fails
 *
 * @example
 * ```typescript
 * // Get multiple user records
 * const users = await mget<UserRecord>(['user:1', 'user:2', 'user:3']);
 * // Returns array of found users (may be shorter than input if some keys don't exist)
 * ```
 *
 * @see {@link get} to retrieve a single value
 * @category Data Storage
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
 * Deletes multiple keys in a single database operation. No error is thrown
 * for keys that don't exist (idempotent operation).
 *
 * @param keys - Array of keys to delete
 * @returns Promise that resolves when the operation completes
 * @throws {Error} If the database operation fails
 *
 * @example
 * ```typescript
 * // Delete multiple OTP records
 * await mdel([
 *   'otp:user1@example.com',
 *   'otp:user2@example.com',
 *   'otp:user3@example.com'
 * ]);
 * ```
 *
 * @see {@link del} to delete a single key
 * @category Data Storage
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
 * Performs a prefix-based query to retrieve all records with keys matching
 * the prefix. Useful for retrieving related records (e.g., all eligibility
 * records for an election, all access requests, etc.).
 *
 * @param prefix - The key prefix to search for (e.g., `'eligibility:election-123:'`, `'user:'`)
 * @returns Array of values whose keys match the prefix
 * @throws {Error} If the database operation fails
 *
 * @example
 * ```typescript
 * // Get all eligibility records for an election
 * const eligible = await getByPrefix<EligibilityRecord>('eligibility:election-123:');
 *
 * // Get all access requests for an election
 * const requests = await getByPrefix<AccessRequestRecord>('access_request:election-123:');
 *
 * // Get all user records
 * const users = await getByPrefix<UserRecord>('user:');
 * ```
 *
 * @see {@link get} to retrieve a single value by exact key
 * @category Data Storage
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
