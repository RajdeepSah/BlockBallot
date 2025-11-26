import { NextRequest } from "next/server";
import { createWritableContract } from "@/utils/blockchain/contract";
import { validateContractAddress, validateVotesArray } from "@/utils/validation";
import { handleApiError, createValidationError, createNotFoundError } from "@/utils/api/errors";
import { authenticateUser } from "@/utils/api/auth";
import { createClient } from "@/utils/supabase/server";
import * as kv from "@/utils/supabase/kvStore";
import type { VoteInput, VoteResponse } from "@/types/blockchain";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { electionId, contractAddress, positions, candidates, votes } = body;
    
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    const user = await authenticateUser(authHeader);
    console.log(`body: ${JSON.stringify(body)}`);
    console.log(`positions: ${positions}, candidates: ${candidates}, votes: ${votes}`);
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
    } else if (Array.isArray(positions) && Array.isArray(candidates)) {

      votesToProcess = positions.flatMap((positionName: string, idx: number) => {
        const candidateSelection = candidates[idx];

        if (Array.isArray(candidateSelection)) {
          return candidateSelection.map((candidateName: string) => ({
            position: positionName,
            candidate: candidateName,
          }));
        }

        if (candidateSelection) {
          return [{ position: positionName, candidate: candidateSelection }];
        }

        return [];
      });
    } else if (positions && candidates) {
      // Single vote format (backward compatible)
      votesToProcess = [{ position: positions, candidate: candidates }];
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

    // Get election from database to check dates and validate election exists
    const supabase = await createClient();
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return createNotFoundError('Election');
    }

    // Check if election is active
    const now = new Date();
    const startsAt = new Date(election.starts_at);
    const endsAt = new Date(election.ends_at);

    if (now < startsAt) {
      return Response.json({ error: 'Election has not started yet' }, { status: 400 });
    }

    if (now > endsAt) {
      return Response.json({ error: 'Election has ended' }, { status: 400 });
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      return Response.json({ error: 'User data not found' }, { status: 404 });
    }

    // Check eligibility
    const eligibility = await kv.get(`eligibility:${electionId}:${userData.email}`);
    if (!eligibility || (eligibility.status !== 'approved' && eligibility.status !== 'preapproved')) {
      return Response.json({ error: 'You are not eligible to vote in this election' }, { status: 403 });
    }

    // Check if already voted using prefix search to detect any locks or completed votes
    // This prevents race conditions by checking for ANY key matching the pattern
    const voteKeyPrefix = `ballot:link:${electionId}:${user.id}`;
    const finalVoteKey = voteKeyPrefix; // Final key without timestamp
    const existingLocks = await kv.getByPrefix(`${voteKeyPrefix}:`); // Check for timestamped locks
    const finalVote = await kv.get(finalVoteKey); // Check for completed vote
    
    if (existingLocks.length > 0 || finalVote) {
      return Response.json({ error: 'You have already voted in this election' }, { status: 400 });
    }

    // Create unique timestamped lock to prevent race condition
    // Each request gets a unique key, so they can't overwrite each other
    const timestamp = Date.now();
    const uniqueSuffix = crypto.randomUUID().substring(0, 8);
    const lockKey = `${voteKeyPrefix}:${timestamp}-${uniqueSuffix}`;
    
    const pendingLock = {
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Create the unique lock - this cannot be overwritten by concurrent requests
    await kv.set(lockKey, pendingLock);

    // Double-check: verify no other request completed voting while we were creating the lock
    const verifyFinalVote = await kv.get(finalVoteKey);
    if (verifyFinalVote) {
      // Another request completed voting between our prefix check and lock creation
      await kv.del(lockKey); // Clean up our lock
      return Response.json({ error: 'You have already voted in this election' }, { status: 400 });
    }

    // Lock acquired - proceed with blockchain transaction
    let txHash: string;
    try {
      const contract = createWritableContract(contractAddress);
      const tx = await contract.castVotes(positions, candidates);
      await tx.wait(1);
      txHash = tx.hash;
    } catch (error) {
      // If blockchain transaction fails, remove the lock so user can retry
      await kv.del(lockKey);
      throw error;
    }

    // Create final vote record (without timestamp) and clean up temporary lock
    const ballotLink = {
      tx_hash: txHash,
      created_at: pendingLock.created_at
    };

    await kv.set(finalVoteKey, ballotLink);
    await kv.del(lockKey); // Remove temporary lock key

    // Return success response with transaction hash
    const response: VoteResponse = {
      success: true,
      txHash: txHash,
      votesProcessed: votesToProcess.length,
      timestamp: ballotLink.created_at
    };

    return Response.json(response);

  } catch (error) {
    return handleApiError(error, "vote");
  }
}