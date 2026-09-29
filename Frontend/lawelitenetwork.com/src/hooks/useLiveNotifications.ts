'use client';

import { useState, useEffect, useRef } from 'react';
import { subscribeToNotifications, markAsRead } from '@/services/notifications/notificationService';

/**
 * @fileOverview useLiveNotifications Hook
 * Enhanced real-time synchronization for executive alerts with change detection for toasts.
 */
export function useLiveNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [latestNotification, setLatestNotification] = useState<any>(null);
  
  // Keep track of IDs we've already seen to avoid duplicate toasts
  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      const unread = data.filter(n => !n.isRead);
      setUnreadCount(unread.length);
      
      // Identify the single newest unread notification for toast alerting
      if (unread.length > 0) {
        const newest = unread[0];
        if (!seenIds.current.has(newest.id || newest.notificationId)) {
          setLatestNotification(newest);
          seenIds.current.add(newest.id || newest.notificationId);
        }
      }
      
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userId]);

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n => markAsRead(n.id || n.notificationId)));
  };

  return {
    notifications,
    unreadCount,
    loading,
    latestNotification,
    markAsRead,
    handleMarkAllRead
  };
}
