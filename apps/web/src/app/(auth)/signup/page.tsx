'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSignUp, useSignInWithGoogle, useSignInWithApple, useCheckUsername } from '@quillty/api';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const signUp = useSignUp();
  const signInWithGoogle = useSignInWithGoogle();
  const signInWithApple = useSignInWithApple();
  const checkUsername = useCheckUsername();

  const validateUsername = useCallback(
    async (value: string) => {
      if (value.length < 3) {
        setUsernameStatus('idle');
        return;
      }

      if (!/^[a-z0-9_]+$/.test(value.toLowerCase())) {
        setUsernameStatus('idle');
        return;
      }

      setUsernameStatus('checking');
      const isAvailable = await checkUsername(value);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    },
    [checkUsername]
  );

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(value);
    validateUsername(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }

    try {
      await signUp.mutateAsync({ email, password, username, displayName });
      router.push('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle.mutateAsync(window.location.origin + '/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple.mutateAsync(window.location.origin + '/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Apple');
    }
  };

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

      <h2 className="mb-2 text-2xl font-bold text-gray-900">Create your account</h2>
      <p className="mb-8 text-gray-600">
        Join the quilting community today
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Social login buttons */}
      <div className="mb-6 space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={signInWithGoogle.isPending}
          className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={signInWithApple.isPending}
          className="flex min-h-[44px] w-full items-center justify-center gap-3 rounded-lg bg-black px-4 py-3 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-sm text-gray-500">
            or sign up with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Display name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label
            htmlFor="username"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              @
            </span>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              required
              minLength={3}
              maxLength={30}
              pattern="[a-z0-9_]+"
              className="min-h-[44px] w-full rounded-lg border border-gray-200 py-3 pl-8 pr-10 text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              placeholder="username"
            />
            {usernameStatus === 'checking' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
              </div>
            )}
            {usernameStatus === 'available' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {usernameStatus === 'taken' && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Letters, numbers, and underscores only
          </p>
        </div>

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

        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="min-h-[44px] w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500">
            At least 8 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={signUp.isPending || usernameStatus !== 'available'}
          className="min-h-[44px] w-full rounded-lg bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {signUp.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
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
