
"use client";

import { apiClient } from '@/lib/api/client';
import { UserRole } from '../types';

export interface LawyerSearchParams {
  city?: string;
  specialization?: string;
  minExperience?: number;
  minRating?: number;
  sortBy?: 'rankingBoost' | 'rating' | 'experienceYears' | 'createdAt';
  pageSize?: number;
  lastDoc?: null;
  onlyApproved?: boolean;
}

export class ProfileRepository {
  constructor() {}

  async getProfile(roleId: UserRole, userId: string) {
    try {
      if (roleId === 'lawyer') {
        const res = await apiClient.get(`/lawyers/${userId}`);
        return res.data?.data ?? null;
      } else if (roleId === 'client') {
        const res = await apiClient.get(`/clients/${userId}`);
        return res.data?.data ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }

  async createProfile(roleId: UserRole, userId: string, data: any) {
    try {
      const endpoint = roleId === 'lawyer' ? '/lawyers' : '/clients';
      const res = await apiClient.post(endpoint, { ...data, userId });
      return res.data?.data ?? data;
    } catch {
      return null;
    }
  }

  async updateProfile(roleId: UserRole, userId: string, data: any) {
    try {
      const endpoint = roleId === 'lawyer' ? `/lawyers/${userId}` : `/clients/${userId}`;
      await apiClient.patch(endpoint, data);
    } catch {
      // no-op
    }
  }

  async findLawyers(params: LawyerSearchParams) {
    try {
      const queryParams: Record<string, any> = {};

      if (params.city) queryParams.city = params.city;
      if (params.specialization) queryParams.specialization = params.specialization;
      if (params.minExperience !== undefined) queryParams.minExperience = params.minExperience;
      if (params.minRating !== undefined) queryParams.minRating = params.minRating;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.onlyApproved) queryParams.status = 'approved';

      const limit = Math.min(params.pageSize || 12, 50);
      queryParams.limit = limit;

      const res = await apiClient.get('/lawyers', { params: queryParams });
      const docs = res.data?.data ?? [];

      return {
        docs,
        lastSnapshot: null,
        count: docs.length,
        hasMore: docs.length === limit
      };
    } catch {
      return { docs: [], lastSnapshot: null, count: 0, hasMore: false };
    }
  }

  async findPendingVerifications() {
    try {
      const res = await apiClient.get('/lawyers', {
        params: { verificationStatus: 'pending', limit: 20 }
      });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }
}
