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
   console.log(`Checking environment variable: ${key}: ${value}`);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please set it in your .env.local file.`
    );
  }
}

export const blockchainConfig = {
  rpcUrl: requiredEnvVars.SEPOLIA_RPC_URL!,
  privateKey: requiredEnvVars.ORGANIZER_PRIVATE_KEY!,
  network: 'sepolia' as const,
  chainId: 11155111,
} as const;



