import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Shield } from 'lucide-react';

interface Verify2FAProps {
  userId: string;
  devOTP?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function Verify2FA({ userId, devOTP, onSuccess, onBack }: Verify2FAProps) {
  const { verify2FA, resendOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [displayOTP, setDisplayOTP] = useState(devOTP);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(userId, otp);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      const newOTP = await resendOTP(userId);
      setDisplayOTP(newOTP);
      setError('');
      // Show success message briefly
      const tempError = error;
      setError('New code sent!');
      setTimeout(() => {
        if (error === 'New code sent!') {
          setError('');
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-indigo-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant={error === 'New code sent!' ? 'default' : 'destructive'}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {displayOTP && (
              <Alert>
                <AlertDescription>
                  <strong>Development Mode:</strong> Your OTP is <strong>{displayOTP}</strong>
                </AlertDescription>
              </Alert>
            )}

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
              <p className="text-xs text-gray-500 text-center">
                Code expires in 5 minutes
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={onBack}
                className="text-gray-600 hover:underline"
              >
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
    </div>
  );
}
