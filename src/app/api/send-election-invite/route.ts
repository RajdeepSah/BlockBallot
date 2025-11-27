import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { projectId } from '@/utils/supabase/info';
import { createClient as createServerClient } from '@/utils/supabase/server';
import {
  buildElectionInviteEmail,
  getElectionInvitePlainText,
  type ElectionInviteEmailOptions,
} from '@/emails/ElectionInviteEmail';

export const runtime = 'nodejs';

const RESEND_API_URL = 'https://api.resend.com/emails';
const KV_TABLE = 'kv_store_b7b6fbd4';
const RATE_LIMIT_KEY_PREFIX = 'invite_rate:';
const HISTORY_KEY_PREFIX = 'invite_history:';
const INVITE_RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;
const INVITE_HISTORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const supabaseUrl = process.env.SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabaseServerClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

function requireSupabase() {
  if (!supabaseServerClient) {
    throw httpError(
      500,
      'Missing Supabase service role credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return supabaseServerClient;
}

interface SendInvitePayload {
  electionId?: string;
  directLink?: string;
}

interface RateLimitRecord {
  lastSentAt: number;
}

interface InviteHistoryRecord {
  emails: Record<string, number>;
}

type EligibilityRecord = {
  id: string;
  contact: string;
  status: string;
};

type VerifiedVoter = {
  id: string;
  email: string;
};

type NormalizedVoter = VerifiedVoter & { normalizedEmail: string };

interface HttpError extends Error {
  status: number;
}

function httpError(status: number, message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  return error;
}

async function getKvValue<T>(key: string): Promise<T | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(KV_TABLE)
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw httpError(500, `KV read failed: ${error.message}`);
  }

  return (data?.value as T) ?? null;
}

async function setKvValue<T>(key: string, value: T): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from(KV_TABLE).upsert({ key, value });
  if (error) {
    throw httpError(500, `KV write failed: ${error.message}`);
  }
}

async function getAuthedUserId(request: Request): Promise<string> {
  const authorization =
    request.headers.get('authorization') ?? request.headers.get('Authorization');

  if (!authorization) {
    throw httpError(401, 'Authorization header is required.');
  }

  const [scheme, token] = authorization.split(' ');
  const accessToken = scheme?.toLowerCase() === 'bearer' ? token : authorization;

  if (!accessToken) {
    throw httpError(401, 'Invalid authorization header.');
  }

  const client = requireSupabase();
  const { data, error } = await client.auth.getUser(accessToken);
  if (error || !data?.user) {
    throw httpError(401, 'Invalid or expired session.');
  }

  return data.user.id;
}

async function enforceRateLimit(electionId: string) {
  const key = `${RATE_LIMIT_KEY_PREFIX}${electionId}`;
  const record = await getKvValue<RateLimitRecord>(key);
  if (record) {
    const now = Date.now();
    const elapsed = now - record.lastSentAt;
    if (elapsed < INVITE_RATE_LIMIT_WINDOW_MS) {
      const seconds = Math.ceil((INVITE_RATE_LIMIT_WINDOW_MS - elapsed) / 1000);
      throw httpError(
        429,
        `Please wait ${seconds}s before sending another invitation batch.`
      );
    }
  }
}

async function updateRateLimit(electionId: string) {
  const key = `${RATE_LIMIT_KEY_PREFIX}${electionId}`;
  await setKvValue<RateLimitRecord>(key, { lastSentAt: Date.now() });
}

async function getPreapprovedVoters(electionId: string): Promise<VerifiedVoter[]> {
  // The previous implementation queried a non-existent `election_voters` table, which
  // triggered "table ... not found" errors. Pre-approved voters are actually stored
  // inside the KV table under `eligibility:${electionId}:*`, so we load them directly.
  const client = requireSupabase();
  const { data, error } = await client
    .from(KV_TABLE)
    .select('key,value')
    .like('key', `eligibility:${electionId}:%`);

  if (error) {
    throw httpError(500, `Failed to load pre-approved voters: ${error.message}`);
  }

  const rows = (data as { value: EligibilityRecord }[]) ?? [];
  return rows
    .map((row) => row.value)
    .filter(
      (record) =>
        record &&
        typeof record.contact === 'string' &&
        record.contact.trim().length > 0 &&
        (record.status === 'preapproved' || record.status === 'approved')
    )
    .map((record) => ({
      id: record.id ?? record.contact,
      email: record.contact.trim(),
    }));
}

async function getInviteHistory(electionId: string): Promise<InviteHistoryRecord> {
  const key = `${HISTORY_KEY_PREFIX}${electionId}`;
  const history = (await getKvValue<InviteHistoryRecord>(key)) ?? { emails: {} };
  const now = Date.now();
  const prunedEntries: Record<string, number> = {};

  for (const [email, sentAt] of Object.entries(history.emails ?? {})) {
    if (typeof sentAt === 'number' && now - sentAt <= INVITE_HISTORY_TTL_MS) {
      prunedEntries[email] = sentAt;
    }
  }

  return { emails: prunedEntries };
}

