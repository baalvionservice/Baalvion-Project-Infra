/**
 * @fileOverview Type definitions for the Content Version Control system.
 */

export type VersionStatus = 'Published' | 'Draft' | 'Archived';

export interface VersionMetadata {
  wordCount: number;
  readingTime: number;
  qualityScore: number;
  badges: string[];
}

export interface ArticleVersion {
  id: string;
  version: string;
  editor: string;
  summary: string;
  date: string;
  status: VersionStatus;
  content: string;
  metadata: VersionMetadata;
}

export interface EditMilestone {
  date: string;
  editor: string;
  event: string;
  summary: string;
  type: 'creation' | 'edit' | 'review' | 'publication';
}

export interface VersionControlData {
  articleId: string;
  articleTitle: string;
  versions: ArticleVersion[];
  timeline: EditMilestone[];
}
