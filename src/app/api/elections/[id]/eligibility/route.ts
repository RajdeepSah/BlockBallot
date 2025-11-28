import { NextRequest } from 'next/server';
import { authenticateUser } from '@/utils/api/auth';
import { createClient } from '@/utils/supabase/server';
import * as kv from '@/utils/supabase/kvStore';
import {
  handleApiError,
  createNotFoundError,
  createForbiddenError,
  createBadRequestError,
  createUnauthorizedError,
} from '@/utils/api/errors';

/**
 * POST /api/elections/[id]/eligibility
 *
 * Uploads a voter eligibility list for an election.
 * Only the election creator can upload eligibility lists.
 *
 * Request body:
 * - voters: Array of email addresses to add to eligibility list (required)
 *
 * Headers:
 * - Authorization: Bearer token (required)
 *
 * @param request - Next.js request object containing voter list
 * @param params - Route parameters containing election ID
 * @returns JSON response with success status and count of added voters
 * @throws Returns error response if election not found, user is not creator, or validation fails
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (election.creator_id !== user.id) {
      return createForbiddenError('Only election creator can upload eligibility list');
    }

    const { voters } = await request.json();
    if (!voters || !Array.isArray(voters)) {
      return createBadRequestError('Invalid voter list');
    }

    let addedCount = 0;
    for (const voterEmail of voters) {
      if (!voterEmail || typeof voterEmail !== 'string') continue;

      const email = voterEmail.trim().toLowerCase();
      const eligibilityId = crypto.randomUUID();

      const existingUserId = await kv.get<string>(`user:email:${email}`);

      const eligibility = {
        id: eligibilityId,
        election_id: electionId,
        contact: email,
        user_id: existingUserId || null,
        status: 'preapproved',
        created_at: new Date().toISOString(),
      };

      await kv.set(`eligibility:${electionId}:${email}`, eligibility);
      addedCount++;
    }

    return Response.json({
      success: true,
      message: `Added ${addedCount} voters to eligibility list`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createUnauthorizedError();
    }
    console.error('Upload eligibility error:', error);
    return handleApiError(error, 'upload-eligibility');
  }
}
