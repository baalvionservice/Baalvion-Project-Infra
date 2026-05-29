"use client";

import { apiClient, getToken } from '@/lib/api/client';
import { useAuthStore } from "@/store/authStore";

/**
 * @fileOverview REST AuthStateListener
 * Replaces the Firebase onAuthStateChanged listener.
 * Reads the in-memory JWT (P0: never localStorage) and fetches /auth/me.
 * NOTE: on a full reload the in-memory token is gone (law-service has no httpOnly refresh cookie
 * yet — Phase 1b), so this resolves to signed-out until re-login.
 */
export const initAuthListener = async () => {
  const { setUser, setLoading } = useAuthStore.getState();
  setLoading(true);

  const token = getToken();

  if (!token) {
    setUser(null);
    setLoading(false);
    return;
  }

  try {
    const res = await apiClient.get('/auth/me');
    const user = res.data?.data ?? null;
    setUser(user);
  } catch {
    setUser(null);
  } finally {
    setLoading(false);
  }
};
