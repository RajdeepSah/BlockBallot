/**
 * @module test-utils/mocks/supabase
 * @category Testing
 * @internal
 *
 * Mock implementations of Supabase client utilities for testing.
 *
 * Provides factory functions to create mocked Supabase clients that can be
 * used in tests without requiring real database connections or credentials.
 */

/**
 * Creates a mock Supabase client for testing.
 *
 * Returns a Jest mock object that mimics the structure of a Supabase client.
 * The client includes mock implementations for common Supabase operations
 * like `from()`, `auth`, etc.
 *
 * @param overrides - Optional properties to override default mock behavior
 * @returns Mock Supabase client object
 *
 * @example
 * ```typescript
 * const mockClient = createMockSupabaseClient();
 *
 * // Configure mock responses
 * mockClient.from.mockReturnValue({
 *   select: jest.fn().mockResolvedValue({ data: [], error: null }),
 *   insert: jest.fn().mockResolvedValue({ data: null, error: null }),
 * });
 * ```
 */
export function createMockSupabaseClient(overrides?: Record<string, unknown>) {
  return {
    /**
     * Mock `from()` method for table operations.
     * Returns a chainable query builder mock.
     */
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),

    /**
     * Mock `auth` namespace for authentication operations.
     */
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },

    /**
     * Mock `rpc()` method for stored procedure calls.
     */
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),

    ...overrides,
  };
}

/**
 * Creates a mock implementation of `getServiceRoleClient`.
 *
 * Returns a Jest mock function that returns a mock Supabase client with
 * service role permissions.
 *
 * @returns Mock function for `getServiceRoleClient`
 *
 * @example
 * ```typescript
 * const mockGetServiceClient = createMockGetServiceRoleClient();
 * const client = mockGetServiceClient();
 * ```
 */
export function createMockGetServiceRoleClient() {
  return jest.fn().mockReturnValue(
    createMockSupabaseClient() as unknown as ReturnType<typeof import('@/utils/supabase/clients').getServiceRoleClient>
  ) as jest.MockedFunction<typeof import('@/utils/supabase/clients').getServiceRoleClient>;
}

/**
 * Creates a mock implementation of `getAnonServerClient`.
 *
 * Returns a Jest mock function that returns a mock Supabase client with
 * anonymous permissions.
 *
 * @returns Mock function for `getAnonServerClient`
 *
 * @example
 * ```typescript
 * const mockGetAnonClient = createMockGetAnonServerClient();
 * const client = mockGetAnonClient();
 * ```
 */
export function createMockGetAnonServerClient() {
  return jest.fn().mockReturnValue(
    createMockSupabaseClient() as unknown as ReturnType<typeof import('@/utils/supabase/clients').getAnonServerClient>
  ) as jest.MockedFunction<typeof import('@/utils/supabase/clients').getAnonServerClient>;
}

