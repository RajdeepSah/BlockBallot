import { NextRequest } from "next/server";
import { authenticateUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import * as kv from "@/utils/supabase/kvStore";
import { handleApiError, createNotFoundError, createForbiddenError, createBadRequestError, createUnauthorizedError } from "@/utils/api/errors";

/**
 * POST /api/elections/[id]/eligibility
 * Upload voter eligibility list (admin only)
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

    // Verify user is the election creator
    if (election.creator_id !== user.id) {
      return createForbiddenError('Only election creator can upload eligibility list');
    }

    // Parse request body
    const { voters } = await request.json();
    if (!voters || !Array.isArray(voters)) {
      return createBadRequestError('Invalid voter list');
    }

    let addedCount = 0;
    for (const voterEmail of voters) {
      if (!voterEmail || typeof voterEmail !== 'string') continue;

      const email = voterEmail.trim().toLowerCase();
      const eligibilityId = crypto.randomUUID();
      
      // Check if user exists with this email
      const existingUserId = await kv.get<string>(`user:email:${email}`);

      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: email,
        user_id: existingUserId || null,
        status: 'preapproved',
        created_at: new Date().toISOString()
      };

      await kv.set(`eligibility:${electionId}:${email}`, eligibility);
      addedCount++;
    }

    return Response.json({
      success: true,
      message: `Added ${addedCount} voters to eligibility list`
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Upload eligibility error:', error);
    return handleApiError(error, 'upload-eligibility');
  }
}

