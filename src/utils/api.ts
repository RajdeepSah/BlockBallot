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
  // Auth - Now using Next.js API routes
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
  getMe: (token: string) => apiCall('/auth/me', { token }),

  // Elections
  getElection: async (id: string) => {
    const response = await authenticatedFetch(`/api/elections/${id}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get election');
    }
    return await response.json();
  },
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

  // Access Requests - Now using Next.js API routes
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

  // Results
  getResults: async (electionId: string) => {
    const response = await authenticatedFetch(`/api/elections/${electionId}/results`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch results');
    }
    return await response.json();
  },

  // Voting
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
