import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { projectId } from '@/utils/supabase/info';

const KV_TABLE = 'kv_store_b7b6fbd4';
const supabaseUrl = process.env.SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabaseServerClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

type EligibilityRecord = {
  id: string;
  contact: string;
  user_id?: string;
  status: string;
};

type KvRow<T> = {
  key: string;
  value: T;
};

function requireSupabase() {
  if (!supabaseServerClient) {
    throw new Error(
      'Missing Supabase service role credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return supabaseServerClient;
}

async function getKvValue<T>(key: string): Promise<T | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(KV_TABLE)
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.value as T) ?? null;
}

async function resolveUserName(userId?: string, fallbackEmail?: string) {
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
        (record) =>
          record &&
          (record.status === 'preapproved' || record.status === 'approved')
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

    // Previously the Supabase edge function printed log text ahead of its JSON payload,
    // which is why clients saw "Unexpected non-whitespace character" parse errors.
    // Returning with NextResponse.json guarantees the response is pure JSON.
    return NextResponse.json({ voters });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load eligible voters.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
