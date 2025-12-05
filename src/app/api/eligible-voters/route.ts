/**
 * @module app/api/eligible-voters/route
 * @category API Routes
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { projectId } from '@/utils/supabase/info';
import type { EligibilityRecord } from '@/types/kv-records';

const KV_TABLE = 'kv_store_b7b6fbd4';
const supabaseUrl = process.env.SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabaseServerClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

type KvRow<T> = {
  key: string;
  value: T;
};

/**
 * Ensures Supabase service role client is available.
 *
 * @returns Supabase client with service role
 * @throws {Error} If service role credentials are missing
 *
 * @internal
 */
function requireSupabase() {
  if (!supabaseServerClient) {
    throw new Error(
      'Missing Supabase service role credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return supabaseServerClient;
}

/**
 * Retrieves a value from the KV store by key.
 *
 * @param key - The key to look up
 * @returns The value if found, null otherwise
 * @throws {Error} If KV read fails
 *
 * @internal
 */
async function getKvValue<T>(key: string): Promise<T | null> {
  const client = requireSupabase();
  const { data, error } = await client.from(KV_TABLE).select('value').eq('key', key).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.value as T) ?? null;
}

/**
 * Resolves a user's display name from their user ID or email.
 *
 * @param userId - Optional user ID to look up
 * @param fallbackEmail - Fallback email if user ID is not available
 * @returns User's display name, email, or "Pending Registration"
 *
 * @internal
 */
async function resolveUserName(userId?: string | null, fallbackEmail?: string) {
  if (!userId && fallbackEmail) {
    const mappedUserId = await getKvValue<string>(`user:email:${fallbackEmail}`);
    if (mappedUserId) {
      userId = mappedUserId;
    }
  }

  if (!userId) {
    return fallbackEmail ?? 'Pending Registration';
  }

  const userData = await getKvValue<{ name?: string; email?: string }>(`user:${userId}`);
  if (userData?.name) {
    return userData.name;
  }
  if (userData?.email) {
    return userData.email;
  }
  return fallbackEmail ?? 'Pending Registration';
}

/**
 * POST /api/eligible-voters
 *
 * Retrieves the list of eligible voters for an election.
 *
 * Returns all pre-approved and approved voters with their display names.
 * Used by election administrators to view and manage the voter list.
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "electionId": "election-uuid"
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "voters": [
 *     {
 *       "id": "voter-uuid",
 *       "email": "voter@example.com",
 *       "full_name": "John Doe"
 *     }
 *   ]
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing electionId
 * - `500` - Server error or database failure
 *
 * @param request - The incoming request object
 * @returns JSON response with voters array, or error response (400/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/eligible-voters', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ electionId: 'election-uuid' })
 * });
 * const { voters } = await response.json();
 * ```
 *
 * @category API Routes
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const electionId = payload?.electionId as string | undefined;

    if (!electionId) {
      return NextResponse.json({ error: 'electionId is required.' }, { status: 400 });
    }

    const client = requireSupabase();
    const { data, error } = await client
      .from(KV_TABLE)
      .select('key,value')
      .like('key', `eligibility:${electionId}:%`);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? 'Failed to load eligibility list.' },
        { status: 500 }
      );
    }

    const eligibilityRecords = (data as KvRow<EligibilityRecord>[]) ?? [];
    const preapproved = eligibilityRecords
      .map((row) => row.value)
      .filter(
        (record) => record && (record.status === 'preapproved' || record.status === 'approved')
      );

    const voters = await Promise.all(
      preapproved.map(async (record) => {
        const email = record.contact;
        const fullName = await resolveUserName(record.user_id, email);
        return {
          id: record.id ?? email,
          email,
          full_name: fullName,
        };
      })
    );

    voters.sort((a, b) => a.email.localeCompare(b.email));

    return NextResponse.json({ voters });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load eligible voters.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
