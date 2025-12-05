/**
 * @module app/api/get-votes/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';
import { createReadOnlyContract } from '@/utils/blockchain/contract';
import { validateContractAddress } from '@/utils/validation';
import { handleApiError, createValidationError } from '@/utils/api/errors';
import type { VotesResponse, PositionResult, CandidateTally } from '@/types/blockchain';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/get-votes
 *
 * Retrieves all vote tallies from a blockchain contract.
 *
 * Queries the blockchain smart contract directly to get raw vote counts
 * for all positions and candidates. Can look up by contract address or
 * election ID.
 *
 * ## Request
 *
 * **Query Parameters:**
 * - `contractAddress` - Ethereum contract address (0x...)
 * - `electionId` - Election UUID (alternative to contractAddress)
 *
 * At least one of `contractAddress` or `electionId` is required.
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "positions": [
 *     {
 *       "name": "President",
 *       "candidates": [
 *         { "name": "John Doe", "votes": "80" },
 *         { "name": "Jane Smith", "votes": "70" }
 *       ]
 *     }
 *   ],
 *   "contractAddress": "0x742d35Cc..."
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Missing parameters or invalid contract address
 * - `500` - Server error or blockchain query failure
 *
 * @param request - Next.js request object with query parameters
 * @returns JSON response with positions and vote counts, or error response (400/500)
 *
 * @example
 * ```typescript
 * // By contract address
 * const response = await fetch('/api/get-votes?contractAddress=0x742d35Cc...');
 *
 * // By election ID
 * const response = await fetch('/api/get-votes?electionId=election-uuid');
 * ```
 *
 * @see GET /api/elections/[id]/results for formatted results with percentages
 * @category API Routes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let contractAddress = searchParams.get('contractAddress');
    const electionId = searchParams.get('electionId');

    if (!contractAddress && electionId) {
      const supabase = await createClient();
      const { data: election, error: electionError } = await supabase
        .from('elections')
        .select('contract_address')
        .eq('id', electionId)
        .single();

      if (electionError || !election?.contract_address) {
        return createValidationError(
          `Election not found or contract address not available for election ID: ${electionId}`
        );
      }

      contractAddress = election.contract_address;
    }

    if (!contractAddress) {
      return createValidationError(
        "Either 'contractAddress' or 'electionId' query parameter is required."
      );
    }

    try {
      validateContractAddress(contractAddress);
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    const contract = createReadOnlyContract(contractAddress);
    const positions: string[] = await contract.getPositionList();

    if (!positions || positions.length === 0) {
      const response: VotesResponse = {
        positions: [],
        contractAddress,
      };
      return Response.json(response);
    }

    const results: PositionResult[] = [];

    for (const positionName of positions) {
      const candidates: string[] = await contract.getCandidateList(positionName);

      const candidateTallies: CandidateTally[] = [];

      for (const candidateName of candidates) {
        const tally: bigint = await contract.getVoteCount(positionName, candidateName);
        candidateTallies.push({
          name: candidateName,
          votes: tally.toString(), // Convert BigInt to string
        });
      }

      results.push({
        name: positionName,
        candidates: candidateTallies,
      });
    }

    const response: VotesResponse = {
      positions: results,
      contractAddress,
    };

    return Response.json(response);
  } catch (error) {
    return handleApiError(error, 'get-votes');
  }
}
