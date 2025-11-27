import { NextRequest } from "next/server";
import { createReadOnlyContract } from "@/utils/blockchain/contract";
import { validateContractAddress } from "@/utils/validation";
import { handleApiError, createValidationError } from "@/utils/api/errors";
import type { VotesResponse, PositionResult, CandidateTally } from "@/types/blockchain";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/get-votes
 * Retrieves all vote tallies from a blockchain contract.
 * Can accept either contractAddress or electionId query parameter.
 * 
 * @param request - Next.js request object with query parameters
 * @returns JSON response with positions, candidates, and vote counts, or error response
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let contractAddress = searchParams.get("contractAddress");
    const electionId = searchParams.get("electionId");

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
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    const contract = createReadOnlyContract(contractAddress);
    const positions: string[] = await contract.getPositionList();

    if (!positions || positions.length === 0) {
      const response: VotesResponse = {
        positions: [],
        contractAddress
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
          votes: tally.toString() // Convert BigInt to string
        });
      }

      results.push({
        name: positionName,
        candidates: candidateTallies
      });
    }

    const response: VotesResponse = {
      positions: results,
      contractAddress
    };

    return Response.json(response);
    
  } catch (error) {
    return handleApiError(error, "get-votes");
  }
}