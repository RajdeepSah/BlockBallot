"use client";

import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * AuthLayout - Consistent layout wrapper for authentication pages
 * 
 * Provides a centered, gradient background layout for SignIn, SignUp, and Verify2FA pages.
 * Design customization: Modify the gradient colors here to change all auth pages at once.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {children}
    </div>
  );
}

