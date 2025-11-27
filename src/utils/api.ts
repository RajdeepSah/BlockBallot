import { projectId, publicAnonKey } from './supabase/info';
import { getValidAccessToken } from './auth/tokenRefresh';
import { authenticatedFetch, handleUnauthorizedError } from './auth/errorHandler';
import { RegisterData, LoginData, Verify2FAData, ResendOTPData, VoteSelections } from '@/types/api';
import { Election, Candidate } from '@/types/election';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b7b6fbd4`;

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

/**
 * Makes an API call to the Supabase Edge Function.
 * 
 * @param endpoint - API endpoint path
 * @param options - Request options (method, body, token)
 * @returns Promise resolving to API response data
 * @throws Error if API request fails
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

export const api = {
  /**
   * Registers a new user account.
   * 
   * @param data - Registration data (name, email, password, optional phone)
   * @returns Promise resolving to registration response
   * @throws Error if registration fails
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
   * @param data - Login credentials (email, password)
   * @returns Promise resolving to login response with 2FA requirement
   * @throws Error if login fails
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
   * Verifies 2FA OTP code for user authentication.
   * 
   * @param data - 2FA verification data (email, otp)
   * @returns Promise resolving to verification response
   * @throws Error if verification fails
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
   * @param data - Resend OTP data (email)
   * @returns Promise resolving to resend response
   * @throws Error if resend fails
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
   * @param token - Authentication token
   * @returns Promise resolving to user data
   * @throws Error if request fails
   */
  getMe: (token: string) => apiCall('/auth/me', { token }),

  /**
   * Retrieves a single election by ID.
   * 
   * @param id - Election ID
   * @returns Promise resolving to election data
   * @throws Error if election not found or request fails
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
   * @param code - Optional 7-digit election code to search for
   * @param token - Optional authentication token to get user's elections
   * @returns Promise resolving to elections array
   * @throws Error if search fails
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
   * @param electionId - The election ID
   * @param voters - Array of email addresses to add to eligibility
   * @param _token - Authentication token (unused, uses refreshed token internally)
   * @returns Promise resolving to upload response
   * @throws Error if upload fails or user is not election creator
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
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ voters })
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
   * @param electionId - The election ID
   * @param _token - Authentication token (unused, uses refreshed token internally)
   * @returns Promise resolving to eligibility status
   * @throws Error if check fails
   */
  checkEligibility: async (electionId: string, _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/eligibility-status`, {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
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
   * @param electionId - The election ID
   * @param _token - Authentication token (unused, uses refreshed token internally)
   * @returns Promise resolving to access request response
   * @throws Error if request fails
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
        'Authorization': `Bearer ${validToken}`
      }
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
   * @param electionId - The election ID
   * @param _token - Authentication token (unused, uses refreshed token internally)
   * @returns Promise resolving to access requests array
   * @throws Error if request fails or user is not election creator
   */
  getAccessRequests: async (electionId: string, _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/access-requests`, {
      headers: {
        'Authorization': `Bearer ${validToken}`
      }
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
   * @param electionId - The election ID
   * @param requestId - The access request ID
   * @param action - Action to take ('approve' or 'deny')
   * @param _token - Authentication token (unused, uses refreshed token internally)
   * @returns Promise resolving to update response
   * @throws Error if update fails or user is not election creator
   */
  updateAccessRequest: async (electionId: string, requestId: string, action: 'approve' | 'deny', _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }
    const response = await authenticatedFetch(`/api/elections/${electionId}/access-requests/${requestId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({ action })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update access request');
    }
    
    return await response.json();
  },

  /**
   * Gets election results from the blockchain.
   * 
   * @param electionId - The election ID
   * @returns Promise resolving to election results
   * @throws Error if results not available or request fails
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
   * @param electionId - The election ID
   * @param selections - Vote selections mapping position IDs to candidate IDs or arrays
   * @param election - The election object with contract address
   * @param _token - Authentication token (unused, uses refreshed token internally)
   * @returns Promise resolving to vote receipt with transaction hash
   * @throws Error if voting fails, user is ineligible, or has already voted
   */
  castVote: async (electionId: string, selections: VoteSelections, election: Election, _token: string) => {
    const validToken = await getValidAccessToken();
    if (!validToken) {
      handleUnauthorizedError();
      throw new Error('Unauthorized');
    }

    // Use the election data passed in (already loaded in component)
    if (!election || !election.contract_address) {
      throw new Error('Election not found or contract address missing');
    }

    // Transform selections (positionId -> candidateId) to votes array (position name -> candidate name)
    const votes: Array<{ position: string; candidate: string }> = [];
    
    for (const position of election.positions) {
      const selection = selections[position.id];
      if (!selection) continue;

      // Handle different ballot types
      if (Array.isArray(selection)) {
        // Multiple choice or ranked choice - add each selection
        for (const candidateId of selection) {
          const candidate = position.candidates.find((c: Candidate) => c.id === candidateId);
          if (candidate) {
            votes.push({ position: position.name, candidate: candidate.name });
          }
        }
      } else {
        // Single choice
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
        'Authorization': `Bearer ${validToken}`
      },
      body: JSON.stringify({
        electionId,
        contractAddress: election.contract_address,
        votes
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cast vote');
    }

    const result = await response.json();
    return {
      receipt: result.txHash,
      ...result
    };
  },
};
