'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useResetPassword } from '@quillty/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetPassword = useResetPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await resetPassword.mutateAsync({ email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Check your email</h2>
        <p className="mb-8 text-gray-600">
          We&apos;ve sent a password reset link to{' '}
          <span className="font-medium">{email}</span>
        </p>
        <Link
          href="/login"
          className="font-semibold text-brand hover:text-brand-dark"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="mb-8 flex justify-center lg:hidden">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand">
          <svg
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
        </div>
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">Forgot password?</h2>
      <p className="mb-8 text-gray-600">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="min-h-[44px] w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={resetPassword.isPending}
          className="min-h-[44px] w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {resetPassword.isPending ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand hover:text-brand-dark"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
