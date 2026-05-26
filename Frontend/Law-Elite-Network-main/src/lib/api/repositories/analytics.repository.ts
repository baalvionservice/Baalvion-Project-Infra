
"use client";

import { apiClient } from '@/lib/api/client';

export class AnalyticsRepository {
  constructor() {}

  async log(eventType: string, metadata: any, uid?: string) {
    const payload = {
      eventType,
      uid: uid ?? null,
      metadata,
      createdAt: new Date().toISOString(),
    };
    // Non-blocking fire-and-forget
    apiClient.post('/admin/analytics/events', payload).catch(() => {});
    return payload;
  }

  async countEventsByType(eventType: string, _startDate?: Date): Promise<number> {
    try {
      const res = await apiClient.get('/admin/analytics', { params: { eventType, aggregate: 'count' } });
      return res.data?.data?.total ?? 0;
    } catch {
      return 0;
    }
  }

  async getEventsByType(eventType: string, startDate?: Date) {
    try {
      const params: Record<string, any> = { eventType };
      if (startDate) params.startDate = startDate.toISOString();
      const res = await apiClient.get('/admin/analytics', { params });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }
}
