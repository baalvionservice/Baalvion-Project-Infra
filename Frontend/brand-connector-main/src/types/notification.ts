
export type NotificationType = "info" | "success" | "warning";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  event: string;
  action: string;
  enabled: boolean;
}
