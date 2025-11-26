/**
 * Generate Etherscan URL for a contract address
 */
export function getEtherscanUrl(hash: string, type:'tx'|'address',base='sepolia.arbiscan.io'): string {
  return `https://${base}/${type}/${hash}`;
}