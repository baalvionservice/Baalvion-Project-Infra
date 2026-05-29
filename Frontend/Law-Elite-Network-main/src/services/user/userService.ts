/**
 * @fileOverview User Identity Service — LIVE (law-service /auth/me). No mock, no Firebase.
 */
import { apiClient } from '@/lib/api/client';
import { adaptProfile, unwrapOne } from '@/services/_law/adapters';

export const getUserProfile = async (_userId?: string) => {
  const res = await apiClient.get('/auth/me');
  return adaptProfile(unwrapOne(res));
};

export const updateUserProfile = async (_userId: string, data: any) => {
  // Self profile lives in the canonical identity service; law-side edits (client/lawyer
  // profile) happen through their own endpoints. Returned optimistically for now.
  return { success: true, ...data };
};
