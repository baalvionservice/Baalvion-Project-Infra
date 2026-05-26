/**
 * @fileOverview Core Review Type definitions for the Law Elite Network.
 */

export interface Review {
  id: string;
  lawyerId: string;
  userId: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: number;
}
