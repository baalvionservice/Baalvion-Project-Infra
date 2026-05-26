"use client";

import { apiClient } from '@/lib/api/client';
import { useAuthStore } from "@/store/authStore";

/**
 * @fileOverview REST AuthStateListener
 * Replaces the Firebase onAuthStateChanged listener.
 * Reads the stored JWT and fetches the current user profile from /auth/me.
 */
export const initAuthListener = async () => {
  const { setUser, setLoading } = useAuthStore.getState();
  setLoading(true);

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('baalvion_law_token')
    : null;

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
