import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { Verify2FA } from './components/Verify2FA';
import { Dashboard } from './components/Dashboard';
import { CreateElection } from './components/CreateElection';
import { ElectionView } from './components/ElectionView';
import { AdminPanel } from './components/AdminPanel';
import { ResultsView } from './components/ResultsView';

type Screen = 
  | { type: 'auth'; mode: 'signin' | 'signup' }
  | { type: '2fa'; userId: string; devOTP?: string }
  | { type: 'dashboard' }
  | { type: 'create-election' }
  | { type: 'election-view'; electionId: string }
  | { type: 'admin-panel'; electionId: string }
  | { type: 'results'; electionId: string };

function AppContent() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>({ type: 'auth', mode: 'signin' });

  useEffect(() => {
    // Check for election query parameter
    const params = new URLSearchParams(window.location.search);
    const electionId = params.get('election');
    
    if (electionId && user) {
      setScreen({ type: 'election-view', electionId });
    } else if (user && screen.type === 'auth') {
      setScreen({ type: 'dashboard' });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Auth Flow
  if (!user) {
    if (screen.type === 'auth') {
      if (screen.mode === 'signin') {
        return (
          <SignIn
            onToggleMode={() => setScreen({ type: 'auth', mode: 'signup' })}
            onSuccess={() => setScreen({ type: 'dashboard' })}
            on2FARequired={(userId, devOTP) => setScreen({ type: '2fa', userId, devOTP })}
          />
        );
      } else {
        return (
          <SignUp
            onToggleMode={() => setScreen({ type: 'auth', mode: 'signin' })}
            onSuccess={() => setScreen({ type: 'auth', mode: 'signin' })}
          />
        );
      }
    }

    if (screen.type === '2fa') {
      return (
        <Verify2FA
          userId={screen.userId}
          devOTP={screen.devOTP}
          onSuccess={() => setScreen({ type: 'dashboard' })}
          onBack={() => setScreen({ type: 'auth', mode: 'signin' })}
        />
      );
    }
  }

  // Authenticated Flow
  switch (screen.type) {
    case 'dashboard':
      return (
        <Dashboard
          onCreateElection={() => setScreen({ type: 'create-election' })}
          onViewElection={(electionId) => setScreen({ type: 'election-view', electionId })}
          onManageElection={(electionId) => setScreen({ type: 'admin-panel', electionId })}
        />
      );

    case 'create-election':
      return (
        <CreateElection
          onBack={() => setScreen({ type: 'dashboard' })}
          onSuccess={(electionId) => setScreen({ type: 'admin-panel', electionId })}
        />
      );

    case 'election-view':
      return (
        <ElectionView
          electionId={screen.electionId}
          onBack={() => setScreen({ type: 'dashboard' })}
          onViewResults={(electionId) => setScreen({ type: 'results', electionId })}
        />
      );

    case 'admin-panel':
      return (
        <AdminPanel
          electionId={screen.electionId}
          onBack={() => setScreen({ type: 'dashboard' })}
          onViewResults={(electionId) => setScreen({ type: 'results', electionId })}
        />
      );

    case 'results':
      return (
        <ResultsView
          electionId={screen.electionId}
          onBack={() => setScreen({ type: 'dashboard' })}
          onManage={(electionId) => setScreen({ type: 'admin-panel', electionId })}
        />
      );

    default:
      return (
        <Dashboard
          onCreateElection={() => setScreen({ type: 'create-election' })}
          onViewElection={(electionId) => setScreen({ type: 'election-view', electionId })}
          onManageElection={(electionId) => setScreen({ type: 'admin-panel', electionId })}
        />
      );
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
