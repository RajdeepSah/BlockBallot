/**
 * @jest-environment node
 * 
 * Comprehensive Jest unit test suite for POST /api/vote route handler.
 * 
 * This test suite achieves 100% statement coverage and high cyclomatic complexity
 * coverage by testing all code paths in the vote route handler.
 * 
 * @module app/api/vote/__tests__/route.test
 */

import { NextRequest } from 'next/server';
import { POST } from '../route';
import type { Contract } from 'ethers';
import type { VoteInput } from '@/types/blockchain';
import type {
  UserRecord,
  EligibilityRecord,
  BallotLinkRecord,
  VoteTransactionRecord,
} from '@/types/kv-records';

// Mock all external dependencies
jest.mock('@/utils/api/auth', () => ({
  authenticateUser: jest.fn(),
}));

jest.mock('@/utils/validation', () => ({
  validateContractAddress: jest.fn(),
  validateVotesArray: jest.fn(),
}));

jest.mock('@/utils/blockchain/contract', () => ({
  createWritableContract: jest.fn(),
}));

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/utils/supabase/kvStore', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  getByPrefix: jest.fn(),
}));

// Import mocked functions
import { authenticateUser } from '@/utils/api/auth';
import { validateContractAddress, validateVotesArray } from '@/utils/validation';
import { createWritableContract } from '@/utils/blockchain/contract';
import { createClient } from '@/utils/supabase/server';
import * as kv from '@/utils/supabase/kvStore';

// Type the mocked functions
const mockAuthenticateUser = authenticateUser as jest.MockedFunction<typeof authenticateUser>;
const mockValidateContractAddress = validateContractAddress as jest.MockedFunction<
  typeof validateContractAddress
>;
const mockValidateVotesArray = validateVotesArray as jest.MockedFunction<typeof validateVotesArray>;
const mockCreateWritableContract = createWritableContract as jest.MockedFunction<
  typeof createWritableContract
>;
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockKvGet = kv.get as jest.MockedFunction<typeof kv.get>;
const mockKvSet = kv.set as jest.MockedFunction<typeof kv.set>;
const mockKvDel = kv.del as jest.MockedFunction<typeof kv.del>;
const mockKvGetByPrefix = kv.getByPrefix as jest.MockedFunction<typeof kv.getByPrefix>;

