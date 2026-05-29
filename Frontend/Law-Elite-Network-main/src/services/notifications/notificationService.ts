/**
 * @fileOverview Notification Service — LIVE (law-service / Postgres). No mock, no Firebase.
 * "subscribe" polls the user-scoped notifications endpoint (lightweight near-real-time).
 */
import { notificationApi } from '@/lib/api/client';
import { adaptNotification, unwrapList } from '@/services/_law/adapters';

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: NotificationPriority;
  relatedCaseId?: string;
}

// User-facing notifications are emitted server-side (e.g. admin broadcasts / future events).
// Client-side "create" is a no-op so call sites that fire optimistic alerts don't break.
export const createNotification = async (_data: CreateNotificationInput) => ({ success: true });

export const getNotifications = async () => {
  const res = await notificationApi.list();
  return unwrapList(res).map(adaptNotification);
};

export const markAsRead = async (notificationId: string) => {
  await notificationApi.markRead(notificationId);
  return { success: true };
};

export const subscribeToNotifications = (
  _userId: string,
  callback: (notifications: any[]) => void,
): (() => void) => {
  let active = true;
  const tick = async () => {
    try {
      const list = await getNotifications();
      if (active) callback(list);
    } catch { /* ignore transient errors */ }
  };
  tick();
  const interval = setInterval(tick, 30_000);
  return () => { active = false; clearInterval(interval); };
};
