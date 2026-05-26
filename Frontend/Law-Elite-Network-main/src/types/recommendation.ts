/**
 * @fileOverview Core Recommendation Type definitions for the Law Elite Network.
 */

export type RecommendationType = 'action' | 'suggestion' | 'alert';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  actionLink: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: number;
}
