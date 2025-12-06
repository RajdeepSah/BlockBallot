/**
 * @module app/api/elections/[id]/access-requests/route
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
  createUnauthorizedError,
} from '@/utils/api/errors';
import { UserRecord, AccessRequestRecord } from '@/types/kv-records';

/**
 * GET /api/elections/[id]/access-requests
 *
 * Retrieves all access requests for an election (admin only).
 *
 * Returns all access requests (pending, approved, denied) enriched with
 * user profile data. Only the election creator can access this endpoint.
 *
 * ## Request
 *
 * **Path Parameters:**
 * - `id` - Election UUID
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` - Required, must be election creator
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "requests": [
 *     {
 *       "id": "request-uuid",
 *       "election_id": "election-uuid",
 *       "user_id": "user-uuid",
 *       "contact": "voter@example.com",
 *       "status": "pending",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "user_name": "John Doe",
 *       "user_email": "voter@example.com"
 *     }
 *   ]
 * }
 * ```
 *
 * **Error Responses:**
 * - `401` - Unauthorized (missing or invalid token)
 * - `403` - Only election creator can view access requests
 * - `404` - Election not found
 * - `500` - Server error
 *
 * @param request - Next.js request object with Authorization header
 * @param params - Route parameters containing election id
 * @returns JSON response with access requests array, or error response (401/403/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/elections/election-uuid/access-requests', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 * const { requests } = await response.json();
 * const pending = requests.filter(r => r.status === 'pending');
 * ```
 *
 * @see PATCH /api/elections/[id]/access-requests/[requestId] to approve/deny
 * @category API Routes
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return createForbiddenError('Only election creator can view access requests');
    }

    const allRequests = await kv.getByPrefix<AccessRequestRecord>(`access_request:${electionId}:`);
    const requests = allRequests.filter((req) => req.election_id === electionId);

    const enrichedRequests = [];
    for (const req of requests) {
      const userData = await kv.get<UserRecord>(`user:${req.user_id}`);
      enrichedRequests.push({
        ...req,
        user_name: userData?.name || 'Unknown',
        user_email: userData?.email || req.contact,
      });
    }

    return Response.json({ requests: enrichedRequests });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Get access requests error:', error);
    return handleApiError(error, 'get-access-requests');
  }
}
