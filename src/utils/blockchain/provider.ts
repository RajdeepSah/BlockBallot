/**
 * @module utils/blockchain/provider
 * @category Blockchain
 *
 * Blockchain provider utilities for creating and managing Ethereum providers and wallets.
 *
 * This module provides functions to create:
 * - **JSON RPC Providers**: For reading blockchain state (no signing capability)
 * - **Wallets**: For signing transactions and deploying contracts
 *
 * All functions use configuration from `@/config/blockchain` which reads from
 * environment variables (RPC URL, private key).
 *
 * ## Usage
 *
 * ```typescript
 * import { createProvider, createWallet } from '@/utils/blockchain/provider';
 *
 * // Create a provider for read operations
 * const provider = createProvider();
 * const blockNumber = await provider.getBlockNumber();
 *
 * // Create a wallet for write operations
 * const wallet = createWallet();
 * const balance = await wallet.provider.getBalance(wallet.address);
 * ```
 */

import { JsonRpcProvider, Wallet } from 'ethers';
import { blockchainConfig } from '@/config/blockchain';

/**
 * Creates a read-only JSON RPC provider for blockchain queries.
 *
 * The provider is connected to the configured RPC endpoint (from `SEPOLIA_RPC_URL`
 * environment variable). This provider can be used to:
 * - Query blockchain state (block numbers, balances, contract state)
 * - Read contract data (via contract instances)
 * - Listen to events
 *
 * **Note**: This provider cannot sign transactions. Use {@link createWallet} for write operations.
 *
 * @returns JsonRpcProvider instance connected to the configured RPC endpoint
 *
 * @example
 * ```typescript
 * const provider = createProvider();
 *
 * // Get current block number
 * const blockNumber = await provider.getBlockNumber();
 *
 * // Get balance of an address
 * const balance = await provider.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
 * ```
 *
 * @see {@link createWallet} for write operations
 * @see {@link module:utils/blockchain/contract.createReadOnlyContract} which uses this provider
 * @category Blockchain
 */
export function createProvider(): JsonRpcProvider {
  return new JsonRpcProvider(blockchainConfig.rpcUrl);
}

/**
 * Creates a wallet instance from the configured private key.
 *
 * The wallet is created from the `ORGANIZER_PRIVATE_KEY` environment variable
 * and is automatically connected to a provider. This wallet can be used to:
 * - Sign transactions
 * - Deploy contracts
 * - Send transactions to smart contracts
 *
 * **Security Note**: The private key should be kept secure and never exposed
 * in client-side code. This function is intended for server-side use only.
 *
 * @returns Wallet instance connected to the provider
 *
 * @example
 * ```typescript
 * const wallet = createWallet();
 *
 * // Get wallet address
 * console.log('Wallet address:', wallet.address);
 *
 * // Get wallet balance
 * const balance = await wallet.provider.getBalance(wallet.address);
 * ```
 *
 * @see {@link module:utils/blockchain/contract.createWritableContract} which uses this wallet
 * @see {@link createWalletWithProvider} to use a custom provider
 * @category Blockchain
 */
export function createWallet(): Wallet {
  const provider = createProvider();
  return new Wallet(blockchainConfig.privateKey, provider);
}

/**
 * Creates a wallet instance with a custom provider.
 *
 * Useful when you need a wallet connected to a specific provider instance
 * (e.g., for testing with a different RPC endpoint, or when you've already
 * created a provider and want to reuse it).
 *
 * @param provider - Custom JsonRpcProvider instance to connect the wallet to
 * @returns Wallet instance connected to the custom provider
 *
 * @example
 * ```typescript
 * // Create a custom provider
 * const customProvider = new JsonRpcProvider('https://custom-rpc-endpoint.com');
 *
 * // Create wallet with custom provider
 * const wallet = createWalletWithProvider(customProvider);
 * ```
 *
 * @see {@link createWallet} to use the default provider
 * @category Blockchain
 */
export function createWalletWithProvider(provider: JsonRpcProvider): Wallet {
  return new Wallet(blockchainConfig.privateKey, provider);
}
