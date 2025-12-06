/**
 * @module app/api/auth/resend-otp/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';

import { createValidationError, handleApiError, createNotFoundError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { UserRecord } from '@/types/kv-records';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generates a random 6-digit OTP code.
 *
 * @returns 6-digit OTP string (e.g., `"123456"`)
 *
 * @internal
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/resend-otp
 *
 * Resends an OTP code to a user for 2FA verification.
 *
 * Generates a new 6-digit OTP code and stores it in the KV store
 * with a 5-minute expiration. Used when the original OTP expires
 * or the user didn't receive it.
 *
 * **Note**: In development mode, the OTP is returned in the response
 * for testing purposes. In production, the OTP should be sent via email.
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "userId": "user-uuid"
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "message": "OTP resent",
 *   "devOTP": "123456"
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing user ID
 * - `404` - User not found
 * - `500` - Server error
 *
 * @param request - Next.js request object containing userId in body
 * @returns JSON response with success status and dev OTP, or error response (400/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/resend-otp', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ userId })
 * });
 * ```
 *
 * @see POST /api/auth/verify-2fa to verify the OTP
 * @category API Routes
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return createValidationError('Missing user ID');
    }

    const userData = await kv.get<UserRecord>(`user:${userId}`);
    if (!userData) {
      return createNotFoundError('User');
    }

    const otp = generateOTP();
    const otpData = {
      otp,
      email: userData.email,
      userId,
      created_at: Date.now(),
      expires_at: Date.now() + OTP_EXPIRY_MS,
      verified: false,
    };

    await kv.set(`otp:${userData.email}`, otpData);

    return Response.json({
      success: true,
      message: 'OTP resent',
      devOTP: otp,
    });
  } catch (error) {
    return handleApiError(error, 'auth/resend-otp');
  }
}
