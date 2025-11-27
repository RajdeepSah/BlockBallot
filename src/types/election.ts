/**
 * Election type definitions
 * Extends base election structure with blockchain fields
 */

// ============================================
// Base Election Types
// ============================================

export interface Candidate {
  id: string;
  name: string;
  description: string;
}

export interface Position {
  id: string;
  name: string;
  description: string;
  ballot_type: 'single' | 'multiple' | 'ranked';
  candidates: Candidate[];
}

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

// ============================================
// Election Results Types
// ============================================

export interface CandidateResult {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  votes: number;
  percentage: string;
}

export interface PositionResult {
  position_name: string;
  ballot_type: 'single' | 'multiple' | 'ranked';
  candidates: CandidateResult[];
}

export interface ElectionResults {
  election_id: string;
  election_title: string;
  total_votes: number;
  eligible_voters: number;
  turnout_percentage: string;
  results: Record<string, PositionResult>;
  has_ended: boolean;
}

// ============================================
// Eligibility & Access Types
// ============================================

export interface AccessRequest {
  id: string;
  status: 'pending' | 'approved' | 'denied';
  user_name: string;
  user_email: string;
  created_at: string;
}

export interface EligibilityStatus {
  eligible: boolean;
  hasVoted: boolean;
  accessRequest?: AccessRequest;
}

export interface AccessRequestsResponse {
  requests: AccessRequest[];
}

