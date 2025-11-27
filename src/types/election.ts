/**
 * Election type definitions
 * Extends base election structure with blockchain fields
 */

/**
 * Represents a candidate in an election position.
 */
export interface Candidate {
  id: string;
  name: string;
  description: string;
}

/**
 * Represents a position in an election with its candidates and ballot type.
 */
export interface Position {
  id: string;
  name: string;
  description: string;
  ballot_type: 'single' | 'multiple' | 'ranked';
  candidates: Candidate[];
}

/**
 * Represents a complete election with all its metadata and positions.
 */
export interface Election {
  id?: string;
  code: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  creator_id: string;
  status: 'draft' | 'active' | 'ended';
  positions: Position[];
  time_zone: string;
  contract_address?: string;
}

/**
 * Represents a candidate's result in an election with vote counts.
 */
export interface CandidateResult {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  votes: number;
  percentage: string;
}

/**
 * Represents the results for a single position in an election.
 */
export interface PositionResult {
  position_name: string;
  ballot_type: 'single' | 'multiple' | 'ranked';
  candidates: CandidateResult[];
}

/**
 * Represents complete election results with statistics and position breakdowns.
 */
export interface ElectionResults {
  election_id: string;
  election_title: string;
  total_votes: number;
  eligible_voters: number;
  turnout_percentage: string;
  results: Record<string, PositionResult>;
  has_ended: boolean;
}

/**
 * Represents a user's request for access to vote in an election.
 */
export interface AccessRequest {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  user_name: string;
  user_email: string;
  created_at: string;
}

/**
 * Represents a user's eligibility status for an election.
 */
export interface EligibilityStatus {
  eligible: boolean;
  hasVoted: boolean;
  accessRequest?: AccessRequest;
}

/**
 * Response containing all access requests for an election.
 */
export interface AccessRequestsResponse {
  requests: AccessRequest[];
}
