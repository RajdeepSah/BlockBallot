/**
 * @module app/api/auth/login/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';

import {
  createValidationError,
  handleApiError,
  createUnauthorizedError,
  createNotFoundError,
  createErrorResponse,
} from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { getAnonServerClient } from '@/utils/supabase/clients';
import { UserRecord } from '@/types/kv-records';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generates a random 6-digit OTP code.
 *
 * Creates a numeric code between 100000 and 999999 for 2FA verification.
 *
 * @returns 6-digit OTP string (e.g., `"123456"`)
 *
 * @internal
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password, then generates an OTP for 2FA.
 *
 * This endpoint:
 * 1. Validates email and password credentials
 * 2. Authenticates with Supabase Auth
 * 3. Generates a 6-digit OTP code
 * 4. Stores OTP in KV store with 5-minute expiration
 * 5. Returns session tokens and OTP (OTP shown in dev mode only)
 *
 * **Note**: In development, the OTP is included in the response for testing.
 * In production, the OTP should be sent via email.
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "userpassword"
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "message": "2FA required",
 *   "userId": "user-uuid",
 *   "accessToken": "jwt-token",
 *   "refreshToken": "refresh-token",
 *   "requires2FA": true,
 *   "devOTP": "123456"
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing credentials
 * - `401` - Invalid credentials
 * - `404` - User data not found
 * - `500` - Server error
 *
 * @param request - Next.js request object containing login credentials
 * @returns JSON response with 2FA requirement, access token, and dev OTP, or error response (400/401/404/500) if authentication fails
 *
 * @see POST /api/auth/verify-2fa to complete authentication
 * @category API Routes
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return createValidationError('Missing credentials');
    }

    const supabase = getAnonServerClient();
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !sessionData.user || !sessionData.session) {
      if (signInError) {
        if (signInError.message?.toLowerCase().includes('invalid login credentials')) {
          return createErrorResponse(
            'Invalid email or password. Please check your credentials and try again.',
            401
          );
        }
        if (signInError.message?.toLowerCase().includes('email not confirmed')) {
          return createErrorResponse('Please verify your email address before logging in.', 401);
        }
        if (signInError.message?.toLowerCase().includes('user not found')) {
          return createErrorResponse('No account found with this email address.', 401);
        }
        return createErrorResponse(
          signInError.message || 'Login failed. Please check your credentials.',
          401
        );
      }
      return createErrorResponse('Login failed. Please check your credentials and try again.', 401);
    }

    const userId = sessionData.user.id;
    const userData = await kv.get<UserRecord>(`user:${userId}`);
    if (!userData) {
      return createNotFoundError('User data');
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
      message: '2FA required',
      userId,
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      requires2FA: true,
      devOTP: otp,
    });
  } catch (error) {
    return handleApiError(error, 'auth/login');
  }
}
