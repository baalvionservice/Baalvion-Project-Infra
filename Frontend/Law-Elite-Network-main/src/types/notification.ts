/**
 * @fileOverview Core Notification Type definitions for the Law Elite Network.
 */

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  /** Same-site path the notification links to, when it has one. */
  url?: string;
  createdAt: number;
}
