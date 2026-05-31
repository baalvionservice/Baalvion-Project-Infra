/**
 * @fileOverview NotificationService
 * Primary service layer for intelligence alerts and event broadcasting.
 * Backed by law-service (/v1/notifications), scoped to the authenticated user.
 */

import { apiClient } from "@/lib/api/client";
import { Notification } from "@/types/notification";

// law-service notification row (snake_case) → app Notification shape.
function mapNotification(n: any): Notification {
  return {
    id: String(n.id),
    userId: String(n.user_id ?? n.userId ?? ""),
    title: n.title ?? "",
    message: n.message ?? "",
    read: !!n.read,
    createdAt: n.created_at ? new Date(n.created_at).getTime() : (n.createdAt ?? Date.now()),
  };
}

/**
 * Retrieves all alerts for the authenticated member (userId is server-scoped via the token).
 */
export const getUserNotifications = async (_userId?: string): Promise<Notification[]> => {
  const { data } = await apiClient.get("/notifications", { params: { limit: 100 } });
  const items = data?.items ?? data?.data?.items ?? data?.data ?? [];
  return (Array.isArray(items) ? items : []).map(mapNotification);
};

/**
 * Synchronizes the read status of a specific alert.
 */
export const markAsRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`);
};

/**
 * Marks every alert for the authenticated member as read.
 */
export const markAllAsRead = async (): Promise<void> => {
  await apiClient.post("/notifications/read-all");
};

/**
 * Dismisses (deletes) a specific alert.
 */
export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`);
};

/**
 * Notifications are generated server-side by law-service events; the client does not create
 * them directly. Retained as a no-op for back-compat with optimistic-UI callers.
 */
export const createNotification = async (_notification: Notification): Promise<void> => {
  /* server-generated — no client write endpoint */
};
