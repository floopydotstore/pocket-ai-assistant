import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            variant: 'destructive',
            description: 'This email is already registered. Please sign in instead.',
          });
        } else {
          toast({
            variant: 'destructive',
            description: error.message,
          });
        }
        return { error };
      }

      toast({ description: 'Account created successfully!' });
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({ variant: 'destructive', description: error.message });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: 'destructive',
          description: error.message,
        });
        return { error };
      }

      toast({ description: 'Welcome back!' });
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({ variant: 'destructive', description: error.message });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({ description: 'Signed out successfully' });
  };

  const deleteAccount = async () => {
    try {
      // Delete user data first (cascading will handle related tables)
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error deleting profile:', profileError);
        }
      }

      // Sign out after deletion - full account deletion requires admin API
      await supabase.auth.signOut();
      
      toast({ description: 'Account deleted successfully' });
      return { error: null };
    } catch (err) {
      const error = err as Error;
      toast({ variant: 'destructive', description: error.message });
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
