'use client';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/AuthContext';
import { Toaster } from '@/components/ui/sonner';

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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider> 
    </ThemeProvider>
  );
}
