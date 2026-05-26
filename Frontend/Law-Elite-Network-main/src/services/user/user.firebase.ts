'use client';
/**
 * @fileOverview REST User Identity Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseGetUserProfile = async (_userId: string) => {
  try {
    const res = await apiClient.get('/auth/me');
    return res.data?.data ?? null;
  } catch (error) {
    console.error('Identity retrieval failure:', error);
    throw new Error('Unable to synchronize user profile from the network.');
  }
};

export const firebaseUpdateUserProfile = async (userId: string, data: any) => {
  try {
    const res = await apiClient.patch(`/users/${userId}`, data);
    return res.data?.data ?? data;
  } catch (error) {
    console.error('Identity update failure:', error);
    throw new Error('Unable to synchronize profile updates with the network.');
  }
};
