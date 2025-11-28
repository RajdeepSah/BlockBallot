const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const ORGANIZER_PRIVATE_KEY = process.env.ORGANIZER_PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
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
    artifacts: './artifacts',
  },
};

export default config;
