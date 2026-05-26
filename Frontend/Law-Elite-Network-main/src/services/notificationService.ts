/**
 * @fileOverview NotificationService
 * Primary service layer for intelligence alerts and event broadcasting.
 */

import {
  getNotificationsMock,
  saveNotificationsMock,
} from "@/lib/mock/notificationMock";
import { Notification } from "@/types/notification";

/**
 * Retrieves all alerts for the specified member.
 */
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  const data = getNotificationsMock();
  return data.filter((n: any) => n.userId === userId);
};

/**
 * Broadcasts a new network alert.
 */
export const createNotification = async (notification: Notification): Promise<void> => {
  const existing = getNotificationsMock();
  const updated = [notification, ...existing];
  saveNotificationsMock(updated);
};

/**
 * Synchronizes the read status of a specific alert.
 */
export const markAsRead = async (id: string): Promise<void> => {
  const data = getNotificationsMock();

  const updated = data.map((n: any) =>
    n.id === id ? { ...n, read: true } : n
  );

  saveNotificationsMock(updated);
};
