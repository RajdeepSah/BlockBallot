/**
 * @module types/blockchain
 * @category Types
 *
 * Type definitions for blockchain operations and smart contract interactions.
 *
 * This module contains types used for:
 * - Contract addresses and transaction hashes
 * - Vote inputs and position data
 * - Blockchain response structures
 * - Contract deployment data
 */

/**
 * Ethereum contract address (0x-prefixed hex string).
 *
 * Must be a valid Ethereum address format (42 characters: `0x` + 40 hex digits).
 *
 * @example
 * ```typescript
 * const address: ContractAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
 * ```
 */
export type ContractAddress = string;

/**
 * Ethereum transaction hash (0x-prefixed hex string).
 *
 * Represents a transaction hash on the blockchain (66 characters: `0x` + 64 hex digits).
 *
 * @example
 * ```typescript
 * const txHash: TransactionHash = '0xabc123...';
 * ```
 */
export type TransactionHash = string;

/**
 * Candidate vote tally from blockchain.
 *
 * Vote counts are returned as strings from the blockchain contract because
 * Ethereum uses BigInt values that may exceed JavaScript's Number.MAX_SAFE_INTEGER.
 *
 * @example
 * ```typescript
 * const tally: CandidateTally = {
 *   name: 'John Doe',
 *   votes: '150'
 * };
 *
 * // Convert to number for display
 * const voteCount = parseInt(tally.votes, 10);
 * ```
 */
export interface CandidateTally {
  /** Candidate name as stored in the smart contract */
  name: string;
  /** Vote count as string (from blockchain BigInt) */
  votes: string;
}

/**
 * Position result with candidate tallies from blockchain.
 *
 * Represents all vote counts for a single position, including
 * tallies for each candidate in that position.
 *
 * @example
 * ```typescript
 * const result: PositionResult = {
 *   name: 'President',
 *   candidates: [
 *     { name: 'John Doe', votes: '150' },
 *     { name: 'Jane Smith', votes: '120' }
 *   ]
 * };
 * ```
 */
export interface PositionResult {
  /** Position name as stored in the smart contract */
  name: string;
  /** Array of candidate vote tallies, one per candidate */
  candidates: CandidateTally[];
}

/**
 * Response from contract deployment endpoint.
 *
 * Returned when a new election smart contract is deployed to the blockchain.
 */
export interface DeploymentResponse {
  /** Whether deployment was successful */
  success: boolean;
  /** Election ID associated with the contract */
  electionId: string;
  /** Deployed contract address on the blockchain */
  contractAddress: ContractAddress;
  /** Transaction hash of the deployment transaction */
  txHash: string;
  /** Status message */
  message: string;
}

/**
 * Response from vote casting endpoint.
 *
 * Returned after successfully casting votes on the blockchain.
 */
export interface VoteResponse {
  /** Whether vote was successfully cast */
  success: boolean;
  /** Blockchain transaction hash (proof of vote) */
  txHash: TransactionHash;
  /** Number of votes processed */
  votesProcessed: number;
  /** ISO timestamp of when the vote was cast */
  timestamp?: string;
}

/**
 * Response containing all votes from blockchain.
 *
 * Complete vote tallies for all positions and candidates from the contract.
 */
export interface VotesResponse {
  /** Array of position results with candidate tallies */
  positions: PositionResult[];
  /** Contract address from which votes were retrieved */
  contractAddress: ContractAddress;
}

/**
 * Single vote input for blockchain contract.
 *
 * Represents one vote selection: a candidate for a specific position.
 *
 * @example
 * ```typescript
 * const vote: VoteInput = {
 *   position: 'President',
 *   candidate: 'John Doe'
 * };
 * ```
 */
export interface VoteInput {
  /** Position name */
  position: string;
  /** Candidate name */
  candidate: string;
}

/**
 * Position input for contract deployment.
 *
 * Used when deploying a new election contract. Defines a position
 * and its candidates.
 *
 * @example
 * ```typescript
 * const position: PositionInput = {
 *   name: 'President',
 *   candidates: [
 *     { name: 'John Doe' },
 *     { name: 'Jane Smith' }
 *   ]
 * };
 * ```
 */
export interface PositionInput {
  /** Position name */
  name: string;
  /** Array of candidate objects (each with a name) */
  candidates: Array<{ name: string }>;
}
