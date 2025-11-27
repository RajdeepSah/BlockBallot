/**
 * KV Store record types
 * Types for data stored in the Supabase KV store
 */

// ============================================
// User Records
// ============================================

export interface UserRecord {
  id?: string;
  email: string;
  name?: string;
  phone?: string;
}

// ============================================
// OTP Records
// ============================================

export interface OtpRecord {
  otp: string;
  expires_at: number;
}

// ============================================
// Eligibility Records
// ============================================

export interface EligibilityRecord {
  id?: string;
  election_id: string;
  contact: string;
  user_id?: string | null;
  status: 'preapproved' | 'approved' | 'denied';
  created_at: string;
}

// ============================================
// Access Request Records
// ============================================

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

// ============================================
// Ballot / Vote Records
// ============================================

export interface BallotLinkRecord {
  ballot_id?: string;
  status: 'pending' | 'completed';
  created_at: string;
  tx_hash?: string;
}

