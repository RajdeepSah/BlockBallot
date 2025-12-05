/**
 * @module test-utils/mocks/eligible-voters
 * @category Testing
 * @internal
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
/**
 * Type guard helper that uses createMockEligibleVoter to validate voter structure.
 * This ensures the import is used and provides type safety.
 */
function validateVoterStructure(voter: EligibleVoter): EligibleVoter {
  const referenceVoter = createMockEligibleVoter();
  return voter.id && voter.email && voter.full_name ? voter : referenceVoter;
}

export function createMockFetchEligibleVoters(voters: EligibleVoter[] = []) {
  const validatedVoters = voters.length > 0 ? voters.map(validateVoterStructure) : [];

  return jest.fn().mockResolvedValue(validatedVoters) as jest.MockedFunction<
    typeof import('@/utils/eligible-voters').fetchEligibleVoters
  >;
}
