/**
 * API-related type definitions
 * Types for authentication, requests, and responses
 */

// ============================================
// Auth Types
// ============================================

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  requires2FA: boolean;
  accessToken?: string;
  userId?: string;
}

export interface Verify2FAData {
  email: string;
  otp: string;
}

export interface ResendOTPData {
  email: string;
}

// ============================================
// Vote Types
// ============================================

/** Map of position ID to selected candidate ID(s) */
export type VoteSelections = Record<string, string | string[]>;

export interface CastVotePayload {
  electionId: string;
  contractAddress: string;
  votes: Array<{ position: string; candidate: string }>;
}

export interface VoteReceipt {
  receipt: string;
  txHash?: string;
  success?: boolean;
}

// ============================================
// API Response Types
// ============================================

export interface ApiErrorResponse {
  error: string;
  details?: string;
  message?: string;
}

export interface AccessRequestResponse {
  success?: boolean;
  status?: 'pending' | 'approved' | 'denied' | 'already-approved';
  message?: string;
}

export interface UploadEligibilityResponse {
  success: boolean;
  added: number;
  message?: string;
}

