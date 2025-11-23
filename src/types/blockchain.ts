/**
 * Type definitions for blockchain operations
 */

export type ContractAddress = string;
export type TransactionHash = string;

export interface CandidateTally {
  name: string;
  votes: string;
}

export interface PositionResult {
  name: string;
  candidates: CandidateTally[];
}

export interface DeploymentResponse {
  success: boolean;
  electionId: string;
  contractAddress: ContractAddress;
  txHash: string;
  message: string;
}

export interface VoteResponse {
  success: boolean;
  txHash: TransactionHash;
  votesProcessed: number;
}

export interface VotesResponse {
  positions: PositionResult[];
  contractAddress: ContractAddress;
}

export interface VoteInput {
  position: string;
  candidate: string;
}

export interface PositionInput {
  name: string;
  candidates: Array<{ name: string }>;
}

