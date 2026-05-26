import { ApiResponse } from '@/types';
import { EditorialDashboardData } from '@/types/editorial';

/**
 * @fileOverview Mock service for the Editorial Review Workflow system.
 */

const mockEditorialData: EditorialDashboardData = {
  metrics: {
    submitted: 14,
    under_review: 8,
    approved: 42,
    revisions: 5,
    published_recently: 12
  },
  submissions: [
    {
      id: 'sub-1',
      title: 'Understanding Inflation and Interest Rates',
      author: 'Daniel Harris',
      category: 'Macroeconomics',
      status: 'Under Review',
      assigned_editor: 'Sarah Collins',
      submitted_at: '2024-03-12T10:00:00Z',
      quality_score: 88,
      trust_score: 92,
      word_count: 2400,
      engagement_projection: 'High'
    },
    {
      id: 'sub-2',
      title: 'Beginner Guide to Options Trading',
      author: 'Emily Chen',
      category: 'Trading',
      status: 'Submitted',
      assigned_editor: 'Michael Grant',
      submitted_at: '2024-03-12T11:30:00Z',
      quality_score: 74,
      trust_score: 85,
      word_count: 1850,
      engagement_projection: 'Medium'
    },
    {
      id: 'sub-3',
      title: 'The Future of DeFi Liquidity',
      author: 'Sarah Crypto',
      category: 'Crypto',
      status: 'Revision Requested',
      assigned_editor: 'Sarah Collins',
      submitted_at: '2024-03-11T14:20:00Z',
      quality_score: 91,
      trust_score: 88,
      word_count: 3200,
      engagement_projection: 'Viral'
    }
  ],
  editors: [
    {
      id: 'ed-1',
      name: 'Sarah Collins',
      expertise: 'Macroeconomics',
      articles_assigned: 12,
      review_progress: 75,
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      status: 'Active'
    },
    {
      id: 'ed-2',
      name: 'Michael Grant',
      expertise: 'Stock Market',
      articles_assigned: 8,
      review_progress: 40,
      avatar: 'https://picsum.photos/seed/michael/100/100',
      status: 'Active'
    }
  ],
  activity_log: [
    { id: 'log-1', editor_name: 'Sarah Collins', action: 'Article Approved', article_title: 'Yield Curve Audit', timestamp: '2024-03-12T09:00:00Z' },
    { id: 'log-2', editor_name: 'Michael Grant', action: 'Revision Requested', article_title: 'Options Basics', timestamp: '2024-03-12T08:30:00Z' },
    { id: 'log-3', editor_name: 'Sarah Collins', action: 'Editor Reassigned', article_title: 'DeFi Future', timestamp: '2024-03-11T16:00:00Z' }
  ]
};

export const getEditorialDashboardData = async (): Promise<ApiResponse<EditorialDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockEditorialData,
    status: 200,
  };
};
