/**
 * @module types/api
 * @category Types
 *
 * API-related type definitions for authentication, requests, and responses.
 *
 * This module contains TypeScript interfaces and types used throughout the
 * API layer for request/response data structures, authentication payloads,
 * and error responses.
 */

/**
 * User registration data for creating a new account.
 *
 * @example
 * ```typescript
 * const registrationData: RegisterData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'SecurePassword123!',
 *   phone: '+1234567890' // Optional
 * };
 * ```
 */
export interface RegisterData {
  /** User's full name */
  name: string;
  /** User's email address (must be unique) */
  email: string;
  /** User's password (will be hashed server-side) */
  password: string;
  /** Optional phone number */
  phone?: string;
}

/**
 * User login credentials for authentication.
 *
 * @example
 * ```typescript
 * const loginData: LoginData = {
 *   email: 'john@example.com',
 *   password: 'SecurePassword123!'
 * };
 * ```
 */
export interface LoginData {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Response from login endpoint indicating 2FA requirement.
 *
 * If `requires2FA` is `true`, the user must complete 2FA verification.
 * If `false`, authentication is complete and tokens are provided.
 *
 * @example
 * ```typescript
 * const response: LoginResponse = await api.login(credentials);
 * if (response.requires2FA) {
 *   // Prompt for OTP
 * } else {
 *   // Already authenticated, tokens available
 *   console.log('Access token:', response.accessToken);
 * }
 * ```
 */
export interface LoginResponse {
  /** Whether 2FA verification is required */
  requires2FA: boolean;
  /** Access token (only present if 2FA is disabled) */
  accessToken?: string;
  /** User ID (only present if 2FA is disabled) */
  userId?: string;
}

/**
 * 2FA verification data for completing authentication.
 *
 * @example
 * ```typescript
 * const verifyData: Verify2FAData = {
 *   email: 'john@example.com',
 *   otp: '123456' // 6-digit code from email
 * };
 * ```
 */
export interface Verify2FAData {
  /** User's email address (must match login email) */
  email: string;
  /** 6-digit OTP code from email */
  otp: string;
}

/**
 * Data for resending OTP code to user's email.
 *
 * @example
 * ```typescript
 * const resendData: ResendOTPData = {
 *   email: 'john@example.com'
 * };
 * ```
 */
export interface ResendOTPData {
  /** User's email address to send OTP to */
  email: string;
}

/**
 * Map of position ID to selected candidate ID(s).
 *
 * Supports different ballot types:
 * - **Single choice**: `string` (single candidate ID)
 * - **Multiple/ranked choice**: `string[]` (array of candidate IDs)
 *
 * @example
 * ```typescript
 * // Single choice vote
 * const selections: VoteSelections = {
 *   'position-1': 'candidate-1',
 *   'position-2': 'candidate-2'
 * };
 *
 * // Multiple choice vote
 * const multiSelections: VoteSelections = {
 *   'position-1': ['candidate-1', 'candidate-2'],
 *   'position-2': 'candidate-3'
 * };
 * ```
 */
export type VoteSelections = Record<string, string | string[]>;

/**
 * Payload for casting a vote to the blockchain.
 *
 * @example
 * ```typescript
 * const payload: CastVotePayload = {
 *   electionId: 'election-123',
 *   contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   votes: [
 *     { position: 'President', candidate: 'John Doe' },
 *     { position: 'Vice President', candidate: 'Jane Smith' }
 *   ]
 * };
 * ```
 */
export interface CastVotePayload {
  /** Election ID */
  electionId: string;
  /** Blockchain contract address */
  contractAddress: string;
  /** Array of vote objects with position and candidate names */
  votes: Array<{ position: string; candidate: string }>;
}

/**
 * Receipt returned after successfully casting a vote.
 *
 * Contains the transaction hash which serves as proof of vote.
 *
 * @example
 * ```typescript
 * const receipt: VoteReceipt = await api.castVote(...);
 * console.log('Vote transaction:', receipt.txHash);
 * console.log('Receipt ID:', receipt.receipt);
 * ```
 */
export interface VoteReceipt {
  /** Receipt ID or transaction hash */
  receipt: string;
  /** Blockchain transaction hash (proof of vote) */
  txHash?: string;
  /** Whether the vote was successfully cast */
  success?: boolean;
}

/**
 * Standardized API error response structure.
 *
 * All API errors follow this format for consistency.
 *
 * @example
 * ```typescript
 * // Error response from API
 * const error: ApiErrorResponse = {
 *   error: 'Validation failed',
 *   details: 'Email is required',
 *   message: 'Validation failed' // Backward compatibility
 * };
 * ```
 */
export interface ApiErrorResponse {
  /** Error message describing what went wrong */
  error: string;
  /** Optional additional error details (stack trace, error code, etc.) */
  details?: string;
  /** Backward compatibility field (same as `error`) */
  message?: string;
}

/**
 * Response from access request endpoint.
 *
 * Returned when a user requests access to vote in an election.
 *
 * @example
 * ```typescript
 * const response: AccessRequestResponse = await api.requestAccess(electionId, token);
 * console.log('Request status:', response.status); // 'pending', 'approved', etc.
 * ```
 */
export interface AccessRequestResponse {
  /** Whether the request was successfully created */
  success?: boolean;
  /** Status of the access request */
  status?: 'pending' | 'approved' | 'denied' | 'already-approved';
  /** Optional status message */
  message?: string;
}

/**
 * Response from eligibility upload endpoint.
 *
 * Returned when an admin uploads a list of eligible voters.
 *
 * @example
 * ```typescript
 * const response: UploadEligibilityResponse = await api.uploadEligibility(
 *   electionId,
 *   ['voter1@example.com', 'voter2@example.com'],
 *   token
 * );
 * console.log(`Added ${response.added} eligible voters`);
 * ```
 */
export interface UploadEligibilityResponse {
  /** Whether the upload was successful */
  success: boolean;
  /** Number of voters added to eligibility list */
  added: number;
  /** Optional status message */
  message?: string;
}
