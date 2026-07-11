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
  // 4-dimension breakdown (spec area 8). Undefined on legacy single-score
  // reviews — render `rating` only in that case.
  professionalism?: number;
  communication?: number;
  expertise?: number;
  timeliness?: number;
}
