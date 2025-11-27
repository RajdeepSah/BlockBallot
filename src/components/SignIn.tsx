import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Vote, Lock, Mail } from 'lucide-react';
import { AuthLayout } from './layouts/AuthLayout';

interface SignInProps {
  onToggleMode: () => void;
  onSuccess: () => void;
  on2FARequired: (payload: { userId: string; email: string }) => void;
}

/**
 * SignIn component for user authentication.
 * Handles login flow and triggers 2FA when required.
 * 
 * @param props - Component props
 * @param props.onToggleMode - Callback to switch to sign up
 * @param props.onSuccess - Callback when login succeeds without 2FA
 * @param props.on2FARequired - Callback when 2FA is required
 * @returns Sign in form UI
 */
export function SignIn({ onToggleMode, onSuccess, on2FARequired }: SignInProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestEmailOtp = async (targetEmail: string) => {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send verification code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const result = await login(normalizedEmail, password);
      
      if (result.requires2FA) {
        if (!result.userId) {
          throw new Error('Unable to start verification flow. Missing user ID.');
        }

        await requestEmailOtp(normalizedEmail);
        on2FARequired({ userId: result.userId, email: normalizedEmail });
        return;
      }

      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full">
              <Vote className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">BlockBallot</CardTitle>
          <CardDescription>
            Your voice. Your vote.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => window.location.href = '/forgot-password'}
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={onToggleMode}
                className="text-indigo-600 hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
