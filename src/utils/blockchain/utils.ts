/**
 * @module utils/blockchain/utils
 * @category Blockchain
 *
 * Blockchain utility functions for common operations.
 *
 * This module provides helper functions for blockchain-related tasks such as
 * generating explorer URLs for viewing transactions and contract addresses.
 */

/**
 * Generates an Etherscan (or Arbiscan) URL for viewing a transaction or contract address.
 *
 * Creates a URL to view blockchain data on the explorer. Supports different
 * blockchain networks by changing the base URL.
 *
 * @param hash - Transaction hash or contract address (0x-prefixed hex string)
 * @param type - Type of URL to generate: `'tx'` for transaction, `'address'` for contract
 * @param base - Base URL for the blockchain explorer (default: `'sepolia.arbiscan.io'`)
 * @returns Full URL to view the transaction or address on the explorer
 *
 * @example
 * ```typescript
 * // Get transaction URL
 * const txUrl = getEtherscanUrl('0xabc123...', 'tx');
 * // Returns: "https://sepolia.arbiscan.io/tx/0xabc123..."
 *
 * // Get contract address URL
 * const contractUrl = getEtherscanUrl('0x742d35...', 'address');
 * // Returns: "https://sepolia.arbiscan.io/address/0x742d35..."
 *
 * // Use different explorer
 * const customUrl = getEtherscanUrl('0xabc123...', 'tx', 'etherscan.io');
 * ```
 *
 * @category Blockchain
 */
export function getEtherscanUrl(
  hash: string,
  type: 'tx' | 'address',
  base = 'sepolia.arbiscan.io'
): string {
  return `https://${base}/${type}/${hash}`;
}
