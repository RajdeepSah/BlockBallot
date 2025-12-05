/**
 * @module config/blockchain
 * @category Configuration
 *
 * Centralized blockchain configuration for Ethereum/Arbitrum network interactions.
 *
 * This module validates and exports blockchain-related environment variables
 * required for connecting to the blockchain network and signing transactions.
 *
 * **Required Environment Variables:**
 * - `SEPOLIA_RPC_URL` - JSON-RPC endpoint for the Arbitrum Sepolia testnet
 * - `ORGANIZER_PRIVATE_KEY` - Private key for the organizer wallet (server-side only)
 *
 * ## Usage
 *
 * ```typescript
 * import { blockchainConfig } from '@/config/blockchain';
 *
 * const provider = new JsonRpcProvider(blockchainConfig.rpcUrl);
 * const wallet = new Wallet(blockchainConfig.privateKey, provider);
 * ```
 *
 * @see {@link module:utils/blockchain/provider.createProvider} for provider creation utilities
 */

const requiredEnvVars = {
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
  ORGANIZER_PRIVATE_KEY: process.env.ORGANIZER_PRIVATE_KEY,
} as const;

// Validate required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` + `Please set it in your .env.local file.`
    );
  }
}

/**
 * Blockchain configuration object containing RPC URL, private key, and network details.
 * Validates required environment variables on module load.
 */
export const blockchainConfig = {
  rpcUrl: requiredEnvVars.SEPOLIA_RPC_URL!,
  privateKey: requiredEnvVars.ORGANIZER_PRIVATE_KEY!,
  network: 'sepolia' as const,
  chainId: 421614,
} as const;
