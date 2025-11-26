import { NextRequest } from 'next/server';

import { createValidationError, handleApiError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { getAnonServerClient } from '@/utils/supabase/clients';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userId = sessionData.user.id;
    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return Response.json({ error: 'User data not found' }, { status: 404 });
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


