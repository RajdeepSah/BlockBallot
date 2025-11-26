import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "@/utils/supabase/info";
import { handleApiError } from "@/utils/api/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    // Create Supabase client - use server client for database queries
    const supabase = await createClient();

    // If code is provided, search by code
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
        elections: election ? [election] : [] 
      });
    }

    // If token is provided, get user's elections
    if (token) {
      let userId: string | null = null;
      
      try {
        // Create a Supabase client with the token to authenticate
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

        // Get user from token
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
        if (!authError && user) {
          userId = user.id;
        }
      } catch (authErr) {
        console.error('Error authenticating user:', authErr);
      }

      if (userId) {
        // Get elections created by user
        const { data: createdElections, error: createdError } = await supabase
          .from('elections')
          .select('*')
          .eq('creator_id', userId);

        if (createdError) {
          console.error('Error fetching created elections:', createdError);
          return Response.json({ elections: [] });
        }

        // Note: Eligibility-based elections would need to query an eligibility table
        // For now, we return only created elections
        return Response.json({ 
          elections: createdElections || [] 
        });
      }
    }

    // No code and no valid token - return empty array
    return Response.json({ elections: [] });
  } catch (error) {
    return handleApiError(error, "search-elections");
  }
}

