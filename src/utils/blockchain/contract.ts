/**
 * @module utils/blockchain/contract
 * @category Blockchain
 *
 * Contract instance utilities for creating and managing Ethereum contract interactions.
 *
 * This module provides functions to create contract instances for:
 * - **Read-only operations**: Querying contract state (vote counts, positions, candidates)
 * - **Write operations**: Sending transactions (casting votes, deploying contracts)
 *
 * Contract instances are created using ethers.js and are connected to either
 * a provider (read-only) or a wallet (writable) depending on the operation type.
 *
 * ## Usage
 *
 * ```typescript
 * import { createReadOnlyContract, createWritableContract } from '@/utils/blockchain/contract';
 *
 * // Read vote counts
 * const readContract = createReadOnlyContract('0x1234...');
 * const votes = await readContract.getVoteCount('President', 'John Doe');
 *
 * // Cast a vote (requires wallet)
 * const writeContract = createWritableContract('0x1234...');
 * await writeContract.castVotes([...]);
 * ```
 */

import { Contract } from 'ethers';
import { createProvider, createWallet } from './provider';
import { getContractABI } from './contractLoader';
import type { ContractAddress } from '@/types/blockchain';

/**
 * Creates a read-only contract instance for querying blockchain state.
 *
 * This contract instance is connected to a provider only and **cannot** be used
 * to send transactions. Use this for reading contract state such as:
 * - Vote counts
 * - Position and candidate lists
 * - Contract metadata
 *
 * All operations are read-only and do not require gas or signing.
 *
 * @param address - The contract address (must be a valid Ethereum address)
 * @returns Contract instance for read-only operations (connected to provider)
 *
 * @example
 * ```typescript
 * const contract = createReadOnlyContract('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 *
 * // Read vote count
 * const votes = await contract.getVoteCount('President', 'John Doe');
 *
 * // Get all positions
 * const positions = await contract.getPositionList();
 * ```
 *
 * @see {@link createWritableContract} for write operations
 * @see {@link createProvider} for provider creation
 * @category Blockchain
 */
export function createReadOnlyContract(address: ContractAddress): Contract {
  const provider = createProvider();
  return new Contract(address, getContractABI(), provider);
}

/**
 * Creates a writable contract instance that can send transactions.
 *
 * This contract instance is connected to a wallet and **can** be used to send
 * transactions. Use this for write operations such as:
 * - Casting votes
 * - Deploying contracts
 * - Any state-changing operations
 *
 * All operations require gas and will create blockchain transactions.
 * The wallet is configured from environment variables (ORGANIZER_PRIVATE_KEY).
 *
 * @param address - The contract address (must be a valid Ethereum address)
 * @returns Contract instance for write operations (connected to wallet)
 *
 * @example
 * ```typescript
 * const contract = createWritableContract('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 *
 * // Cast votes (requires gas, creates transaction)
 * const tx = await contract.castVotes([
 *   { position: 'President', candidate: 'John Doe' }
 * ]);
 * await tx.wait(); // Wait for transaction confirmation
 * ```
 *
 * @see {@link createReadOnlyContract} for read-only operations
 * @see {@link createWallet} for wallet creation
 * @category Blockchain
 */
export function createWritableContract(address: ContractAddress): Contract {
  const wallet = createWallet();
  return new Contract(address, getContractABI(), wallet);
}
