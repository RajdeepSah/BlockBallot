'use client';

import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { SignIn } from '@/components/SignIn';
import { SignUp } from '@/components/SignUp';
import { Verify2FA } from '@/components/Verify2FA';
import { Dashboard } from '@/components/Dashboard';

/**
 * Loading spinner component displayed while authentication state is being determined.
 *
 * @returns Loading spinner UI
 */
function LoadingSpinner() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Main content component for the home page.
 * Handles routing between sign in, sign up, 2FA, and dashboard screens.
 *
 * @returns Appropriate screen component based on authentication state
 */
function HomePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [manualScreen, setManualScreen] = useState<'signup' | '2fa' | null>(null);
  const [twoFAState, setTwoFAState] = useState<{ userId: string; email: string } | null>(null);
  const hasNavigatedRef = useRef(false);

  const electionId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return searchParams.get('election');
    } catch {
      return null;
    }
  }, [searchParams]);

  const screen: 'signin' | 'signup' | '2fa' | 'dashboard' | null = (() => {
    if (loading) return null;

    if (manualScreen) return manualScreen;

    if (!user) {
      return 'signin';
    } else {
      return 'dashboard';
    }
  })();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (loading || !user) return;

    if (electionId && !hasNavigatedRef.current && screen === 'dashboard') {
      hasNavigatedRef.current = true;
      router.push(`/vote/${electionId}`);
    }
  }, [user, loading, electionId, router, screen]);

  if (loading || !screen) {
    return <LoadingSpinner />;
  }

  if (!user) {
    if (screen === 'signin') {
      return (
        <SignIn
          onToggleMode={() => setManualScreen('signup')}
          onSuccess={() => {
            setManualScreen(null);
          }}
          on2FARequired={({ userId, email }) => {
            setTwoFAState({ userId, email });
            setManualScreen('2fa');
          }}
        />
      );
    } else if (screen === 'signup') {
      return (
        <SignUp
          onToggleMode={() => setManualScreen(null)}
          onSuccess={() => setManualScreen(null)}
        />
      );
    } else if (screen === '2fa' && twoFAState) {
      return (
        <Verify2FA
          email={twoFAState.email}
          onSuccess={() => {
            setManualScreen(null);
            setTwoFAState(null);
          }}
          onBack={() => {
            setManualScreen(null);
            setTwoFAState(null);
          }}
        />
      );
    }
  }

  if (screen === 'dashboard') {
    return (
      <Dashboard
        onCreateElection={() => router.push('/create-election')}
        onViewElection={(electionId) => router.push(`/vote/${electionId}`)}
        onManageElection={(electionId) => router.push(`/admin/${electionId}`)}
      />
    );
  }

  return null;
}

/**
 * Home page component wrapped in Suspense for Next.js navigation.
 * Entry point for the application, handles authentication flow.
 *
 * @returns Suspense-wrapped home page content
 */
export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePageContent />
    </Suspense>
  );
}
