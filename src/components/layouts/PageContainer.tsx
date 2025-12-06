'use client';

import React from 'react';
import { cn } from '@/components/ui/utils';

type MaxWidth = 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl';

const maxWidthClasses: Record<MaxWidth, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
};

/**
 * Props for PageContainer component.
 * @internal
 */
interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: MaxWidth;
  className?: string;
  /** Include gray background wrapper (default: true) */
  withBackground?: boolean;
}

/**
 * PageContainer - Consistent layout wrapper for page content
 *
 * Provides standard max-width, horizontal padding, and vertical spacing.
 * Design customization: Modify spacing and max-width here to affect all pages.
 */
export function PageContainer({
  children,
  maxWidth = '6xl',
  className,
  withBackground = true,
}: PageContainerProps) {
  const content = (
    <div className={cn(maxWidthClasses[maxWidth], 'mx-auto px-4 py-8 sm:px-6 lg:px-8', className)}>
      {children}
    </div>
  );

  if (withBackground) {
    return <div className="page-container min-h-screen bg-gray-50 dark:bg-gray-900">{content}</div>;
  }

  return <div className="page-container">{content}</div>;
}
