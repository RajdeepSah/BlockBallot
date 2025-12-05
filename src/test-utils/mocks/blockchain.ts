/**
 * @module test-utils/mocks/blockchain
 * @category Testing
 * @internal
 *
 * Mock implementations of blockchain utilities for testing.
 *
 * Provides factory functions to create mocked blockchain contracts and
 * transactions that can be used in tests without requiring real
 * blockchain connections or wallet signatures.
 */

/**
 * Mock blockchain transaction object.
 *
 * Mimics the structure of an ethers.js transaction response.
 */
export interface MockTransaction {
  /** Transaction hash */
  hash: string;
  /** Mock wait function that resolves when transaction is mined */
  wait: jest.Mock<Promise<Record<string, unknown>>>;
}

/**
 * Mock blockchain contract object.
 *
 * Mimics the structure of the BlockBallotSingle contract.
 */
export interface MockContract {
  /** Mock castVotes function for submitting votes */
  castVotes: jest.Mock<Promise<MockTransaction>>;
}

/**
 * Configuration options for creating a mock transaction.
 */
export interface MockTransactionOptions {
  /** Transaction hash (default: '0xabc123def456789') */
  hash?: string;
  /** Value returned by wait() (default: empty object) */
  waitResult?: Record<string, unknown>;
  /** Whether wait() should reject (default: false) */
  waitRejects?: boolean;
  /** Error to throw if waitRejects is true */
  waitError?: Error;
}

/**
 * Configuration options for creating a mock contract.
 */
export interface MockContractOptions {
  /** Transaction options for castVotes result */
  transaction?: MockTransactionOptions;
  /** Whether castVotes should reject (default: false) */
  castVotesRejects?: boolean;
  /** Error to throw if castVotesRejects is true */
  castVotesError?: Error;
}

/**
 * Creates a mock blockchain transaction for testing.
 *
 * Returns a mock transaction object that mimics an ethers.js transaction
 * response with a configurable hash and wait() behavior.
 *
 * @param options - Configuration options for the mock transaction
 * @returns Mock transaction object
 *
 * @example
 * ```typescript
 * // Create default transaction
 * const tx = createMockTransaction();
 * expect(tx.hash).toBe('0xabc123def456789');
 *
 * // Create with custom hash
 * const customTx = createMockTransaction({ hash: '0x123...' });
 *
 * // Create transaction that fails on wait
 * const failingTx = createMockTransaction({
 *   waitRejects: true,
 *   waitError: new Error('Transaction reverted')
 * });
 * ```
 */
export function createMockTransaction(
  options?: MockTransactionOptions
): MockTransaction {
  const {
    hash = '0xabc123def456789',
    waitResult = {},
    waitRejects = false,
    waitError = new Error('Transaction failed'),
  } = options || {};

  const waitMock = waitRejects
    ? jest.fn<Promise<Record<string, unknown>>, []>().mockRejectedValue(waitError)
    : jest.fn<Promise<Record<string, unknown>>, []>().mockResolvedValue(waitResult);

  return {
    hash,
    wait: waitMock,
  };
}

/**
 * Creates a mock blockchain contract for testing.
 *
 * Returns a mock contract object that mimics the BlockBallotSingle contract
 * with configurable castVotes() behavior.
 *
 * @param options - Configuration options for the mock contract
 * @returns Mock contract object
 *
 * @example
 * ```typescript
 * // Create default contract
 * const contract = createMockContract();
 * const tx = await contract.castVotes(['President'], ['John Doe']);
 * expect(tx.hash).toBe('0xabc123def456789');
 *
 * // Create contract that fails
 * const failingContract = createMockContract({
 *   castVotesRejects: true,
 *   castVotesError: new Error('Insufficient gas')
 * });
 * ```
 */
export function createMockContract(options?: MockContractOptions): MockContract {
  const {
    transaction,
    castVotesRejects = false,
    castVotesError = new Error('Transaction failed'),
  } = options || {};

  const mockTx = createMockTransaction(transaction);

  const castVotesMock = castVotesRejects
    ? jest.fn<Promise<MockTransaction>, [string[], string[]]>().mockRejectedValue(castVotesError)
    : jest.fn<Promise<MockTransaction>, [string[], string[]]>().mockResolvedValue(mockTx);

  return {
    castVotes: castVotesMock,
  };
}

/**
 * Type helper for the mocked contract.
 * Useful for TypeScript type checking in tests.
 */
export type { MockContract as MockBlockchainContract };

