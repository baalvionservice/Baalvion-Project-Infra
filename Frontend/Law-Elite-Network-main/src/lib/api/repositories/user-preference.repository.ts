
"use client";

import { apiClient } from '@/lib/api/client';

export class UserPreferenceRepository {
  constructor() {}

  async getByUid(uid: string) {
    try {
      const res = await apiClient.get(`/users/${uid}/preferences`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async updatePreferences(uid: string, data: { caseType?: string; city?: string; search?: string }) {
    try {
      await apiClient.patch(`/users/${uid}/preferences`, data);
    } catch {
      // no-op stub
    }
  }
}
