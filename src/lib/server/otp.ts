import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { projectId } from '@/utils/supabase/info';

const OTP_TABLE = 'kv_store_b7b6fbd4';
const OTP_KEY_PREFIX = 'otp:';

/**
 * OTP expiration time in milliseconds (5 minutes).
 */
export const OTP_EXPIRATION_MS = 5 * 60 * 1000;

/**
 * Rate limit window for OTP generation in milliseconds (1 minute).
 */
export const OTP_RATE_LIMIT_WINDOW_MS = 60 * 1000;

/**
 * Maximum number of verification attempts allowed per OTP.
 */
export const OTP_MAX_VERIFY_ATTEMPTS = 5;

const supabaseUrl = process.env.SUPABASE_URL ?? `https://${projectId}.supabase.co`;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const supabaseServerClient = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null;

function requireSupabase() {
  if (!supabaseServerClient) {
    throw new Error(
      'Missing Supabase service role credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return supabaseServerClient;
}

/**
 * OTP record stored in the KV store with security metadata.
 */
export interface OtpRecord {
  email: string;
  otpHash: string;
  salt: string;
  expiresAt: number;
  createdAt: number;
  attemptCount: number;
  lastSentAt: number;
}

/**
 * Generates the KV store key for an email's OTP record.
 *
 * @param email - Email address
 * @returns KV store key string
 */
function keyForEmail(email: string) {
  return `${OTP_KEY_PREFIX}${email}`;
}

/**
 * Retrieves an OTP record from the KV store.
 *
 * @param email - Email address to get OTP record for
 * @returns OTP record if found, null otherwise
 * @throws Error if database operation fails
 */
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

/**
 * Stores an OTP record in the KV store.
 *
 * @param record - OTP record to store
 * @throws Error if database operation fails
 */
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

/**
 * Deletes an OTP record from the KV store.
 *
 * @param email - Email address whose OTP record should be deleted
 * @throws Error if database operation fails
 */
export async function deleteOtpRecord(email: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from(OTP_TABLE).delete().eq('key', keyForEmail(email));

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Sanitizes and normalizes an email address.
 *
 * @param value - Value to sanitize as email
 * @returns Normalized email address (lowercase, trimmed) or null if invalid
 */
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

/**
 * Validates that a string is a valid email address format.
 *
 * @param email - Email string to validate
 * @returns True if email format is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generates a random 6-digit OTP code.
 *
 * @returns 6-digit OTP string
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Creates a secure hash of an OTP using HMAC-SHA256.
 *
 * @param otp - The OTP code to hash
 * @param salt - Optional salt (if not provided, generates a random one)
 * @returns Object containing the hash and salt
 */
export function createOtpHash(otp: string, salt?: string) {
  const otpSalt = salt ?? crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', otpSalt).update(otp).digest('hex');
  return { hash, salt: otpSalt };
}

/**
 * Performs a timing-safe comparison of two hash strings.
 * Prevents timing attacks when comparing OTP hashes.
 *
 * @param hashA - First hash to compare
 * @param hashB - Second hash to compare
 * @returns True if hashes are equal, false otherwise
 */
export function timingSafeCompare(hashA: string, hashB: string): boolean {
  const bufferA = Buffer.from(hashA, 'hex');
  const bufferB = Buffer.from(hashB, 'hex');

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}
