/**
 * @fileOverview Core Booking Type definitions for the Law Elite Network.
 */

export interface Booking {
  id: string;
  lawyerId: string;
  userId: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
  amount?: number;
  currency?: string;
  createdAt: number;
}
