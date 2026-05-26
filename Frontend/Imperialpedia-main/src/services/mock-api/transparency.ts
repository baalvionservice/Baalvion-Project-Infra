import { ApiResponse } from '@/types';
import { TransparencyData } from '@/types/system';

/**
 * @fileOverview Mock service for Platform Transparency Reports.
 */

const mockTransparencyData: TransparencyData = {
  metrics: {
    articles_published: 18240,
    contributors: 3200,
    editorial_reviews: 8640,
    moderation_actions: 720,
    community_reports: 410,
    revisions_made: 1540
  },
  moderation: {
    removed: 450,
    flagged: 1200,
    warnings: 320,
    restricted: 45,
    resolved: 1150,
    trends: [
      { date: 'Jan', removed: 40, flagged: 100 },
      { date: 'Feb', removed: 35, flagged: 120 },
      { date: 'Mar', removed: 55, flagged: 150 },
      { date: 'Apr', removed: 42, flagged: 110 },
      { date: 'May', removed: 38, flagged: 95 },
      { date: 'Jun', removed: 45, flagged: 130 }
    ]
  },
  editorial: {
    submitted: 1200,
    approved: 1050,
    rejected: 50,
    revised: 100,
    trends: [
      { date: 'Jan', approved: 150, revised: 20 },
      { date: 'Feb', approved: 180, revised: 15 },
      { date: 'Mar', approved: 210, revised: 25 },
      { date: 'Apr', approved: 190, revised: 18 },
      { date: 'May', approved: 175, revised: 12 },
      { date: 'Jun', approved: 205, revised: 22 }
    ]
  },
  community: {
    discussions: 2400,
    comments: 45000,
    votes: 125000,
    predictions: 8400,
    trends: [
      { date: 'Jan', engagement: 12000 },
      { date: 'Feb', engagement: 15000 },
      { date: 'Mar', engagement: 18000 },
      { date: 'Apr', engagement: 16500 },
      { date: 'May', engagement: 19200 },
      { date: 'Jun', engagement: 22400 }
    ]
  },
  quality: {
    avg_score: 84,
    verified_pct: 72,
    needs_improvement: 120,
    top_rated: 420,
    trends: [
      { date: 'Jan', score: 80 },
      { date: 'Feb', score: 81 },
      { date: 'Mar', score: 82 },
      { date: 'Apr', score: 82 },
      { date: 'May', score: 83 },
      { date: 'Jun', score: 84 }
    ]
  },
  reports: [
    { id: 'tr-1', title: 'Monthly Transparency Report', period: 'August 2025', summary: 'Editorial activity and moderation insights for the late summer cycle.' },
    { id: 'tr-2', title: 'Quarterly Governance Report', period: 'Q2 2025', summary: 'Deep dive into platform operations, user growth, and community engagement.' },
    { id: 'tr-3', title: 'Annual Platform Integrity Report', period: '2024', summary: 'The definitive overview of Imperialpedia scale, safety, and expert audits.' }
  ]
};

export const getTransparencyData = async (): Promise<ApiResponse<TransparencyData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockTransparencyData,
    status: 200,
  };
};
