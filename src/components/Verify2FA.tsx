import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from './layouts/AuthLayout';

/**
 * Props for the Verify2FA component.
 * @internal
 */
interface Verify2FAProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
}

/**
 * Verify2FA component for entering and verifying OTP codes.
 * Handles 2FA verification flow after initial login.
 *
 * @param props - Component props
 * @param props.email - Email address receiving the OTP
 * @param props.onSuccess - Callback when verification succeeds
 * @param props.onBack - Callback to return to login
 * @returns 2FA verification form UI
 */
export function Verify2FA({ email, onSuccess, onBack }: Verify2FAProps) {
  const { verify2FA, resendOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [isSlidingOut, setIsSlidingOut] = useState(false);

  const handleTransition = (callback: () => void) => {
    setIsSlidingOut(true);
    setTimeout(() => {
      callback();
    }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await verify2FA(email, otp);
      toast.success('2FA verification successful!');
      handleTransition(() => {
        onSuccess();
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '2FA verification failed';
      toast.error(message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    handleTransition(() => {
      onBack();
    });
  };

  const handleResend = async () => {
    setResending(true);

    try {
      await resendOTP(email);
      toast.success('New code sent!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout>
      <Card className={`w-full max-w-md page-card ${isSlidingOut ? 'slide-out' : ''}`}>
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-indigo-600 p-3">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-center text-xs text-gray-500">
                Code was sent to <span className="font-medium text-gray-700">{email}</span> and
                expires in 5 minutes.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={handleBack} className="text-gray-600 hover:underline">
                ← Back to login
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-indigo-600 hover:underline"
              >
                {resending ? 'Sending...' : 'Resend code'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
