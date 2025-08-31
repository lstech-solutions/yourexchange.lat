'use client';

import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        setLoading(true);
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(sessionError);
          setUser(null);
          setSession(null);
          return;
        }

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setError(null);
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setError(err instanceof Error ? err : new Error('An unexpected error occurred'));
        setUser(null);
        setSession(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Get initial session and user
    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, newSession: Session | null) => {
        if (!mounted) return;
        
        try {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setError(null);
          
          // Handle specific auth events if needed
          if (event === 'SIGNED_IN') {
            console.log('User signed in:', newSession?.user?.email);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
          setError(err instanceof Error ? err : new Error('Error processing auth state change'));
        } finally {
          setLoading(false);
        }
      }
    );

    // Cleanup function
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const value = {
    user,
    session,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
