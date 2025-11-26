import { NextRequest } from "next/server";
import { createReadOnlyContract } from "@/utils/blockchain/contract";
import { validateContractAddress } from "@/utils/validation";
import { handleApiError, createValidationError } from "@/utils/api/errors";
import type { VotesResponse, PositionResult, CandidateTally } from "@/types/blockchain";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    let contractAddress = searchParams.get("contractAddress");
    const electionId = searchParams.get("electionId");

    // If no contract address provided, try to look it up by electionId
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

    // Validate contract address format
    try {
      validateContractAddress(contractAddress);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    // Create read-only contract instance
    const contract = createReadOnlyContract(contractAddress);

    // Fetch the list of positions
    const positions: string[] = await contract.getPositionList();

    if (!positions || positions.length === 0) {
      const response: VotesResponse = {
        positions: [],
        contractAddress
      };
      return Response.json(response);
    }

    // Build results structure with positions and their candidates
    const results: PositionResult[] = [];

    // Loop through each position
    for (const positionName of positions) {
      // Get candidates for this position
      const candidates: string[] = await contract.getCandidateList(positionName);
      
      const candidateTallies: CandidateTally[] = [];

      // Loop through each candidate to get their tally
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