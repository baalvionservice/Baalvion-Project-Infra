'use client';

/**
 * @fileOverview REST Lawyer Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseGetAllLawyers = async () => {
  try {
    const res = await apiClient.get('/lawyers');
    return res.data?.data ?? [];
  } catch (error) {
    console.error('Lawyers retrieval failure:', error);
    throw new Error('Unable to synchronize marketplace from the network.');
  }
};

export const firebaseGetLawyerById = async (id: string) => {
  try {
    const res = await apiClient.get(`/lawyers/${id}`);
    return res.data?.data ?? null;
  } catch (error) {
    console.error('Lawyer retrieval failure:', error);
    throw new Error('Unable to synchronize practitioner dossier.');
  }
};

export const firebaseSearchLawyers = async (filters: {
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  query?: string;
}) => {
  try {
    const params: Record<string, any> = {};
    if (filters.specialization && filters.specialization !== 'all') {
      params.specialization = filters.specialization;
    }
    if (filters.minRating && filters.minRating !== 'all' as any) {
      params.minRating = filters.minRating;
    }
    if (filters.maxPrice && filters.maxPrice !== 'all' as any) {
      params.maxPrice = filters.maxPrice;
    }
    if (filters.query) {
      params.search = filters.query;
    }

    const res = await apiClient.get('/lawyers', { params });
    return res.data?.data ?? [];
  } catch (error) {
    console.error('Search failure:', error);
    throw new Error('Search protocol interrupted.');
  }
};
