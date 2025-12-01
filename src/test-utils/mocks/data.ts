/**
 * @module test-utils/mocks/data
 * @category Testing
 *
 * Mock data factories for creating test data structures.
 *
 * Provides factory functions to generate consistent test data for elections,
 * users, candidates, and other entities used throughout the application.
 * All factories return objects that match the expected TypeScript interfaces.
 */

import { Election, Candidate, Position, AccessRequest } from '@/types/election';
import { RegisterData, LoginData } from '@/types/api';
import { EligibleVoter } from '@/utils/eligible-voters';

/**
 * Creates a mock user object for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock user object with test data
 *
 * @example
 * ```typescript
 * const user = createMockUser({ email: 'custom@example.com' });
 * ```
 */
export function createMockUser(overrides?: Partial<{ id: string; name: string; email: string; phone?: string }>) {
  return {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    ...overrides,
  };
}

/**
 * Creates a mock candidate object for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock candidate object with test data
 *
 * @example
 * ```typescript
 * const candidate = createMockCandidate({ name: 'John Doe' });
 * ```
 */
export function createMockCandidate(overrides?: Partial<Candidate>): Candidate {
  return {
    id: 'candidate-id-1',
    name: 'Test Candidate',
    description: 'Test candidate description',
    ...overrides,
  };
}

/**
 * Creates a mock position object for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock position object with test data
 *
 * @example
 * ```typescript
 * const position = createMockPosition({
 *   name: 'President',
 *   candidates: [createMockCandidate()]
 * });
 * ```
 */
export function createMockPosition(overrides?: Partial<Position>): Position {
  return {
    id: 'position-id-1',
    name: 'Test Position',
    description: 'Test position description',
    ballot_type: 'single',
    candidates: [createMockCandidate()],
    ...overrides,
  };
}

/**
 * Creates a mock election object for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock election object with test data
 *
 * @example
 * ```typescript
 * const election = createMockElection({
 *   title: 'Presidential Election',
 *   code: 'ABC1234'
 * });
 * ```
 */
export function createMockElection(overrides?: Partial<Election>): Election {
  const now = new Date();
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  return {
    id: 'test-election-id',
    code: 'ABC1234',
    title: 'Test Election',
    description: 'Test Election Description',
    starts_at: startDate.toISOString(),
    ends_at: endDate.toISOString(),
    creator_id: 'creator-id',
    status: 'active',
    positions: [createMockPosition()],
    time_zone: 'UTC',
    contract_address: '0x1234567890123456789012345678901234567890',
    ...overrides,
  };
}

/**
 * Creates a mock access request object for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock access request object with test data
 *
 * @example
 * ```typescript
 * const request = createMockAccessRequest({
 *   status: 'pending',
 *   user_email: 'voter@example.com'
 * });
 * ```
 */
export function createMockAccessRequest(overrides?: Partial<AccessRequest>): AccessRequest {
  return {
    id: 'request-id-1',
    status: 'pending',
    user_name: 'Test Voter',
    user_email: 'voter@example.com',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock eligible voter object for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock eligible voter object with test data
 *
 * @example
 * ```typescript
 * const voter = createMockEligibleVoter({
 *   email: 'voter@example.com',
 *   full_name: 'John Doe'
 * });
 * ```
 */
export function createMockEligibleVoter(overrides?: Partial<EligibleVoter>): EligibleVoter {
  return {
    id: 'voter-id-1',
    email: 'voter@example.com',
    full_name: 'Test Voter',
    ...overrides,
  };
}

/**
 * Creates mock registration data for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock registration data object
 *
 * @example
 * ```typescript
 * const registerData = createMockRegisterData({
 *   email: 'newuser@example.com'
 * });
 * ```
 */
export function createMockRegisterData(overrides?: Partial<RegisterData>): RegisterData {
  return {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
    phone: '+1234567890',
    ...overrides,
  };
}

/**
 * Creates mock login data for testing.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock login data object
 *
 * @example
 * ```typescript
 * const loginData = createMockLoginData({
 *   email: 'user@example.com'
 * });
 * ```
 */
export function createMockLoginData(overrides?: Partial<LoginData>): LoginData {
  return {
    email: 'test@example.com',
    password: 'TestPassword123!',
    ...overrides,
  };
}

