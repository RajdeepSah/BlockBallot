/**
 * @module app/api/elections/[id]/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { handleApiError, createNotFoundError, createBadRequestError } from '@/utils/api/errors';

/**
 * GET /api/elections/[id]
 *
 * Retrieves a single election by ID.
 *
 * Returns the complete election data including positions, candidates,
 * and contract address. No authentication required.
 *
 * ## Request
 *
 * **Path Parameters:**
 * - `id` - Election UUID
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "id": "election-uuid",
 *   "code": "ABC1234",
 *   "title": "Election Title",
 *   "description": "Election description",
 *   "starts_at": "2024-01-01T00:00:00Z",
 *   "ends_at": "2024-01-31T23:59:59Z",
 *   "creator_id": "user-uuid",
 *   "status": "active",
 *   "positions": [
 *     {
 *       "id": "position-uuid",
 *       "name": "President",
 *       "candidates": [...]
 *     }
 *   ],
 *   "contract_address": "0x742d35Cc..."
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing election ID
 * - `404` - Election not found
 * - `500` - Server error
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing election ID
 * @returns JSON response with election data, or error response (400/404/500)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/elections/election-uuid');
 * const election = await response.json();
 * ```
 *
 * @category API Routes
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: electionId } = await params;

    if (!electionId) {
      return createBadRequestError('Election ID is required');
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
    return handleApiError(error, 'get-election');
  }
}
