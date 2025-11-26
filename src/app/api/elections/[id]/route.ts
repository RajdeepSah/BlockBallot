import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { handleApiError, createNotFoundError } from "@/utils/api/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await params;

    if (!electionId) {
      return Response.json({ error: "Election ID is required" }, { status: 400 });
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

