import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleApiError, createNotFoundError, createBadRequestError } from "@/utils/api/errors";

/**
 * GET /api/elections/[id]
 * 
 * Retrieves a single election by ID.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing election ID
 * @returns JSON response with election data
 * @throws Returns error response if election not found or ID is missing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await params;

    if (!electionId) {
      return createBadRequestError("Election ID is required");
    }

    const supabase = await createClient();
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return createNotFoundError('Election');
    }

    return Response.json(election);
  } catch (error) {
    return handleApiError(error, "get-election");
  }
}

