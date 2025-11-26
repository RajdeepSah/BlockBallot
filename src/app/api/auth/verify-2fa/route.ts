import { NextRequest } from 'next/server';

import { createValidationError, handleApiError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return createValidationError('Missing OTP or user ID');
    }

    const otpData = await kv.get(`otp:${userId}`);
    if (!otpData) {
      return Response.json({ error: 'No OTP found for this user' }, { status: 404 });
    }

    if (Date.now() > otpData.expires_at) {
      await kv.del(`otp:${userId}`);
      return Response.json({ error: 'OTP expired' }, { status: 401 });
    }

    if (otpData.otp !== otp) {
      return Response.json({ error: 'Invalid OTP' }, { status: 401 });
    }

    await kv.del(`otp:${userId}`);

    const userData = await kv.get(`user:${userId}`);
    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
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


