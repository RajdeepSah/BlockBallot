import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError, createNotFoundError } from "@/utils/api/errors";

/**
 * GET /api/elections/[id]/access-requests
 * Get all access requests for an election (admin only)
 * Ported from Supabase Edge Function
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify user is the election creator
    if (election.creator_id !== user.id) {
      return Response.json({ error: 'Only election creator can view access requests' }, { status: 403 });
    }

    // Get all access requests for this election
    const allRequests = await kv.getByPrefix(`access_request:${electionId}:`);
    const requests = allRequests.filter(req => req.election_id === electionId);

    // Enrich with user data
    const enrichedRequests = [];
    for (const request of requests) {
      const userData = await kv.get(`user:${request.user_id}`);
      enrichedRequests.push({
        ...request,
        user_name: userData?.name || 'Unknown',
        user_email: userData?.email || request.contact
      });
    }

    return Response.json({ requests: enrichedRequests });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Get access requests error:', error);
    return handleApiError(error, 'get-access-requests');
  }
}

