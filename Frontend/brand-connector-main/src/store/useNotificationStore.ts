
import { create } from 'zustand';
import { Notification, AutomationRule } from '@/types/notification';
import { notificationsApi } from '@/lib/api/notifications';
import { automationApi } from '@/lib/api/automation';

interface NotificationState {
  notifications: Notification[];
  rules: AutomationRule[];
  loading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  fetchRules: () => Promise<void>;
  triggerEvent: (event: string, payload: any) => Promise<void>;
  
  // Derived
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  rules: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await notificationsApi.getNotifications();
      if (res.success) set({ notifications: res.data });
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const res = await notificationsApi.markAsRead(id);
    if (res.success) {
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      }));
    }
  },

  fetchRules: async () => {
    const res = await automationApi.getRules();
    if (res.success) set({ rules: res.data });
  },

  triggerEvent: async (event, payload) => {
    console.log(`Triggering automation: ${event}`);
    await automationApi.trigger(event, payload);
    // Refresh notifications after a small delay to show the effect of automation
    setTimeout(() => get().fetchNotifications(), 1000);
  },

  unreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  }
}));
