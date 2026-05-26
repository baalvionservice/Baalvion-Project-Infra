/**
 * @fileOverview Core Notification Type definitions for the Law Elite Network.
 */

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
}
