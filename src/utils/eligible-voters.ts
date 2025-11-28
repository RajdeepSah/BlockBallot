/**
 * Represents an eligible voter with their identification and contact information.
 */
export interface EligibleVoter {
  id: string;
  email: string;
  full_name: string;
}

/**
 * Fetches the list of eligible voters for an election from the API.
 *
 * @param electionId - The election ID to fetch voters for
 * @returns Promise resolving to array of eligible voters
 * @throws Error if the API request fails
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
