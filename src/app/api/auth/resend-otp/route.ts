import { NextRequest } from 'next/server';

import { createValidationError, handleApiError, createNotFoundError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { UserRecord } from '@/types/kv-records';

const OTP_EXPIRY_MS = 5 * 60 * 1000;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
      userId,
      created_at: Date.now(),
      expires_at: Date.now() + OTP_EXPIRY_MS,
      verified: false,
    };

    await kv.set(`otp:${userId}`, otpData);

    return Response.json({
      success: true,
      message: 'OTP resent',
      devOTP: otp,
    });
  } catch (error) {
    return handleApiError(error, 'auth/resend-otp');
  }
}


