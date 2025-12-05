/**
 * @module test-utils/render
 * @category Testing
 * @internal
 *
 * Custom render utilities for React Testing Library.
 *
 * Provides a custom render function that wraps components with common providers
 * (AuthContext, etc.) and re-exports all React Testing Library utilities for
 * convenient single-import usage in tests.
 *
 * @example
 * ```typescript
 * import { render, screen, fireEvent } from '@/test-utils/render';
 *
 * test('renders component', () => {
 *   render(<MyComponent />);
 *   expect(screen.getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';

/**
 * Props for the AllProviders wrapper component.
 */
interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all common context providers.
 *
 * This component wraps test components with necessary providers like AuthProvider.
 * Note: AuthContext is typically mocked in tests, so this wrapper serves as a
 * placeholder that can be extended when real providers are needed.
 *
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns Wrapped component tree
 */
function AllProviders({ children }: AllProvidersProps): ReactElement {
  return <>{children}</>;
}

/**
 * Extended render options that include custom wrapper configuration.
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Optional custom wrapper component. If not provided, uses AllProviders.
   */
  wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * Custom render function that wraps components with common providers.
 *
 * Use this instead of importing `render` directly from `@testing-library/react`
 * to ensure consistent provider setup across all tests.
 *
 * @param ui - React element to render
 * @param options - Render options (passed to RTL render)
 * @returns Render result with all RTL utilities
 *
 * @example
 * ```typescript
 * import { render, screen } from '@/test-utils/render';
 *
 * test('renders with providers', () => {
 *   render(<Dashboard />);
 *   expect(screen.getByRole('heading')).toBeInTheDocument();
 * });
 * ```
 */
function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { wrapper: Wrapper = AllProviders, ...restOptions } = options || {};

  return render(ui, {
    wrapper: Wrapper,
    ...restOptions,
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';

// Override the render export with our custom version
export { customRender as render };

// Export userEvent for convenience (commonly used with RTL)
export { default as userEvent } from '@testing-library/user-event';

