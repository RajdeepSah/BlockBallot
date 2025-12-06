/**
 * @module app/api/elections/[id]/access-requests/[requestId]/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';
import { authenticateUser } from '@/utils/api/auth';
import { createClient } from '@/utils/supabase/server';
import * as kv from '@/utils/supabase/kvStore';
import {
  handleApiError,
  createNotFoundError,
  createBadRequestError,
  createForbiddenError,
  createUnauthorizedError,
} from '@/utils/api/errors';
import { UserRecord, AccessRequestRecord } from '@/types/kv-records';

/**
 * PATCH /api/elections/[id]/access-requests/[requestId]
 *
 * Approves or denies an access request (admin only).
 *
 * When approved, an eligibility record is automatically created for the user,
 * allowing them to vote immediately. Only the election creator can manage
 * access requests.
 *
 * ## Request
 *
 * **Path Parameters:**
 * - `id` - Election UUID
 * - `requestId` - Access request UUID
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` - Required, must be election creator
 *
 * **Body:**
 * ```json
 * {
 *   "action": "approve"
 * }
 * ```
 *
 * | Field | Type | Required | Values |
 * |-------|------|----------|--------|
 * | action | string | Yes | `"approve"` or `"deny"` |
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "message": "Access request approved"
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Invalid action (must be 'approve' or 'deny')
 * - `401` - Unauthorized (missing or invalid token)
 * - `403` - Only election creator can manage access requests
 * - `404` - Election, access request, or user data not found
 * - `500` - Server error
 *
 * @param request - Next.js request object with action in body
 * @param params - Route parameters containing election id and requestId
 * @returns JSON response with success status, or error response (400/401/403/404/500)
 *
 * @example
 * ```typescript
 * // Approve a request
 * const response = await fetch(
 *   '/api/elections/election-uuid/access-requests/request-uuid',
 *   {
 *     method: 'PATCH',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       Authorization: `Bearer ${token}`
 *     },
 *     body: JSON.stringify({ action: 'approve' })
 *   }
 * );
 * ```
 *
 * @see GET /api/elections/[id]/access-requests to view all requests
 * @category API Routes
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: electionId, requestId } = await params;
    const authHeader = request.headers.get('Authorization');

    const user = await authenticateUser(authHeader);

    const { action } = await request.json();
    if (!action || !['approve', 'deny'].includes(action)) {
      return createBadRequestError('Invalid action');
    }

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
      return createForbiddenError('Only election creator can manage access requests');
    }

    const accessRequest = await kv.get<AccessRequestRecord>(`access_request:${requestId}`);
    if (!accessRequest || accessRequest.election_id !== electionId) {
      return createNotFoundError('Access request');
    }

    const updatedRequest: AccessRequestRecord = {
      ...accessRequest,
      status: action === 'approve' ? 'approved' : 'denied',
      decided_by: user.id,
      decided_at: new Date().toISOString(),
    };

    await kv.set(`access_request:${requestId}`, updatedRequest);
    await kv.set(`access_request:${electionId}:${updatedRequest.user_id}`, updatedRequest);

    if (action === 'approve') {
      const userData = await kv.get<UserRecord>(`user:${updatedRequest.user_id}`);
      if (!userData) {
        return createNotFoundError('User data');
      }

      const eligibilityId = crypto.randomUUID();
      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: userData.email,
        user_id: updatedRequest.user_id,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      await kv.set(`eligibility:${electionId}:${userData.email}`, eligibility);
    }

    return Response.json({
      success: true,
      message: `Access request ${action}d`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Update access request error:', error);
    return handleApiError(error, 'update-access-request');
  }
}
