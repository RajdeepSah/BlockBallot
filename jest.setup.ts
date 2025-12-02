// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Set default test environment variables before any modules are imported
// These are safe defaults that prevent errors during test execution
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-project-id.supabase.co';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test-project-id.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key-for-testing-only';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-anon-key-for-testing-only';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key-for-testing-only';

// Mock Supabase info module to prevent module-level execution errors
jest.mock('@/utils/supabase/info', () => ({
  projectId: 'test-project-id',
  publicAnonKey: 'test-anon-key-for-testing-only',
}));

// Suppress React act() warnings and expected API error logs in tests
// React Testing Library automatically wraps user interactions and async operations in act(),
// but React 18+ still logs warnings for some internal state updates. These warnings are
// false positives and don't indicate actual problems with the tests.
// We also suppress "API Error" console.error messages from handleApiError since we're
// intentionally testing error scenarios and don't want to clutter test output.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Filter out act() warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to') ||
        args[0].includes('was not wrapped in act(...)'))
    ) {
      return;
    }
    // Filter out expected API error logs from handleApiError during tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('API Error')
    ) {
      return;
    }
    // Keep all other console errors
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

