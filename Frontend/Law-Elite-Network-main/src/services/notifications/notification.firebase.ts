'use client';
/**
 * @fileOverview REST Notification Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseCreateNotification = async (data: any) => {
  try {
    await apiClient.post('/notifications', {
      ...data,
      isRead: false,
    });
  } catch (error) {
    console.error('Notification creation failure:', error);
  }
};

export const firebaseSubscribeToNotifications = (
  userId: string,
  callback: (notifications: any[]) => void
): (() => void) => {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await apiClient.get('/notifications', { params: { userId, limit: 20 } });
      const notifications = res.data?.data ?? [];
      callback(notifications);
    } catch {
      // silently skip failed polls
    }
    if (active) {
      setTimeout(poll, 30_000);
    }
  };

  // Kick off immediately
  poll();

  return () => {
    active = false;
  };
};

export const firebaseMarkAsRead = async (notificationId: string) => {
  try {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('Mark as read failure:', error);
  }
};
