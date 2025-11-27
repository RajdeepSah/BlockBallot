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
 * Retrieves all access requests for an election (admin only).
 * Only the election creator can view access requests.
 *
 * @param request - Next.js request object with Authorization header
 * @param params - Route parameters containing election id
 * @returns JSON response with array of access requests enriched with user data, or error response
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: electionId } = await params;
    const authHeader = request.headers.get('Authorization');

    // Authenticate user
    const user = await authenticateUser(authHeader);

    // Get election from Supabase database
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
