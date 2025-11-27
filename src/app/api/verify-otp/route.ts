import { NextResponse } from 'next/server';
import {
  OTP_MAX_VERIFY_ATTEMPTS,
  createOtpHash,
  deleteOtpRecord,
  getOtpRecord,
  isValidEmail,
  sanitizeEmail,
  setOtpRecord,
  timingSafeCompare,
} from '@/lib/server/otp';

export const runtime = 'nodejs';

/**
 * POST /api/verify-otp
 * Verifies an OTP code for email verification.
 * Enforces maximum attempt limits and expiration checks.
 * 
 * @param request - Request object containing email and otp in JSON body
 * @returns JSON response with success status, or error response
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const normalizedEmail = sanitizeEmail(payload?.email);
    const rawOtp = typeof payload?.otp === 'string' ? payload.otp.trim() : '';
    const sanitizedOtp = rawOtp.replace(/\D/g, '');

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (sanitizedOtp.length !== 6) {
      return NextResponse.json({ error: 'A 6-digit verification code is required.' }, { status: 400 });
    }

    const record = await getOtpRecord(normalizedEmail).catch((error) => {
      if (error.message.includes('Supabase')) {
        throw error;
      }
      throw new Error('Unable to read OTP data store.');
    });

    if (!record) {
      return NextResponse.json({ error: 'No active verification request found.' }, { status: 404 });
    }

    if (Date.now() > record.expiresAt) {
      await deleteOtpRecord(normalizedEmail).catch(() => undefined);
      return NextResponse.json({ error: 'Verification code expired. Request a new one.' }, { status: 410 });
    }

    if (record.attemptCount >= OTP_MAX_VERIFY_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many invalid attempts. Request a new code.' }, { status: 429 });
    }

    const { hash } = createOtpHash(sanitizedOtp, record.salt);
    const isMatch = timingSafeCompare(hash, record.otpHash);

    if (!isMatch) {
      await setOtpRecord({ ...record, attemptCount: record.attemptCount + 1 });
      return NextResponse.json({ error: 'Invalid verification code.' }, { status: 401 });
    }

    await deleteOtpRecord(normalizedEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify code.';
    const status = message.includes('Supabase') ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
