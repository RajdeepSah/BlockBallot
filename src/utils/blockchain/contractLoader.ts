/**
 * Contract artifact loader
 * Handles loading and parsing contract ABIs and bytecode
 */

import fs from 'fs';
import path from 'path';

const CONTRACT_NAME = 'BlockBallotSingle';
const ARTIFACTS_PATH = path.join(
  process.cwd(),
  'artifacts',
  'contracts',
  `${CONTRACT_NAME}.sol`,
  `${CONTRACT_NAME}.json`
);

// ABI fragment can be a function, event, or other contract element
type ABIFragment = Record<string, unknown>;

interface ContractArtifact {
  abi: ABIFragment[];
  bytecode: string;
}

let cachedArtifact: ContractArtifact | null = null;

/**
 * Load contract artifact from file system
 * Caches the result for subsequent calls
 */
export function loadContractArtifact(): ContractArtifact {
  if (cachedArtifact) {
    return cachedArtifact;
  }

  if (!fs.existsSync(ARTIFACTS_PATH)) {
    throw new Error(
      `Contract artifact not found at ${ARTIFACTS_PATH}. ` +
      `Please run 'npm run compile-contract' first.`
    );
  }

  try {
    const fileContent = fs.readFileSync(ARTIFACTS_PATH, 'utf-8');
    const artifact = JSON.parse(fileContent);
    
    if (!artifact.abi || !artifact.bytecode) {
      throw new Error('Invalid contract artifact: missing ABI or bytecode');
    }

    cachedArtifact = {
      abi: artifact.abi,
      bytecode: artifact.bytecode,
    };

    return cachedArtifact;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load contract artifact: ${errorMessage}`);
  }
}

/**
 * Get contract ABI
 */
export function getContractABI(): ABIFragment[] {
  return loadContractArtifact().abi;
}

/**
 * Get contract bytecode
 */
export function getContractBytecode(): string {
  return loadContractArtifact().bytecode;
}

