/**
 * @module types/election
 * @category Types
 *
 * Election type definitions for election data structures.
 *
 * This module contains types for:
 * - Elections and their metadata
 * - Positions and candidates
 * - Election results and statistics
 * - Access requests and eligibility
 */

/**
 * Represents a candidate in an election position.
 */
export interface Candidate {
  /** Unique candidate ID */
  id: string;
  /** Candidate name */
  name: string;
  /** Candidate description or bio */
  description: string;
}

/**
 * Represents a position in an election with its candidates and ballot type.
 */
export interface Position {
  /** Unique position ID */
  id: string;
  /** Position name (e.g., "President", "Vice President") */
  name: string;
  /** Position description */
  description: string;
  /** Ballot type: single choice, multiple choice, or ranked choice */
  ballot_type: 'single' | 'multiple' | 'ranked';
  /** Array of candidates for this position */
  candidates: Candidate[];
}

/**
 * Represents a complete election with all its metadata and positions.
 *
 * This is the main election data structure containing all information
 * needed to display and interact with an election.
 */
export interface Election {
  /** Unique election ID (UUID) */
  id?: string;
  /** 7-digit alphanumeric election code for sharing */
  code: string;
  /** Election title */
  title: string;
  /** Election description */
  description: string;
  /** ISO timestamp when election starts */
  starts_at: string;
  /** ISO timestamp when election ends */
  ends_at: string;
  /** ID of the user who created the election */
  creator_id: string;
  /** Current election status */
  status: 'draft' | 'active' | 'ended';
  /** Array of positions in the election */
  positions: Position[];
  /** Time zone for election timing */
  time_zone: string;
  /** Blockchain contract address (set after deployment) */
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
