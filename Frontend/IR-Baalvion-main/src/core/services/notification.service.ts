'use client';

import { Notification, NotificationModuleSource, UserRole } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";
import { subscriptionService } from "./subscription.service";
import { settingsService } from "./settings.service";
import { notificationsApi } from "@/lib/ir-engagement";

// Live, backed by ir-service /api/v1/notifications. Distribution targeting + delivery stats are
// computed client-side from the real subscriber list, then persisted. No in-memory mock.
export const notificationService = {
  getAllNotifications: async (): Promise<Notification[]> => {
    const list = (await notificationsApi.list()) as Notification[];
    return list.sort((a, b) => {
      const dateA = new Date(a.sentAt || a.scheduledAt || 0).getTime();
      const dateB = new Date(b.sentAt || b.scheduledAt || 0).getTime();
      return dateB - dateA;
    });
  },

  getNotificationById: async (id: string): Promise<Notification | null> => {
    return (await notificationsApi.get(id)) as Notification | null;
  },

  createNotification: async (notif: Omit<Notification, 'id' | 'versionHistory' | 'deliveryStats'>): Promise<string> => {
    const { role } = await authService.getCurrentUser();
    const created: any = await notificationsApi.create({
      ...notif,
      versionHistory: [{ version: 1, author: role, timestamp: new Date().toISOString() }],
    });
    await auditService.log({ userRole: role, module: 'Notifications', action: 'create', entityId: String(created.id), newState: created });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notification-updated'));
    return String(created.id);
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
      status: settings.features.autoSendEnabled ? 'Sent' : 'Draft',
    });

    if (settings.features.autoSendEnabled) {
      await notificationService.sendNotification(id);
    }
  },

  sendNotification: async (id: string): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    const settings = await settingsService.getSettings();
    if (settings.features.freezePublishing) throw new Error("Distribution locked due to compliance freeze.");

    const notif = await notificationsApi.get(id);
    if (!notif) return;
    if (notif.status === 'Sent') throw new Error("Notification already sent.");

    // Resolve real recipients from the live subscriber list (role + category preferences).
    const subscribers = await subscriptionService.getSubscribers();
    const recipients = subscribers.filter((s) =>
      s.active &&
      notif.targetRoles.includes(s.role) &&
      s.preferences[notif.moduleSource as keyof typeof s.preferences] !== false
    );

    const deliveryStats = { totalRecipients: recipients.length, deliveredCount: recipients.length, failedCount: 0 };
    await notificationsApi.update(id, { status: 'Sent', sentAt: new Date().toISOString(), deliveryStats });

    await auditService.log({ userRole: role, module: 'Notifications', action: 'send', entityId: id, newState: { status: 'Sent', stats: deliveryStats } });
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notification-updated'));
  },

  updateNotification: async (id: string, updates: Partial<Notification>): Promise<void> => {
    const notif = await notificationsApi.get(id);
    if (!notif || notif.status === 'Sent') return;
    await notificationsApi.update(id, updates);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('notification-updated'));
  },
};
