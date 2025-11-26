export interface EligibleVoter {
  id: string;
  email: string;
  full_name: string;
}

export async function fetchEligibleVoters(electionId: string): Promise<EligibleVoter[]> {
  const response = await fetch('/api/eligible-voters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ electionId }),
  });

  // Calling res.json() directly avoids the double parsing that surfaced the JSON error earlier.
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Failed to load eligible voters.');
  }

  return data.voters || [];
}
