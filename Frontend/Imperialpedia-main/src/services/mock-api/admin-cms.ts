import { ApiResponse } from '@/types';
import { CMSDashboardData } from '@/types/system';

/**
 * @fileOverview Specialized mock service for the Admin CMS Dashboard.
 * Aligned with Prompt 42 requirements for content, roles, and logs.
 */

const mockCMSData: CMSDashboardData = {
  cms_content: [
    { content_id: 1, title: "Macro Trends in 2026", author: "Eleanor Vance", status: "Published", last_updated: "2026-03-15" },
    { content_id: 2, title: "Understanding QE Cycles", author: "The Market Maven", status: "Draft", last_updated: "2026-03-15" },
    { content_id: 3, title: "DeFi Liquidity Audit", author: "Sarah Crypto", status: "Review", last_updated: "2026-03-14" },
    { content_id: 4, title: "Fixed Income Fundamentals", author: "Julian Wealth", status: "Published", last_updated: "2026-03-12" }
  ],
  user_roles: [
    { username: "AdminUser", role: "Admin", permissions: { view: true, edit: true, delete: true } },
    { username: "EditorUser", role: "Editor", permissions: { view: true, edit: true, delete: false } },
    { username: "ModeratorUser", role: "Moderator", permissions: { view: true, edit: false, delete: true } },
    { username: "GuestReader", role: "Viewer", permissions: { view: true, edit: false, delete: false } }
  ],
  analytics: [
    { metric: "Article Views", value: 124500 },
    { metric: "Guide Engagement", value: 8420 },
    { metric: "Total Users", value: 142500 },
    { metric: "Active Experts", value: 156 }
  ],
  system_logs: [
    { event: "Content Approved: Macro Trends", user: "AdminUser", timestamp: "2026-03-15 10:00" },
    { event: "User Role Changed: editor_john", user: "AdminUser", timestamp: "2026-03-15 11:00" },
    { event: "Draft Created: yield_scam_audit", user: "EditorUser", timestamp: "2026-03-15 12:30" },
    { event: "Security Alert: Unusual Login", user: "System", timestamp: "2026-03-15 14:20" }
  ]
};

export const getCmsDashboardData = async (): Promise<ApiResponse<CMSDashboardData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockCMSData,
    status: 200,
  };
};
