/**
 * Blockchain provider utilities
 * Creates and manages Ethereum providers and wallets
 */

import { JsonRpcProvider, Wallet } from 'ethers';
import { blockchainConfig } from '@/config/blockchain';

/**
 * Create a read-only JSON RPC provider
 */
export function createProvider(): JsonRpcProvider {
  return new JsonRpcProvider(blockchainConfig.rpcUrl);
}

/**
 * Create a wallet instance from the configured private key
 */
export function createWallet(): Wallet {
  const provider = createProvider();
  return new Wallet(blockchainConfig.privateKey, provider);
}

/**
 * Create a wallet with a custom provider
 */
export function createWalletWithProvider(provider: JsonRpcProvider): Wallet {
  return new Wallet(blockchainConfig.privateKey, provider);
}

