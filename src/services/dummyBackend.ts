// Dummy backend service to simulate smart contract interactions
// In production, these would interact with Ethereum smart contracts

export interface Candidate {
  name: string;
  votes?: number;
}

export interface Position {
  id: string;
  title: string;
  candidates: Candidate[];
}

export interface Election {
  id: string;
  title: string;
  description: string;
  timezone: string;
  startDate: Date;
  endDate: Date;
  positions: Position[];
  voterEmails: string[];
}

export interface VoteData {
  electionId: string;
  votes: Record<string, string>; // positionId -> candidateName
}

// In-memory storage (simulates blockchain)
const elections: Election[] = [];
const votes: Map<string, VoteData> = new Map();

export const dummyBackend = {
  // Create a new election (simulates deploying a smart contract)
  createElection: async (electionData: Omit<Election, 'id'>): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const id = `election-${Date.now()}`;
        const election: Election = {
          id,
          ...electionData,
        };
        elections.push(election);
        console.log('Election created:', election);
        resolve(id);
      }, 1000); // Simulate network delay
    });
  },

  // Get election by ID
  getElection: async (electionId: string): Promise<Election | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const election = elections.find(e => e.id === electionId);
        resolve(election || null);
      }, 500);
    });
  },

  // Submit votes (simulates blockchain transaction)
  submitVote: async (voteData: VoteData): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const voterKey = `${voteData.electionId}-voter-${Date.now()}`;
        votes.set(voterKey, voteData);
        console.log('Vote submitted:', voteData);
        resolve(true);
      }, 1500); // Simulate blockchain transaction time
    });
  },

  // Get election results (simulates reading from blockchain)
  getElectionResults: async (electionId: string): Promise<Position[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const election = elections.find(e => e.id === electionId);
        if (!election) {
          resolve([]);
          return;
        }

        // Calculate votes from submitted votes
        const results = election.positions.map(position => ({
          ...position,
          candidates: position.candidates.map(candidate => ({
            ...candidate,
            votes: Array.from(votes.values())
              .filter(v => v.electionId === electionId && v.votes[position.id] === candidate.name)
              .length,
          })).sort((a, b) => (b.votes || 0) - (a.votes || 0)),
        }));

        resolve(results);
      }, 800);
    });
  },

  // Check if election is active
  isElectionActive: (election: Election): boolean => {
    const now = new Date();
    return now >= election.startDate && now <= election.endDate;
  },

  // Check if election has ended
  hasElectionEnded: (election: Election): boolean => {
    const now = new Date();
    return now > election.endDate;
  },
};
