'use client';

import { useState, useEffect } from 'react';
import { subscribeToNotifications, markAsRead } from '@/services/notifications/notificationService';

/**
 * @fileOverview useNotifications Hook
 * Real-time synchronization for executive alerts.
 */
export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkRead
  };
}
