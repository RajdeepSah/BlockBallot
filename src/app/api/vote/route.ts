/**
 * @module app/api/vote/route
 * @category API Routes
 */

import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
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
import { UserRecord, EligibilityRecord, BallotLinkRecord, VoteTransactionRecord } from '@/types/kv-records';

/**
 * POST /api/vote
 *
 * Casts a vote in an election by submitting votes to the blockchain contract.
 *
 * This endpoint handles the complete voting flow:
 * 1. Validates user authentication and eligibility
 * 2. Validates vote data and contract address
 * 3. Checks election timing (must be within start/end dates)
 * 4. Prevents duplicate votes using timestamped locks
 * 5. Submits votes to the blockchain smart contract
 * 6. Stores user vote flag and transaction hash separately (privacy-preserving design)
 *
 * **Race Condition Prevention:**
 * Uses timestamped locks to prevent concurrent vote submissions. A temporary
 * lock is created before voting, and removed after successful submission or on error.
 *
 * ## Request
 *
 * **Headers:**
 * - `Authorization: Bearer <token>` - Required, user authentication token
 *
 * **Body (Preferred Format):**
 * ```json
 * {
 *   "electionId": "election-uuid",
 *   "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   "votes": [
 *     { "position": "President", "candidate": "John Doe" },
 *     { "position": "Vice President", "candidate": "Jane Smith" }
 *   ]
 * }
 * ```
 *
 * **Body (Legacy Format - for backward compatibility):**
 * ```json
 * {
 *   "electionId": "election-uuid",
 *   "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
 *   "positions": ["President", "Vice President"],
 *   "candidates": ["John Doe", "Jane Smith"]
 * }
 * ```
 *
 * ## Response
 *
 * **Success (200):**
 * ```json
 * {
 *   "success": true,
 *   "txHash": "0xabc123...",
 *   "votesProcessed": 2,
 *   "timestamp": "2024-01-01T12:00:00.000Z"
 * }
 * ```
 *
 * **Error Responses:**
 * - `400` - Validation error, election timing invalid, or user already voted
 * - `401` - Unauthorized (missing or invalid token)
 * - `403` - User not eligible to vote
 * - `404` - Election or user data not found
 * - `500` - Server error or blockchain transaction failure
 *
 * @param request - Next.js request object containing vote data
 * @returns JSON response with transaction hash and vote details, or error response (400/401/403/404/500) if voting fails
 *
 * @example
 * ```typescript
 * // Client-side usage
 * const response = await fetch('/api/vote', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Authorization': `Bearer ${token}`
 *   },
 *   body: JSON.stringify({
 *     electionId: 'election-123',
 *     contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *     votes: [
 *       { position: 'President', candidate: 'John Doe' }
 *     ]
 *   })
 * });
 *
 * const result = await response.json();
 * console.log('Vote cast! Transaction:', result.txHash);
 * ```
 *
 * @see {@link createWritableContract} for contract instance creation
 * @see {@link validateVotesArray} for vote validation
 * @category API Routes
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

    const voteKeyPrefix = `vote:user:${electionId}:${user.id}`;
    const finalVoteKey = voteKeyPrefix;
    const existingLocks = await kv.getByPrefix<BallotLinkRecord>(`${voteKeyPrefix}:`);
    const finalVote = await kv.get<BallotLinkRecord>(finalVoteKey);

    if (existingLocks.length > 0 || finalVote) {
      return createBadRequestError('You have already voted in this election');
    }

    const timestamp = Date.now();
    const uniqueSuffix = crypto.randomUUID().substring(0, 8);
    const lockKey = `${voteKeyPrefix}:${timestamp}-${uniqueSuffix}`;

    /**
     * Temporary lock record to prevent race conditions during vote submission.
     *
     * @type {BallotLinkRecord}
     */
    const pendingLock: BallotLinkRecord = {
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

    /**
     * Store user vote flag for duplicate prevention.
     *
     * This record indicates the user has voted but does NOT contain the transaction hash
     * to preserve vote anonymity. The key pattern `vote:user:{electionId}:{userId}` allows
     * checking if a specific user has voted, but cannot be used to link to their transaction.
     *
     * @type {BallotLinkRecord}
     */
    const userVoteFlag: BallotLinkRecord = {
      status: 'completed',
      created_at: pendingLock.created_at,
    };

    await kv.set(finalVoteKey, userVoteFlag);

    /**
     * Store transaction hash separately in anonymous registry.
     *
     * Transaction hashes are stored at `vote:tx:{electionId}:{txHash}` with NO user ID
     * in the key or value. This breaks the association between users and their transaction
     * hashes, preserving vote anonymity while still allowing transaction verification.
     *
     * @type {VoteTransactionRecord}
     */
    const txRegistryKey = `vote:tx:${electionId}:${txHash}`;
    const txRecord: VoteTransactionRecord = {
      timestamp: pendingLock.created_at,
      electionId: electionId,
    };
    await kv.set(txRegistryKey, txRecord);

    await kv.del(lockKey);

    const response: VoteResponse = {
      success: true,
      txHash: txHash,
      votesProcessed: votesToProcess.length,
      timestamp: userVoteFlag.created_at,
    };

    return Response.json(response);
  } catch (error) {
    return handleApiError(error, 'vote');
  }
}
