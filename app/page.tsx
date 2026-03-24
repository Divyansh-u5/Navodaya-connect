'use client';

import { useEffect, useState } from 'react';
import AuthUI from '../components/AuthUI';
import OnboardingWizard from '../components/OnboardingWizard'; // <-- We are importing your new wizard here!
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If they are NOT logged in, show the Login/Signup screen
  if (!session) {
    return <AuthUI />;
  }

  // If they ARE logged in, show the Onboarding Wizard instead of the old welcome text!
  return <OnboardingWizard />;
}