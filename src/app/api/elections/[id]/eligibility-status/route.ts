/**
 * @module app/api/elections/[id]/eligibility-status/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';
import { authenticateUser } from '@/utils/api/auth';
import * as kv from '@/utils/supabase/kvStore';
import { handleApiError, createNotFoundError, createUnauthorizedError } from '@/utils/api/errors';
import { UserRecord, EligibilityRecord, AccessRequestRecord } from '@/types/kv-records';
import type { AccessRequest } from '@/types/election';

/**
 * GET /api/elections/[id]/eligibility-status
 *
 * Checks if the current user is eligible to vote in an election.
 *
 * Returns comprehensive status including:
 * - Whether the user is pre-approved or approved to vote
 * - Whether the user has already voted
 * - Status of any pending access request
 *
 * ## Request
 *
 * **Path Parameters:**
 * - `id` - Election UUID
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` - Required
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "eligible": true,
 *   "hasVoted": false,
 *   "accessRequest": {
 *     "status": "pending",
 *     "id": "request-uuid"
 *   }
 * }
 * ```
 *
 * **Error Responses:**
 * - `401` - Unauthorized (missing or invalid token)
 * - `404` - User not found
 * - `500` - Server error
 *
 * @param request - Next.js request object with Authorization header
 * @param params - Route parameters containing election id
 * @returns JSON response with eligibility status, or error response (401/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/elections/election-uuid/eligibility-status', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 * const { eligible, hasVoted, accessRequest } = await response.json();
 * ```
 *
 * @category API Routes
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: electionId } = await params;
    const authHeader = request.headers.get('Authorization');

    // Authenticate user
    const user = await authenticateUser(authHeader);

    // Get user data from KV store
    const userData = await kv.get<UserRecord>(`user:${user.id}`);
    if (!userData) {
      return createNotFoundError('User');
    }

    const eligibility = await kv.get<EligibilityRecord>(
      `eligibility:${electionId}:${userData.email}`
    );
    /**
     * Check if user has voted by looking up vote flag.
     *
     * Uses key pattern `vote:user:{electionId}:{userId}` which stores only a vote flag
     * (no transaction hash) to preserve vote anonymity. The existence of this record
     * indicates the user has voted, but does not reveal their transaction hash.
     */
    const ballotLink = await kv.get(`vote:user:${electionId}:${user.id}`);

    const accessRequestRecord = await kv.get<AccessRequestRecord>(
      `access_request:${electionId}:${user.id}`
    );

    const accessRequest: AccessRequest | null = accessRequestRecord
      ? {
          id: accessRequestRecord.id,
          status: accessRequestRecord.status,
          user_name: userData.name || accessRequestRecord.contact,
          user_email: accessRequestRecord.contact,
          created_at: accessRequestRecord.created_at,
        }
      : null;

    return Response.json({
      eligible:
        eligibility && (eligibility.status === 'approved' || eligibility.status === 'preapproved'),
      hasVoted: !!ballotLink,
      accessRequest,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Check eligibility error:', error);
    return handleApiError(error, 'check-eligibility');
  }
}
