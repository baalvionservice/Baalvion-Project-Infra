'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  AuthUser,
  clearTokens,
  fetchMe,
  getAccessToken,
} from './api';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  reload: () => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState>({
  user: null,
  loading: true,
  reload: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await fetchMe());
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = '/login';
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <Ctx.Provider value={{ user, loading, reload, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
