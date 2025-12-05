/**
 * @module app/api/auth/register/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';

import { createValidationError, handleApiError } from '@/utils/api/errors';
import * as kv from '@/utils/supabase/kvStore';
import { getServiceRoleClient } from '@/utils/supabase/clients';

/**
 * POST /api/auth/register
 *
 * Registers a new user account with email and password.
 *
 * This endpoint:
 * 1. Validates registration data (name, email, password)
 * 2. Checks if email is already registered
 * 3. Creates user in Supabase Auth
 * 4. Stores user profile in KV store
 * 5. Creates email-to-userId mapping for lookups
 *
 * ## Request
 *
 * **Body:**
 * ```json
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "SecurePassword123!",
 *   "phone": "+1234567890"
 * }
 * ```
 *
 * | Field | Type | Required | Description |
 * |-------|------|----------|-------------|
 * | name | string | Yes | User's full name |
 * | email | string | Yes | User email address (must be unique) |
 * | password | string | Yes | Password (minimum 8 characters) |
 * | phone | string | No | User phone number |
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "userId": "user-uuid"
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing required fields, password too short, or email already registered
 * - `500` - Server error or Supabase Auth failure
 *
 * @param request - Next.js request object containing registration data
 * @returns JSON response with success status and user ID, or error response (400/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     password: 'SecurePassword123!'
 *   })
 * });
 * const { userId } = await response.json();
 * ```
 *
 * @see POST /api/auth/login to login after registration
 * @category API Routes
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
