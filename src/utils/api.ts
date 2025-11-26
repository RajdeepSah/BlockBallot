import { getValidAccessToken } from './auth/tokenRefresh';
import { authenticatedFetch, handleUnauthorizedError } from './auth/errorHandler';

export const api = {
  // Auth - Now using Next.js API routes
  register: async (data: any) => {
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
  login: async (data: any) => {
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
  verify2FA: async (data: any) => {
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
  resendOTP: async (data: any) => {
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
  getMe: async () => {
    const response = await authenticatedFetch('/api/auth/me');
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load user');
    }
    return await response.json();
  },

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
  
  uploadEligibility: async (electionId: string, voters: string[], token: string) => {
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
  checkEligibility: async (electionId: string, token: string) => {
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
  requestAccess: async (electionId: string, token: string) => {
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
  getAccessRequests: async (electionId: string, token: string) => {
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
  updateAccessRequest: async (electionId: string, requestId: string, action: 'approve' | 'deny', token: string) => {
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
};
