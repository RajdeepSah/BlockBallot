/**
 * @module test-utils
 * @category Testing
 *
 * Central export point for all test utilities and mocks.
 *
 * This module provides a single import location for all testing utilities,
 * making it easy to import mocks and test helpers throughout the test suite.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   createMockApi,
 *   createMockAuthContext,
 *   createMockElection,
 *   createMockToast,
 * } from '@/test-utils';
 * ```
 */

// Data factories
export * from './mocks/data';

// API mocks
export * from './mocks/api';

// Auth mocks
export * from './mocks/auth';

// Supabase mocks
export * from './mocks/supabase';

// Notification mocks
export * from './mocks/notifications';

// Eligible voters mocks
export * from './mocks/eligible-voters';

