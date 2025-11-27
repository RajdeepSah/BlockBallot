/**
 * Contract instance utilities
 * Creates contract instances for interaction
 */

import { Contract } from 'ethers';
import { createProvider, createWallet } from './provider';
import { getContractABI } from './contractLoader';
import type { ContractAddress } from '@/types/blockchain';

/**
 * Creates a read-only contract instance for querying blockchain state.
 * Cannot be used to send transactions.
 *
 * @param address - The contract address
 * @returns Contract instance for read-only operations
 */
export function createReadOnlyContract(address: ContractAddress): Contract {
  const provider = createProvider();
  return new Contract(address, getContractABI(), provider);
}

/**
 * Creates a writable contract instance that can send transactions.
 * Contract is connected to a wallet for signing transactions.
 *
 * @param address - The contract address
 * @returns Contract instance for write operations (voting, etc.)
 */
export function createWritableContract(address: ContractAddress): Contract {
  const wallet = createWallet();
  return new Contract(address, getContractABI(), wallet);
}
