import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from './layouts/AuthLayout';
import { Logo } from './Logo';

/**
 * Props for the SignIn component.
 * @internal
 */
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSlidingOut, setIsSlidingOut] = useState(false);

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

  const handleTransition = (callback: () => void) => {
    setIsSlidingOut(true);
    setTimeout(() => {
      callback();
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const result = await login(normalizedEmail, password);

      if (result.requires2FA) {
        if (!result.userId) {
          throw new Error('Unable to start verification flow. Missing user ID.');
        }

        await requestEmailOtp(normalizedEmail);
        const userId = result.userId;
        handleTransition(() => {
          on2FARequired({ userId, email: normalizedEmail });
        });
        return;
      }

      handleTransition(() => {
        onSuccess();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.';
      toast.error(message, {
        duration: 5000,
      });
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    handleTransition(() => {
      onToggleMode();
    });
  };

  return (
    <AuthLayout>
      <Card className={`page-card w-full max-w-md ${isSlidingOut ? 'slide-out' : ''}`}>
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="xl" className="h-48 w-48" />
          </div>
          <CardTitle className="text-2xl">BlockBallot</CardTitle>
          <CardDescription>Vote trusted, vote secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => (window.location.href = '/forgot-password')}
                className="text-sm text-indigo-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
              <button
                type="button"
                onClick={handleToggleMode}
                className="text-indigo-600 hover:underline dark:text-indigo-400"
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
