import { ID, Slug, Timestamp } from '@/types/common';

/**
 * @fileOverview Comprehensive type definition for an Article in the Content Engine.
 */

export type ArticleStatus = 'draft' | 'review' | 'published' | 'archived' | 'changes_requested' | 'submitted';

export interface Article {
  id: ID;
  slug: Slug;
  title: string;
  description: string;
  body?: string; // Full content body
  authorId: ID;
  publishedAt?: Timestamp;
  updatedAt: Timestamp;
  category: string;
  tags: string[];
  status: ArticleStatus;
  readingTime: number; // in minutes
  featuredImage: string;
  
  // SEO specific fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

/**
 * Simplified structure for the Article Editor and Draft management.
 */
export interface ArticleDraft {
  id: ID;
  title: string;
  body: string;
  summary: string;
  category: string;
  tags: string[];
  status: 'draft' | 'submitted';
  createdAt: Timestamp;
}

/**
 * Structure for Editor Review Workflow
 */
export interface Comment {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface SubmittedArticle extends Article {
  comments: Comment[];
  submittedAt: string;
}

export interface ArticleSubmission {
  id: string;
  title: string;
  body: string;
  authorId: string;
  status: "submitted" | "approved" | "changes_requested";
  submittedAt: string;
  updatedAt?: string;
}

export type NotificationType = "success" | "info" | "warning" | "follower" | "engagement" | "announcement";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  relatedId?: string;
}

export interface ReviewAction {
  id: string;
  articleId: string;
  articleTitle: string;
  action: "submitted" | "approved" | "changes_requested" | "commented" | "published";
  userId: string;
  userName: string;
  comment?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  type: 'content' | 'user' | 'system' | 'security';
}

export interface Writer {
  id: ID;
  name: string;
  role: 'writer';
  drafts: ArticleDraft[];
  publishedCount: number;
}

export interface Editor {
  id: ID;
  name: string;
  role: 'editor';
  pendingArticles: SubmittedArticle[];
}
