/**
 * API-related type definitions
 * Types for authentication, requests, and responses
 */

/**
 * User registration data.
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * User login credentials.
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Response from login endpoint indicating 2FA requirement.
 */
export interface LoginResponse {
  requires2FA: boolean;
  accessToken?: string;
  userId?: string;
}

/**
 * 2FA verification data.
 */
export interface Verify2FAData {
  email: string;
  otp: string;
}

/**
 * Data for resending OTP code.
 */
export interface ResendOTPData {
  email: string;
}

/**
 * Map of position ID to selected candidate ID(s).
 * For single choice: string (candidate ID)
 * For multiple/ranked choice: string[] (array of candidate IDs)
 */
export type VoteSelections = Record<string, string | string[]>;

/**
 * Payload for casting a vote to the blockchain.
 */
export interface CastVotePayload {
  electionId: string;
  contractAddress: string;
  votes: Array<{ position: string; candidate: string }>;
}

/**
 * Receipt returned after successfully casting a vote.
 */
export interface VoteReceipt {
  receipt: string;
  txHash?: string;
  success?: boolean;
}

/**
 * Standardized API error response.
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  message?: string;
}

/**
 * Response from access request endpoint.
 */
export interface AccessRequestResponse {
  success?: boolean;
  status?: 'pending' | 'approved' | 'denied' | 'already-approved';
  message?: string;
}

/**
 * Response from eligibility upload endpoint.
 */
export interface UploadEligibilityResponse {
  success: boolean;
  added: number;
  message?: string;
}

