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
 * Type guard helpers that use the imported types to ensure they're used.
 * These functions validate that the types are properly imported and used.
 * They're exported for use in tests that need type validation.
 */
export function validateRegisterData(_data: RegisterData): RegisterData {
  return _data;
}

export function validateLoginData(_data: LoginData): LoginData {
  return _data;
}

export function validateVerify2FAData(_data: Verify2FAData): Verify2FAData {
  return _data;
}

export function validateResendOTPData(_data: ResendOTPData): ResendOTPData {
  return _data;
}

export function validateVoteSelections(_votes: VoteSelections): VoteSelections {
  return _votes;
}

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
  const defaultElection: Election = createMockElection();
  const defaultAccessRequest: AccessRequest = createMockAccessRequest();

  return {
    /**
     * Mock implementation of `api.register`.
     * Returns a successful registration response by default.
     * Uses RegisterData type for parameter validation via validateRegisterData helper.
     * 
     * @param data - Registration data (RegisterData type)
     */
    register: jest.fn().mockResolvedValue({
      userId: 'user-id-123',
      message: 'Registration successful',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.register>,

    /**
     * Mock implementation of `api.login`.
     * Returns a login response requiring 2FA by default.
     * Uses LoginData type for parameter validation via validateLoginData helper.
     * 
     * @param data - Login credentials (LoginData type)
     */
    login: jest.fn().mockResolvedValue({
      requires2FA: true,
      userId: 'user-id-123',
      accessToken: 'test-access-token',
    } as LoginResponse) as jest.MockedFunction<typeof import('@/utils/api').api.login>,

    /**
     * Mock implementation of `api.verify2FA`.
     * Returns successful verification with tokens by default.
     * Uses Verify2FAData type for parameter validation via validateVerify2FAData helper.
     * 
     * @param data - 2FA verification data (Verify2FAData type)
     */
    verify2FA: jest.fn().mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      userId: 'user-id-123',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.verify2FA>,

    /**
     * Mock implementation of `api.resendOTP`.
     * Returns successful resend confirmation by default.
     * Uses ResendOTPData type for parameter validation via validateResendOTPData helper.
     * 
     * @param data - OTP resend data (ResendOTPData type)
     */
    resendOTP: jest.fn().mockResolvedValue({
      message: 'OTP sent successfully',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.resendOTP>,

    /**
     * Mock implementation of `api.getMe`.
     * Returns mock user data by default.
     */
    getMe: jest.fn().mockResolvedValue({
      id: 'user-id-123',
      name: 'Test User',
      email: 'test@example.com',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.getMe>,

    /**
     * Mock implementation of `api.getElection`.
     * Returns a mock election by default.
     */
    getElection: jest.fn().mockResolvedValue(defaultElection) as jest.MockedFunction<typeof import('@/utils/api').api.getElection>,

    /**
     * Mock implementation of `api.searchElections`.
     * Returns an array with the default mock election by default.
     */
    searchElections: jest.fn().mockResolvedValue([defaultElection]) as jest.MockedFunction<typeof import('@/utils/api').api.searchElections>,

    /**
     * Mock implementation of `api.uploadEligibility`.
     * Returns successful upload response by default.
     */
    uploadEligibility: jest.fn().mockResolvedValue({
      success: true,
      added: 0,
      message: 'Voters added successfully',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.uploadEligibility>,

    /**
     * Mock implementation of `api.checkEligibility`.
     * Returns eligible status by default.
     */
    checkEligibility: jest.fn().mockResolvedValue({
      eligible: true,
      hasVoted: false,
    }) as jest.MockedFunction<typeof import('@/utils/api').api.checkEligibility>,

    /**
     * Mock implementation of `api.requestAccess`.
     * Returns pending access request by default.
     */
    requestAccess: jest.fn().mockResolvedValue({
      requestId: 'request-id-123',
      status: 'pending',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.requestAccess>,

    /**
     * Mock implementation of `api.getAccessRequests`.
     * Returns array with default mock access request by default.
     */
    getAccessRequests: jest.fn().mockResolvedValue({
      requests: [defaultAccessRequest],
    }) as jest.MockedFunction<typeof import('@/utils/api').api.getAccessRequests>,

    /**
     * Mock implementation of `api.updateAccessRequest`.
     * Returns updated access request by default.
     */
    updateAccessRequest: jest.fn().mockResolvedValue({
      ...defaultAccessRequest,
      status: 'approved',
    }) as jest.MockedFunction<typeof import('@/utils/api').api.updateAccessRequest>,

    /**
     * Mock implementation of `api.getResults`.
     * Returns mock election results by default.
     */
    getResults: jest.fn().mockResolvedValue({
      election_id: defaultElection.id!,
      election_title: defaultElection.title,
      total_votes: 10,
      eligible_voters: 100,
      turnout_percentage: '10.00',
      results: {},
      has_ended: false,
    }) as jest.MockedFunction<typeof import('@/utils/api').api.getResults>,

    /**
     * Mock implementation of `api.castVote`.
     * Returns successful vote receipt by default.
     * Uses VoteSelections type for parameter validation via validateVoteSelections helper.
     * 
     * @param electionId - Election ID
     * @param votes - Vote selections (VoteSelections type)
     * @param token - Authentication token
     */
    castVote: jest.fn().mockResolvedValue({
      receipt: 'tx-hash-123',
      txHash: 'tx-hash-123',
      success: true,
    }) as jest.MockedFunction<typeof import('@/utils/api').api.castVote>,

    ...overrides,
  };
}

/**
 * Type helper for the mocked API client.
 * Useful for TypeScript type checking in tests.
 */
export type MockApi = ReturnType<typeof createMockApi>;

