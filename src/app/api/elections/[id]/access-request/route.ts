import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError, createNotFoundError } from "@/utils/api/errors";

/**
 * POST /api/elections/[id]/access-request
 * Submit an access request to vote in an election
 * Ported from Supabase Edge Function
 */
export async function POST(
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

    // Get user data
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return Response.json({ error: 'User data not found' }, { status: 404 });
    }
    
    // Check for existing request
    const existingRequest = await kv.get(`access_request:${electionId}:${user.id}`);
    if (existingRequest) {
      return Response.json({ 
        error: 'Access request already exists', 
        status: existingRequest.status 
      }, { status: 400 });
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
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Access request error:', error);
    return handleApiError(error, 'submit-access-request');
  }
}

