/**
 * KV Store record types
 * Types for data stored in the Supabase KV store
 */

/**
 * User record stored in KV store.
 */
export interface UserRecord {
  id?: string;
  email: string;
  name?: string;
  phone?: string;
}

/**
 * OTP record stored in KV store (legacy format).
 */
export interface OtpRecord {
  otp: string;
  expires_at: number;
}

/**
 * Eligibility record for a voter in an election.
 */
export interface EligibilityRecord {
  id?: string;
  election_id: string;
  contact: string;
  user_id?: string | null;
  status: 'preapproved' | 'approved' | 'denied';
  created_at: string;
}

/**
 * Access request record for voters requesting eligibility.
 */
export interface AccessRequestRecord {
  id: string;
  election_id: string;
  user_id: string;
  contact: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  decided_by?: string;
  decided_at?: string;
}

/**
 * Ballot link record connecting a user to their vote without exposing vote content.
 */
export interface BallotLinkRecord {
  ballot_id?: string;
  status: 'pending' | 'completed';
  created_at: string;
  tx_hash?: string;
}
