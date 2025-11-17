import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Get environment variables (after dotenv.config)
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const ORGANIZER_PRIVATE_KEY = process.env.ORGANIZER_PRIVATE_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC_URL,
      accounts: [ORGANIZER_PRIVATE_KEY],
      chainId: 11155111,
    },
    hardhat: {
      type: "edr-simulated",
      chainId: 31337,
    }
  },
  // This is to make sure Hardhat's artifacts are in a known location
  paths: {
    artifacts: "./artifacts",
  },
};

export default config;