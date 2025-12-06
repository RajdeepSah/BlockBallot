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
 * - `vote:user:` - User vote flags (indicates if user has voted, no transaction hash)
 * - `vote:tx:` - Transaction hash registry (anonymous, no user ID)
 * - `otp:` - OTP records
 */

/**
 * User record stored in KV store.
 *
 * Contains user profile information. Created during registration and
 * used throughout the application for user identification.
 *
 * Stored with key: `user:{userId}`
 *
 * @example
 * ```typescript
 * const user: UserRecord = {
 *   id: 'user-uuid',
 *   email: 'john@example.com',
 *   name: 'John Doe',
 *   phone: '+1234567890'
 * };
 *
 * // Store in KV
 * await kv.set(`user:${user.id}`, user);
 * ```
 */
export interface UserRecord {
  /** User ID (UUID from Supabase Auth) */
  id?: string;
  /** User's email address (normalized to lowercase) */
  email: string;
  /** User's full name */
  name?: string;
  /** User's phone number (optional) */
  phone?: string;
  /** Preferred 2FA delivery method */
  twofa_method?: 'email' | 'sms' | 'totp' | null;
  /** ISO timestamp when the user record was created */
  created_at?: string;
}

/**
 * OTP record stored in KV store (legacy format).
 *
 * **Note:** This is a simplified legacy format. The complete OTP record
 * with security fields is defined in `@/lib/server/otp` and includes
 * additional fields like `otpHash`, `salt`, `attemptCount`, and `lastSentAt`.
 *
 * This interface is maintained for backward compatibility with older
 * auth routes that use the simplified format.
 *
 * @deprecated Use the complete `OtpRecord` from `@/lib/server/otp` for new code
 *
 * @example
 * ```typescript
 * const legacyOtp: OtpRecord = {
 *   otp: '123456',
 *   expires_at: Date.now() + 5 * 60 * 1000
 * };
 * ```
 *
 * @see {@link module:lib/server/otp.OtpRecord} for the complete OtpRecord type
 */
export interface OtpRecord {
  /** The OTP code (plain text - legacy format only) */
  otp: string;
  /** Unix timestamp when OTP expires */
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
 * User vote flag record indicating a user has voted in an election.
 *
 * This record is used for duplicate vote prevention and checking if a user has voted.
 * It does NOT contain the transaction hash to preserve vote anonymity.
 * Transaction hashes are stored separately in VoteTransactionRecord.
 *
 * Stored with key: `vote:user:{electionId}:{userId}`
 */
export interface BallotLinkRecord {
  /** Vote status */
  status: 'pending' | 'completed';
  /** ISO timestamp when vote was cast */
  created_at: string;
}

/**
 * Transaction hash registry record for anonymous vote verification.
 *
 * This record stores transaction hashes without any user-identifying information
 * to preserve vote anonymity. Transaction hashes cannot be linked back to users
 * through KV store queries.
 *
 * Stored with key: `vote:tx:{electionId}:{txHash}`
 */
export interface VoteTransactionRecord {
  /** ISO timestamp when vote was cast */
  timestamp: string;
  /** Election ID */
  electionId: string;
}
