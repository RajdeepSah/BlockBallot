"use client";

import React from "react";
import { cn } from "./utils";

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
  className 
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn("text-center", className)}>
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

