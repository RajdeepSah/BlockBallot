import { NextRequest } from 'next/server';

import { authenticateUser } from '@/utils/api/auth';
import { handleApiError, createNotFoundError } from '@/utils/api/errors';
import { createReadOnlyContract } from '@/utils/blockchain/contract';
import * as kv from '@/utils/supabase/kvStore';
import { getServiceRoleClient } from '@/utils/supabase/clients';

interface PositionRecord {
  id?: string;
  name: string;
  description?: string;
  ballot_type?: string;
  candidates?: Array<{ id?: string; name: string; description?: string; photo_url?: string | null }>;
}

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
      return Response.json({ error: 'Results not available yet' }, { status: 403 });
    }

    if (!election.contract_address) {
      return Response.json({ error: 'Election contract address missing' }, { status: 400 });
    }

    const contract = createReadOnlyContract(election.contract_address);
    const positionNames: string[] = await contract.getPositionList();
    const electionPositions: PositionRecord[] = Array.isArray(election.positions)
      ? election.positions
      : [];

    // Query ballot links directly to get keys and filter out temporary lock keys
    // Final vote keys: ballot:link:${electionId}:${user.id}
    // Lock keys: ballot:link:${electionId}:${user.id}:${timestamp}-${uniqueSuffix}
    const { data: voteKeys, error: voteKeysError } = await supabase
      .from('kv_store_b7b6fbd4')
      .select('key')
      .like('key', `ballot:link:${electionId}:%`);
    
    if (voteKeysError) {
      throw new Error(`Failed to query vote keys: ${voteKeysError.message}`);
    }
    
    // Filter out lock keys (which have additional colons after the user ID)
    // Count only final vote keys that match pattern: ballot:link:${electionId}:${user.id}
    const totalVotes = voteKeys?.filter((entry) => {
      if (!entry?.key) return false;
      const key = entry.key;
      const prefix = `ballot:link:${electionId}:`;
      if (!key.startsWith(prefix)) return false;
      // Remove prefix to get the suffix (should be just user.id for final votes)
      const suffix = key.substring(prefix.length);
      // Final votes have no additional colons, locks have colons followed by timestamp
      return !suffix.includes(':');
    }).length || 0;

    const eligibilityRecords = await kv.getByPrefix(`eligibility:${electionId}:`);
    const eligibleVoters = eligibilityRecords.filter(
      (record) =>
        record?.election_id === electionId &&
        (record?.status === 'approved' || record?.status === 'preapproved')
    ).length;

    const formattedResults: Record<string, any> = {};

    for (let positionIndex = 0; positionIndex < positionNames.length; positionIndex++) {
      const positionName = positionNames[positionIndex];
      const positionMeta =
        electionPositions.find((pos) => pos.name === positionName) ||
        electionPositions[positionIndex] ||
        null;
      const positionId = positionMeta?.id || `position-${positionIndex}`;
      const candidatesFromContract: string[] = await contract.getCandidateList(positionName);

      const candidatesPayload = [];
      for (let candidateIndex = 0; candidateIndex < candidatesFromContract.length; candidateIndex++) {
        const candidateName = candidatesFromContract[candidateIndex];
        const candidateMeta =
          positionMeta?.candidates?.find((c) => c.name === candidateName) || null;
        const candidateId = candidateMeta?.id || `${positionId}-candidate-${candidateIndex}`;
        const voteCount = await contract.getVoteCount(positionName, candidateName);
        const voteNumber = Number(voteCount.toString());

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
      Object.values(formattedResults).forEach((position: any) => {
        position.candidates = position.candidates.map((candidate: any) => ({
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

