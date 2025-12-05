/**
 * @module utils/blockchain/contractLoader
 * @category Blockchain
 *
 * Contract artifact loader for loading and parsing smart contract ABIs and bytecode.
 *
 * This module handles loading the compiled contract artifact from the Hardhat
 * compilation output. The artifact contains:
 * - **ABI** (Application Binary Interface): Function signatures and event definitions
 * - **Bytecode**: Compiled contract code for deployment
 *
 * Artifacts are cached in memory after first load to improve performance.
 * The artifact file is expected at: `artifacts/contracts/BlockBallotSingle.sol/BlockBallotSingle.json`
 *
 * ## Usage
 *
 * ```typescript
 * import { getContractABI, getContractBytecode } from '@/utils/blockchain/contractLoader';
 *
 * // Get ABI for contract interaction
 * const abi = getContractABI();
 *
 * // Get bytecode for deployment
 * const bytecode = getContractBytecode();
 * ```
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
 * @internal
 */
type ABIFragment = Record<string, unknown>;

/**
 * Contract artifact containing ABI and bytecode.
 * @internal
 */
interface ContractArtifact {
  abi: ABIFragment[];
  bytecode: string;
}

let cachedArtifact: ContractArtifact | null = null;

/**
 * Loads the contract artifact from the file system.
 *
 * Reads the compiled contract artifact JSON file and parses it. The result
 * is cached in memory for subsequent calls. If the artifact file doesn't exist,
 * a helpful error message suggests running `npm run compile-contract`.
 *
 * @returns Contract artifact object containing `abi` and `bytecode`
 * @throws {Error} If artifact file is missing, cannot be read, or is invalid (missing ABI/bytecode)
 *
 * @example
 * ```typescript
 * try {
 *   const artifact = loadContractArtifact();
 *   console.log('ABI loaded:', artifact.abi.length, 'functions');
 *   console.log('Bytecode length:', artifact.bytecode.length);
 * } catch (error) {
 *   console.error('Failed to load artifact:', error.message);
 *   // Error might be: "Contract artifact not found at ... Please run 'npm run compile-contract' first."
 * }
 * ```
 *
 * @see {@link getContractABI} to get just the ABI
 * @see {@link getContractBytecode} to get just the bytecode
 * @category Blockchain
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
 *
 * Returns the ABI array which contains function signatures, event definitions,
 * and other contract interface information. The artifact is loaded and cached
 * if not already loaded.
 *
 * @returns Array of ABI fragments (functions, events, etc.)
 * @throws {Error} If contract artifact cannot be loaded
 *
 * @example
 * ```typescript
 * const abi = getContractABI();
 *
 * // Use ABI to create contract instance
 * const contract = new Contract(address, abi, provider);
 * ```
 *
 * @see {@link loadContractArtifact} to get the full artifact
 * @see {@link getContractBytecode} to get the bytecode
 * @category Blockchain
 */
export function getContractABI(): ABIFragment[] {
  return loadContractArtifact().abi;
}

/**
 * Gets the contract bytecode for deployment.
 *
 * Returns the compiled contract bytecode as a hexadecimal string. This is
 * used when deploying new contract instances. The artifact is loaded and
 * cached if not already loaded.
 *
 * @returns Contract bytecode as hex string (starts with `0x`)
 * @throws {Error} If contract artifact cannot be loaded
 *
 * @example
 * ```typescript
 * const bytecode = getContractBytecode();
 *
 * // Deploy contract
 * const factory = new ContractFactory(abi, bytecode, wallet);
 * const contract = await factory.deploy(positions, candidates);
 * ```
 *
 * @see {@link loadContractArtifact} to get the full artifact
 * @see {@link getContractABI} to get the ABI
 * @category Blockchain
 */
export function getContractBytecode(): string {
  return loadContractArtifact().bytecode;
}
