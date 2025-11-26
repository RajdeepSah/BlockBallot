import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError } from "@/utils/api/errors";

/**
 * GET /api/elections/[id]/eligibility-status
 * Check if current user is eligible to vote in an election
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
    
    // Get user data from KV store
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check eligibility
    const eligibility = await kv.get(`eligibility:${electionId}:${userData.email}`);
    
    // Check if already voted
    const ballotLink = await kv.get(`ballot:link:${electionId}:${user.id}`);

    // Check access request
    const accessRequest = await kv.get(`access_request:${electionId}:${user.id}`);

    return Response.json({
      eligible: eligibility && (eligibility.status === 'approved' || eligibility.status === 'preapproved'),
      hasVoted: !!ballotLink,
      accessRequest: accessRequest ? {
        status: accessRequest.status,
        id: accessRequest.id
      } : null
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Check eligibility error:', error);
    return handleApiError(error, 'check-eligibility');
  }
}

