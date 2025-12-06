/**
 * @module app/api/elections/[id]/eligibility/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';
import { authenticateUser } from '@/utils/api/auth';
import { createClient } from '@/utils/supabase/server';
import * as kv from '@/utils/supabase/kvStore';
import {
  handleApiError,
  createNotFoundError,
  createForbiddenError,
  createBadRequestError,
  createUnauthorizedError,
} from '@/utils/api/errors';

/**
 * POST /api/elections/[id]/eligibility
 *
 * Uploads a voter eligibility list for an election.
 *
 * Allows the election creator to pre-approve voters by email address.
 * Pre-approved voters can vote immediately without requesting access.
 * If the email is already registered, the eligibility record is linked
 * to their user ID.
 *
 * ## Request
 *
 * **Path Parameters:**
 * - `id` - Election UUID
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` - Required, must be election creator
 *
 * **Body:**
 * ```json
 * {
 *   "voters": [
 *     "voter1@example.com",
 *     "voter2@example.com",
 *     "voter3@example.com"
 *   ]
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "message": "Added 3 voters to eligibility list"
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Invalid voter list format
 * - `401` - Unauthorized (missing or invalid token)
 * - `403` - Only election creator can upload eligibility list
 * - `404` - Election not found
 * - `500` - Server error
 *
 * @param request - Next.js request object containing voter list
 * @param params - Route parameters containing election ID
 * @returns JSON response with success status, or error response (400/401/403/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/elections/election-uuid/eligibility', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     Authorization: `Bearer ${token}`
 *   },
 *   body: JSON.stringify({
 *     voters: ['voter1@example.com', 'voter2@example.com']
 *   })
 * });
 * ```
 *
 * @category API Routes
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: electionId } = await params;
    const authHeader = request.headers.get('Authorization');

    const user = await authenticateUser(authHeader);

    const supabase = await createClient();
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return createNotFoundError('Election');
    }

    if (election.creator_id !== user.id) {
      return createForbiddenError('Only election creator can upload eligibility list');
    }

    const { voters } = await request.json();
    if (!voters || !Array.isArray(voters)) {
      return createBadRequestError('Invalid voter list');
    }

    let addedCount = 0;
    for (const voterEmail of voters) {
      if (!voterEmail || typeof voterEmail !== 'string') continue;

      const email = voterEmail.trim().toLowerCase();
      const eligibilityId = crypto.randomUUID();

      const existingUserId = await kv.get<string>(`user:email:${email}`);

      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: email,
        user_id: existingUserId || null,
        status: 'preapproved',
        created_at: new Date().toISOString(),
      };

      await kv.set(`eligibility:${electionId}:${email}`, eligibility);
      addedCount++;
    }

    return Response.json({
      success: true,
      message: `Added ${addedCount} voters to eligibility list`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Upload eligibility error:', error);
    return handleApiError(error, 'upload-eligibility');
  }
}
