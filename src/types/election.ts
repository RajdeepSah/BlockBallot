/**
 * Election type definitions
 * Extends base election structure with blockchain fields
 */

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

