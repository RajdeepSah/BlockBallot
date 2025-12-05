/**
 * @module test-utils
 * @category Testing
 * @internal
 *
 * Central export point for all test utilities and mocks.
 *
 * This module provides a single import location for all testing utilities,
 * making it easy to import mocks and test helpers throughout the test suite.
 *
 * ## Usage
 *
 * ```typescript
 * // Import mock factories
 * import {
 *   createMockApi,
 *   createMockAuthContext,
 *   createMockElection,
 *   createMockToast,
 *   createMockContract,
 *   createMockUserRecord,
 * } from '@/test-utils';
 *
 * // Import render utilities (alternative to @testing-library/react)
 * import { render, screen, fireEvent, userEvent } from '@/test-utils/render';
 * ```
 */

// Data factories (includes KV record factories)
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

// Blockchain mocks
export * from './mocks/blockchain';
