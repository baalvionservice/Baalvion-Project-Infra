/**
 * @fileOverview Core Payment Type definitions for the Law Elite Network.
 */

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  status: "success" | "failed";
  method: "upi" | "card" | "netbanking";
  createdAt: number;
}
