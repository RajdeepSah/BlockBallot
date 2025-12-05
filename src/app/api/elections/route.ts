/**
 * @module app/api/elections/route
 * @category API Routes
 */

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
 * This endpoint supports two modes:
 * - **Search by code**: Public search using a 7-digit election code
 * - **Get user's elections**: Returns elections created by the authenticated user
 *
 * ## Request
 *
 * **Query Parameters:**
 * - `code` (optional) - 7-digit alphanumeric election code to search for
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` (optional) - For retrieving user's elections
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "elections": [
 *     {
 *       "id": "election-uuid",
 *       "code": "ABC1234",
 *       "title": "Election Title",
 *       "description": "Election description",
 *       "starts_at": "2024-01-01T00:00:00Z",
 *       "ends_at": "2024-01-31T23:59:59Z",
 *       "creator_id": "user-uuid",
 *       "status": "active",
 *       "positions": [...],
 *       "contract_address": "0x..."
 *     }
 *   ]
 * }
 * ```
 *
 * **Error Responses:**
 * - `500` - Server error
 *
 * @param request - Next.js request object with optional query params and auth header
 * @returns JSON response with elections array (may be empty)
 *
 * @example
 * ```typescript
 * // Search by code
 * const response = await fetch('/api/elections?code=ABC1234');
 *
 * // Get user's elections
 * const response = await fetch('/api/elections', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 * ```
 *
 * @category API Routes
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
