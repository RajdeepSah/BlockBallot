"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { SignIn } from '@/components/SignIn';
import { SignUp } from '@/components/SignUp';
import { Verify2FA } from '@/components/Verify2FA';
import { Dashboard } from '@/components/Dashboard';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState<'signin' | 'signup' | '2fa' | 'dashboard' | null>(null);
  const [twoFAState, setTwoFAState] = useState<{ userId: string; email: string } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        setScreen('signin');
      } else {
        const electionId = searchParams.get('election');
        if (electionId) {
          router.push(`/vote/${electionId}`);
        } else {
          setScreen('dashboard');
        }
      }
    }
  }, [user, loading, searchParams, router]);

  if (loading || !screen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (screen === 'signin') {
      return (
        <SignIn
          onToggleMode={() => setScreen('signup')}
          onSuccess={() => setScreen('dashboard')}
          on2FARequired={({ userId, email }) => {
            setTwoFAState({ userId, email });
            setScreen('2fa');
          }}
        />
      );
    } else if (screen === 'signup') {
      return (
        <SignUp
          onToggleMode={() => setScreen('signin')}
          onSuccess={() => setScreen('signin')}
        />
      );
    } else if (screen === '2fa' && twoFAState) {
      return (
        <Verify2FA
          email={twoFAState.email}
          onSuccess={() => setScreen('dashboard')}
          onBack={() => setScreen('signin')}
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

