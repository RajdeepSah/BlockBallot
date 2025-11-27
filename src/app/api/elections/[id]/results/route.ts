import { NextRequest } from 'next/server';

import { authenticateUser } from '@/utils/api/auth';
import { handleApiError, createNotFoundError, createForbiddenError, createBadRequestError } from '@/utils/api/errors';
import { createReadOnlyContract } from '@/utils/blockchain/contract';
import * as kv from '@/utils/supabase/kvStore';
import { getServiceRoleClient } from '@/utils/supabase/clients';

/**
 * Retries a function with exponential backoff to handle rate limiting.
 * 
 * @param fn - The function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if it's a rate limit error
      const err = error as Record<string, unknown>;
      const isRateLimit = (typeof err?.message === 'string' && err.message.includes('Too Many Requests')) || 
                         err?.code === 'BAD_DATA' ||
                         (typeof err?.shortMessage === 'string' && err.shortMessage.includes('missing response'));
      
      if (!isRateLimit || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError || new Error('Failed after retries');
}

/**
 * Adds a delay to avoid rate limiting.
 * 
 * @param ms - Delay duration in milliseconds
 * @returns Promise that resolves after the delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { EligibilityRecord } from "@/types/kv-records";

interface PositionRecord {
  id?: string;
  name: string;
  description?: string;
  ballot_type?: string;
  candidates?: Array<{ id?: string; name: string; description?: string; photo_url?: string | null }>;
}

/**
 * GET /api/elections/[id]/results
 * 
 * Retrieves election results from the blockchain contract.
 * Results are only available to the election creator before the election ends,
 * and publicly available after the election ends.
 * 
 * Headers:
 * - Authorization: Bearer token (optional, required for creator access before end)
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing election ID
 * @returns JSON response with election results including vote counts and percentages
 * @throws Returns error response if election not found, contract missing, or access denied
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: electionId } = await params;
    const supabase = getServiceRoleClient();
    const { data: election, error: electionError } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .single();

    if (electionError || !election) {
      return createNotFoundError('Election');
    }

    const authHeader = request.headers.get('Authorization');
    let requesterId: string | null = null;
    if (authHeader) {
      try {
        const requester = await authenticateUser(authHeader);
        requesterId = requester.id;
      } catch {
        requesterId = null;
      }
    }

    const now = new Date();
    const endsAt = new Date(election.ends_at);
    const hasEnded = now > endsAt;

    if (!hasEnded && requesterId !== election.creator_id) {
      return createForbiddenError('Results not available yet');
    }

    if (!election.contract_address) {
      return createBadRequestError('Election contract address missing');
    }

    const contract = createReadOnlyContract(election.contract_address);
    
    const positionNames: string[] = await retryWithBackoff(
      () => contract.getPositionList() as Promise<string[]>
    );
    
    const electionPositions: PositionRecord[] = Array.isArray(election.positions)
      ? election.positions
      : [];

    const { data: voteKeys, error: voteKeysError } = await supabase
      .from('kv_store_b7b6fbd4')
      .select('key')
      .like('key', `ballot:link:${electionId}:%`);
    
    if (voteKeysError) {
      throw new Error(`Failed to query vote keys: ${voteKeysError.message}`);
    }
    
    const totalVotes = voteKeys?.filter((entry) => {
      if (!entry?.key) return false;
      const key = entry.key;
      const prefix = `ballot:link:${electionId}:`;
      if (!key.startsWith(prefix)) return false;
      const suffix = key.substring(prefix.length);
      return !suffix.includes(':');
    }).length || 0;

    const eligibilityRecords = await kv.getByPrefix<EligibilityRecord>(`eligibility:${electionId}:`);
    const eligibleVoters = eligibilityRecords.filter(
      (record) =>
        record?.election_id === electionId &&
        (record?.status === 'approved' || record?.status === 'preapproved')
    ).length;

    interface FormattedCandidate {
      id: string;
      name: string;
      description: string;
      photo_url: string | null;
      votes: number;
      percentage: string;
    }

    interface FormattedPosition {
      position_name: string;
      ballot_type: string;
      candidates: FormattedCandidate[];
    }

    const formattedResults: Record<string, FormattedPosition> = {};

    for (let positionIndex = 0; positionIndex < positionNames.length; positionIndex++) {
      const positionName = positionNames[positionIndex];
      const positionMeta =
        electionPositions.find((pos) => pos.name === positionName) ||
        electionPositions[positionIndex] ||
        null;
      const positionId = positionMeta?.id || `position-${positionIndex}`;
      
      const candidatesFromContract: string[] = await retryWithBackoff(
        () => contract.getCandidateList(positionName) as Promise<string[]>
      );
      
      if (positionIndex > 0) {
        await delay(200);
      }

      const candidatesPayload = [];
      for (let candidateIndex = 0; candidateIndex < candidatesFromContract.length; candidateIndex++) {
        const candidateName = candidatesFromContract[candidateIndex];
        const candidateMeta =
          positionMeta?.candidates?.find((c) => c.name === candidateName) || null;
        const candidateId = candidateMeta?.id || `${positionId}-candidate-${candidateIndex}`;
        
        const voteCount = await retryWithBackoff(
          () => contract.getVoteCount(positionName, candidateName)
        );
        const voteNumber = Number(voteCount.toString());
        
        if (candidateIndex > 0) {
          await delay(100);
        }

        candidatesPayload.push({
          id: candidateId,
          name: candidateName,
          description: candidateMeta?.description || '',
          photo_url: candidateMeta?.photo_url || null,
          votes: voteNumber,
          percentage: '0.00',
        });
      }

      candidatesPayload.sort((a, b) => b.votes - a.votes);

      formattedResults[positionId] = {
        position_name: positionName,
        ballot_type: positionMeta?.ballot_type || 'single',
        candidates: candidatesPayload,
      };
    }

    const turnoutPercentage =
      eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(2) : '0.00';

    if (totalVotes > 0) {
      Object.values(formattedResults).forEach((position: FormattedPosition) => {
        position.candidates = position.candidates.map((candidate: FormattedCandidate) => ({
          ...candidate,
          percentage: ((candidate.votes / totalVotes) * 100).toFixed(2),
        }));
      });
    }

    return Response.json({
      election_id: electionId,
      election_title: election.title,
      total_votes: totalVotes,
      eligible_voters: eligibleVoters,
      turnout_percentage: turnoutPercentage,
      results: formattedResults,
      has_ended: hasEnded,
    });
  } catch (error) {
    return handleApiError(error, 'election-results');
  }
}

