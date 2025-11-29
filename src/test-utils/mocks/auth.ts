/**
 * @module test-utils/mocks/auth
 * @category Testing
 *
 * Mock implementations of authentication utilities and context for testing.
 *
 * Provides factory functions to create mocked authentication contexts and
 * utilities that can be used in component tests without requiring real
 * authentication state or API calls.
 */

import { createMockUser } from './data';

/**
 * Interface matching the AuthContextType from AuthContext.
 * Used for type safety in mocks.
 */
export interface MockAuthContextType {
  user: { id: string; name: string; email: string; phone?: string } | null;
  token: string | null;
  login: jest.Mock;
  verify2FA: jest.Mock;
  register: jest.Mock;
  logout: jest.Mock;
  resendOTP: jest.Mock;
  loading: boolean;
}

/**
 * Creates a mocked authentication context value for testing.
 *
 * Returns a complete mock auth context with all methods as Jest mocks.
 * All methods are pre-configured to return successful responses by default.
 *
 * @param overrides - Optional properties to override default mock values
 * @returns Mock authentication context object
 *
 * @example
 * ```typescript
 * // Use default authenticated state
 * const mockAuth = createMockAuthContext();
 *
 * // Override to test unauthenticated state
 * const unauthenticatedAuth = createMockAuthContext({
 *   user: null,
 *   token: null
 * });
 *
 * // Override specific methods
 * mockAuth.login.mockResolvedValue({ requires2FA: false });
 * ```
 */
export function createMockAuthContext(
  overrides?: Partial<MockAuthContextType>
): MockAuthContextType {
  const defaultUser = createMockUser();

  return {
    user: defaultUser,
    token: 'test-access-token',
    login: jest.fn().mockResolvedValue({
      requires2FA: true,
      userId: defaultUser.id,
      email: defaultUser.email,
    }),
    verify2FA: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    resendOTP: jest.fn().mockResolvedValue(undefined),
    loading: false,
    ...overrides,
  };
}

/**
 * Creates a mock implementation of `getValidAccessToken` utility.
 *
 * Returns a Jest mock function that can be configured to return different
 * token values or simulate token refresh scenarios.
 *
 * @param token - Default token to return (default: `'test-access-token'`)
 * @returns Mock function for `getValidAccessToken`
 *
 * @example
 * ```typescript
 * const mockGetToken = createMockGetValidAccessToken('custom-token');
 * mockGetToken.mockResolvedValue('refreshed-token');
 * ```
 */
export function createMockGetValidAccessToken(token: string = 'test-access-token') {
  return jest.fn<() => Promise<string | null>>().mockResolvedValue(token);
}

/**
 * Creates a mock implementation of `authenticatedFetch` utility.
 *
 * Returns a Jest mock function that can be configured to return different
 * Response objects for testing various API scenarios.
 *
 * @param responseData - Default response data to return
 * @param status - Default HTTP status code (default: `200`)
 * @returns Mock function for `authenticatedFetch`
 *
 * @example
 * ```typescript
 * const mockFetch = createMockAuthenticatedFetch({ data: 'test' });
 * mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: 'Not found' }), {
 *   status: 404
 * }));
 * ```
 */
export function createMockAuthenticatedFetch(responseData: unknown = {}, status: number = 200) {
  return jest.fn<typeof import('@/utils/auth/errorHandler').authenticatedFetch>().mockResolvedValue(
    new Response(JSON.stringify(responseData), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

