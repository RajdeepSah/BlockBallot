import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError, createNotFoundError } from "@/utils/api/errors";

/**
 * PATCH /api/elections/[id]/access-requests/[requestId]
 * Approve or deny an access request (admin only)
 * Ported from Supabase Edge Function
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const { id: electionId, requestId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    // Authenticate user
    const user = await authenticateUser(authHeader);
    
    // Parse request body
    const { action } = await request.json();
    if (!action || !['approve', 'deny'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

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
      return Response.json({ error: 'Only election creator can manage access requests' }, { status: 403 });
    }

    // Get access request
    const accessRequest = await kv.get(`access_request:${requestId}`);
    if (!accessRequest || accessRequest.election_id !== electionId) {
      return Response.json({ error: 'Access request not found' }, { status: 404 });
    }

    // Update request status
    accessRequest.status = action === 'approve' ? 'approved' : 'denied';
    accessRequest.decided_by = user.id;
    accessRequest.decided_at = new Date().toISOString();

    await kv.set(`access_request:${requestId}`, accessRequest);
    await kv.set(`access_request:${electionId}:${accessRequest.user_id}`, accessRequest);

    // If approved, add to eligibility
    if (action === 'approve') {
      const userData = await kv.get(`user:${accessRequest.user_id}`);
      if (!userData) {
        return Response.json({ error: 'User data not found' }, { status: 404 });
      }
      
      const eligibilityId = crypto.randomUUID();
      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: userData.email,
        user_id: accessRequest.user_id,
        status: 'approved',
        created_at: new Date().toISOString()
      };

      await kv.set(`eligibility:${electionId}:${userData.email}`, eligibility);
    }

    return Response.json({
      success: true,
      message: `Access request ${action}d`
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Update access request error:', error);
    return handleApiError(error, 'update-access-request');
  }
}

