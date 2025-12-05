'use client';

import React from 'react';
import { cn } from './utils';

/**
 * Props for the LoadingSpinner component.
 * @internal
 */
interface LoadingSpinnerProps {
  /** Message to display below the spinner */
  message?: string;
  /** Whether to render with full-screen centering (default: true) */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingSpinner - Consistent loading indicator
 *
 * Design customization: Modify spinner size, color, and animation here.
 */
export function LoadingSpinner({
  message = 'Loading...',
  fullScreen = true,
  className,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn('text-center', className)}>
      <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
      {message && <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">{content}</div>
    );
  }

  return content;
}
