import { authApiClient } from '@/lib/apiClient';

export const authServerService = {
  login: (email: string, password: string) =>
    authApiClient.post('/login', { email, password }),

  logout: async (): Promise<void> => {
    await authApiClient.post('/logout', {});
  },

  checkSession: async (): Promise<{ isAuthenticated: boolean; userId: string | null }> => {
    // Proxy backend exposes /users/me (not /session) — derive session status from it
    const res = await fetch(
      (process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:4000/v1/auth').replace('/auth', '/users/me'),
      {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('baalvion_jobs_token') ?? '' : ''}`,
        },
      },
    );
    if (!res.ok) return { isAuthenticated: false, userId: null };
    const data = await res.json().catch(() => null);
    const userId = data?.data?.id ?? data?.id ?? null;
    return { isAuthenticated: !!userId, userId: userId ? String(userId) : null };
  },
};
