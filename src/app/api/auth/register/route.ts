import { NextRequest } from 'next/server';

import { createValidationError, handleApiError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { getServiceRoleClient } from '@/utils/supabase/clients';

/**
 * POST /api/auth/register
 *
 * Registers a new user account with email and password.
 * Creates user in Supabase Auth and stores user data in KV store.
 *
 * Request body:
 * - name: User's full name (required)
 * - email: User email address (required)
 * - password: User password, minimum 8 characters (required)
 * - phone: User phone number (optional)
 *
 * @param request - Next.js request object containing registration data
 * @returns JSON response with success status and user ID
 * @throws Returns error response if registration fails, validation fails, or email already exists
 */
export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return createValidationError('Missing required fields');
    }

    if (password.length < 8) {
      return createValidationError('Password must be at least 8 characters');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await kv.get<string>(`user:email:${normalizedEmail}`);
    if (existingUser) {
      return createValidationError('Email already registered');
    }

    const supabase = getServiceRoleClient();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name, phone },
    });

    if (authError || !authData?.user) {
      return createValidationError(authError?.message || 'Failed to create user');
    }

    const userId = authData.user.id;
    const userData = {
      id: userId,
      name,
      email: normalizedEmail,
      phone: phone || null,
      twofa_method: 'email',
      created_at: new Date().toISOString(),
    };

    await kv.set(`user:${userId}`, userData);
    await kv.set(`user:email:${normalizedEmail}`, userId);

    return Response.json({
      success: true,
      message: 'User registered successfully',
      userId,
    });
  } catch (error) {
    return handleApiError(error, 'auth/register');
  }
}
