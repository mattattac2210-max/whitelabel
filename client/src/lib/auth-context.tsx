// ============================================================
// AUTH CONTEXT
// Manages Supabase auth session state.
// Determines whether to show auth screens or the main app.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// ── Auth screen flow ─────────────────────────────────────────

export type AuthScreen =
  | 'splash'
  | 'signup'
  | 'signup2'
  | 'verify'
  | 'login'
  | 'forgot'
  | 'setup-vehicle'
  | 'setup-tax'
  | 'setup-logbook'
  | 'all-set';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isNewUser: boolean;        // true = show onboarding after signup
  authScreen: AuthScreen;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  // Navigation
  goTo: (screen: AuthScreen) => void;
  // Actions
  signUp: (email: string, password: string, firstName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  verifyOtp: (token: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => void;
  clearError: () => void;
  // Pending signup data (passed between steps)
  pendingEmail: string;
  pendingPhone: string;
  setPendingEmail: (v: string) => void;
  setPendingPhone: (v: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('splash');
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');

  // ── Session listener ───────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ── Navigation ─────────────────────────────────────────────
  const goTo = useCallback((screen: AuthScreen) => {
    setError(null);
    setAuthScreen(screen);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ── Sign up ────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string, firstName: string, phone: string) => {
      setError(null);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { first_name: firstName, phone },
          },
        });
        if (error) throw error;
        setPendingEmail(email);
        setPendingPhone(phone);
        setIsNewUser(true);
        // For now, skip OTP verification and go straight to onboarding
        setAuthScreen('setup-vehicle');
      } catch (err: any) {
        setError(err.message || 'Signup failed. Please try again.');
      }
    },
    []
  );

  // ── Sign in ────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Session listener will fire and update state
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Check your email and password.');
    }
  }, []);

  // ── OAuth ──────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }, []);

  const signInWithApple = useCallback(async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }, []);

  // ── OTP verify ────────────────────────────────────────────
  const verifyOtp = useCallback(
    async (token: string) => {
      setError(null);
      try {
        const { error } = await supabase.auth.verifyOtp({
          email: pendingEmail,
          token,
          type: 'signup',
        });
        if (error) throw error;
        setAuthScreen('setup-vehicle');
      } catch (err: any) {
        setError(err.message || 'Invalid code. Please try again.');
      }
    },
    [pendingEmail]
  );

  // ── Reset password ────────────────────────────────────────
  const resetPassword = useCallback(
    async (email: string) => {
      setError(null);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        goTo('login');
      } catch (err: any) {
        setError(err.message || 'Could not send reset email.');
      }
    },
    [goTo]
  );

  // ── Sign out ──────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthScreen('splash');
  }, []);

  // ── Complete onboarding ───────────────────────────────────
  const completeOnboarding = useCallback(() => {
    setIsNewUser(false);
    // Session is already set — app-context will load data
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isNewUser,
        authScreen,
        error,
        goTo,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithApple,
        verifyOtp,
        resetPassword,
        signOut,
        completeOnboarding,
        clearError,
        pendingEmail,
        pendingPhone,
        setPendingEmail,
        setPendingPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

