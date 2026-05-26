
import { apiClient } from '@/lib/api/client';

export class NotificationRepository {
  constructor() {}

  async create(data: any) {
    try {
      const res = await apiClient.post('/notifications', { ...data, isRead: false });
      return res.data?.data ?? null;
    } catch {
      return null;
    }
  }

  async markAsRead(notificationId: string) {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch {
      // no-op
    }
  }

  async getNotifications(recipientUid: string, max: number = 20) {
    try {
      const res = await apiClient.get('/notifications', {
        params: { recipientUid, limit: max }
      });
      return res.data?.data ?? [];
    } catch {
      return [];
    }
  }

  // Legacy method kept for compatibility — returns null since Firestore queries are gone
  getNotificationsQuery(_recipientUid: string, _max: number = 20) {
    return null;
  }
}
