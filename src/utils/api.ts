import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b7b6fbd4`;

interface ApiOptions {
  method?: string;
  body?: any;
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
  // Auth
  register: (data: any) => apiCall('/auth/register', { method: 'POST', body: data }),
  login: (data: any) => apiCall('/auth/login', { method: 'POST', body: data }),
  verify2FA: (data: any) => apiCall('/auth/verify-2fa', { method: 'POST', body: data }),
  resendOTP: (data: any) => apiCall('/auth/resend-otp', { method: 'POST', body: data }),
  resetPassword: (data: any) => apiCall('/auth/forgot-password', { method: 'POST', body: data }),
  getMe: (token: string) => apiCall('/auth/me', { token }),

  // Elections
  createElection: (data: any, token: string) => 
    apiCall('/elections', { method: 'POST', body: data, token }),
  getElection: (id: string) => apiCall(`/elections/${id}`),
  searchElections: (code?: string, token?: string) => {
    const query = code ? `?code=${code}` : '';
    return apiCall(`/elections${query}`, { token });
  },
  
  // Eligibility
  uploadEligibility: (electionId: string, voters: string[], token: string) =>
    apiCall(`/elections/${electionId}/eligibility`, { 
      method: 'POST', 
      body: { voters }, 
      token 
    }),
  checkEligibility: (electionId: string, token: string) =>
    apiCall(`/elections/${electionId}/eligibility-status`, { token }),

  // Access Requests
  requestAccess: (electionId: string, token: string) =>
    apiCall(`/elections/${electionId}/access-request`, { method: 'POST', token }),
  getAccessRequests: (electionId: string, token: string) =>
    apiCall(`/elections/${electionId}/access-requests`, { token }),
  updateAccessRequest: (electionId: string, requestId: string, action: 'approve' | 'deny', token: string) =>
    apiCall(`/elections/${electionId}/access-requests/${requestId}`, {
      method: 'PATCH',
      body: { action },
      token
    }),

  // Voting
  castVote: (electionId: string, votes: any, token: string) =>
    apiCall(`/elections/${electionId}/cast-vote`, { 
      method: 'POST', 
      body: { votes }, 
      token 
    }),
  
  // Results
  getResults: (electionId: string, token?: string) =>
    apiCall(`/elections/${electionId}/results`, { token }),
};
