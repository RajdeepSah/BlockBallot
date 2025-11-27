import { NextRequest } from 'next/server';
import { authenticateUser } from '@/utils/api/auth';
import * as kv from '@/utils/supabase/kvStore';
import { handleApiError, createNotFoundError, createUnauthorizedError } from '@/utils/api/errors';
import { UserRecord, EligibilityRecord, AccessRequestRecord } from '@/types/kv-records';

/**
 * GET /api/elections/[id]/eligibility-status
 * Checks if the current user is eligible to vote in an election.
 * Returns eligibility status, vote status, and any pending access requests.
 *
 * @param request - Next.js request object with Authorization header
 * @param params - Route parameters containing election id
 * @returns JSON response with eligible, hasVoted, and accessRequest status, or error response
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
    const ballotLink = await kv.get(`ballot:link:${electionId}:${user.id}`);

    const accessRequest = await kv.get<AccessRequestRecord>(
      `access_request:${electionId}:${user.id}`
    );

    return Response.json({
      eligible:
        eligibility && (eligibility.status === 'approved' || eligibility.status === 'preapproved'),
      hasVoted: !!ballotLink,
      accessRequest: accessRequest
        ? {
            status: accessRequest.status,
            id: accessRequest.id,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Check eligibility error:', error);
    return handleApiError(error, 'check-eligibility');
  }
}
