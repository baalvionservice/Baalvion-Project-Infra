import { ApiResponse } from '@/types';

/**
 * @fileOverview Mock service for content publishing schedules.
 */

export interface ScheduledArticle {
  id: string;
  title: string;
  author: string;
  scheduledDate: string;
  status: "scheduled" | "published";
}

const mockScheduled: ScheduledArticle[] = [
  { id: 'sch-1', title: 'Macro Trends in 2026', author: 'The Market Maven', scheduledDate: '2024-04-10T10:00:00Z', status: 'scheduled' },
  { id: 'sch-2', title: 'Quantitative Easing vs Tightening', author: 'Expert Editor', scheduledDate: '2024-04-12T14:30:00Z', status: 'scheduled' },
  { id: 'sch-3', title: 'The Future of DeFi', author: 'Wealth Builder', scheduledDate: '2024-04-15T09:00:00Z', status: 'scheduled' },
  { id: 'sch-4', title: 'Yield Curve Inversion Deep Dive', author: 'The Market Maven', scheduledDate: '2024-04-05T08:00:00Z', status: 'published' },
];

export const getScheduledArticles = async (): Promise<ApiResponse<ScheduledArticle[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    data: mockScheduled,
    status: 200,
  };
};
