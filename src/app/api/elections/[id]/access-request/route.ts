import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError, createNotFoundError, createBadRequestError, createUnauthorizedError } from "@/utils/api/errors";
import { UserRecord, AccessRequestRecord } from "@/types/kv-records";

/**
 * POST /api/elections/[id]/access-request
 * Submits an access request to vote in an election.
 * Creates a pending access request that can be approved/denied by the election creator.
 * 
 * @param request - Next.js request object with Authorization header
 * @param params - Route parameters containing election id
 * @returns JSON response with success status and requestId, or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const userData = await kv.get<UserRecord>(`user:${user.id}`);
    if (!userData) {
      return createNotFoundError('User data');
    }
    
    const existingRequest = await kv.get<AccessRequestRecord>(`access_request:${electionId}:${user.id}`);
    if (existingRequest) {
      return createBadRequestError('Access request already exists');
    }

    const requestId = crypto.randomUUID();
    const accessRequest = {
      id: requestId,
      election_id: electionId,
      user_id: user.id,
      contact: userData.email,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    await kv.set(`access_request:${electionId}:${user.id}`, accessRequest);
    await kv.set(`access_request:${requestId}`, accessRequest);

    return Response.json({
      success: true,
      message: 'Access request submitted',
      requestId
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Access request error:', error);
    return handleApiError(error, 'submit-access-request');
  }
}

