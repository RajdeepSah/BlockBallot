/**
 * @module app/api/send-otp/route
 * @category API Routes
 */

import { NextResponse } from 'next/server';
import { buildOtpEmail, getOtpPlainText } from '@/emails/OtpEmail';
import {
  OTP_EXPIRATION_MS,
  OTP_RATE_LIMIT_WINDOW_MS,
  createOtpHash,
  deleteOtpRecord,
  generateOtp,
  getOtpRecord,
  isValidEmail,
  sanitizeEmail,
  setOtpRecord,
  type OtpRecord,
} from '@/lib/server/otp';

export const runtime = 'nodejs';

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Sends an OTP email using the Resend API.
 *
 * @param email - Recipient email address
 * @param code - OTP code to send
 * @throws {Error} If API key is missing or email sending fails
 *
 * @internal
 */
async function sendOtpEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const expiresInMinutes = Math.round(OTP_EXPIRATION_MS / 60000);
  const html = buildOtpEmail({ code, expiresInMinutes });
  const text = getOtpPlainText(code, expiresInMinutes);

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'BlockBallot <no-reply@blockballot.officialework.com>',
      to: email,
      subject: 'Your BlockBallot Verification Code',
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message ?? 'Failed to send OTP email.');
  }
}

/**
 * POST /api/send-otp
 *
 * Generates and sends an OTP code to the provided email address.
 *
 * Creates a secure 6-digit OTP, hashes it with HMAC-SHA256, stores the
 * hash in the KV store, and sends the plain OTP via email. Enforces
 * rate limiting (1 minute) to prevent abuse.
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "email": "user@example.com"
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Invalid email address
 * - `429` - Rate limited (OTP already sent recently)
 * - `500` - Server error or email sending failure
 *
 * @param request - Request object containing email in JSON body
 * @returns JSON response with success status, or error response (400/429/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/send-otp', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ email: 'user@example.com' })
 * });
 * ```
 *
 * @see POST /api/verify-otp to verify the OTP code
 * @category API Routes
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    const normalizedEmail = sanitizeEmail(payload?.email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const existingRecord = await getOtpRecord(normalizedEmail).catch((error) => {
      if (error.message.includes('Supabase')) {
        throw error;
      }
      throw new Error('Unable to read OTP data store.');
    });

    if (existingRecord && Date.now() - existingRecord.lastSentAt < OTP_RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json(
        { error: 'OTP already sent. Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    const otp = generateOtp();
    const { hash, salt } = createOtpHash(otp);
    const now = Date.now();
    const record: OtpRecord = {
      email: normalizedEmail,
      otpHash: hash,
      salt,
      createdAt: now,
      expiresAt: now + OTP_EXPIRATION_MS,
      attemptCount: 0,
      lastSentAt: now,
    };

    await setOtpRecord(record);

    try {
      await sendOtpEmail(normalizedEmail, otp);
    } catch (error) {
      await deleteOtpRecord(normalizedEmail).catch(() => undefined);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send verification code.';
    const status = message.includes('Supabase') || message.includes('RESEND') ? 500 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
