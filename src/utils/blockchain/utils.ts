/**
 * Generates an Etherscan (or Arbiscan) URL for viewing a transaction or contract address.
 *
 * @param hash - Transaction hash or contract address
 * @param type - Type of URL to generate ('tx' for transaction, 'address' for contract)
 * @param base - Base URL for the blockchain explorer (default: sepolia.arbiscan.io)
 * @returns Full URL to view the transaction or address on the explorer
 */
export function getEtherscanUrl(
  hash: string,
  type: 'tx' | 'address',
  base = 'sepolia.arbiscan.io'
): string {
  return `https://${base}/${type}/${hash}`;
}
