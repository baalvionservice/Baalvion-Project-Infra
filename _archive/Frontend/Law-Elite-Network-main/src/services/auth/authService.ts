
'use client';

import { getToken } from '@/lib/api/client';

function parseJwt(token: string) {
  try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
}

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  const token = getToken();
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload) return null;
  return { uid: String(payload.id || ''), email: payload.email, role: payload.role };
};

export const getUserRole = async (_uid: string): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  const token = getToken();
  if (!token) return null;
  const payload = parseJwt(token);
  return payload?.role || null;
};
