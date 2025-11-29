/**
 * @module test-utils/mocks/api
 * @category Testing
 *
 * Mock implementations of the API client for testing.
 *
 * Provides factory functions to create mocked API clients with configurable
 * behavior for all API methods. All mocks return Jest mock functions that
 * can be configured per test case.
 */

import { Election, AccessRequest } from '@/types/election';
import { RegisterData, LoginData, Verify2FAData, ResendOTPData, VoteSelections, LoginResponse } from '@/types/api';
import { createMockElection, createMockAccessRequest } from './data';

/**
 * Creates a mocked API client with all methods as Jest mock functions.
 *
 * All methods are pre-configured to return successful responses by default.
 * Individual methods can be overridden in tests using `mockReturnValue` or `mockResolvedValue`.
 *
 * @param overrides - Optional partial API object to override default mock implementations
 * @returns Mocked API client object with all methods as Jest mocks
 *
 * @example
 * ```typescript
 * // Use default successful mocks
 * const mockApi = createMockApi();
 *
 * // Override specific methods
 * mockApi.login.mockResolvedValue({ requires2FA: true, userId: '123' });
 * mockApi.getElection.mockRejectedValue(new Error('Not found'));
 * ```
 */
export function createMockApi(overrides?: Partial<typeof import('@/utils/api').api>) {
  const defaultElection = createMockElection();
  const defaultAccessRequest = createMockAccessRequest();

  return {
    /**
     * Mock implementation of `api.register`.
     * Returns a successful registration response by default.
     */
    register: jest.fn<typeof import('@/utils/api').api.register>().mockResolvedValue({
      userId: 'user-id-123',
      message: 'Registration successful',
    }),

    /**
     * Mock implementation of `api.login`.
     * Returns a login response requiring 2FA by default.
     */
    login: jest.fn<typeof import('@/utils/api').api.login>().mockResolvedValue({
      requires2FA: true,
      userId: 'user-id-123',
      accessToken: 'test-access-token',
    } as LoginResponse),

    /**
     * Mock implementation of `api.verify2FA`.
     * Returns successful verification with tokens by default.
     */
    verify2FA: jest.fn<typeof import('@/utils/api').api.verify2FA>().mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      userId: 'user-id-123',
    }),

    /**
     * Mock implementation of `api.resendOTP`.
     * Returns successful resend confirmation by default.
     */
    resendOTP: jest.fn<typeof import('@/utils/api').api.resendOTP>().mockResolvedValue({
      message: 'OTP sent successfully',
    }),

    /**
     * Mock implementation of `api.getMe`.
     * Returns mock user data by default.
     */
    getMe: jest.fn<typeof import('@/utils/api').api.getMe>().mockResolvedValue({
      id: 'user-id-123',
      name: 'Test User',
      email: 'test@example.com',
    }),

    /**
     * Mock implementation of `api.getElection`.
     * Returns a mock election by default.
     */
    getElection: jest.fn<typeof import('@/utils/api').api.getElection>().mockResolvedValue(defaultElection),

    /**
     * Mock implementation of `api.searchElections`.
     * Returns an array with the default mock election by default.
     */
    searchElections: jest.fn<typeof import('@/utils/api').api.searchElections>().mockResolvedValue([defaultElection]),

    /**
     * Mock implementation of `api.uploadEligibility`.
     * Returns successful upload response by default.
     */
    uploadEligibility: jest.fn<typeof import('@/utils/api').api.uploadEligibility>().mockResolvedValue({
      success: true,
      added: 0,
      message: 'Voters added successfully',
    }),

    /**
     * Mock implementation of `api.checkEligibility`.
     * Returns eligible status by default.
     */
    checkEligibility: jest.fn<typeof import('@/utils/api').api.checkEligibility>().mockResolvedValue({
      eligible: true,
      hasVoted: false,
    }),

    /**
     * Mock implementation of `api.requestAccess`.
     * Returns pending access request by default.
     */
    requestAccess: jest.fn<typeof import('@/utils/api').api.requestAccess>().mockResolvedValue({
      requestId: 'request-id-123',
      status: 'pending',
    }),

    /**
     * Mock implementation of `api.getAccessRequests`.
     * Returns array with default mock access request by default.
     */
    getAccessRequests: jest.fn<typeof import('@/utils/api').api.getAccessRequests>().mockResolvedValue({
      requests: [defaultAccessRequest],
    }),

    /**
     * Mock implementation of `api.updateAccessRequest`.
     * Returns updated access request by default.
     */
    updateAccessRequest: jest.fn<typeof import('@/utils/api').api.updateAccessRequest>().mockResolvedValue({
      ...defaultAccessRequest,
      status: 'approved',
    }),

    /**
     * Mock implementation of `api.getResults`.
     * Returns mock election results by default.
     */
    getResults: jest.fn<typeof import('@/utils/api').api.getResults>().mockResolvedValue({
      election_id: defaultElection.id!,
      election_title: defaultElection.title,
      total_votes: 10,
      eligible_voters: 100,
      turnout_percentage: '10.00',
      results: {},
      has_ended: false,
    }),

    /**
     * Mock implementation of `api.castVote`.
     * Returns successful vote receipt by default.
     */
    castVote: jest.fn<typeof import('@/utils/api').api.castVote>().mockResolvedValue({
      receipt: 'tx-hash-123',
      txHash: 'tx-hash-123',
      success: true,
    }),

    ...overrides,
  };
}

/**
 * Type helper for the mocked API client.
 * Useful for TypeScript type checking in tests.
 */
export type MockApi = ReturnType<typeof createMockApi>;

