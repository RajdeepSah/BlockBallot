/**
 * Blockchain provider utilities
 * Creates and manages Ethereum providers and wallets
 */

import { JsonRpcProvider, Wallet } from 'ethers';
import { blockchainConfig } from '@/config/blockchain';

/**
 * Creates a read-only JSON RPC provider for blockchain queries.
 * Uses the configured RPC URL from blockchain config.
 * 
 * @returns JsonRpcProvider instance
 */
export function createProvider(): JsonRpcProvider {
  return new JsonRpcProvider(blockchainConfig.rpcUrl);
}

/**
 * Creates a wallet instance from the configured private key.
 * Wallet can be used to sign transactions and deploy contracts.
 * 
 * @returns Wallet instance connected to the provider
 */
export function createWallet(): Wallet {
  const provider = createProvider();
  return new Wallet(blockchainConfig.privateKey, provider);
}

/**
 * Creates a wallet instance with a custom provider.
 * Useful when you need a wallet connected to a specific provider instance.
 * 
 * @param provider - Custom JsonRpcProvider to use
 * @returns Wallet instance connected to the custom provider
 */
export function createWalletWithProvider(provider: JsonRpcProvider): Wallet {
  return new Wallet(blockchainConfig.privateKey, provider);
}

