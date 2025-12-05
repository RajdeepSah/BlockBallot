/**
 * @module utils/eligible-voters
 * @category Election Management
 *
 * Client-side utilities for fetching eligible voter data.
 *
 * This module provides functions and types for retrieving the list of
 * eligible voters for an election from the API.
 *
 * ## Usage
 *
 * ```typescript
 * import { fetchEligibleVoters, type EligibleVoter } from '@/utils/eligible-voters';
 *
 * const voters = await fetchEligibleVoters('election-123');
 * voters.forEach(voter => console.log(voter.email, voter.full_name));
 * ```
 */

/**
 * Represents an eligible voter with their identification and contact information.
 *
 * @example
 * ```typescript
 * const voter: EligibleVoter = {
 *   id: 'voter-uuid',
 *   email: 'voter@example.com',
 *   full_name: 'John Doe'
 * };
 * ```
 */
export interface EligibleVoter {
  /** Unique voter ID */
  id: string;
  /** Voter's email address */
  email: string;
  /** Voter's full name (or email if name not available) */
  full_name: string;
}

/**
 * Fetches the list of eligible voters for an election from the API.
 *
 * Retrieves all pre-approved and approved voters for the specified election.
 * This function is typically used by election administrators to view who
 * is eligible to vote.
 *
 * @param electionId - The election ID to fetch voters for
 * @returns Promise resolving to array of eligible voters
 * @throws {Error} If the API request fails or returns an error
 *
 * @example
 * ```typescript
 * try {
 *   const voters = await fetchEligibleVoters('election-123');
 *   console.log(`${voters.length} eligible voters`);
 * } catch (error) {
 *   console.error('Failed to load voters:', error.message);
 * }
 * ```
 *
 * @category Election Management
 */
export async function fetchEligibleVoters(electionId: string): Promise<EligibleVoter[]> {
  const response = await fetch('/api/eligible-voters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ electionId }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load eligible voters.');
  }

  return data.voters || [];
}
