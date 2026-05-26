import { ArticleStatus } from '@/modules/content-engine/types';
import { ID, Slug, Timestamp } from './common';

/**
 * @fileOverview Content and Article related types.
 */

export interface ArticleCategory {
  id: ID;
  name: string;
  slug: Slug;
  description?: string;
}

export interface ArticleTag {
  id: ID;
  name: string;
  slug: Slug;
}

export interface AuthorProfile {
  id: ID;
  name: string;
  slug: Slug;
  bio: string;
  avatar: string;
  role: string;
}

export interface ContentMeta {
  readingTime: number; // in minutes
  viewCount: number;
  isFeatured: boolean;
}

export interface Article {
  id: ID;
  slug: Slug;
  title: string;
  excerpt: string;
  description: string;
  content: string;
  category: string;
  authorId: ID;
  author?: AuthorProfile;
  status: ArticleStatus;
  tags: string[];
  featuredImage: string;
  publishedAt: Timestamp;
  body: string;
  updatedAt?: Timestamp;
  meta?: ContentMeta;
}
