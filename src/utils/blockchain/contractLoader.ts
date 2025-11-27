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

/**
 * ABI fragment representing a contract function, event, or other element.
 */
type ABIFragment = Record<string, unknown>;

/**
 * Contract artifact containing ABI and bytecode.
 */
interface ContractArtifact {
  abi: ABIFragment[];
  bytecode: string;
}

let cachedArtifact: ContractArtifact | null = null;

/**
 * Loads the contract artifact from the file system.
 * Caches the result for subsequent calls to improve performance.
 * 
 * @returns Contract artifact containing ABI and bytecode
 * @throws Error if artifact file is missing or invalid
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
 * Gets the contract ABI (Application Binary Interface).
 * Loads and caches the artifact if not already loaded.
 * 
 * @returns Array of ABI fragments
 * @throws Error if contract artifact cannot be loaded
 */
export function getContractABI(): ABIFragment[] {
  return loadContractArtifact().abi;
}

/**
 * Gets the contract bytecode for deployment.
 * Loads and caches the artifact if not already loaded.
 * 
 * @returns Contract bytecode as hex string
 * @throws Error if contract artifact cannot be loaded
 */
export function getContractBytecode(): string {
  return loadContractArtifact().bytecode;
}

