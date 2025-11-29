/**
 * @module test-utils/mocks/eligible-voters
 * @category Testing
 *
 * Mock implementations of eligible voters utilities for testing.
 *
 * Provides factory functions to create mocked `fetchEligibleVoters` functions
 * that can be used in component tests.
 */

import { EligibleVoter } from '@/utils/eligible-voters';
import { createMockEligibleVoter } from './data';

/**
 * Creates a mock implementation of `fetchEligibleVoters`.
 *
 * Returns a Jest mock function that can be configured to return different
 * arrays of eligible voters for testing various scenarios.
 *
 * @param voters - Default voters to return (default: empty array)
 * @returns Mock function for `fetchEligibleVoters`
 *
 * @example
 * ```typescript
 * // Return default empty list
 * const mockFetchVoters = createMockFetchEligibleVoters();
 *
 * // Return specific voters
 * const mockFetchVoters = createMockFetchEligibleVoters([
 *   createMockEligibleVoter({ email: 'voter1@example.com' }),
 *   createMockEligibleVoter({ email: 'voter2@example.com' })
 * ]);
 *
 * // Override in test
 * mockFetchVoters.mockResolvedValue([...customVoters]);
 * ```
 */
export function createMockFetchEligibleVoters(voters: EligibleVoter[] = []) {
  return jest.fn<typeof import('@/utils/eligible-voters').fetchEligibleVoters>().mockResolvedValue(voters);
}

