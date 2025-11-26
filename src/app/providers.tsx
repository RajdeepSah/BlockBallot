"use client";

import { AuthProvider } from "@/components/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
