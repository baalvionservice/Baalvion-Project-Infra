'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, UserRole } from '@/types';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth-cookies';
import { brandTokenStore, AUTH_URL } from '@/lib/api-client';

/**
 * @fileOverview Baalvion Auth Context
 *
 * Production: uses Firebase auth + JWT from proxy-backend (:4000).
 * Development (NODE_ENV !== 'production'): also exposes signInAs() for role switching.
 */

interface AuthState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  /** Development/testing only — sign in as a mock role. */
  signInAs: (role: UserRole) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  /** Production login: Firebase email/password + JWT exchange. */
  loginWithEmail: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Dev-mock auth is OFF by default everywhere. It only activates when explicitly
 * opted in via NEXT_PUBLIC_BAALVION_DEV_MOCK=1 AND outside production. This
 * prevents the mock role-switcher from ever being reachable in a real build.
 */
const MOCK_ENABLED =
  process.env.NEXT_PUBLIC_BAALVION_DEV_MOCK === '1' && process.env.NODE_ENV !== 'production';

function getMockProfile(role: UserRole): User {
  return {
    id: role === 'ADMIN' ? 'admin_root' : role === 'BRAND' ? 'brand_user_1' : 'creator_user_1',
    email: `${role.toLowerCase()}@baalvion.com`,
    role,
    displayName: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
    status: 'ACTIVE',
    isVerified: true,
    tourCompleted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function fetchBackendJwt(
  firebaseToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebaseToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json.data ?? json;
    return {
      accessToken: raw.accessToken ?? raw.token ?? '',
      refreshToken: raw.refreshToken ?? '',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Initialise session ──────────────────────────────────────────────────────
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      const isProd = process.env.NODE_ENV === 'production';
      const hasFirebaseConfig =
        !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (isProd && hasFirebaseConfig) {
        // Production: wire up Firebase auth state listener
        try {
          const { getAuth, onAuthStateChanged } = await import('firebase/auth');
          const { initializeFirebase } = await import('@/firebase');
          const { auth } = initializeFirebase();
          if (auth) {
            unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
              if (firebaseUser) {
                const firebaseToken = await firebaseUser.getIdToken();
                const jwt = await fetchBackendJwt(firebaseToken);
                if (jwt) {
                  brandTokenStore.set(jwt.accessToken, jwt.refreshToken);
                }
                setCurrentUser({
                  id: firebaseUser.uid,
                  email: firebaseUser.email ?? '',
                  role: 'BRAND',
                  displayName: firebaseUser.displayName ?? firebaseUser.email ?? '',
                  status: 'ACTIVE',
                  isVerified: firebaseUser.emailVerified,
                  tourCompleted: false,
                  createdAt: firebaseUser.metadata.creationTime ?? new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setAuthCookies({ role: 'BRAND', verified: firebaseUser.emailVerified, onboarded: true });
              } else {
                setCurrentUser(null);
                brandTokenStore.clear();
                clearAuthCookies();
              }
              setLoading(false);
            });
            return; // early return — listener handles loading
          }
        } catch (err) {
          console.error('[AuthContext] Firebase init error:', err);
        }
      }

      // Development / no Firebase: restore from localStorage (mock auth — gated OFF by default)
      if (MOCK_ENABLED && typeof window !== 'undefined') {
        const savedRole = localStorage.getItem('mock_role') as UserRole | null;
        if (savedRole) {
          setCurrentUser(getMockProfile(savedRole));
          setAuthCookies({ role: savedRole, onboarded: true });
        }
      }
      setLoading(false);
    }

    init();
    return () => unsubscribe?.();
  }, []);

  // ── loginWithEmail ──────────────────────────────────────────────────────────
  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { getAuth, signInWithEmailAndPassword } = await import('firebase/auth');
      const { initializeFirebase } = await import('@/firebase');
      const { auth } = initializeFirebase();
      if (!auth) throw new Error('Firebase auth not available');

      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await credential.user.getIdToken();

      // Exchange Firebase token for a backend JWT
      const jwt = await fetchBackendJwt(firebaseToken);
      if (jwt) {
        brandTokenStore.set(jwt.accessToken, jwt.refreshToken);
      }

      const user: User = {
        id: credential.user.uid,
        email: credential.user.email ?? '',
        role: 'BRAND',
        displayName: credential.user.displayName ?? credential.user.email ?? '',
        status: 'ACTIVE',
        isVerified: credential.user.emailVerified,
        tourCompleted: false,
        createdAt: credential.user.metadata.creationTime ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      setAuthCookies({ role: 'BRAND', verified: credential.user.emailVerified, onboarded: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── signInAs (dev/test only) ────────────────────────────────────────────────
  const signInAs = useCallback((role: UserRole) => {
    if (!MOCK_ENABLED) {
      console.warn('[AuthContext] signInAs() mock auth is disabled — set NEXT_PUBLIC_BAALVION_DEV_MOCK=1 (non-production) to enable.');
      return;
    }
    const profile = getMockProfile(role);
    setCurrentUser(profile);
    if (typeof window !== 'undefined') localStorage.setItem('mock_role', role);
    setAuthCookies({ role, onboarded: true });
  }, []);

  // ── signOut ─────────────────────────────────────────────────────────────────
  const signOutAction = useCallback(async () => {
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const hasFirebaseConfig = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      if (isProd && hasFirebaseConfig) {
        const { getAuth, signOut: firebaseSignOut } = await import('firebase/auth');
        const { initializeFirebase } = await import('@/firebase');
        const { auth } = initializeFirebase();
        if (auth) await firebaseSignOut(auth);
      }
    } catch {
      // ignore sign-out errors
    }
    brandTokenStore.clear();
    clearAuthCookies();
    if (typeof window !== 'undefined') localStorage.removeItem('mock_role');
    setCurrentUser(null);
    window.location.href = '/auth/login';
  }, []);

  const refreshUser = useCallback(async () => {
    // Optionally re-fetch user profile from brand-service here
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        signInAs,
        signOut: signOutAction,
        refreshUser,
        loginWithEmail,
      }}
    >
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
