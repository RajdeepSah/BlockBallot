/**
 * Type definitions for blockchain operations
 */

/**
 * Ethereum contract address (0x-prefixed hex string).
 */
export type ContractAddress = string;

/**
 * Ethereum transaction hash (0x-prefixed hex string).
 */
export type TransactionHash = string;

/**
 * Candidate vote tally from blockchain.
 */
export interface CandidateTally {
  name: string;
  votes: string;
}

/**
 * Position result with candidate tallies from blockchain.
 */
export interface PositionResult {
  name: string;
  candidates: CandidateTally[];
}

/**
 * Response from contract deployment endpoint.
 */
export interface DeploymentResponse {
  success: boolean;
  electionId: string;
  contractAddress: ContractAddress;
  txHash: string;
  message: string;
}

/**
 * Response from vote casting endpoint.
 */
export interface VoteResponse {
  success: boolean;
  txHash: TransactionHash;
  votesProcessed: number;
  timestamp?: string;
}

/**
 * Response containing all votes from blockchain.
 */
export interface VotesResponse {
  positions: PositionResult[];
  contractAddress: ContractAddress;
}

/**
 * Single vote input for blockchain contract.
 */
export interface VoteInput {
  position: string;
  candidate: string;
}

/**
 * Position input for contract deployment.
 */
export interface PositionInput {
  name: string;
  candidates: Array<{ name: string }>;
}
