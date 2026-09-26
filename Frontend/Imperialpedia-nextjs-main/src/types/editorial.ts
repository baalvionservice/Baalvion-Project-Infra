/**
 * @fileOverview Type definitions for the Editorial Review Workflow system.
 */

export type ReviewStatus = 'Submitted' | 'Under Review' | 'Revision Requested' | 'Approved' | 'Rejected';

export interface EditorialSubmission {
  id: string;
  title: string;
  author: string;
  category: string;
  status: ReviewStatus;
  assigned_editor: string;
  submitted_at: string;
  quality_score: number;
  trust_score: number;
  word_count: number;
  engagement_projection: string;
}

export interface EditorNode {
  id: string;
  name: string;
  expertise: string;
  articles_assigned: number;
  review_progress: number;
  avatar: string;
  status: 'Active' | 'On Leave';
}

export interface EditorialLogEntry {
  id: string;
  editor_name: string;
  action: 'Article Approved' | 'Revision Requested' | 'Article Rejected' | 'Editor Reassigned';
  article_title: string;
  timestamp: string;
}

export interface RevisionDirective {
  message: string;
  required_improvements: string[];
  suggested_edits: string;
  deadline: string;
}

export interface EditorialDashboardData {
  metrics: {
    submitted: number;
    under_review: number;
    approved: number;
    revisions: number;
    published_recently: number;
  };
  submissions: EditorialSubmission[];
  editors: EditorNode[];
  activity_log: EditorialLogEntry[];
}
