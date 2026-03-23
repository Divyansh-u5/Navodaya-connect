'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthUI = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success, Supabase will redirect via OAuth, so no need to unset loading here
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold text-center mb-6 text-zinc-900 dark:text-zinc-50">
        Welcome
      </h2>
      {error && (
        <div className="mb-4 w-full rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-200 px-4 py-3 text-sm border border-red-300 dark:border-red-700">
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-200 font-medium">Email</span>
          <input
            type="email"
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-700 dark:text-zinc-200 font-medium">Password</span>
          <input
            type="password"
            className="rounded-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-700"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </label>
        <button
          type="submit"
          className="w-full mt-2 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
      <button
        className="w-full mt-3 py-2 rounded-md border border-indigo-600 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ marginBottom: '1rem' }}
        onClick={handleSignUp}
        disabled={loading}
      >
        {loading ? "Signing Up..." : "Sign Up"}
      </button>
      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
        <span className="mx-3 text-zinc-500 dark:text-zinc-400 text-sm">or</span>
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
      </div>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-2 flex items-center justify-center gap-2 rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        type="button"
      >
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <g>
            <path
              fill="#4285F4"
              d="M24 9.5c3.51 0 6.24 1.52 7.68 2.8l5.7-5.5C33.65 3.96 29.33 2 24 2 14.82 2 6.99 7.98 3.69 16.01l6.99 5.47C12.72 15.21 17.86 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.28 24.56c0-1.77-.16-3.14-.5-4.51H24v9.24h12.39c-.25 1.54-1.62 3.86-4.66 5.41l7.22 5.57c4.2-3.89 6.33-9.61 6.33-15.71z"
            />
            <path
              fill="#FBBC05"
              d="M10.68 28.36a14.5 14.5 0 0 1 0-8.72l-6.99-5.48C2.45 18.04 2 20.15 2 22.5s.45 4.46 1.69 6.34l6.99-5.48z"
            />
            <path
              fill="#EA4335"
              d="M24 44c5.33 0 9.81-1.76 13.08-4.81l-7.22-5.57c-2.02 1.34-4.77 2.26-8.02 2.26-6.14 0-11.27-5.71-13.3-13.12l-6.99 5.48C6.99 40.02 14.82 46 24 46z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </g>
        </svg>
        Continue with Google
      </button>
    </div>
  );
};

export default AuthUI;