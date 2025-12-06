/**
 * @module utils/api
 * @category API Client
 *
 * Client-side API wrapper utilities for interacting with BlockBallot backend services.
 *
 * This module provides a centralized API client that handles:
 * - Authentication token management and automatic refresh
 * - Request/response formatting
 * - Error handling and standardized error responses
 * - Type-safe API method wrappers for all backend endpoints
 *
 * ## Usage
 *
 * ```typescript
 * import { api } from '@/utils/api';
 *
 * // Register a new user
 * await api.register({ name: 'John', email: 'john@example.com', password: 'secure' });
 *
 * // Login and handle 2FA
 * const loginResponse = await api.login({ email: 'john@example.com', password: 'secure' });
 * ```
 */

import { projectId, publicAnonKey } from './supabase/info';
import { getValidAccessToken } from './auth/tokenRefresh';
import { authenticatedFetch, handleUnauthorizedError } from './auth/errorHandler';
import { RegisterData, LoginData, Verify2FAData, ResendOTPData, VoteSelections } from '@/types/api';
import { Election, Candidate } from '@/types/election';

/**
 * Base URL for Supabase Edge Function calls.
 *
 * @deprecated Most API calls now use Next.js API routes (`/api/...`) via `authenticatedFetch`.
 * This constant is only used by `apiCall` for legacy edge function calls.
 *
 * @internal
 */
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b7b6fbd4`;

/**
 * Options for API call function.
 * @internal
 */
interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

/**
 * Makes an API call to the Supabase Edge Function.
 *
 * @deprecated Most API calls should use `authenticatedFetch` with Next.js API routes instead.
 * This function is retained for backward compatibility with specific edge function endpoints.
 *
 * @param endpoint - API endpoint path (e.g., `/auth/me`)
 * @param options - Request configuration options
 * @param options.method - HTTP method (default: `'GET'`)
 * @param options.body - Request body to send (will be JSON stringified)
 * @param options.token - Optional authentication token (if not provided, uses public anon key)
 * @returns Promise resolving to API response data
 * @throws {Error} If API request fails or returns non-OK status
 *
 * @example
 * ```typescript
 * // Make an authenticated API call
 * const data = await apiCall('/auth/me', {
 *   method: 'GET',
 *   token: 'your-token-here'
 * });
 * ```
 *
 * @see {@link api} for higher-level API methods
 * @category API Client
 */
export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

/**
 * Main API client object providing type-safe methods for all backend endpoints.
 *
 * All methods automatically handle:
 * - Token refresh when tokens expire
 * - Error formatting and handling
 * - Request/response serialization
 *
 * @category API Client
 */
export const api = {
  /**
   * Registers a new user account in the system.
   *
   * Creates a new user with email/password authentication. After registration,
   * the user must complete email verification and 2FA setup.
   *
   * @param data - User registration data
   * @param data.name - User's full name
   * @param data.email - User's email address (must be unique)
   * @param data.password - User's password (will be hashed server-side)
   * @param data.phone - Optional phone number
   * @returns Promise resolving to registration response with user ID
   * @throws {Error} If registration fails (email already exists, invalid data, etc.)
   *
   * @example
   * ```typescript
   * try {
   *   const result = await api.register({
   *     name: 'John Doe',
   *     email: 'john@example.com',
   *     password: 'SecurePassword123!'
   *   });
   *   console.log('User registered:', result.userId);
   * } catch (error) {
   *   console.error('Registration failed:', error.message);
   * }
   * ```
   *
   * @see {@link api.login} for logging in after registration
   * @category API Client
   */
  register: async (data: RegisterData) => {
    const response = await authenticatedFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }
    return await response.json();
  },
  /**
   * Logs in a user with email and password.
   *
   * Authenticates the user and initiates the 2FA flow. The response indicates
   * whether 2FA is required. If `requires2FA` is true, use {@link api.verify2FA}
   * to complete authentication.
   *
   * @param data - User login credentials
   * @param data.email - User's email address
   * @param data.password - User's password
   * @returns Promise resolving to login response object with `requires2FA: boolean` and optional `accessToken`/`userId` if 2FA is disabled
   * @throws {Error} If login fails (invalid credentials, user not found, etc.)
   *
   * @example
   * ```typescript
   * const response = await api.login({
   *   email: 'john@example.com',
   *   password: 'SecurePassword123!'
   * });
   *
   * if (response.requires2FA) {
   *   // Prompt user for OTP code
   *   const otp = await promptForOTP();
   *   await api.verify2FA({ email: 'john@example.com', otp });
   * }
   * ```
   *
   * @see {@link api.verify2FA} to complete 2FA authentication
   * @see {@link api.resendOTP} to resend OTP code
   * @category API Client
   */
  login: async (data: LoginData) => {
    const response = await authenticatedFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return await response.json();
  },
  /**
   * Verifies 2FA OTP code to complete user authentication.
   *
   * After successful login, this method completes the authentication process
   * by verifying the one-time password sent to the user's email. On success,
   * authentication tokens are stored in localStorage.
   *
   * @param data - 2FA verification data
   * @param data.email - User's email address (must match login email)
   * @param data.otp - 6-digit OTP code from email
   * @returns Promise resolving to verification response with access and refresh tokens
   * @throws {Error} If verification fails (invalid OTP, expired OTP, too many attempts)
   *
   * @example
   * ```typescript
   * // After receiving OTP via email
   * const result = await api.verify2FA({
   *   email: 'john@example.com',
   *   otp: '123456'
   * });
   *
   * // Tokens are now stored in localStorage
   * console.log('Authenticated!', result.userId);
   * ```
   *
   * @see {@link api.login} to initiate login flow
   * @see {@link api.resendOTP} to request a new OTP code
   * @category API Client
   */
  verify2FA: async (data: Verify2FAData) => {
    const response = await authenticatedFetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '2FA verification failed');
    }
    return await response.json();
  },
  /**
   * Resends OTP code to user's email.
   *
   * Requests a new OTP code when the user hasn't received one or the previous
   * code has expired. Rate limiting applies to prevent abuse.
   *
   * @param data - Resend OTP request data
   * @param data.email - User's email address
   * @returns Promise resolving to resend confirmation
   * @throws {Error} If resend fails (rate limited, invalid email, etc.)
   *
   * @example
   * ```typescript
   * // User didn't receive OTP or it expired
   * await api.resendOTP({ email: 'john@example.com' });
   * console.log('New OTP sent to email');
   * ```
   *
   * @see {@link api.verify2FA} to verify the new OTP code
   * @category API Client
   */
  resendOTP: async (data: ResendOTPData) => {
    const response = await authenticatedFetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend OTP');
    }
    return await response.json();
  },
  /**
   * Gets current authenticated user information.
   *
   * Retrieves the profile and account information for the currently authenticated user.
   * The token is automatically refreshed if expired.
   *
   * @param token - Authentication token (optional, will use stored token if not provided)
   * @returns Promise resolving to user data object with id, email, name, etc.
   * @throws {Error} If request fails or user is not authenticated
   *
   * @example
   * ```typescript
   * const user = await api.getMe(token);
   * console.log('Current user:', user.name, user.email);
   * ```
   *
   * @category API Client
   */
  getMe: (token: string) => apiCall('/auth/me', { token }),

  /**
   * Retrieves a single election by ID.
   *
   * Fetches complete election data including positions, candidates, metadata,
   * and contract address. Requires authentication.
   *
   * @param id - Election ID (UUID)
   * @returns Promise resolving to {@link Election} object with all election data
   * @throws {Error} If election not found, request fails, or user is not authenticated
   *
   * @example
   * ```typescript
   * const election = await api.getElection('election-id-123');
   * console.log('Election:', election.title);
   * console.log('Positions:', election.positions.length);
   * ```
   *
   * @see {@link api.searchElections} to search for elections by code
   * @category API Client
   */
  getElection: async (id: string) => {
    const response = await authenticatedFetch(`/api/elections/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get election');
    }
    return await response.json();
  },
  /**
   * Searches for elections by code or gets user's elections.
   *
   * Can be used in two ways:
   * - **Search by code**: Provide a 7-digit election code to find a specific election
   * - **Get user's elections**: Provide a token to get all elections the user has access to
   *
   * @param code - Optional 7-digit alphanumeric election code to search for
   * @param token - Optional authentication token (if provided, returns user's elections instead of searching)
   * @returns Promise resolving to array of {@link Election} objects
   * @throws {Error} If search fails or user is not authenticated (when using token)
   *
   * @example
   * ```typescript
   * // Search by election code
   * const elections = await api.searchElections('ABC1234');
   *
   * // Get user's elections
   * const myElections = await api.searchElections(undefined, token);
   * ```
   *
   * @see {@link api.getElection} to get a single election by ID
   * @category API Client
   */
  searchElections: async (code?: string, token?: string) => {
    const query = code ? `?code=${code}` : '';
    const headers: Record<string, string> = {};

    if (token) {
      const validToken = await getValidAccessToken();
      if (!validToken) {
        handleUnauthorizedError();
        throw new Error('Unauthorized');
      }
      headers['Authorization'] = `Bearer ${validToken}`;
    }

    const response = await authenticatedFetch(`/api/elections${query}`, { headers });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search elections');
    }

    return await response.json();
  },

  /**
   * Uploads a voter eligibility list for an election.
   *
   * Adds email addresses to the eligibility list for an election. Only the election
   * creator (admin) can perform this operation. Eligible voters can then vote
   * without requesting access.
   *
   * @param electionId - The election ID
   * @param voters - Array of email addresses to add to eligibility list
   * @param _token - Authentication token (unused parameter, uses refreshed token internally)
   * @returns Promise resolving to upload response with count of voters added
   * @throws {Error} If upload fails, user is not election creator, or validation fails
   *
   * @example
   * ```typescript
   * await api.uploadEligibility('election-id', [
   *   'voter1@example.com',
   *   'voter2@example.com',
   *   'voter3@example.com'
   * ], token);
   * ```
   *
   * @see {@link api.checkEligibility} to check if a user is eligible
   * @see {@link api.requestAccess} for users not on the eligibility list
   * @category API Client
   */
  uploadEligibility: async (electionId: string, voters: string[], _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/eligibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({ voters }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload eligibility list');
    }

    return await response.json();
  },
  /**
   * Checks if the current user is eligible to vote in an election.
   *
   * Determines whether the authenticated user is on the eligibility list for
   * the specified election. Users can vote immediately if eligible, otherwise
   * they must request access.
   *
   * @param electionId - The election ID
   * @param _token - Authentication token (unused parameter, uses refreshed token internally)
   * @returns Promise resolving to eligibility status object with `eligible: boolean`
   * @throws {Error} If check fails or user is not authenticated
   *
   * @example
   * ```typescript
   * const status = await api.checkEligibility('election-id', token);
   * if (status.eligible) {
   *   console.log('User can vote immediately');
   * } else {
   *   console.log('User must request access');
   * }
   * ```
   *
   * @see {@link api.requestAccess} to request access if not eligible
   * @category API Client
   */
  checkEligibility: async (electionId: string, _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/eligibility-status`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check eligibility');
    }

    return await response.json();
  },

  /**
   * Requests access to vote in an election.
   *
   * Submits an access request for users who are not on the eligibility list.
   * The election admin can then approve or deny the request. Users can vote
   * immediately after approval.
   *
   * @param electionId - The election ID
   * @param _token - Authentication token (unused parameter, uses refreshed token internally)
   * @returns Promise resolving to access request response with request ID
   * @throws {Error} If request fails, user already has access, or user is not authenticated
   *
   * @example
   * ```typescript
   * const result = await api.requestAccess('election-id', token);
   * console.log('Access requested:', result.requestId);
   * console.log('Status:', result.status); // 'pending'
   * ```
   *
   * @see {@link api.checkEligibility} to check eligibility first
   * @see {@link api.getAccessRequests} for admins to view requests
   * @category API Client
   */
  requestAccess: async (electionId: string, _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/access-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request access');
    }

    return await response.json();
  },
  /**
   * Gets all access requests for an election (admin only).
   *
   * Retrieves all pending, approved, and denied access requests for an election.
   * Only the election creator (admin) can access this endpoint.
   *
   * @param electionId - The election ID
   * @param _token - Authentication token (unused parameter, uses refreshed token internally)
   * @returns Promise resolving to array of access request objects
   * @throws {Error} If request fails, user is not election creator, or user is not authenticated
   *
   * @example
   * ```typescript
   * const requests = await api.getAccessRequests('election-id', token);
   * const pending = requests.filter(r => r.status === 'pending');
   * console.log(`${pending.length} pending requests`);
   * ```
   *
   * @see {@link api.updateAccessRequest} to approve or deny requests
   * @category API Client
   */
  getAccessRequests: async (electionId: string, _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/access-requests`, {
      headers: {
        Authorization: `Bearer ${validToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get access requests');
    }

    return await response.json();
  },
  /**
   * Updates an access request status (approve or deny).
   *
   * Allows election admins to approve or deny access requests. When approved,
   * the user immediately becomes eligible to vote. Only the election creator
   * can perform this action.
   *
   * @param electionId - The election ID
   * @param requestId - The access request ID to update
   * @param action - Action to take: `'approve'` or `'deny'`
   * @param _token - Authentication token (unused parameter, uses refreshed token internally)
   * @returns Promise resolving to updated access request object
   * @throws {Error} If update fails, user is not election creator, or request not found
   *
   * @example
   * ```typescript
   * // Approve an access request
   * await api.updateAccessRequest('election-id', 'request-id', 'approve', token);
   *
   * // Deny an access request
   * await api.updateAccessRequest('election-id', 'request-id', 'deny', token);
   * ```
   *
   * @see {@link api.getAccessRequests} to view all requests
   * @category API Client
   */
  updateAccessRequest: async (
    electionId: string,
    requestId: string,
    action: 'approve' | 'deny',
    _token: string
  ) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(
      `/api/elections/${electionId}/access-requests/${requestId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify({ action }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update access request');
    }

    return await response.json();
  },

  /**
   * Gets election results from the blockchain.
   *
   * Retrieves vote tallies directly from the blockchain smart contract. Results
   * are immutable and verifiable. Returns vote counts and percentages for each
   * candidate in each position.
   *
   * @param electionId - The election ID
   * @returns Promise resolving to election results with vote counts and percentages
   * @throws {Error} If results not available, contract not found, or request fails
   *
   * @example
   * ```typescript
   * const results = await api.getResults('election-id');
   * results.positions.forEach(position => {
   *   console.log(`${position.name}:`);
   *   position.candidates.forEach(candidate => {
   *     console.log(`  ${candidate.name}: ${candidate.votes} votes (${candidate.percentage}%)`);
   *   });
   * });
   * ```
   *
   * @see {@link api.castVote} to cast a vote
   * @category API Client
   */
  getResults: async (electionId: string) => {
    const response = await authenticatedFetch(`/api/elections/${electionId}/results`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch results');
    }
    return await response.json();
  },

  /**
   * Casts a vote in an election by submitting to the blockchain contract.
   *
   * Submits vote selections to the blockchain smart contract. The vote is
   * permanently recorded on-chain and cannot be modified. Users can only vote
   * once per election and must be eligible.
   *
   * **Note**: This method transforms position/candidate IDs from the election
   * object into position/candidate names required by the blockchain contract.
   *
   * @param electionId - The election ID
   * @param selections - Vote selections mapping position IDs to candidate IDs (or arrays for multi-choice)
   * @param election - The election object containing positions, candidates, and contract address
   * @param _token - Authentication token (unused parameter, uses refreshed token internally)
   * @returns Promise resolving to vote receipt with transaction hash
   * @throws {Error} If voting fails, user is ineligible, user has already voted, or validation fails
   *
   * @example
   * ```typescript
   * // Single choice vote
   * const receipt = await api.castVote('election-id', {
   *   'position-id-1': 'candidate-id-1',
   *   'position-id-2': 'candidate-id-2'
   * }, election, token);
   *
   * console.log('Vote cast! Transaction:', receipt.txHash);
   * ```
   *
   * @see {@link api.getResults} to view election results after voting
   * @category API Client
   */
  castVote: async (
    electionId: string,
    selections: VoteSelections,
    election: Election,
    _token: string
  ) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }

    if (!election || !election.contract_address) {
      throw new Error('Election not found or contract address missing');
    }

    const votes: Array<{ position: string; candidate: string }> = [];

    for (const position of election.positions) {
      const selection = selections[position.id];
      if (!selection) continue;

      if (Array.isArray(selection)) {
        for (const candidateId of selection) {
          const candidate = position.candidates.find((c: Candidate) => c.id === candidateId);
          if (candidate) {
            votes.push({ position: position.name, candidate: candidate.name });
          }
        }
      } else {
        const candidate = position.candidates.find((c: Candidate) => c.id === selection);
        if (candidate) {
          votes.push({ position: position.name, candidate: candidate.name });
        }
      }
    }

    if (votes.length === 0) {
      throw new Error('No valid votes to cast');
    }

    const response = await authenticatedFetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        electionId,
        contractAddress: election.contract_address,
        votes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cast vote');
    }

    const result = await response.json();
    return {
      receipt: result.txHash,
      ...result,
    };
  },
};