function filterVoters(
  voters: VerifiedVoter[],
  history: InviteHistoryRecord
): { toSend: NormalizedVoter[]; skipped: number } {
  const seen = new Set<string>();
  const historyEmails = history.emails ?? {};
  const normalized: NormalizedVoter[] = [];
  let skipped = 0;

  for (const voter of voters) {
    const normalizedEmail = voter.email.toLowerCase();
    if (seen.has(normalizedEmail)) {
      skipped += 1;
      continue;
    }
    seen.add(normalizedEmail);

    if (historyEmails[normalizedEmail]) {
      skipped += 1;
      continue;
    }

    normalized.push({ ...voter, normalizedEmail });
  }

  return { toSend: normalized, skipped };
}

async function saveInviteHistory(
  electionId: string,
  history: InviteHistoryRecord,
  sentVoters: NormalizedVoter[]
) {
  const now = Date.now();
  for (const voter of sentVoters) {
    history.emails[voter.normalizedEmail] = now;
  }

  const key = `${HISTORY_KEY_PREFIX}${electionId}`;
  await setKvValue(key, history);
}

function resolveDirectLink(request: Request, electionId: string, provided?: string) {
  const sanitized = typeof provided === 'string' && provided.trim() ? provided.trim() : null;
  const vercelBase = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  const envBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_BASE_URL ??
    vercelBase;

  if (envBase) {
    return `${envBase.replace(/\/$/, '')}/vote/${electionId}`;
  }

  if (sanitized && sanitized.startsWith('http')) {
    return sanitized;
  }

  const origin = request.headers.get('origin');
  if (origin) {
    return `${origin.replace(/\/$/, '')}/vote/${electionId}`;
  }

  const host = request.headers.get('x-forwarded-host');
  if (host) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${host.replace(/\/$/, '')}/vote/${electionId}`;
  }

  return `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://blockballot.vercel.app'}/vote/${electionId}`;
}

async function sendInvitationEmail(
  to: string,
  payload: ElectionInviteEmailOptions
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw httpError(500, 'RESEND_API_KEY is not configured.');
  }

  const fromAddress =
    process.env.EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    'BlockBallot <no-reply@blockballot.officialework.com>';

  const html = buildElectionInviteEmail(payload);
  const text = getElectionInvitePlainText(payload);

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress,
      to,
      subject: `You're invited to vote in "${payload.electionName}"`,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message ?? 'Failed to send election invitation email.';
    throw httpError(502, message);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthedUserId(request);
    const payload = (await request.json().catch(() => null)) as SendInvitePayload | null;

    if (!payload || !payload.electionId) {
      throw httpError(400, 'electionId is required.');
    }
    const supabase = await createServerClient();
    const { data: election } = await supabase
      .from('elections')
      .select('*')   
      .eq('id', payload.electionId)
      .single();

    if (!election) {
      throw httpError(404, 'Election not found.');
    }

    if (election.creator_id !== userId) {
      throw httpError(403, 'Only the election creator can send invitations.');
    }

    await enforceRateLimit(election.id);

    const voters = await getPreapprovedVoters(election.id);
    if (voters.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: 'No eligible voters to notify.',
      });
    }

    const history = await getInviteHistory(election.id);
    const { toSend } = filterVoters(voters, history);

    if (toSend.length === 0) {
      await updateRateLimit(election.id);
      return NextResponse.json({
        success: true,
        sentCount: 0,
        message: 'All eligible voters have already received an invitation.',
      });
    }

    const emailPayload: ElectionInviteEmailOptions = {
      electionName: election.title,
      electionCode: election.code,
      directLink: resolveDirectLink(request, election.id, payload.directLink),
      startTime: election.starts_at,
      endTime: election.ends_at,
    };

    let sentCount = 0;
    const successfullySent: NormalizedVoter[] = [];
    for (const voter of toSend) {
      try {
        await sendInvitationEmail(voter.email, emailPayload);
        sentCount += 1;
        successfullySent.push(voter);
      } catch (err) {
        console.error('Failed to send election invite', {
          email: voter.email,
          electionId: election.id,
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    if (successfullySent.length > 0) {
      await saveInviteHistory(election.id, history, successfullySent);
    }
    await updateRateLimit(election.id);

    return NextResponse.json({
      success: true,
      sentCount,
    });
  } catch (error) {
    const httpErr = error as HttpError;
    const status = httpErr?.status ?? 500;
    const message = error instanceof Error ? error.message : 'Failed to send election invitations.';
    return NextResponse.json({ error: message }, { status });
  }
}
