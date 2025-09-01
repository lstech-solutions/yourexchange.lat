'use client';

import { createClient } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  session: Session | null;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<{
    user: User | null;
    session: Session | null;
    loading: boolean;
  }>({
    user: null,
    session: null,
    loading: true,
  });

  const { user, session, loading } = state;
  const supabase = useRef(createClient()).current;
  const isMounted = useRef(true);

  const updateState = useCallback((updates: Partial<typeof state>) => {
    if (!isMounted.current) return;
    
    setState(prev => {
      // Only update if something actually changed
      const hasChanges = Object.keys(updates).some(
        key => prev[key as keyof typeof prev] !== updates[key as keyof typeof updates]
      );
      
      return hasChanges ? { ...prev, ...updates } : prev;
    });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      updateState({ user: null, session: null });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, [updateState, supabase]);

  useEffect(() => {
    isMounted.current = true;
    
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!isMounted.current) return;
        
        if (error) {
          console.error('Error getting session:', error);
          updateState({ user: null, session: null, loading: false });
          return;
        }

        updateState({
          session: initialSession,
          user: initialSession?.user ?? null,
          loading: false,
        });
      } catch (error) {
        console.error('Unexpected error getting session:', error);
        updateState({
          user: null,
          session: null,
          loading: false
        });
      }
    };

    // Get initial session and user
    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted.current) return;
        
        const currentSession = newSession || (await supabase.auth.getSession()).data.session;
        
        updateState({
          session: currentSession,
          user: currentSession?.user ?? null,
          loading: false,
        });
      }
    );

    // Cleanup function
    return () => {
      isMounted.current = false;
      subscription?.unsubscribe();
    };
  }, [updateState, supabase]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => {
    return {
      user,
      loading,
      session,
      signOut,
    };
  }, [user?.id, session?.access_token, loading, signOut]);
}
