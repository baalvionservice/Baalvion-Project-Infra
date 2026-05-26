
"use client";

import { apiClient } from '@/lib/api/client';

export class UserRepository {
  constructor() {}

  async findById(userId: string) {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async findByUid(uid: string) {
    try {
      const res = await apiClient.get('/auth/me');
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async findByEmail(email: string) {
    try {
      const res = await apiClient.get('/admin/users', { params: { email } });
      const list = res.data?.data;
      return Array.isArray(list) ? list[0] ?? null : null;
    } catch {
      return null;
    }
  }

  async findAll(max: number = 100) {
    try {
      const res = await apiClient.get('/admin/users', { params: { limit: max } });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }

  async create(userId: string, data: any) {
    try {
      const res = await apiClient.post('/admin/users', { ...data, userId });
      return res.data?.data ?? data;
    } catch {
      return null;
    }
  }

  async update(userId: string, data: any) {
    try {
      await apiClient.patch(`/admin/users/${userId}`, data);
    } catch {
      // no-op
    }
  }

  async updateLastLogin(userId: string) {
    try {
      await apiClient.patch(`/admin/users/${userId}`, { lastLoginAt: new Date().toISOString() });
    } catch {
      // no-op
    }
  }

  async getCount() {
    try {
      const res = await apiClient.get('/admin/users', { params: { limit: 1 } });
      return res.data?.meta?.total ?? 0;
    } catch {
      return 0;
    }
  }
}
