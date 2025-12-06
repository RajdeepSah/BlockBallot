/**
 * @module test-utils/mocks/data
 * @category Testing
 * @internal
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
import type {
  UserRecord,
  EligibilityRecord,
  BallotLinkRecord,
  VoteTransactionRecord,
} from '@/types/kv-records';

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
export function createMockUser(
  overrides?: Partial<{ id: string; name: string; email: string; phone?: string }>
) {
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
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
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

/**
 * Creates a mock user record for KV store testing.
 *
 * This factory creates UserRecord objects that match the structure
 * stored in the Supabase KV store under the `user:` prefix.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock user record object
 *
 * @example
 * ```typescript
 * const userRecord = createMockUserRecord({
 *   id: 'user-123',
 *   email: 'john@example.com'
 * });
 * ```
 */
export function createMockUserRecord(overrides?: Partial<UserRecord>): UserRecord {
  return {
    id: 'user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+1234567890',
    ...overrides,
  };
}

/**
 * Creates a mock eligibility record for KV store testing.
 *
 * This factory creates EligibilityRecord objects that match the structure
 * stored in the Supabase KV store under the `eligibility:` prefix.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock eligibility record object
 *
 * @example
 * ```typescript
 * const eligibility = createMockEligibilityRecord({
 *   election_id: 'election-456',
 *   status: 'approved'
 * });
 * ```
 */
export function createMockEligibilityRecord(
  overrides?: Partial<EligibilityRecord>
): EligibilityRecord {
  return {
    election_id: 'test-election-id',
    contact: 'test@example.com',
    status: 'approved',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock ballot link record for KV store testing.
 *
 * This factory creates BallotLinkRecord objects that match the structure
 * stored in the Supabase KV store under the `vote:user:` prefix.
 * Used for duplicate vote prevention.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock ballot link record object
 *
 * @example
 * ```typescript
 * const ballotLink = createMockBallotLinkRecord({
 *   status: 'completed'
 * });
 * ```
 */
export function createMockBallotLinkRecord(
  overrides?: Partial<BallotLinkRecord>
): BallotLinkRecord {
  return {
    status: 'completed',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates a mock vote transaction record for KV store testing.
 *
 * This factory creates VoteTransactionRecord objects that match the structure
 * stored in the Supabase KV store under the `vote:tx:` prefix.
 * Used for anonymous vote verification.
 *
 * @param overrides - Optional properties to override default values
 * @returns Mock vote transaction record object
 *
 * @example
 * ```typescript
 * const txRecord = createMockVoteTransactionRecord({
 *   electionId: 'election-456'
 * });
 * ```
 */
export function createMockVoteTransactionRecord(
  overrides?: Partial<VoteTransactionRecord>
): VoteTransactionRecord {
  return {
    timestamp: new Date().toISOString(),
    electionId: 'test-election-id',
    ...overrides,
  };
}
