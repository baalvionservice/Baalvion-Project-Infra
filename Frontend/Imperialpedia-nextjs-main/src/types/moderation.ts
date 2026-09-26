import { ID, Timestamp } from "./common";

/**
 * @fileOverview Type definitions for the platform moderation system.
 */

export type ModerationType =
  | "article"
  | "comment"
  | "submission"
  | "Discussion"
  | "Article"
  | "Comment";
export type ModerationStatus =
  | "Pending"
  | "Reviewed"
  | "Action Taken"
  | "Approved"
  | "Rejected"
  | "pending"
  | "approved"
  | "rejected"
  | "flagged"
  | "Under Review"
  | "Resolved";

/**
 * Standard interface for administrative moderation tasks.
 */
export interface ModerationItem {
  id: string;
  content: string;
  creator: string;
  reportType: string;
  status: "Pending" | "Reviewed" | "Action Taken";
  date: string;
  title: string;
  author: string;
  type: ModerationType;
  createdAt: string;
}

/**
 * Interface for the Moderation Approvals workflow.
 */
export interface ModerationApproval {
  id: string;
  content: string;
  fullContent?: string;
  creator: string;
  reportType: string;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
}

/**
 * Prompt 69: AI Moderation Dashboard Types
 */
export interface ModerationMetrics {
  flagged_content: number;
  articles_under_review: number;
  flagged_comments: number;
  user_reports: number;
  resolved_cases: number;
}

export interface FlaggedContentDetail {
  id: string;
  type: ModerationType;
  author: string;
  reason: string;
  risk_score: number;
  date: string;
  status: ModerationStatus;
  content_preview: string;
  engagement: {
    views: number;
    likes: number;
  };
  risk_analysis: {
    spam: number;
    misinformation: number;
    toxicity: number;
    manipulation: number;
  };
}

export interface ModerationHistoryItem {
  id: string;
  moderator: string;
  action: "Approved" | "Revision Requested" | "Removed" | "User Warned";
  type: string;
  date: string;
}

export interface CommunityReport {
  id: string;
  reporter: string;
  content_title: string;
  reason: string;
  timestamp: string;
  status: "Open" | "Closed";
}

export interface AIModerationHubData {
  moderation_metrics: ModerationMetrics;
  flagged_content: FlaggedContentDetail[];
  history: ModerationHistoryItem[];
  community_reports: CommunityReport[];
}

/**
 * Legacy/Alternative interface for content engine moderation.
 */
export interface ModerationEntry {
  id: ID;
  type: ModerationType;
  title: string;
  author: string;
  status: ModerationStatus;
  createdAt: Timestamp;
  content?: string;
}
