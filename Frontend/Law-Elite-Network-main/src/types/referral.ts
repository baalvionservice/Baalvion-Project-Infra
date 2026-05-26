/**
 * @fileOverview Core Referral Type definitions for the Law Elite Network.
 */

export interface Referral {
  userId: string;
  code: string;
  referredUsers: string[];
  rewards: number;
}
