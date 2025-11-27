import { NextRequest } from 'next/server';

import {
  createValidationError,
  handleApiError,
  createUnauthorizedError,
  createNotFoundError,
} from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { getAnonServerClient } from '@/utils/supabase/clients';
import { UserRecord } from '@/types/kv-records';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generates a random 6-digit OTP code.
 *
 * @returns 6-digit OTP string
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password, then generates an OTP for 2FA.
 *
 * Request body:
 * - email: User email address (required)
 * - password: User password (required)
 *
 * @param request - Next.js request object containing login credentials
 * @returns JSON response with 2FA requirement, access token, and dev OTP
 * @throws Returns error response if authentication fails or credentials are missing
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
      return createUnauthorizedError();
    }

    const userId = sessionData.user.id;
    const userData = await kv.get<UserRecord>(`user:${userId}`);
    if (!userData) {
      return createNotFoundError('User data');
    }

    const otp = generateOTP();
    const otpData = {
      otp,
      userId,
      created_at: Date.now(),
      expires_at: Date.now() + OTP_EXPIRY_MS,
      verified: false,
    };

    await kv.set(`otp:${userId}`, otpData);

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
