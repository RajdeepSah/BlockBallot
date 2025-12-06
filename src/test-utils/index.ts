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

export * from './mocks/data';

export * from './mocks/api';

export * from './mocks/auth';

export * from './mocks/supabase';

export * from './mocks/notifications';

export * from './mocks/eligible-voters';

export * from './mocks/blockchain';
