'use client';

import React, { useEffect, useState } from 'react';
import AuthUI from '../components/AuthUI';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the initial session
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></span>
        <span className="ml-4 text-zinc-700 dark:text-zinc-100 text-lg">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-300 dark:from-zinc-900 dark:to-black">
        <AuthUI />
      </div>
    );
  }

  // Dashboard
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-indigo-100 dark:from-black dark:to-zinc-900 px-4">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 flex flex-col items-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
          Welcome, {session.user.email}!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-300 mb-8 text-center">
          You are logged in. This is your dashboard.
        </p>
        <button
          onClick={handleSignOut}
          className="px-5 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
}