describe('POST /api/vote', () => {
  // Test data constants
  const mockUserId = 'user-123';
  const mockUserEmail = 'test@example.com';
  const mockElectionId = 'election-456';
  const mockContractAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const mockTxHash = '0xabc123def456789';
  const mockAuthHeader = 'Bearer mock-token';

  // Type for Supabase query builder mock (supports method chaining)
  interface MockSupabaseQueryBuilder {
    from: jest.Mock<MockSupabaseQueryBuilder>;
    select: jest.Mock<MockSupabaseQueryBuilder>;
    eq: jest.Mock<MockSupabaseQueryBuilder>;
    single: jest.Mock<Promise<{ data: unknown; error: unknown | null }>>;
  }

  // Type for Supabase client mock
  interface MockSupabaseClient {
    from: jest.Mock<MockSupabaseQueryBuilder>;
  }

  // Mock Supabase client chain
  const createMockSupabaseClient = (): MockSupabaseClient => {
    const mockQueryBuilder: MockSupabaseQueryBuilder = {
      from: jest.fn<MockSupabaseQueryBuilder, []>().mockReturnThis(),
      select: jest.fn<MockSupabaseQueryBuilder, []>().mockReturnThis(),
      eq: jest.fn<MockSupabaseQueryBuilder, []>().mockReturnThis(),
      single: jest.fn<Promise<{ data: unknown; error: unknown | null }>, []>(),
    };
    return {
      from: jest.fn<MockSupabaseQueryBuilder, []>().mockReturnValue(mockQueryBuilder),
    };
  };

  // Type for transaction mock
  type MockTransaction = {
    hash: string;
    wait: jest.Mock<Promise<unknown>>;
  };

  // Type for contract mock
  type MockContract = {
    castVotes: jest.Mock<Promise<MockTransaction>>;
  };

  // Mock blockchain contract
  const createMockContract = (): MockContract => {
    const mockTx: MockTransaction = {
      hash: mockTxHash,
      wait: jest.fn().mockResolvedValue({}),
    };
    return {
      castVotes: jest.fn().mockResolvedValue(mockTx),
    };
  };

  // Helper to create NextRequest
  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: mockAuthHeader,
      },
      body: JSON.stringify(body),
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Test Case 1: Valid Vote Submission (Happy Path)', () => {
    it('should successfully cast a vote and return 200 OK', async () => {
      const mockVotes: VoteInput[] = [
        { position: 'President', candidate: 'John Doe' },
        { position: 'Vice President', candidate: 'Jane Smith' },
      ];

      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        ends_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
        name: 'Test User',
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockContract = createMockContract();
      const mockSupabaseClient = createMockSupabaseClient();

      // Setup mocks
      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateWritableContract.mockReturnValue(mockContract as unknown as Contract);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      // Mock kv.get calls in the order they occur in the route handler:
      // 1. User data: kv.get(`user:${user.id}`)
      // 2. Eligibility: kv.get(`eligibility:${electionId}:${userData.email}`)
      // 3. Final vote check (first): kv.get(finalVoteKey)
      // 4. Final vote check (second, after lock): kv.get(finalVoteKey)
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // 1. User data
        .mockResolvedValueOnce(mockEligibility) // 2. Eligibility
        .mockResolvedValueOnce(undefined) // 3. Final vote check (first)
        .mockResolvedValueOnce(undefined); // 4. Final vote check (second, after lock)
      mockKvGetByPrefix.mockResolvedValue([]); // No existing locks
      mockKvSet.mockResolvedValue(undefined);
      mockKvDel.mockResolvedValue(undefined);

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: mockVotes,
      });

      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        txHash: mockTxHash,
        votesProcessed: 2,
        timestamp: expect.any(String),
      });

      // Verify function calls
      expect(mockAuthenticateUser).toHaveBeenCalledWith(mockAuthHeader);
      expect(mockValidateContractAddress).toHaveBeenCalledWith(mockContractAddress);
      expect(mockValidateVotesArray).toHaveBeenCalledWith(mockVotes);
      expect(mockContract.castVotes).toHaveBeenCalledWith(
        ['President', 'Vice President'],
        ['John Doe', 'Jane Smith']
      );
      expect(mockKvSet).toHaveBeenCalledTimes(3); // Lock, vote flag, transaction registry
      expect(mockKvDel).toHaveBeenCalledTimes(1); // Lock cleanup
    });
  });

  describe('Test Case 2: Missing Authentication Token', () => {
    it('should return 500 when authenticateUser throws', async () => {
      mockAuthenticateUser.mockRejectedValue(new Error('Unauthorized'));

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Unauthorized');
    });
  });

  describe('Test Case 3: Invalid Contract Address', () => {
    it('should return 400 when contract address is invalid', async () => {
      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockImplementation(() => {
        throw new Error('Invalid contract address format: invalid-address');
      });

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: 'invalid-address',
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid contract address format: invalid-address');
    });
  });

  describe('Test Case 4: Invalid Vote Format', () => {
    it('should return 400 when votes, positions, and candidates are all missing', async () => {
      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        // Missing votes, positions, and candidates
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Either 'position' and 'candidate' or 'votes' array is required.");
    });
  });

  describe('Test Case 5: Empty Votes Array', () => {
    it('should return 400 when votes array is empty', async () => {
      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockImplementation(() => {
        throw new Error('At least one vote is required');
      });

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('At least one vote is required');
    });
  });

  describe('Test Case 6: Election Not Found', () => {
    it('should return 404 when election does not exist', async () => {
      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('Election not found');
    });
  });

  describe('Test Case 7: Election Not Started Yet', () => {
    it('should return 400 when election has not started', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        ends_at: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Election has not started yet');
    });
  });

  describe('Test Case 8: Election Ended', () => {
    it('should return 400 when election has ended', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        ends_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Election has ended');
    });
  });

  describe('Test Case 9: User Data Not Found', () => {
    it('should return 404 when user data is not found in KV store', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet.mockResolvedValue(undefined); // User data not found

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.error).toBe('User data not found');
    });
  });

  describe('Test Case 10: No Eligibility Record', () => {
    it('should return 403 when user has no eligibility record', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(undefined); // Eligibility not found

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('You are not eligible to vote in this election');
    });
  });

  describe('Test Case 11: Eligibility Status Not Approved', () => {
    it('should return 403 when eligibility status is denied', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'denied',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility); // Eligibility with denied status

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.error).toBe('You are not eligible to vote in this election');
    });
  });

  describe('Test Case 12: User Already Voted (Final Vote Exists)', () => {
    it('should return 400 when user has already voted (final vote exists)', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockFinalVote: BallotLinkRecord = {
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility
        .mockResolvedValueOnce(mockFinalVote); // Final vote exists
      mockKvGetByPrefix.mockResolvedValue([]);

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('You have already voted in this election');
    });
  });

  describe('Test Case 13: User Already Voted (Existing Locks)', () => {
    it('should return 400 when existing locks are found', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockExistingLock: BallotLinkRecord = {
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility); // Eligibility
      mockKvGetByPrefix.mockResolvedValue([mockExistingLock]); // Existing locks found
      mockKvGet.mockResolvedValueOnce(undefined); // Final vote check

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('You have already voted in this election');
    });
  });

  describe('Test Case 14: Final Vote Created During Lock (Race Condition)', () => {
    it('should detect race condition and clean up lock', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockFinalVote: BallotLinkRecord = {
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility
        .mockResolvedValueOnce(undefined) // First final vote check (before lock)
        .mockResolvedValueOnce(mockFinalVote); // Second final vote check (after lock - race condition!)
      mockKvGetByPrefix.mockResolvedValue([]); // No existing locks
      mockKvSet.mockResolvedValue(undefined);

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('You have already voted in this election');

      // Verify lock was created and then deleted
      expect(mockKvSet).toHaveBeenCalled(); // Lock was set
      expect(mockKvDel).toHaveBeenCalled(); // Lock was cleaned up
    });
  });

  describe('Test Case 15: Blockchain Transaction Failure', () => {
    it('should handle blockchain transaction failure and clean up lock', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockContract = createMockContract();
      const mockSupabaseClient = createMockSupabaseClient();

      // Make castVotes throw an error
      mockContract.castVotes.mockRejectedValue(
        new Error('Transaction failed: insufficient gas')
      );

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateWritableContract.mockReturnValue(mockContract as unknown as Contract);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility
        .mockResolvedValueOnce(undefined) // Final vote check (first)
        .mockResolvedValueOnce(undefined); // Final vote check (second)
      mockKvGetByPrefix.mockResolvedValue([]); // No existing locks
      mockKvSet.mockResolvedValue(undefined);
      mockKvDel.mockResolvedValue(undefined);

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Transaction failed: insufficient gas');

      // Verify lock was cleaned up
      expect(mockKvDel).toHaveBeenCalled();
    });
  });

  describe('Test Case 16: Legacy Format with Candidate Arrays', () => {
    it('should transform legacy format with candidate arrays correctly', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockContract = createMockContract();
      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateWritableContract.mockReturnValue(mockContract as unknown as Contract);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility
        .mockResolvedValueOnce(undefined) // Final vote check (first)
        .mockResolvedValueOnce(undefined); // Final vote check (second)
      mockKvGetByPrefix.mockResolvedValue([]);
      mockKvSet.mockResolvedValue(undefined);
      mockKvDel.mockResolvedValue(undefined);

      // Legacy format: positions array and candidates as array of arrays
      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        positions: ['President', 'Vice President'],
        candidates: [['John Doe', 'Jane Smith'], ['Bob Johnson']],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify castVotes was called with flattened arrays
      // President -> John Doe, Jane Smith
      // Vice President -> Bob Johnson
      expect(mockContract.castVotes).toHaveBeenCalledWith(
        ['President', 'President', 'Vice President'],
        ['John Doe', 'Jane Smith', 'Bob Johnson']
      );
    });
  });

  describe('Test Case 17: Legacy Format with Single Candidates', () => {
    it('should transform legacy format with single candidates correctly', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockContract = createMockContract();
      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateWritableContract.mockReturnValue(mockContract as unknown as Contract);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility
        .mockResolvedValueOnce(undefined) // Final vote check (first)
        .mockResolvedValueOnce(undefined); // Final vote check (second)
      mockKvGetByPrefix.mockResolvedValue([]);
      mockKvSet.mockResolvedValue(undefined);
      mockKvDel.mockResolvedValue(undefined);

      // Legacy format: positions array and candidates as string array
      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        positions: ['President', 'Vice President'],
        candidates: ['John Doe', 'Bob Johnson'],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify castVotes was called correctly
      expect(mockContract.castVotes).toHaveBeenCalledWith(
        ['President', 'Vice President'],
        ['John Doe', 'Bob Johnson']
      );
    });
  });

  describe('Test Case 18: Single Vote Format', () => {
    it('should transform single vote format correctly', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'approved',
        created_at: new Date().toISOString(),
      };

      const mockContract = createMockContract();
      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateWritableContract.mockReturnValue(mockContract as unknown as Contract);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility
        .mockResolvedValueOnce(undefined) // Final vote check (first)
        .mockResolvedValueOnce(undefined); // Final vote check (second)
      mockKvGetByPrefix.mockResolvedValue([]);
      mockKvSet.mockResolvedValue(undefined);
      mockKvDel.mockResolvedValue(undefined);

      // Single vote format: positions and candidates as strings
      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        positions: 'President',
        candidates: 'John Doe',
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);

      // Verify castVotes was called correctly
      expect(mockContract.castVotes).toHaveBeenCalledWith(['President'], ['John Doe']);
    });
  });

  describe('Test Case 19: Eligibility Status Preapproved', () => {
    it('should accept preapproved eligibility status like approved', async () => {
      const mockElection = {
        id: mockElectionId,
        starts_at: new Date(Date.now() - 86400000).toISOString(),
        ends_at: new Date(Date.now() + 86400000).toISOString(),
      };

      const mockUserData: UserRecord = {
        id: mockUserId,
        email: mockUserEmail,
      };

      const mockEligibility: EligibilityRecord = {
        election_id: mockElectionId,
        contact: mockUserEmail,
        status: 'preapproved', // Preapproved status
        created_at: new Date().toISOString(),
      };

      const mockContract = createMockContract();
      const mockSupabaseClient = createMockSupabaseClient();

      mockAuthenticateUser.mockResolvedValue({ id: mockUserId, email: mockUserEmail });
      mockValidateContractAddress.mockReturnValue(undefined);
      mockValidateVotesArray.mockReturnValue(undefined);
      mockCreateWritableContract.mockReturnValue(mockContract as unknown as Contract);
      mockCreateClient.mockResolvedValue(mockSupabaseClient as Awaited<ReturnType<typeof createClient>>);
      const mockQueryBuilder = mockSupabaseClient.from();
      mockQueryBuilder.single.mockResolvedValue({
        data: mockElection,
        error: null,
      });
      mockKvGet
        .mockResolvedValueOnce(mockUserData) // User data
        .mockResolvedValueOnce(mockEligibility) // Eligibility with preapproved status
        .mockResolvedValueOnce(undefined) // Final vote check (first)
        .mockResolvedValueOnce(undefined); // Final vote check (second)
      mockKvGetByPrefix.mockResolvedValue([]);
      mockKvSet.mockResolvedValue(undefined);
      mockKvDel.mockResolvedValue(undefined);

      const request = createRequest({
        electionId: mockElectionId,
        contractAddress: mockContractAddress,
        votes: [{ position: 'President', candidate: 'John Doe' }],
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.txHash).toBe(mockTxHash);
    });
  });
});

