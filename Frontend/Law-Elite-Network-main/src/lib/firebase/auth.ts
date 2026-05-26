'use client';

/**
 * @fileOverview REST Authentication utilities for the Law Elite Network.
 * Replaces the previous Firebase Auth implementation.
 */

import { apiClient } from '@/lib/api/client';

const TOKEN_KEY = 'baalvion_law_token';

export const loginUser = async (email: string, password: string) => {
  const res = await apiClient.post('/auth/login', { email, password });
  const token: string | undefined = res.data?.data?.accessToken;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return res.data?.data;
};

export const signupUser = async (email: string, password: string) => {
  const res = await apiClient.post('/auth/register', { email, password });
  const token: string | undefined = res.data?.data?.accessToken;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  return res.data?.data;
};

export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // ignore logout errors
  } finally {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Stub `auth` export for legacy compatibility — not a Firebase object
export const auth = {
  currentUser: null as null | { email: string | null; uid: string },
};
