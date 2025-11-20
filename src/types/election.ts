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
  id: string;
  code: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  time_zone: string;
  creator_id: string;
  created_at: string;
  status: 'draft' | 'active' | 'ended';
  positions: Position[];
  //? indicates optional so that It wont interfere with existing elections, but we should make it required after blockchain is fully integrated  
  contractAddress?: string; 
}

