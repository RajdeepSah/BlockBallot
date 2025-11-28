import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '@/utils/supabase/info';
import { handleApiError } from '@/utils/api/errors';

/**
 * GET /api/elections
 *
 * Searches for elections by code or returns elections created by the authenticated user.
 *
 * Query parameters:
 * - code (optional): 7-digit election code to search for
 *
 * Headers:
 * - Authorization (optional): Bearer token for authenticated requests
 *
 * @param request - Next.js request object
 * @returns JSON response with elections array
 * @throws Returns error response if request fails
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    const supabase = await createClient();

    if (code) {
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle();

      if (electionError) {
        console.error('Error searching election by code:', electionError);
        return Response.json({ elections: [] });
      }

      return Response.json({
        elections: election ? [election] : [],
      });
    }

    // If token is provided, get user's elections
    if (token) {
      let userId: string | null = null;

      try {
        const supabaseAuth = createSupabaseClient(
          `https://${projectId}.supabase.co`,
          publicAnonKey,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        const {
          data: { user },
          error: authError,
        } = await supabaseAuth.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        }
      } catch (authErr) {
        console.error('Error authenticating user:', authErr);
      }

      if (userId) {
        const { data: createdElections, error: createdError } = await supabase
          .from('elections')
          .select('*')
          .eq('creator_id', userId);

        if (createdError) {
          console.error('Error fetching created elections:', createdError);
          return Response.json({ elections: [] });
        }

        return Response.json({
          elections: createdElections || [],
        });
      }
    }

    return Response.json({ elections: [] });
  } catch (error) {
    return handleApiError(error, 'search-elections');
  }
}
