import { ApiResponse } from '@/types';
import { AuditLog, ReviewAction } from '@/modules/content-engine/types/article';

/**
 * @fileOverview Mock service for audit logs and review history.
 */

export const mockAuditLogs: AuditLog[] = [
  { id: 'log-1', actor: 'Eleanor Vance', action: 'User Role Changed', details: 'The Market Maven (writer -> editor)', timestamp: '2024-03-12T10:30:00Z', type: 'user' },
  { id: 'log-2', actor: 'Eleanor Vance', action: 'Article Published', details: 'Understanding Yield Curve Inversion', timestamp: '2024-03-12T09:15:00Z', type: 'content' },
  { id: 'log-3', actor: 'Expert Editor', action: 'Category Deleted', details: 'Legacy Web3 Taxonomy Node', timestamp: '2024-03-11T16:45:00Z', type: 'system' },
  { id: 'log-4', actor: 'Eleanor Vance', action: 'SEO Bulk Audit', details: '1,248 Articles scanned for canonicals', timestamp: '2024-03-11T14:20:00Z', type: 'system' },
  { id: 'log-5', actor: 'The Market Maven', action: 'Draft Created', details: 'Quantitative Easing vs Tightening', timestamp: '2024-03-11T11:05:00Z', type: 'content' },
  { id: 'log-6', actor: 'System Auto-Bot', action: 'Security Protocol', details: 'IP 192.168.1.1 blocked after 5 failed login attempts', timestamp: '2024-03-12T12:00:00Z', type: 'security' },
];

export const mockReviewHistory: ReviewAction[] = [
  { 
    id: 'rev-1', 
    articleId: 'art-1', 
    articleTitle: 'Understanding Yield Curve Inversion', 
    action: 'approved', 
    userId: 'u-3', 
    userName: 'Expert Editor', 
    comment: 'Excellent depth on the 2-10 spread analysis.', 
    timestamp: '2024-03-12T09:10:00Z' 
  },
  { 
    id: 'rev-2', 
    articleId: 'art-1', 
    articleTitle: 'Understanding Yield Curve Inversion', 
    action: 'submitted', 
    userId: 'u-2', 
    userName: 'The Market Maven', 
    timestamp: '2024-03-11T15:30:00Z' 
  },
  { 
    id: 'rev-3', 
    articleId: 'art-sub-1', 
    articleTitle: 'The Future of Central Banking', 
    action: 'changes_requested', 
    userId: 'u-3', 
    userName: 'Expert Editor', 
    comment: 'Please add more sources regarding the Fed’s CBDC pilot.', 
    timestamp: '2024-03-10T14:00:00Z' 
  },
  { 
    id: 'rev-4', 
    articleId: 'art-sub-1', 
    articleTitle: 'The Future of Central Banking', 
    action: 'commented', 
    userId: 'u-3', 
    userName: 'Expert Editor', 
    comment: 'Initial structure looks good, but needs more visual data.', 
    timestamp: '2024-03-10T10:30:00Z' 
  },
];

export const getAuditLogs = async (): Promise<ApiResponse<AuditLog[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockAuditLogs,
    status: 200,
  };
};

export const getReviewHistory = async (): Promise<ApiResponse<ReviewAction[]>> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return {
    data: mockReviewHistory,
    status: 200,
  };
};
