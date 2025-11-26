import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { projectId } from '@/utils/supabase/info';

const OTP_TABLE = 'kv_store_b7b6fbd4';
const OTP_KEY_PREFIX = 'otp:';

export const OTP_EXPIRATION_MS = 5 * 60 * 1000;
export const OTP_RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

const supabaseUrl = process.env.SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabaseServerClient = serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey)
  : null;

function requireSupabase() {
  if (!supabaseServerClient) {
    throw new Error('Missing Supabase service role credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseServerClient;
}

export interface OtpRecord {
  email: string;
  otpHash: string;
  salt: string;
  expiresAt: number;
  createdAt: number;
  attemptCount: number;
  lastSentAt: number;
}

function keyForEmail(email: string) {
  return `${OTP_KEY_PREFIX}${email}`;
}

export async function getOtpRecord(email: string): Promise<OtpRecord | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from(OTP_TABLE)
    .select('value')
    .eq('key', keyForEmail(email))
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.value as OtpRecord) ?? null;
}

export async function setOtpRecord(record: OtpRecord): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from(OTP_TABLE).upsert({
    key: keyForEmail(record.email),
    value: record,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteOtpRecord(email: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client
    .from(OTP_TABLE)
    .delete()
    .eq('key', keyForEmail(email));

  if (error) {
    throw new Error(error.message);
  }
}

export function sanitizeEmail(value: unknown): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const sanitized = value.trim().toLowerCase();
  if (!sanitized) {
    return null;
  }

  return sanitized;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createOtpHash(otp: string, salt?: string) {
  const otpSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', otpSalt).update(otp).digest('hex');
  return { hash, salt: otpSalt };
}

export function timingSafeCompare(hashA: string, hashB: string): boolean {
  const bufferA = Buffer.from(hashA, 'hex');
  const bufferB = Buffer.from(hashB, 'hex');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}
