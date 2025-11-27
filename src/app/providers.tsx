"use client";

import { AuthProvider } from "@/components/AuthContext";
import { Toaster } from "@/components/ui/sonner";

/**
 * Root providers component wrapping the application.
 * Provides authentication context and toast notifications.
 * 
 * @param props - Component props
 * @param props.children - Child components to wrap
 * @returns Providers wrapper with AuthProvider and Toaster
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
