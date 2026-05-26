/**
 * @fileOverview Notification Service Entry Point
 * Orchestrates the routing of executive alerts and real-time network signals.
 */

import * as firebaseService from './notification.firebase';
import * as mockService from './notification.mock';

const USE_MOCK = true;

export type NotificationPriority = 'low' | 'medium' | 'high';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: 'case_created' | 'case_updated' | 'status_changed';
  priority?: NotificationPriority;
  relatedCaseId?: string;
}

export const createNotification = async (data: CreateNotificationInput) => {
  const payload = {
    ...data,
    priority: data.priority || 'medium'
  };

  if (USE_MOCK) {
    return await mockService.mockCreateNotification(payload);
  }
  return await firebaseService.firebaseCreateNotification(payload);
};

export const markAsRead = async (notificationId: string) => {
  if (USE_MOCK) {
    return await mockService.mockMarkAsRead(notificationId);
  }
  return await firebaseService.firebaseMarkAsRead(notificationId);
};

export const subscribeToNotifications = (userId: string, callback: (notifications: any[]) => void) => {
  if (USE_MOCK) {
    const handler = () => {
      callback(mockService.mockGetNotifications(userId));
    };
    window.addEventListener('storage', handler);
    handler();
    return () => window.removeEventListener('storage', handler);
  }
  return firebaseService.firebaseSubscribeToNotifications(userId, callback);
};