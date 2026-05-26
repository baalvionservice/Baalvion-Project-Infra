'use client';

import { Notification, NotificationStatus, NotificationModuleSource, UserRole } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { subscriptionService } from "./subscription.service";
import { settingsService } from "./settings.service";

let notificationsState: Notification[] = [
  {
    id: 'notif-001',
    title: 'Q4 Financials Released',
    message: 'The Q4 2025 performance reports are now available in the institutional data room.',
    moduleSource: 'DataRoom',
    targetRoles: ['P1Investor', 'P2Investor'],
    status: 'Sent',
    sentAt: '2026-01-15T08:00:00Z',
    deliveryStats: { totalRecipients: 142, deliveredCount: 142, failedCount: 0 },
    versionHistory: []
  }
];

export const notificationService = {
  getAllNotifications: async (): Promise<Notification[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...notificationsState].sort((a, b) => {
        const dateA = new Date(a.sentAt || a.scheduledAt || 0).getTime();
        const dateB = new Date(b.sentAt || b.scheduledAt || 0).getTime();
        return dateB - dateA;
    });
  },

  getNotificationById: async (id: string): Promise<Notification | null> => {
    return notificationsState.find(n => n.id === id) || null;
  },

  createNotification: async (notif: Omit<Notification, 'id' | 'versionHistory' | 'deliveryStats'>): Promise<string> => {
    const { role } = await authService.getCurrentUser();
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newNotif: Notification = {
      ...notif,
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString() }]
    };

    notificationsState.push(newNotif);
    await auditService.log({
      userRole: role,
      module: 'Notifications',
      action: 'create',
      entityId: newNotif.id,
      newState: newNotif
    });

    window.dispatchEvent(new Event('notification-updated'));
    return newNotif.id;
  },

  triggerAutoNotification: async (source: NotificationModuleSource, entityId: string, title: string, roles: UserRole[]) => {
    const settings = await settingsService.getSettings();
    if (!settings.features.autoNotifyEnabled) return;

    const id = await notificationService.createNotification({
        title: `Action Required: ${title}`,
        message: `A new update has been published in ${source}. Please log in to review.`,
        moduleSource: source,
        entityId,
        targetRoles: roles,
        status: settings.features.autoSendEnabled ? 'Sent' : 'Draft'
    });

    if (settings.features.autoSendEnabled) {
        await notificationService.sendNotification(id);
    }
  },

  sendNotification: async (id: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const settings = await settingsService.getSettings();
    if (settings.features.freezePublishing) throw new Error("Distribution locked due to compliance freeze.");

    const notif = notificationsState.find(n => n.id === id);
    if (!notif) return;
    if (notif.status === 'Sent') throw new Error("Notification already sent.");

    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter subscribers based on roles and categories
    const subscribers = await subscriptionService.getSubscribers();
    const recipients = subscribers.filter(s => 
        s.active && 
        notif.targetRoles.includes(s.role) &&
        s.preferences[notif.moduleSource as keyof typeof s.preferences] !== false
    );

    notif.status = 'Sent';
    notif.sentAt = new Date().toISOString();
    notif.deliveryStats = {
        totalRecipients: recipients.length,
        deliveredCount: recipients.length,
        failedCount: 0
    };

    await auditService.log({
      userRole: role,
      module: 'Notifications',
      action: 'send',
      entityId: id,
      newState: { status: 'Sent', stats: notif.deliveryStats }
    });

    window.dispatchEvent(new Event('notification-updated'));
  },

  updateNotification: async (id: string, updates: Partial<Notification>): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const notif = notificationsState.find(n => n.id === id);
    if (!notif || notif.status === 'Sent') return;

    Object.assign(notif, updates);
    window.dispatchEvent(new Event('notification-updated'));
  }
};
