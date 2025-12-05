/**
 * @module test-utils/mocks/notifications
 * @category Testing
 * @internal
 *
 * Mock implementations of notification/toast utilities for testing.
 *
 * Provides mock implementations of the `sonner` toast library that can be
 * used in tests to verify notification behavior without actually displaying
 * toast messages.
 */

/**
 * Creates a mock implementation of the `toast` object from `sonner`.
 *
 * Returns a Jest mock object with all toast methods (success, error, info, etc.)
 * as mock functions. Useful for verifying that components display appropriate
 * notifications.
 *
 * @returns Mock toast object with all notification methods
 *
 * @example
 * ```typescript
 * const mockToast = createMockToast();
 *
 * // In your test
 * expect(mockToast.success).toHaveBeenCalledWith('Operation successful');
 * expect(mockToast.error).toHaveBeenCalledWith('Operation failed');
 * ```
 */
export function createMockToast() {
  return {
    /**
     * Mock `toast.success` method.
     * Call this to verify success notifications in tests.
     */
    success: jest.fn(),

    /**
     * Mock `toast.error` method.
     * Call this to verify error notifications in tests.
     */
    error: jest.fn(),

    /**
     * Mock `toast.info` method.
     * Call this to verify info notifications in tests.
     */
    info: jest.fn(),

    /**
     * Mock `toast.warning` method.
     * Call this to verify warning notifications in tests.
     */
    warning: jest.fn(),

    /**
     * Mock `toast.loading` method.
     * Call this to verify loading notifications in tests.
     */
    loading: jest.fn(),

    /**
     * Mock `toast.promise` method.
     * Call this to verify promise-based notifications in tests.
     */
    promise: jest.fn(),

    /**
     * Mock `toast.dismiss` method.
     * Call this to verify toast dismissal in tests.
     */
    dismiss: jest.fn(),

    /**
     * Mock `toast.custom` method.
     * Call this to verify custom toast notifications in tests.
     */
    custom: jest.fn(),
  };
}

/**
 * Type helper for the mocked toast object.
 * Useful for TypeScript type checking in tests.
 */
export type MockToast = ReturnType<typeof createMockToast>;

