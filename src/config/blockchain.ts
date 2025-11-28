/**
 * Centralized blockchain configuration
 * Validates and exports blockchain-related environment variables
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
