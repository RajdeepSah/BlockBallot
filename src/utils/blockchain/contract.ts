/**
 * Contract instance utilities
 * Creates contract instances for interaction
 */

import { Contract } from 'ethers';
import { createProvider, createWallet } from './provider';
import { getContractABI } from './contractLoader';
import type { ContractAddress } from '@/types/blockchain';

/**
 * Create a read-only contract instance
 */
export function createReadOnlyContract(address: ContractAddress): Contract {
  const provider = createProvider();
  return new Contract(address, getContractABI(), provider);
}

/**
 * Create a writable contract instance (signed with wallet)
 */
export function createWritableContract(address: ContractAddress): Contract {
  const wallet = createWallet();
  return new Contract(address, getContractABI(), wallet);
}

