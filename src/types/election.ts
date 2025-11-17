/**
 * Election type definitions
 * Extends base election structure with blockchain fields
 */

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
  positions: string[];
  contractAddress?: string; // Blockchain contract address (optional for backward compatibility)
}

