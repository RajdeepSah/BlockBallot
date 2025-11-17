import { NextRequest } from "next/server";
import { createWritableContract } from "@/utils/blockchain/contract";
import { validateContractAddress, validateVotesArray } from "@/utils/validation";
import { handleApiError, createValidationError } from "@/utils/api/errors";
import type { VoteInput, VoteResponse } from "@/types/blockchain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, position, candidate, votes } = body;

    // Validate contract address
    try {
      validateContractAddress(contractAddress);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    // Support both single vote (position + candidate) and array of votes
    let votesToProcess: VoteInput[] = [];
    
    if (votes && Array.isArray(votes)) {
      // Array of votes format
      votesToProcess = votes;
    } else if (position && candidate) {
      // Single vote format (backward compatible)
      votesToProcess = [{ position, candidate }];
    } else {
      return createValidationError(
        "Either 'position' and 'candidate' or 'votes' array is required."
      );
    }

    // Validate votes array
    try {
      validateVotesArray(votesToProcess);
    } catch (validationError) {
      const message = validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    // Create writable contract instance
    const contract = createWritableContract(contractAddress);

    // Process each vote as a separate transaction
    const transactionHashes: string[] = [];
    
    for (const vote of votesToProcess) {
      console.log(`Submitting vote for position "${vote.position}", candidate "${vote.candidate}"`);
      
      // Send the actual transaction to the blockchain
      const tx = await contract.vote(vote.position, vote.candidate);
      
      // Wait for the transaction to be mined (1 confirmation)
      await tx.wait(1);
      
      console.log(`Vote successful! Tx hash: ${tx.hash}`);
      transactionHashes.push(tx.hash);
    }

    // Return success response with transaction hash(es)
    const response: VoteResponse = {
      success: true,
      txHash: transactionHashes.length === 1 ? transactionHashes[0] : transactionHashes,
      txHashes: transactionHashes,
      votesProcessed: votesToProcess.length
    };

    return Response.json(response);

  } catch (error) {
    return handleApiError(error, "vote");
  }
}