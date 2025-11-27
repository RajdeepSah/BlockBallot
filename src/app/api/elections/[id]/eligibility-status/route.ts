import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError, createNotFoundError, createUnauthorizedError } from "@/utils/api/errors";
import { UserRecord, EligibilityRecord, AccessRequestRecord } from "@/types/kv-records";

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
    const userData = await kv.get<UserRecord>(`user:${user.id}`);
    if (!userData) {
      return createNotFoundError('User');
    }

    // Check eligibility
    const eligibility = await kv.get<EligibilityRecord>(`eligibility:${electionId}:${userData.email}`);
    
    // Check if already voted
    const ballotLink = await kv.get(`ballot:link:${electionId}:${user.id}`);

    // Check access request
    const accessRequest = await kv.get<AccessRequestRecord>(`access_request:${electionId}:${user.id}`);

    return Response.json({
      eligible: eligibility && (eligibility.status === 'approved' || eligibility.status === 'preapproved'),
      hasVoted: !!ballotLink,
      accessRequest: accessRequest ? {
        status: accessRequest.status,
        id: accessRequest.id
      } : null
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Check eligibility error:', error);
    return handleApiError(error, 'check-eligibility');
  }
}

