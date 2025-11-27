import { NextRequest } from 'next/server';

import { createValidationError, handleApiError, createUnauthorizedError } from '@/utils/api/errors';
import { getAnonServerClient } from '@/utils/supabase/clients';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return createValidationError('Missing refresh token');
    }

    const supabase = getAnonServerClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return createUnauthorizedError();
    }

    return Response.json({
      success: true,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    });
  } catch (error) {
    return handleApiError(error, 'auth/refresh');
  }
}


