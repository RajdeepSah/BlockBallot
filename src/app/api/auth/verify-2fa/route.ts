import { NextRequest } from 'next/server';

import { createValidationError, handleApiError, createNotFoundError, createUnauthorizedError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { OtpRecord, UserRecord } from '@/types/kv-records';

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return createValidationError('Missing OTP or user ID');
    }

    const otpData = await kv.get<OtpRecord>(`otp:${userId}`);
    if (!otpData) {
      return createNotFoundError('OTP');
    }

    if (Date.now() > otpData.expires_at) {
      await kv.del(`otp:${userId}`);
      return createUnauthorizedError();
    }

    if (otpData.otp !== otp) {
      return createUnauthorizedError();
    }

    await kv.del(`otp:${userId}`);

    const userData = await kv.get<UserRecord>(`user:${userId}`);
    if (!userData) {
      return createNotFoundError('User');
    }

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


