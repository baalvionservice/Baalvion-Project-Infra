/**
 * @fileOverview Core Subscription Type definitions for the Law Elite Network.
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  recommended?: boolean;
}

export interface Subscription {
  userId: string;
  planId: string;
  active: boolean;
  startDate: number;
  expiryDate: number;
}
