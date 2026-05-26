
"use client";

import { apiClient } from '@/lib/api/client';
import { SubscriptionData } from '../types';

export class SubscriptionRepository {
  constructor() {}

  async create(data: Partial<SubscriptionData>) {
    try {
      const res = await apiClient.post('/subscriptions', data);
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async getLatestByUid(uid: string): Promise<SubscriptionData | null> {
    try {
      const res = await apiClient.get('/subscriptions/me');
      return (res.data?.data as SubscriptionData) ?? null;
    } catch {
      return null;
    }
  }

  async getById(id: string): Promise<SubscriptionData | null> {
    try {
      const res = await apiClient.get(`/subscriptions/${id}`);
      return (res.data?.data as SubscriptionData) ?? null;
    } catch {
      return null;
    }
  }
}
