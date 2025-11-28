/**
 * @module types/kv-records
 * @category Types
 *
 * KV Store record types for data stored in the Supabase key-value store.
 *
 * This module contains TypeScript interfaces for all record types stored
 * in the KV store, including user records, eligibility records, access
 * requests, ballot links, and OTP records.
 *
 * **Key Prefix Patterns:**
 * - `user:` - User records
 * - `eligibility:` - Eligibility records
 * - `access_request:` - Access request records
 * - `ballot:link:` - Ballot link records
 * - `otp:` - OTP records
 */

/**
 * User record stored in KV store.
 *
 * Stored with key: `user:{userId}`
 */
export interface UserRecord {
  /** User ID (optional, may be in key) */
  id?: string;
  /** User's email address */
  email: string;
  /** User's full name */
  name?: string;
  /** User's phone number */
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
 *
 * Stored with key: `eligibility:{electionId}:{email}`
 */
export interface EligibilityRecord {
  /** Record ID (optional) */
  id?: string;
  /** Election ID */
  election_id: string;
  /** Voter's email address */
  contact: string;
  /** User ID (if user account exists) */
  user_id?: string | null;
  /** Eligibility status */
  status: 'preapproved' | 'approved' | 'denied';
  /** ISO timestamp when record was created */
  created_at: string;
}

/**
 * Access request record for voters requesting eligibility.
 *
 * Stored with key: `access_request:{electionId}:{userId}`
 */
export interface AccessRequestRecord {
  /** Request ID */
  id: string;
  /** Election ID */
  election_id: string;
  /** User ID of requester */
  user_id: string;
  /** Requester's email address */
  contact: string;
  /** Request status */
  status: 'pending' | 'approved' | 'denied';
  /** ISO timestamp when request was created */
  created_at: string;
  /** ID of admin who decided (if decided) */
  decided_by?: string;
  /** ISO timestamp when request was decided (if decided) */
  decided_at?: string;
}

/**
 * Ballot link record connecting a user to their vote without exposing vote content.
 *
 * This record provides proof of vote (transaction hash) without revealing
 * which candidates were selected. Stored with key: `ballot:link:{electionId}:{userId}`
 */
export interface BallotLinkRecord {
  /** Ballot ID (optional) */
  ballot_id?: string;
  /** Vote status */
  status: 'pending' | 'completed';
  /** ISO timestamp when vote was cast */
  created_at: string;
  /** Blockchain transaction hash (proof of vote) */
  tx_hash?: string;
}
