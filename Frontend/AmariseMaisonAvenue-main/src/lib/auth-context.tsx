'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { authClient, getCurrentUser, type AmariseUser } from '@/lib/auth';

/**
 * Real authenticated-user context for the account area.
 *
 * The mock app store (src/lib/store.tsx) hard-seeds a fake "Julian Vandervilt"
 * user and is shared with the storefront/admin simulator. Rather than mutate that
 * global mock, the logged-in account area reads identity from HERE — the real
 * Baalvion identity service via authClient.
 *
 * On mount we silently restore the session from the httpOnly refresh cookie
 * (authClient.bootstrap) and then load the canonical profile (authClient.me).
 */
interface AuthContextValue {
  user: AmariseUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (patch: { fullName?: string; avatarUrl?: string }) => Promise<AmariseUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AmariseUser | null>(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Restore the access token from the refresh cookie if it was lost on reload,
    // then fetch the canonical profile.
    const restored = await authClient.bootstrap();
    const me = (await authClient.me()) ?? restored;
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const updateProfile = useCallback(
    async (patch: { fullName?: string; avatarUrl?: string }) => {
      const updated = await authClient.updateMe(patch);
      setUser(updated);
      return updated;
    },
    [],
  );

  const logout = useCallback(async () => {
    await authClient.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
