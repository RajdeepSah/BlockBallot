'use client';

import React, { useState } from 'react';

type ApiResult = {
  status: number;
  body: unknown;
};

export default function OtpDevTestPage() {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password123');
  const [userId, setUserId] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loginResult, setLoginResult] = useState<ApiResult | null>(null);
  const [verifyResult, setVerifyResult] = useState<ApiResult | null>(null);
  const [resendResult, setResendResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const callApi = async (url: string, payload: Record<string, unknown>): Promise<ApiResult> => {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      return { status: res.status, body };
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const result = await callApi('/api/auth/login', { email, password });
    setLoginResult(result);
    if (result.body && typeof result.body === 'object' && 'userId' in result.body) {
      setUserId(String((result.body as { userId?: unknown }).userId ?? ''));
    }
    if (result.body && typeof result.body === 'object' && 'devOTP' in result.body) {
      setOtp(String((result.body as { devOTP?: unknown }).devOTP ?? ''));
    }
  };

  const handleVerify = async () => {
    const result = await callApi('/api/auth/verify-2fa', { userId, otp });
    setVerifyResult(result);
  };

  const handleResend = async () => {
    const result = await callApi('/api/auth/resend-otp', { userId });
    setResendResult(result);
    if (result.body && typeof result.body === 'object' && 'devOTP' in result.body) {
      setOtp(String((result.body as { devOTP?: unknown }).devOTP ?? ''));
    }
  };

  const JsonView = ({ title, value }: { title: string; value: unknown }) => (
    <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
      <div className="mb-1 font-semibold">{title}</div>
      <pre className="whitespace-pre-wrap break-words text-xs">
        {value ? JSON.stringify(value, null, 2) : '—'}
      </pre>
    </div>
  );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">OTP Dev Test Page</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Quick manual harness for login → resend OTP → verify 2FA. Uses the live API routes.
        Dev-only; do not ship to production.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-lg font-semibold">Credentials</h2>
          <label className="mb-2 block text-sm font-medium">
            Email
            <input
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </label>
          <label className="mb-4 block text-sm font-medium">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </label>

          <div className="mb-2 text-sm font-medium">State</div>
          <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">
            userId: <code>{userId || '—'}</code>
          </div>
          <div className="mb-4 text-xs text-gray-600 dark:text-gray-300">
            otp (devOTP): <code>{otp || '—'}</code>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Working...' : 'Login (get OTP)'}
            </button>
            <button
              onClick={handleResend}
              disabled={loading || !userId}
              className="rounded bg-amber-500 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              Resend OTP
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || !userId || !otp}
              className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Verify 2FA
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <JsonView title="Login Response" value={loginResult} />
          <JsonView title="Resend Response" value={resendResult} />
          <JsonView title="Verify Response" value={verifyResult} />
        </div>
      </div>
    </div>
  );
}
