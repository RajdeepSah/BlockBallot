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

import type { PositionInput } from './blockchain';

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
 *
 * Includes the calculated percentage of votes received relative to
 * total votes cast in the election.
 *
 * @example
 * ```typescript
 * const candidateResult: CandidateResult = {
 *   id: 'candidate-uuid',
 *   name: 'John Doe',
 *   description: 'Experienced leader with 10 years in the field',
 *   photo_url: 'https://example.com/photos/john.jpg',
 *   votes: 150,
 *   percentage: '53.33'
 * };
 * ```
 */
export interface CandidateResult {
  /** Unique candidate ID */
  id: string;
  /** Candidate name */
  name: string;
  /** Candidate description or bio */
  description: string;
  /** URL to candidate photo (null if no photo) */
  photo_url: string | null;
  /** Number of votes received */
  votes: number;
  /** Percentage of total votes as a string (e.g., "53.33") */
  percentage: string;
}

/**
 * Represents the results for a single position in an election.
 *
 * Contains all candidates for the position sorted by vote count
 * (highest first).
 *
 * @example
 * ```typescript
 * const positionResult: PositionResult = {
 *   position_name: 'President',
 *   ballot_type: 'single',
 *   candidates: [
 *     { id: '1', name: 'John Doe', description: '', photo_url: null, votes: 150, percentage: '55.56' },
 *     { id: '2', name: 'Jane Smith', description: '', photo_url: null, votes: 120, percentage: '44.44' }
 *   ]
 * };
 * ```
 */
export interface PositionResult {
  /** Position name */
  position_name: string;
  /** Ballot type used for this position */
  ballot_type: 'single' | 'multiple' | 'ranked';
  /** Candidates sorted by votes (descending) */
  candidates: CandidateResult[];
}

/**
 * Represents complete election results with statistics and position breakdowns.
 *
 * Returned by the `/api/elections/[id]/results` endpoint. Contains
 * comprehensive voting statistics and results for all positions.
 *
 * @example
 * ```typescript
 * const results: ElectionResults = {
 *   election_id: 'election-uuid',
 *   election_title: 'Annual Board Election 2024',
 *   total_votes: 270,
 *   eligible_voters: 500,
 *   turnout_percentage: '54.00',
 *   results: {
 *     'position-1': { position_name: 'President', ballot_type: 'single', candidates: [...] },
 *     'position-2': { position_name: 'Vice President', ballot_type: 'single', candidates: [...] }
 *   },
 *   has_ended: true
 * };
 * ```
 */
export interface ElectionResults {
  /** Election UUID */
  election_id: string;
  /** Election title for display */
  election_title: string;
  /** Total number of votes cast */
  total_votes: number;
  /** Number of eligible voters */
  eligible_voters: number;
  /** Voter turnout as percentage string (e.g., "54.00") */
  turnout_percentage: string;
  /** Results keyed by position ID */
  results: Record<string, PositionResult>;
  /** Whether the election has ended */
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

/**
 * Represents the payload inserted when creating a new election.
 *
 * Uses simplified position input matching contract deployment requirements.
 */
export interface ElectionInsert {
  code: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  creator_id: string;
  status: 'draft' | 'active' | 'ended';
  positions: PositionInput[];
  time_zone: string;
  contract_address: string;
}
