'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthUI = () => {
  const [isSignUp, setIsSignUp] = useState(false); // 🔴 New Toggle State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null); // 🔴 For email verification

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
        // 🚀 Handle New Account Creation
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg("Account created! Check your email to verify your account.");
      } else {
        // 🚀 Handle Existing User Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // On success, Next.js Traffic Cop will auto-redirect them
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
      
      {/* Header */}
      <h2 className="text-2xl font-bold text-center mb-2 text-zinc-900 dark:text-zinc-50">
        {isSignUp ? 'Create an Account' : 'Welcome Back'}
      </h2>
      <p className="text-center text-zinc-500 text-sm mb-6">
        {isSignUp ? 'Join the Navodaya Connect network' : 'Enter your details to sign in'}
      </p>

      {/* Error & Success Messages */}
      {error && (
        <div className="mb-4 w-full rounded-lg bg-red-50 text-red-600 px-4 py-3 text-sm border border-red-100">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 w-full rounded-lg bg-emerald-50 text-emerald-600 px-4 py-3 text-sm border border-emerald-100">
          {successMsg}
        </div>
      )}

      {/* Main Form */}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-700 dark:text-zinc-200 font-medium">Email</span>
          <input
            type="email"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
          />
        </label>
        
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-zinc-700 dark:text-zinc-200 font-medium">Password</span>
          <input
            type="password"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete={isSignUp ? "new-password" : "current-password"}
            disabled={loading}
            minLength={6}
          />
        </label>

        <button
          type="submit"
          className="w-full mt-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          disabled={loading}
        >
          {loading ? (
            <span className="animate-pulse">Processing...</span>
          ) : isSignUp ? (
            "Create Account"
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Form Mode Toggle */}
      <div className="mt-4 text-center text-sm text-zinc-600">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
            setSuccessMsg(null);
          }}
          className="text-blue-600 font-semibold hover:underline"
          disabled={loading}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>

      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
        <span className="mx-4 text-zinc-400 text-sm font-medium uppercase tracking-wider">or</span>
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-700"></div>
      </div>

      {/* Google Auth */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-2.5 flex items-center justify-center gap-3 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-medium transition-all shadow-sm disabled:opacity-50"
        type="button"
      >
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <g>
            <path fill="#4285F4" d="M24 9.5c3.51 0 6.24 1.52 7.68 2.8l5.7-5.5C33.65 3.96 29.33 2 24 2 14.82 2 6.99 7.98 3.69 16.01l6.99 5.47C12.72 15.21 17.86 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.28 24.56c0-1.77-.16-3.14-.5-4.51H24v9.24h12.39c-.25 1.54-1.62 3.86-4.66 5.41l7.22 5.57c4.2-3.89 6.33-9.61 6.33-15.71z"/>
            <path fill="#FBBC05" d="M10.68 28.36a14.5 14.5 0 0 1 0-8.72l-6.99-5.48C2.45 18.04 2 20.15 2 22.5s.45 4.46 1.69 6.34l6.99-5.48z"/>
            <path fill="#EA4335" d="M24 44c5.33 0 9.81-1.76 13.08-4.81l-7.22-5.57c-2.02 1.34-4.77 2.26-8.02 2.26-6.14 0-11.27-5.71-13.3-13.12l-6.99 5.48C6.99 40.02 14.82 46 24 46z"/>
            <path fill="none" d="M0 0h48v48H0z" />
          </g>
        </svg>
        Continue with Google
      </button>
    </div>
  );
};

export default AuthUI;