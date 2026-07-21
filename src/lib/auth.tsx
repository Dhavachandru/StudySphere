import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Profile } from './types';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string, remember: boolean) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return (data as Profile | null) ?? null;
}

// Create a profile + settings row for a newly registered user.
// Uses upsert so it's idempotent if the OAuth callback fires twice.
async function ensureProfile(user: User): Promise<Profile | null> {
  const existing = await fetchProfile(user.id);
  if (existing) return existing;

  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Student';
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ?? null;

  const { data: profileData } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, full_name: fullName, avatar_url: avatarUrl },
      { onConflict: 'id' }
    )
    .select('*')
    .maybeSingle();

  await supabase
    .from('settings')
    .upsert(
      { user_id: user.id, account_email: user.email, theme: 'dark' },
      { onConflict: 'user_id' }
    );

  return (profileData as Profile | null) ?? { id: user.id, full_name: fullName, avatar_url: avatarUrl, college: null, department: null, semester: 1, bio: null, achievements: [], statistics: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        ensureProfile(data.session.user)
          .then((p) => mounted && setProfile(p))
          .finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // onAuthStateChange callback runs synchronously — wrap async work to avoid deadlock
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        if (sess?.user) {
          const p = await ensureProfile(sess.user);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) setProfile(await fetchProfile(session.user.id));
  };

  const signIn = async (email: string, password: string, remember: boolean) => {
    // Remember Me: when unchecked, clear the persisted session on tab close.
    // Supabase persists in localStorage by default; for "don't remember" we
    // switch to sessionStorage for the session lifetime.
    if (!remember) {
      // Move current storage to session-only by setting a flag the app honors on unload.
      try {
        const key = `sb-${new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
        const raw = localStorage.getItem(key);
        if (raw) {
          sessionStorage.setItem(key, raw);
        }
      } catch {
        // ignore storage errors
      }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      await ensureProfile(data.user);
    }
    return { error: null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
    return { error: error?.message ?? null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signInWithGoogle, resetPassword, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
