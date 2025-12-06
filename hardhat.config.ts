import { HardhatUserConfig } from 'hardhat/config';
import * as dotenv from 'dotenv';
dotenv.config();

const SEPOLIA_RPC_URL: string | undefined = process.env.SEPOLIA_RPC_URL;
const ORGANIZER_PRIVATE_KEY: string | undefined = process.env.ORGANIZER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    hardhat: {
      type: 'edr-simulated',
      chainId: 31337,
    },
    // Only include sepolia network if environment variables are set
    ...(SEPOLIA_RPC_URL && ORGANIZER_PRIVATE_KEY
      ? {
          sepolia: {
            type: 'http',
            url: SEPOLIA_RPC_URL,
            accounts: [ORGANIZER_PRIVATE_KEY],
            chainId: 421614,
          },
        }
      : {}),
  },
  // This is to make sure Hardhat's artifacts are in a known location
  paths: {
    sources: './contracts',
    artifacts: './artifacts',
    cache: './cache',
    tests: './contracts/__tests__',
  },
};

export default config;
