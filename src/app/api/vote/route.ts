import { NextRequest } from 'next/server';
import { createWritableContract } from '@/utils/blockchain/contract';
import { validateContractAddress, validateVotesArray } from '@/utils/validation';
import {
  handleApiError,
  createValidationError,
  createNotFoundError,
  createBadRequestError,
  createForbiddenError,
} from '@/utils/api/errors';
import { authenticateUser } from '@/utils/api/auth';
import { createClient } from '@/utils/supabase/server';
import * as kv from '@/utils/supabase/kvStore';
import type { VoteInput, VoteResponse } from '@/types/blockchain';
import { UserRecord, EligibilityRecord, BallotLinkRecord } from '@/types/kv-records';

/**
 * POST /api/vote
 *
 * Casts a vote in an election by submitting votes to the blockchain contract.
 * Implements race condition prevention using timestamped locks.
 *
 * Request body:
 * - electionId: The election ID (required)
 * - contractAddress: The blockchain contract address (required)
 * - votes: Array of vote objects with position and candidate (preferred format)
 * - positions/candidates: Alternative format for backward compatibility
 *
 * Headers:
 * - Authorization: Bearer token (required)
 *
 * @param request - Next.js request object containing vote data
 * @returns JSON response with transaction hash and vote details
 * @throws Returns error response if voting fails, validation fails, or user is ineligible
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { electionId, contractAddress, positions, candidates, votes } = body;

    const authHeader = request.headers.get('Authorization');
    const user = await authenticateUser(authHeader);

    try {
      validateContractAddress(contractAddress);
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    let votesToProcess: VoteInput[] = [];

    if (votes && Array.isArray(votes)) {
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
      votesToProcess = [{ position: positions, candidate: candidates }];
    } else {
      return createValidationError(
        "Either 'position' and 'candidate' or 'votes' array is required."
      );
    }

    try {
      validateVotesArray(votesToProcess);
    } catch (validationError) {
      const message =
        validationError instanceof Error ? validationError.message : String(validationError);
      return createValidationError(message);
    }

    const positionsArray = votesToProcess.map((vote) => vote.position);
    const candidatesArray = votesToProcess.map((vote) => vote.candidate);

    const supabase = await createClient();
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return createNotFoundError('Election');
    }

    const now = new Date();
    const startsAt = new Date(election.starts_at);
    const endsAt = new Date(election.ends_at);

    if (now < startsAt) {
      return createBadRequestError('Election has not started yet');
    }

    if (now > endsAt) {
      return createBadRequestError('Election has ended');
    }

    const userData = await kv.get<UserRecord>(`user:${user.id}`);
    if (!userData) {
      return createNotFoundError('User data');
    }

    const eligibility = await kv.get<EligibilityRecord>(
      `eligibility:${electionId}:${userData.email}`
    );
    if (
      !eligibility ||
      (eligibility.status !== 'approved' && eligibility.status !== 'preapproved')
    ) {
      return createForbiddenError('You are not eligible to vote in this election');
    }

    const voteKeyPrefix = `ballot:link:${electionId}:${user.id}`;
    const finalVoteKey = voteKeyPrefix;
    const existingLocks = await kv.getByPrefix<BallotLinkRecord>(`${voteKeyPrefix}:`);
    const finalVote = await kv.get<BallotLinkRecord>(finalVoteKey);

    if (existingLocks.length > 0 || finalVote) {
      return createBadRequestError('You have already voted in this election');
    }

    const timestamp = Date.now();
    const uniqueSuffix = crypto.randomUUID().substring(0, 8);
    const lockKey = `${voteKeyPrefix}:${timestamp}-${uniqueSuffix}`;

    const pendingLock = {
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    await kv.set(lockKey, pendingLock);

    const verifyFinalVote = await kv.get(finalVoteKey);
    if (verifyFinalVote) {
      await kv.del(lockKey);
      return createBadRequestError('You have already voted in this election');
    }

    let txHash: string;
    try {
      const contract = createWritableContract(contractAddress);
      const tx = await contract.castVotes(positionsArray, candidatesArray);
      await tx.wait(1);
      txHash = tx.hash;
    } catch (error) {
      await kv.del(lockKey);
      throw error;
    }

    const ballotLink = {
      tx_hash: txHash,
      created_at: pendingLock.created_at,
    };

    await kv.set(finalVoteKey, ballotLink);
    await kv.del(lockKey);

    const response: VoteResponse = {
      success: true,
      txHash: txHash,
      votesProcessed: votesToProcess.length,
      timestamp: ballotLink.created_at,
    };

    return Response.json(response);
  } catch (error) {
    return handleApiError(error, 'vote');
  }
}
