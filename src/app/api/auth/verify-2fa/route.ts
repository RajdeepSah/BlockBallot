/**
 * @module app/api/auth/verify-2fa/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';

import {
  createValidationError,
  handleApiError,
  createNotFoundError,
  createUnauthorizedError,
} from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { OtpRecord, UserRecord } from '@/types/kv-records';

/**
 * POST /api/auth/verify-2fa
 *
 * Verifies a 2FA OTP code and completes the login process.
 *
 * This endpoint validates the OTP code against the stored record,
 * checks expiration, and returns user data on success. The OTP
 * record is deleted after successful verification to prevent reuse.
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "userId": "user-uuid",
 *   "otp": "123456"
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "user": {
 *     "id": "user-uuid",
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "phone": "+1234567890"
 *   }
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing OTP or user ID
 * - `401` - Invalid OTP or expired OTP
 * - `404` - OTP record not found or user not found
 * - `500` - Server error
 *
 * @param request - Next.js request object containing userId and otp in body
 * @returns JSON response with success status and user data, or error response (400/401/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/verify-2fa', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ userId, otp: '123456' })
 * });
 * const { user } = await response.json();
 * ```
 *
 * @see POST /api/auth/login to initiate 2FA flow
 * @see POST /api/auth/resend-otp to resend OTP code
 * @category API Routes
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return createValidationError('Missing OTP or user ID');
    }

    const userData = await kv.get<UserRecord>(`user:${userId}`);
    if (!userData) {
      return createNotFoundError('User');
    }

    const otpData = await kv.get<OtpRecord>(`otp:${userData.email}`);
    if (!otpData) {
      return createNotFoundError('OTP');
    }

    if (Date.now() > otpData.expires_at) {
      await kv.del(`otp:${userData.email}`);
      return createUnauthorizedError();
    }

    if (otpData.otp !== otp) {
      return createUnauthorizedError();
    }

    await kv.del(`otp:${userData.email}`);

    return Response.json({
      success: true,
      message: 'Login successful',
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
      },
    });
  } catch (error) {
    return handleApiError(error, 'auth/verify-2fa');
  }
}
