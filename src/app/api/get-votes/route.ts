import { NextRequest } from "next/server";
import { createReadOnlyContract } from "@/utils/blockchain/contract";
import { validateContractAddress } from "@/utils/validation";
import { handleApiError, createValidationError } from "@/utils/api/errors";
import type { VotesResponse, PositionResult, CandidateTally } from "@/types/blockchain";

export async function GET(request: NextRequest) {
  try {
    // Get contract address from query parameter
    const { searchParams } = new URL(request.url);
    const contractAddress = searchParams.get("contractAddress");

    if (!contractAddress) {
      return createValidationError("Contract address query parameter is required.");
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
        const tally: bigint = await contract.getTally(positionName, candidateName);
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