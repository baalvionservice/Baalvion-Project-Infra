'use client';

/**
 * @fileOverview REST Authentication utilities for the Law Elite Network.
 * Replaces the previous Firebase Auth implementation.
 *
 * SECURITY (P0 remediation): the access token is held in memory via lib/api/client
 * (setToken/clearToken) — never localStorage/sessionStorage.
 */

import { apiClient, setToken, clearToken } from '@/lib/api/client';

export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post('/auth/login', { email, password });
  const token: string | undefined = res.data?.data?.accessToken;
  if (token) setToken(token);
  return res.data?.data;
};

export const signupUser = async (email: string, password: string) => {
  const res = await apiClient.post('/auth/register', { email, password });
  const token: string | undefined = res.data?.data?.accessToken;
  if (token) setToken(token);
  return res.data?.data;
};

export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // ignore logout errors
  } finally {
    clearToken();
  }
};

// Stub `auth` export for legacy compatibility — not a Firebase object
export const auth = {
  currentUser: null as null | { email: string | null; uid: string },
};
