import { login as authLogin, logout as authLogout } from '@/lib/authClient';
import { setTokens, clearTokens, getBearerToken } from '@/lib/apiClient';

// jobs-service via the gateway (port 4100 was a phantom backend — no such service exists).
const DATA_BASE = process.env.NEXT_PUBLIC_JOBS_SERVICE_URL || 'https://api.baalvion.com/api/v1/ecosystem/jobs/api/v1';

export const authServerService = {
  /** Authenticate against Baalvion ID (auth-service). Refresh cookie set server-side. */
  login: async (email: string, password: string) => {
    try {
      const { access_token, user } = await authLogin(email, password);
      setTokens(access_token); // access token in memory only
      return { success: true, data: { token: access_token, user }, error: null };
    } catch (err) {
      return { success: false, data: null, error: err instanceof Error ? err.message : 'Login failed' };
    }
  },

  logout: async (): Promise<void> => {
    await authLogout(); // clears the httpOnly refresh cookie server-side
    clearTokens();
  },

  /** Session check via baalvion-os /users/me (canonical-token-validated). */
  checkSession: async (): Promise<{ isAuthenticated: boolean; userId: string | null }> => {
    const token = getBearerToken();
    if (!token) return { isAuthenticated: false, userId: null };
    try {
      const res = await fetch(`${DATA_BASE}/users/me`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { isAuthenticated: false, userId: null };
      const data = await res.json().catch(() => null);
      const userId = data?.data?.id ?? data?.id ?? null;
      return { isAuthenticated: !!userId, userId: userId ? String(userId) : null };
    } catch {
      return { isAuthenticated: false, userId: null };
    }
  },
};
