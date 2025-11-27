import { NextRequest } from 'next/server';

import { authenticateUser } from '@/utils/api/auth';
import { handleApiError, createUnauthorizedError, createNotFoundError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { UserRecord } from '@/types/kv-records';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return createUnauthorizedError();
    }

    const user = await authenticateUser(authHeader);
    const userData = await kv.get<UserRecord>(`user:${user.id}`);

    if (!userData) {
      return createNotFoundError('User data');
    }

    return Response.json({ user: userData });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    return handleApiError(error, 'auth/me');
  }
}


