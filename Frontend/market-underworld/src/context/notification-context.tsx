
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'class' | 'payment' | 'order' | 'message' | 'achievement' | 'forum' | 'system' | 'account';

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

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    type: 'class',
    title: 'Chemistry Class in 10 Minutes!',
    body: "Your scheduled class starts at 4:00 PM. Don't be late! Priya is already online.",
    read: false,
    pinned: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 min ago
    actionUrl: '/classroom/class-847',
    actionLabel: 'Join Class',
    source: { name: 'Priya Sharma', role: 'Teacher' }
  },
  {
    id: 'notif_2',
    type: 'payment',
    title: '0.02 ETH Payment Confirmed ✅',
    body: "Payment for Chemistry class confirmed on blockchain in 2.3 seconds. TX: 0x4f2a...8b3c",
    read: false,
    pinned: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    actionUrl: '/student/dashboard/wallet',
    actionLabel: 'View Receipt',
    source: { name: 'NEXUS Wallet' }
  },
  {
    id: 'notif_3',
    type: 'message',
    title: 'New Message from Priya Sharma',
    body: "I've prepared some extra practice problems for today's class. Check the resources tab!",
    read: false,
    pinned: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
    actionUrl: '/messages/priya-sharma',
    actionLabel: 'Reply',
    source: { name: 'Priya Sharma', role: 'Teacher' }
  },
  {
    id: 'notif_4',
    type: 'order',
    title: 'Order Shipped! 🚀',
    body: "Your MacBook Air M4 order #NX-2026-01245 has been shipped. ETA: March 12.",
    read: false,
    pinned: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1h ago
    actionUrl: '/marketplace/orders/NX-2026-01245',
    actionLabel: 'Track Order',
    source: { name: 'TechGadgets Store' }
  },
  {
    id: 'notif_5',
    type: 'achievement',
    title: 'Achievement Progress Update!',
    body: "Crypto Whale badge: 84% complete! Just 0.158 ETH more to unlock.",
    read: false,
    pinned: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2h ago
    actionUrl: '/admin/student/achievements',
    actionLabel: 'View Progress'
  },
  {
    id: 'notif_6',
    type: 'achievement',
    title: 'New Badge Unlocked! 🎉',
    body: "🌍 Global Learner badge earned! You enrolled with a teacher from a different country. +50 XP!",
    read: true,
    pinned: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // Yesterday
    actionUrl: '/admin/student/achievements',
    actionLabel: 'View Badge'
  }
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const togglePin = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...t, id };
    setToasts(prev => [...prev, newToast].slice(-4)); // Max 4 toasts
  }, []);

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
