import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });
  }, []);

  if (checking) return null;

  // If logged in, go to onboarding (AI interview) or home
  // If not logged in, go to login first
  if (hasSession) {
    return <Redirect href="/(app)/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
