
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { feed, type FeedItem } from '@/lib/api/notifications';

export type NotificationType =
  | 'class' | 'payment' | 'order' | 'message' | 'achievement' | 'forum' | 'system' | 'account'
  | 'booking' | 'application' | 'verification' | 'gig' | 'education' | 'bounty' | 'kyc';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  pinned: boolean;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  source?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  metadata?: any;
  demo?: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'payment' | 'class';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'pinned' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  togglePin: (id: string) => void;
  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notifications come from the server feed (community-service) while signed in. Anything raised
// locally through addNotification is kept alongside it until the page reloads.
const POLL_MS = 60_000;

const fromFeed = (i: FeedItem): Notification => ({
  id: i.id,
  type: i.type as NotificationType,
  title: i.title,
  body: i.body,
  read: i.read,
  pinned: false,
  timestamp: new Date(i.createdAt),
  actionUrl: i.url ?? undefined,
  actionLabel: i.url ? 'Open' : undefined,
  metadata: { server: true },
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const knownIds = React.useRef<Set<string> | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...t, id }].slice(-4)); // Max 4 toasts
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      knownIds.current = null;
      setNotifications(prev => prev.filter(n => !n.metadata?.server));
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const data = await feed.list();
        if (!alive || !data) return;
        const items = data.items.map(fromFeed);
        // After the first load, announce anything that arrived since the last poll.
        if (knownIds.current) {
          for (const n of items) {
            if (!n.read && !knownIds.current.has(n.id)) addToast({ type: 'info', title: n.title, message: n.body, duration: 6000 });
          }
        }
        knownIds.current = new Set(items.map(n => n.id));
        setNotifications(prev => [...prev.filter(n => !n.metadata?.server), ...items]);
      } catch { /* a missed poll is harmless; try again next tick */ }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [isAuthenticated, addToast]);

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'read' | 'pinned' | 'timestamp'>) => {
    const newNotif: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      pinned: false,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const isServer = (id: string) => notifications.find(n => n.id === id)?.metadata?.server === true;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (isServer(id)) feed.markRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (notifications.some(n => n.metadata?.server)) feed.markAllRead().catch(() => {});
  };

  const deleteNotification = (id: string) => {
    if (isServer(id)) feed.remove(id).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    notifications.filter(n => n.metadata?.server).forEach(n => feed.remove(n.id).catch(() => {}));
    setNotifications([]);
  };

  const togglePin = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification, 
      clearAll, 
      togglePin,
      toasts,
      addToast,
      removeToast
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
